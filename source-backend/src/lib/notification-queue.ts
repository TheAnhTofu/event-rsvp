import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { sendSlackPaymentSuccess, type PaymentSlackPayload } from "./slack";

type NotificationJob =
  | {
      type: "payment_succeeded";
      payload: PaymentSlackPayload;
    };

function getQueueUrl(): string | null {
  const url = process.env.SQS_NOTIFICATION_QUEUE_URL?.trim();
  return url ? url : null;
}

function getSqsClient(): SQSClient {
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error("AWS region is not configured");
  }
  return new SQSClient({ region });
}

export async function enqueuePaymentSuccessNotification(
  payload: PaymentSlackPayload,
): Promise<void> {
  const queueUrl = getQueueUrl();
  if (!queueUrl) {
    // Fallback path for environments without SQS queue.
    await sendSlackPaymentSuccess(payload);
    return;
  }

  const sqs = getSqsClient();
  const body: NotificationJob = { type: "payment_succeeded", payload };
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body),
    }),
  );
}

export async function processNotificationQueueBatch(
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
      const job = JSON.parse(body) as NotificationJob;
      switch (job.type) {
        case "payment_succeeded":
          await sendSlackPaymentSuccess(job.payload);
          break;
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
      console.error(e);
    }
  }

  return { received: messages.length, processed, failed };
}
