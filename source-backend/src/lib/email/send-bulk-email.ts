import {
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "./send-transactional-email";
import { insertEmailLog } from "@db/email-logs";
import { getDraftIdForAckReference } from "@db/registrations";
import { getSql } from "@db/postgres";
import type { RegistrationFormValues } from "../registration-schema.ts";
import {
  buildBankTransferRejectedHtml,
  buildBankTransferRejectedSubject,
  buildBankTransferRejectedText,
} from "./templates/bank-transfer-rejected";
import {
  buildPaymentConfirmationHtml,
  buildPaymentConfirmationSubject,
  buildPaymentConfirmationText,
} from "./templates/payment-confirmation";
import {
  buildThankYouHtml,
  buildThankYouSubject,
  buildThankYouText,
} from "./templates/thank-you";
import {
  buildEmailConfirmationPhysicalAttendanceHtml,
  buildEmailConfirmationPhysicalAttendanceSubject,
  buildEmailConfirmationPhysicalAttendanceText,
} from "./templates/email-confirmation-physical-attendance";
import { normalizeEmailLocale, formatPaymentDateForEmail } from "./i18n/email-locale";
import { attendanceLabelForEmail } from "./i18n/attendance-labels";
import { getThankYouEmailCopy } from "./i18n/thank-you-email-copy";
import { getForumEventDetails } from "./i18n/forum-event-details";
import { paymentNoteForMethodEmail } from "./i18n/payment-method-notes";
import { sendPaymentConfirmationEmail } from "./send-payment-confirmation";
import { sendAcknowledgeEmail } from "./send-acknowledge-email";
import { buildQrCodeImageUrl } from "./email-assets";

type RegistrationRow = {
  reference: string;
  email: string;
  fee_hkd: string;
  payload: RegistrationFormValues;
  webhook_verified_at: string | null;
  payment_status: string;
  stripe_checkout_session_id: string | null;
  locale: string | null;
  payment_method: string | null;
  discount_code: string | null;
};

function mapPaymentMethodForBulk(
  reg: RegistrationRow,
):
  | "stripe"
  | "demo"
  | "bank_transfer"
  | "no_payment"
  | "paymentasia" {
  const m = reg.payment_method?.trim().toLowerCase() ?? "";
  if (m === "bank_transfer") return "bank_transfer";
  if (m === "qfpay") return "paymentasia";
  if (m === "paymentasia") return "paymentasia";
  if (m === "demo") return "demo";
  if (m === "no_payment") return "no_payment";
  return "stripe";
}

function getEventTitle(): string {
  return process.env.EMAIL_EVENT_TITLE?.trim() || "IAIS Annual Conference";
}

function isPaidRegistrationRow(reg: RegistrationRow): boolean {
  return (
    reg.payment_status === "verified" ||
    reg.payment_status === "completed" ||
    Boolean(reg.webhook_verified_at?.trim())
  );
}

async function fetchRegistrationsByReferences(
  references: string[],
): Promise<RegistrationRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      reference,
      email,
      fee_hkd::text,
      payload,
      webhook_verified_at::text,
      payment_status::text,
      stripe_checkout_session_id,
      locale,
      payment_method,
      discount_code
    FROM registrations
    WHERE reference = ANY(${references})
  `;
  return rows as unknown as RegistrationRow[];
}

export type BulkSendResult = {
  sent: number;
  failed: number;
  errors: Array<{ reference: string; error: string }>;
};

export async function sendBulkEmail(
  references: string[],
  templateKey: string,
  options?: { rejectionNote?: string },
): Promise<BulkSendResult> {
  if (!isTransactionalEmailConfigured()) {
    return {
      sent: 0,
      failed: 0,
      errors: [{ reference: "*", error: "No email provider configured (SES or Resend)" }],
    };
  }

  const registrations = await fetchRegistrationsByReferences(references);
  const eventTitle = getEventTitle();
  let sent = 0;
  let failed = 0;
  const errors: Array<{ reference: string; error: string }> = [];

  for (const reg of registrations) {
    const payload = reg.payload;
    const emailLoc = normalizeEmailLocale(reg.locale);
    let subject: string;
    let html: string;
    let text: string;

    try {
      switch (templateKey) {
        case "bank_transfer_rejected": {
          const input = {
            eventTitle,
            recipientTitle: payload.title,
            recipientFirstName: payload.firstName,
            recipientLastName: payload.lastName,
            reference: reg.reference,
            rejectionNote: options?.rejectionNote,
            locale: reg.locale,
          };
          subject = buildBankTransferRejectedSubject(input);
          html = buildBankTransferRejectedHtml(input);
          text = buildBankTransferRejectedText(input);
          break;
        }
        case "payment_confirmation": {
          const paid = isPaidRegistrationRow(reg);
          if (paid) {
            await sendPaymentConfirmationEmail({
              reference: reg.reference,
              email: reg.email,
              amountHkd: Number.parseFloat(reg.fee_hkd) || 0,
              attendance: payload.attendance,
              payload,
              paymentMethod: mapPaymentMethodForBulk(reg),
              locale: reg.locale,
              discountCode: reg.discount_code,
            });
            sent++;
            const minIntervalMs = Number(process.env.BULK_EMAIL_MIN_INTERVAL_MS);
            const delayMs =
              Number.isFinite(minIntervalMs) && minIntervalMs! >= 0
                ? minIntervalMs!
                : 80;
            if (delayMs > 0) {
              await new Promise((r) => setTimeout(r, delayMs));
            }
            continue;
          }
          const paymentDateFormatted = formatPaymentDateForEmail(
            reg.webhook_verified_at,
            emailLoc,
          );
          const methodRaw = reg.payment_method?.trim().toLowerCase() ?? "";
          const paymentNote =
            methodRaw === "pending"
              ? undefined
              : methodRaw === "bank_transfer"
                ? paymentNoteForMethodEmail("bank_transfer", emailLoc)
                : methodRaw === "no_payment"
                  ? paymentNoteForMethodEmail("no_payment", emailLoc)
                  : methodRaw === "demo"
                    ? paymentNoteForMethodEmail("demo", emailLoc)
                    : methodRaw === "qfpay" || methodRaw === "paymentasia"
                      ? paymentNoteForMethodEmail("paymentasia", emailLoc)
                      : reg.stripe_checkout_session_id
                        ? paymentNoteForMethodEmail("stripe", emailLoc)
                        : undefined;
          const input = {
            eventTitle,
            recipientTitle: payload.title,
            recipientFirstName: payload.firstName,
            recipientLastName: payload.lastName,
            recipientCompany: payload.company,
            reference: reg.reference,
            amountHkd: Number.parseFloat(reg.fee_hkd) || 0,
            attendanceLabel: attendanceLabelForEmail(payload.attendance, emailLoc),
            paymentDateFormatted,
            paymentSummaryState: "pending" as const,
            locale: reg.locale,
            ...(paymentNote ? { paymentNote } : {}),
          };
          subject = buildPaymentConfirmationSubject({
            eventTitle,
            reference: reg.reference,
            locale: reg.locale,
          });
          html = buildPaymentConfirmationHtml(input);
          text = buildPaymentConfirmationText(input);
          break;
        }
        case "thank_you": {
          const first = String(payload.firstName ?? "").trim();
          const last = String(payload.lastName ?? "").trim();
          const recipientDisplayName =
            [first, last].filter(Boolean).join(" ") || reg.email.trim();
          const input = {
            eventTitle,
            recipientDisplayName,
            copy: getThankYouEmailCopy(emailLoc),
            forum: getForumEventDetails(emailLoc),
          };
          subject = buildThankYouSubject(input);
          html = buildThankYouHtml(input);
          text = buildThankYouText(input);
          break;
        }
        case "email_confirmation_physical_attendance": {
          const ecInput = {
            eventTitle,
            recipientTitle: String(payload.title ?? "").trim() || undefined,
            recipientFirstName: String(payload.firstName ?? "").trim() || "—",
            recipientLastName: String(payload.lastName ?? "").trim() || "—",
            recipientCompany: String(payload.company ?? "").trim() || undefined,
            qrCodeImageUrl: buildQrCodeImageUrl(reg.reference),
            websiteUrl: process.env.EMAIL_IAIS_WEBSITE_URL?.trim(),
            enquiryEmail: process.env.EMAIL_ENQUIRY_ADDRESS?.trim(),
            cpdGuidelineCode: process.env.EMAIL_CPD_GUIDELINE_CODE?.trim(),
          };
          subject = buildEmailConfirmationPhysicalAttendanceSubject({
            eventTitle,
          });
          html = buildEmailConfirmationPhysicalAttendanceHtml(ecInput);
          text = buildEmailConfirmationPhysicalAttendanceText(ecInput);
          break;
        }
        case "acknowledge": {
          const draftId = await getDraftIdForAckReference(reg.reference);
          const appBase =
            process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
            "https://registration.newtofuevents.com";
          const localeSeg = String(reg.locale ?? "en").trim() || "en";
          const resumeUrl = draftId
            ? `${appBase}/${localeSeg}/register?step=pay&ref=${encodeURIComponent(draftId)}`
            : undefined;
          const ok = await sendAcknowledgeEmail({
            reference: reg.reference,
            email: reg.email,
            amountHkd: Number.parseFloat(reg.fee_hkd) || 0,
            attendance: payload.attendance,
            payload,
            resumeUrl,
            locale: reg.locale,
          });
          if (!ok) {
            errors.push({
              reference: reg.reference,
              error: "Acknowledge email failed or email not configured",
            });
            failed++;
          } else {
            sent++;
          }
          const minIntervalMsAck = Number(process.env.BULK_EMAIL_MIN_INTERVAL_MS);
          const delayMsAck =
            Number.isFinite(minIntervalMsAck) && minIntervalMsAck! >= 0
              ? minIntervalMsAck!
              : 80;
          if (delayMsAck > 0) {
            await new Promise((r) => setTimeout(r, delayMsAck));
          }
          continue;
        }
        default:
          errors.push({ reference: reg.reference, error: `Unknown template: ${templateKey}` });
          failed++;
          continue;
      }

      const { messageId, provider } = await sendTransactionalEmail({
        to: reg.email.trim(),
        subject,
        htmlBody: html,
        textBody: text,
      });

      await insertEmailLog({
        registrationReference: reg.reference,
        templateKey,
        toEmail: reg.email.trim(),
        status: "sent",
        providerMessageId: messageId || null,
        errorMessage: null,
        provider,
      }).catch((e) => console.error("[bulk-email] log insert failed", e));

      sent++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ reference: reg.reference, error: msg });
      failed++;

      await insertEmailLog({
        registrationReference: reg.reference,
        templateKey,
        toEmail: reg.email.trim(),
        status: "failed",
        providerMessageId: null,
        errorMessage: msg,
      }).catch((logErr) => console.error("[bulk-email] log insert failed", logErr));
    }

    // Throttle outbound sends (SES ~14/s; Resend also benefits from pacing)
    const minIntervalMs = Number(process.env.BULK_EMAIL_MIN_INTERVAL_MS);
    const delayMs =
      Number.isFinite(minIntervalMs) && minIntervalMs! >= 0 ? minIntervalMs! : 80;
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { sent, failed, errors };
}
