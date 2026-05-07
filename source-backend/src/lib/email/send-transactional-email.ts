import {
  getEffectiveEmailPrimaryResend,
  getEffectiveEmailProviderMode,
} from "../app-runtime-settings-cache.js";
import { isResendConfigured, sendResendEmail } from "./resend-send";
import {
  isSesConfigured,
  sendSesEmail,
  type SendSesEmailInput,
} from "./ses-send";

export type EmailProviderName = "ses" | "resend";

export type SendTransactionalEmailResult = {
  messageId: string;
  provider: EmailProviderName;
};

function emailProviderMode(): "auto" | "ses" | "resend" {
  return getEffectiveEmailProviderMode();
}

function primaryResendFirst(): boolean {
  return getEffectiveEmailPrimaryResend();
}

/**
 * True if at least one outbound email provider is configured (SES or Resend).
 */
export function isTransactionalEmailConfigured(): boolean {
  return isSesConfigured() || isResendConfigured();
}

/**
 * Sends HTML + text email: SES first when `EMAIL_PROVIDER` is auto (default),
 * unless only Resend is configured. On SES failure in auto mode, falls back to Resend.
 */
export async function sendTransactionalEmail(
  input: SendSesEmailInput,
): Promise<SendTransactionalEmailResult> {
  const mode = emailProviderMode();
  const payload: SendSesEmailInput = input;

  if (mode === "resend") {
    if (!isResendConfigured()) {
      throw new Error("EMAIL_PROVIDER=resend but Resend is not configured");
    }
    const { messageId } = await sendResendEmail({
      to: payload.to,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
      attachments: payload.attachments,
    });
    return { messageId, provider: "resend" };
  }

  if (mode === "ses") {
    if (!isSesConfigured()) {
      throw new Error("EMAIL_PROVIDER=ses but SES is not configured");
    }
    const { messageId } = await sendSesEmail(payload);
    return { messageId, provider: "ses" };
  }

  // auto — optional Resend-first (toggle via EMAIL_PRIMARY_RESEND / AppConfig)
  if (primaryResendFirst() && isResendConfigured()) {
    try {
      const { messageId } = await sendResendEmail({
        to: payload.to,
        subject: payload.subject,
        htmlBody: payload.htmlBody,
        textBody: payload.textBody,
        attachments: payload.attachments,
      });
      return { messageId, provider: "resend" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[email] Resend failed, evaluating SES fallback:", msg);
      if (isSesConfigured()) {
        const { messageId } = await sendSesEmail(payload);
        return { messageId, provider: "ses" };
      }
      throw e;
    }
  }

  if (isSesConfigured()) {
    try {
      const { messageId } = await sendSesEmail(payload);
      return { messageId, provider: "ses" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[email] SES failed, evaluating Resend fallback:", msg);
      if (isResendConfigured()) {
        const { messageId } = await sendResendEmail({
          to: payload.to,
          subject: payload.subject,
          htmlBody: payload.htmlBody,
          textBody: payload.textBody,
          attachments: payload.attachments,
        });
        return { messageId, provider: "resend" };
      }
      throw e;
    }
  }

  if (isResendConfigured()) {
    const { messageId } = await sendResendEmail({
      to: payload.to,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
      attachments: payload.attachments,
    });
    return { messageId, provider: "resend" };
  }

  throw new Error(
    "No email provider configured: set SES (AWS_REGION, AWS_SES_FROM_EMAIL) and/or Resend (RESEND_API_KEY, RESEND_FROM_EMAIL)",
  );
}
