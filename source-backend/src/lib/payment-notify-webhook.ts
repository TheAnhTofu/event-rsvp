import { createHmac } from "node:crypto";

export type PaymentNotifyPayload = {
  event: "payment.completed";
  reference: string;
  stripeCheckoutSessionId: string | null;
  amountTotal: number | null;
  currency: string | null;
  at: string;
};

/**
 * Optional outbound webhook after Stripe checkout is fulfilled (e.g. Slack, Zapier).
 * Set PAYMENT_NOTIFY_WEBHOOK_URL; optionally PAYMENT_NOTIFY_WEBHOOK_SECRET for HMAC header.
 */
export async function notifyPaymentWebhook(payload: PaymentNotifyPayload): Promise<void> {
  const url = process.env.PAYMENT_NOTIFY_WEBHOOK_URL?.trim();
  if (!url) return;

  const secret = process.env.PAYMENT_NOTIFY_WEBHOOK_SECRET?.trim();
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(url, { method: "POST", headers, body });
    if (!res.ok) {
      console.warn(
        "[payment-notify] webhook returned",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (e) {
    console.error("[payment-notify] webhook failed", e);
  }
}
