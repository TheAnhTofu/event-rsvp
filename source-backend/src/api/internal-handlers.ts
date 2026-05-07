import type { Request, Response } from "express";
import { processNotificationQueueBatch } from "../lib/notification-queue.js";
import { processEmailQueueBatch } from "../lib/email-job-queue.js";

function authorized(req: Request): boolean {
  const token = process.env.INTERNAL_QUEUE_PROCESS_TOKEN?.trim();
  if (!token) return false;
  const incoming = req.get("x-queue-token")?.trim();
  return incoming === token;
}

export async function postNotificationQueueProcess(
  req: Request,
  res: Response,
): Promise<void> {
  if (!authorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let maxMessages = 10;
  try {
    const body = req.body as { maxMessages?: unknown };
    if (
      typeof body?.maxMessages === "number" &&
      Number.isFinite(body.maxMessages)
    ) {
      maxMessages = body.maxMessages;
    }
  } catch {
    // use default
  }

  const result = await processNotificationQueueBatch(maxMessages);
  res.json({ ok: true, ...result });
}

export async function postEmailQueueProcess(
  req: Request,
  res: Response,
): Promise<void> {
  if (!authorized(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let maxMessages = 10;
  try {
    const body = req.body as { maxMessages?: unknown };
    if (
      typeof body?.maxMessages === "number" &&
      Number.isFinite(body.maxMessages)
    ) {
      maxMessages = body.maxMessages;
    }
  } catch {
    // use default
  }

  const result = await processEmailQueueBatch(maxMessages);
  res.json({ ok: true, ...result });
}
