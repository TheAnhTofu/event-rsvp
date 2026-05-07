import { buildAcknowledgeInvoicePdf } from "./build-acknowledge-invoice-pdf";
import {
  buildAcknowledgeHtml,
  buildAcknowledgeSubject,
  buildAcknowledgeText,
  type AcknowledgeTemplateInput,
} from "./templates/acknowledge";
import type { SendSesEmailAttachment } from "./ses-send";
import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./send-transactional-email";
import { insertEmailLog } from "@db/email-logs";
import type { RegistrationFormValues } from "../registration-schema.ts";
import { normalizeEmailLocale } from "./i18n/email-locale";
import { attendanceLabelForEmail } from "./i18n/attendance-labels";
import { uploadPdfToS3 } from "../upload-pdf-to-s3";

function getEventTitle(): string {
  return process.env.EMAIL_EVENT_TITLE?.trim() || "IAIS Annual Conference";
}

async function buildAcknowledgeInvoiceAttachment(
  input: SendAcknowledgeEmailInput,
  attendanceLabelText: string,
): Promise<SendSesEmailAttachment | null> {
  try {
    const pdfBytes = await buildAcknowledgeInvoicePdf({
      eventTitle: getEventTitle(),
      reference: input.reference,
      amountHkd: input.amountHkd,
      attendance: input.attendance,
      attendanceLabel: attendanceLabelText,
      payload: input.payload,
    });
    void uploadPdfToS3(input.reference, "IAIS-registration-invoice.pdf", pdfBytes);
    return {
      fileName: "IAIS-registration-invoice.pdf",
      contentType: "application/pdf",
      rawContent: pdfBytes,
    };
  } catch (e) {
    console.warn("[email] acknowledge invoice PDF build failed", e);
    return null;
  }
}

export type SendAcknowledgeEmailInput = {
  reference: string;
  email: string;
  amountHkd: number;
  attendance: RegistrationFormValues["attendance"];
  payload: RegistrationFormValues;
  resumeUrl?: string;
  locale?: string | null;
};

/** @returns whether the transactional send succeeded (logs success/failure either way). */
export async function sendAcknowledgeEmail(
  input: SendAcknowledgeEmailInput,
): Promise<boolean> {
  if (!isTransactionalEmailConfigured()) {
    console.info(
      "[email] Skipped (acknowledge): configure SES and/or Resend for transactional email",
    );
    return false;
  }

  const emailLoc = normalizeEmailLocale(input.locale);
  const eventTitle = getEventTitle();
  const attendanceLabelText = attendanceLabelForEmail(
    input.attendance,
    emailLoc,
  );
  const templateInput: AcknowledgeTemplateInput = {
    eventTitle,
    recipientTitle: input.payload.title,
    recipientFirstName: input.payload.firstName,
    recipientLastName: input.payload.lastName,
    recipientCompany: input.payload.company,
    reference: input.reference,
    amountHkd: input.amountHkd,
    attendanceLabel: attendanceLabelText,
    resumeUrl: input.resumeUrl,
    locale: input.locale,
  };

  const subject = buildAcknowledgeSubject({
    eventTitle,
    reference: input.reference,
    locale: input.locale,
  });
  const html = buildAcknowledgeHtml(templateInput);
  const text = buildAcknowledgeText(templateInput);
  const invoiceAttachment = await buildAcknowledgeInvoiceAttachment(
    input,
    attendanceLabelText,
  );

  try {
    const { messageId, provider } = await sendTransactionalEmail({
      to: input.email.trim(),
      subject,
      htmlBody: html,
      textBody: text,
      ...(invoiceAttachment
        ? { attachments: [invoiceAttachment] }
        : {}),
    });
    try {
      await insertEmailLog({
        registrationReference: input.reference,
        templateKey: "acknowledge",
        toEmail: input.email.trim(),
        status: "sent",
        providerMessageId: messageId || null,
        errorMessage: null,
        provider,
      });
    } catch (e) {
      console.error("[email] log insert failed after acknowledge send", e);
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[email] SES acknowledge send failed", msg);
    try {
      await insertEmailLog({
        registrationReference: input.reference,
        templateKey: "acknowledge",
        toEmail: input.email.trim(),
        status: "failed",
        providerMessageId: null,
        errorMessage: msg,
      });
    } catch (logErr) {
      console.error("[email] log insert failed after acknowledge error", logErr);
    }
    return false;
  }
}
