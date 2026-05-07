import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { sendBulkEmail } from "./email/send-bulk-email";

export type BulkEmailTemplateKey =
  | "payment_confirmation"
  | "bank_transfer_rejected"
  | "thank_you"
  | "email_confirmation_physical_attendance"
  | "acknowledge";

type EmailJob = {
  type: "bulk_email";
  references: string[];
  templateKey: BulkEmailTemplateKey;
  rejectionNote?: string;
};

export type EnqueueBulkEmailResult = {
  /** True when work was handed off to SQS or in-memory worker (HTTP should not sync-send). */
  queued: boolean;
  chunks: number;
  totalReferences: number;
};

function getQueueUrl(): string | null {
  const url = process.env.SQS_EMAIL_QUEUE_URL?.trim();
  return url ? url : null;
}

function getSqsClient(): SQSClient {
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error("AWS region is not configured");
  }
  return new SQSClient({ region });
}

/** Max references per SQS message / in-memory job (keeps messages small, avoids one huge send). */
function getChunkSize(): number {
  const n = Number(process.env.BULK_EMAIL_QUEUE_CHUNK_SIZE);
  if (Number.isFinite(n) && n >= 1 && n <= 500) return Math.floor(n);
  return 50;
}

function chunkReferences<T>(items: T[], size: number): T[][] {
  if (size < 1) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

type MemoryJob = {
  references: string[];
  templateKey: BulkEmailTemplateKey;
  rejectionNote?: string;
};

const memoryQueue: MemoryJob[] = [];
let memoryDraining = false;

async function drainMemoryEmailQueue(): Promise<void> {
  if (memoryDraining) return;
  memoryDraining = true;
  try {
    while (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (!job) break;
      try {
        await sendBulkEmail(job.references, job.templateKey, {
          rejectionNote: job.rejectionNote,
        });
      } catch (e) {
        console.error("[email-queue memory] chunk failed", e);
      }
      await new Promise((r) => setTimeout(r, 25));
    }
  } finally {
    memoryDraining = false;
  }
}

function scheduleMemoryDrain(): void {
  setImmediate(() => {
    void drainMemoryEmailQueue();
  });
}

async function sendChunksToSqs(chunks: string[][], input: {
  templateKey: BulkEmailTemplateKey;
  rejectionNote?: string;
}): Promise<void> {
  const queueUrl = getQueueUrl();
  if (!queueUrl) throw new Error("SQS_EMAIL_QUEUE_URL missing");
  const sqs = getSqsClient();
  await Promise.all(
    chunks.map((references) =>
      sqs.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({
            type: "bulk_email",
            references,
            templateKey: input.templateKey,
            rejectionNote: input.rejectionNote,
          } as EmailJob),
        }),
      ),
    ),
  );
}

function enqueueMemoryChunks(chunks: string[][], input: {
  templateKey: BulkEmailTemplateKey;
  rejectionNote?: string;
}): void {
  for (const references of chunks) {
    memoryQueue.push({
      references,
      templateKey: input.templateKey,
      rejectionNote: input.rejectionNote,
    });
  }
  scheduleMemoryDrain();
}

/**
 * Enqueue bulk email in chunks (SQS preferred). Falls back to in-memory async queue if SQS fails or unset.
 * Always returns `queued: true` on success so callers should not run synchronous sendBulkEmail for the same refs.
 */
export async function enqueueBulkEmailJob(input: {
  references: string[];
  templateKey: BulkEmailTemplateKey;
  rejectionNote?: string;
}): Promise<EnqueueBulkEmailResult> {
  const totalReferences = input.references.length;
  const chunkSize = getChunkSize();
  const chunks = chunkReferences(input.references, chunkSize);
  if (chunks.length === 0) {
    return { queued: false, chunks: 0, totalReferences: 0 };
  }

  const queueUrl = getQueueUrl();
  if (queueUrl) {
    try {
      await sendChunksToSqs(chunks, input);
      return { queued: true, chunks: chunks.length, totalReferences };
    } catch (e) {
      console.error("[email-queue] SQS enqueue failed, using in-memory queue", e);
      enqueueMemoryChunks(chunks, input);
      return { queued: true, chunks: chunks.length, totalReferences };
    }
  }

  enqueueMemoryChunks(chunks, input);
  return { queued: true, chunks: chunks.length, totalReferences };
}

export async function processEmailQueueBatch(
  maxMessages = 10,
): Promise<{ received: number; processed: number; failed: number }> {
  const queueUrl = getQueueUrl();
  if (!queueUrl) {
    return { received: 0, processed: 0, failed: 0 };
  }

  const sqs = getSqsClient();
  const res = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: Math.max(1, Math.min(maxMessages, 10)),
      WaitTimeSeconds: 0,
    }),
  );

  const messages = res.Messages ?? [];
  let processed = 0;
  let failed = 0;

  for (const msg of messages) {
    const body = msg.Body;
    const receiptHandle = msg.ReceiptHandle;
    if (!body || !receiptHandle) {
      failed += 1;
      continue;
    }

    try {
      const job = JSON.parse(body) as EmailJob;
      if (job.type === "bulk_email") {
        await sendBulkEmail(job.references, job.templateKey, {
          rejectionNote: job.rejectionNote,
        });
      }

      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: receiptHandle,
        }),
      );
      processed += 1;
    } catch (e) {
      failed += 1;
      console.error("[email-queue]", e);
    }
  }

  return { received: messages.length, processed, failed };
}
