import { Resend } from "resend";
import type { SendSesEmailAttachment } from "./ses-send";

function getApiKey(): string | null {
  const v = process.env.RESEND_API_KEY?.trim();
  return v ? v : null;
}

function getFromAddress(): string | null {
  const v = process.env.RESEND_FROM_EMAIL?.trim();
  return v ? v : null;
}

export function isResendConfigured(): boolean {
  return Boolean(getApiKey() && getFromAddress());
}

export type SendResendEmailInput = {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  attachments?: SendSesEmailAttachment[];
};

/**
 * Sends via Resend HTTP API. Requires RESEND_API_KEY and verified RESEND_FROM_EMAIL.
 */
export async function sendResendEmail(
  input: SendResendEmailInput,
): Promise<{ messageId: string }> {
  const key = getApiKey();
  const from = getFromAddress();
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not set");
  }

  const resend = new Resend(key);

  // Resend POST body is JSON.stringify'd. Buffer becomes {"type":"Buffer","data":[...]}
  // which the API does not treat as file bytes. Use base64 (see Resend SDK forward example).
  const attachments = input.attachments?.length
    ? input.attachments.map((a) => {
        const bytes = a.rawContent;
        const buf = Buffer.from(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength,
        );
        return {
          filename: a.fileName,
          content: buf.toString("base64"),
          ...(a.contentType.trim() ? { contentType: a.contentType.trim() } : {}),
        };
      })
    : undefined;

  const { data, error } = await resend.emails.send({
    from,
    to: [input.to],
    subject: input.subject,
    html: input.htmlBody,
    text: input.textBody,
    ...(attachments ? { attachments } : {}),
  });

  if (error) {
    throw new Error(error.message ?? "Resend send failed");
  }

  const messageId = data?.id ?? "";
  return { messageId };
}
