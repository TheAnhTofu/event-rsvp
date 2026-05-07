import { buildPaymentReceiptPdf } from "./build-payment-receipt-pdf";
import { resolveReceiptDiscountForPdf } from "./receipt-discount-for-pdf";
import {
  buildPaymentConfirmationHtml,
  buildPaymentConfirmationSubject,
  buildPaymentConfirmationText,
  type PaymentConfirmationTemplateInput,
} from "./templates/payment-confirmation";
import type { SendSesEmailAttachment } from "./ses-send";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./send-transactional-email";
import { insertEmailLog } from "@db/email-logs";
import type { RegistrationFormValues } from "../registration-schema.ts";
import { normalizeEmailLocale, formatPaymentDateForEmail } from "./i18n/email-locale";
import { attendanceLabelForEmail } from "./i18n/attendance-labels";
import { paymentNoteForMethodEmail } from "./i18n/payment-method-notes";
import { uploadPdfToS3 } from "../upload-pdf-to-s3";

function getEventTitle(): string {
  return (
    process.env.EMAIL_EVENT_TITLE?.trim() ||
    "IAIS Annual Conference"
  );
}

export type SendPaymentConfirmationEmailInput = {
  reference: string;
  email: string;
  amountHkd: number;
  attendance: RegistrationFormValues["attendance"];
  payload: RegistrationFormValues;
  paymentMethod:
    | "stripe"
    | "demo"
    | "bank_transfer"
    | "no_payment"
    | "paymentasia";
  /** UI locale from registration (`en` | `zh-Hant` | `zh-Hans`). */
  locale?: string | null;
  /** Normalized promo string from `registration_drafts` / `registrations` — drives receipt PDF discount lines. */
  discountCode?: string | null;
};

/**
 * Sends the payment confirmation email (HTML + text) via SES and/or Resend when configured.
 * Logs success/failure to `email_logs` when the database is available.
 */
export async function sendPaymentConfirmationEmail(
  input: SendPaymentConfirmationEmailInput,
): Promise<void> {
  if (!isTransactionalEmailConfigured()) {
    console.info(
      "[email] Skipped: configure SES (AWS_REGION, AWS_SES_FROM_EMAIL) and/or Resend (RESEND_API_KEY, RESEND_FROM_EMAIL)",
    );
    return;
  }

  const emailLocale = normalizeEmailLocale(input.locale);
  const eventTitle = getEventTitle();
  const paymentDateFormatted = formatPaymentDateForEmail(undefined, emailLocale);

  const attendanceLabelText = attendanceLabelForEmail(
    input.attendance,
    emailLocale,
  );

  const paymentMethodLabel =
    input.paymentMethod === "stripe"
      ? "Credit Card (Stripe)"
      : input.paymentMethod === "bank_transfer"
        ? "Bank Transfer"
        : input.paymentMethod === "demo"
          ? "Demo"
          : input.paymentMethod === "paymentasia"
            ? "Alipay / WeChat Pay (PaymentAsia)"
            : "N/A";

  const receiptDiscount = await resolveReceiptDiscountForPdf({
    attendance: input.attendance,
    audienceType: input.payload.audienceType,
    discountCode: input.discountCode,
    amountPaidHkd: input.amountHkd,
  });

  let receiptAttachment: SendSesEmailAttachment | null = null;
  try {
    const pdfBytes = await buildPaymentReceiptPdf({
      eventTitle,
      reference: input.reference,
      amountHkd: input.amountHkd,
      attendance: input.attendance,
      attendanceLabel: attendanceLabelText,
      payload: input.payload,
      paymentMethod: paymentMethodLabel,
      ...(receiptDiscount
        ? {
            subtotalHkd: receiptDiscount.subtotalHkd,
            discountAmountHkd: receiptDiscount.discountAmountHkd,
            discountCodesLabel: receiptDiscount.discountCodesLabel,
          }
        : {}),
    });
    receiptAttachment = {
      fileName: "IAIS-payment-receipt.pdf",
      contentType: "application/pdf",
      rawContent: pdfBytes,
    };
    void uploadPdfToS3(input.reference, "IAIS-payment-receipt.pdf", pdfBytes);
  } catch (e) {
    console.warn(
      "[email] payment receipt PDF build failed; sending email without attachment",
      e,
    );
  }

  const paymentTemplateInput: PaymentConfirmationTemplateInput = {
    eventTitle,
    recipientTitle: input.payload.title,
    recipientFirstName: input.payload.firstName,
    recipientLastName: input.payload.lastName,
    recipientCompany: input.payload.company,
    reference: input.reference,
    amountHkd: input.amountHkd,
    attendanceLabel: attendanceLabelText,
    paymentNote: paymentNoteForMethodEmail(input.paymentMethod, emailLocale),
    paymentDateFormatted,
    paymentSummaryState: "paid",
    pdfReceiptAttached: Boolean(receiptAttachment),
    locale: input.locale,
  };

  const subject = buildPaymentConfirmationSubject({
    eventTitle,
    reference: input.reference,
    locale: input.locale,
  });
  const html = buildPaymentConfirmationHtml(paymentTemplateInput);
  const text = buildPaymentConfirmationText(paymentTemplateInput);
  const templateKey = "payment_confirmation";

  try {
    const { messageId, provider } = await sendTransactionalEmail({
      to: input.email.trim(),
      subject,
      htmlBody: html,
      textBody: text,
      ...(receiptAttachment ? { attachments: [receiptAttachment] } : {}),
    });
    try {
      await insertEmailLog({
        registrationReference: input.reference,
        templateKey,
        toEmail: input.email.trim(),
        status: "sent",
        providerMessageId: messageId || null,
        errorMessage: null,
        provider,
      });
    } catch (e) {
      console.error("[email] log insert failed after send", e);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[email] SES send failed", msg);
    try {
      await insertEmailLog({
        registrationReference: input.reference,
        templateKey,
        toEmail: input.email.trim(),
        status: "failed",
        providerMessageId: null,
        errorMessage: msg,
      });
    } catch (logErr) {
      console.error("[email] log insert failed after error", logErr);
    }
  }
}

/**
 * Renders payment confirmation HTML for admin preview (no send, no PDF attachment line).
 */
export async function buildPaymentConfirmationEmailHtmlForPreview(
  input: SendPaymentConfirmationEmailInput,
): Promise<string> {
  const emailLocale = normalizeEmailLocale(input.locale);
  const eventTitle = getEventTitle();
  const paymentDateFormatted = formatPaymentDateForEmail(undefined, emailLocale);
  const attendanceLabelText = attendanceLabelForEmail(
    input.attendance,
    emailLocale,
  );
  const paymentTemplateInput: PaymentConfirmationTemplateInput = {
    eventTitle,
    recipientTitle: input.payload.title,
    recipientFirstName: input.payload.firstName,
    recipientLastName: input.payload.lastName,
    recipientCompany: input.payload.company,
    reference: input.reference,
    amountHkd: input.amountHkd,
    attendanceLabel: attendanceLabelText,
    paymentNote: paymentNoteForMethodEmail(input.paymentMethod, emailLocale),
    paymentDateFormatted,
    paymentSummaryState: "paid",
    pdfReceiptAttached: false,
    locale: input.locale,
  };
  return buildPaymentConfirmationHtml(paymentTemplateInput);
}
