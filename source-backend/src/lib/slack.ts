export type PaymentSlackPayload = {
  reference: string;
  email: string;
  amountHkd: number;
  attendance: "in_person" | "online" | "not_attending";
  locale: string | null;
  stripeSessionId: string;
};

export async function sendSlackPaymentSuccess(
  payload: PaymentSlackPayload,
): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return;

  const paymentRefLine = payload.stripeSessionId.startsWith("paymentasia:")
    ? `PaymentAsia ref: \`${payload.stripeSessionId.slice(13)}\``
    : payload.stripeSessionId.startsWith("qfpay:")
      ? `Wallet ref (legacy): \`${payload.stripeSessionId.slice(6)}\``
      : `Stripe session: \`${payload.stripeSessionId}\``;
  const text =
    [
      "*New successful payment*",
      `Reference: \`${payload.reference}\``,
      `Email: ${payload.email}`,
      `Amount: HKD ${payload.amountHkd.toFixed(2)}`,
      `Attendance: ${payload.attendance}`,
      `Locale: ${payload.locale ?? "n/a"}`,
      paymentRefLine,
    ].join("\n");

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status}`);
  }
}
