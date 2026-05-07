import { getSql } from "@db/postgres";
import { getDraftIdForAckReference } from "@db/registrations";
import type { RegistrationFormValues } from "../registration-schema.ts";
import {
  normalizeEmailLocale,
  formatPaymentDateForEmail,
} from "../email/i18n/email-locale";
import { attendanceLabelForEmail } from "../email/i18n/attendance-labels";
import { paymentNoteForMethodEmail } from "../email/i18n/payment-method-notes";
import { getThankYouEmailCopy } from "../email/i18n/thank-you-email-copy";
import { getForumEventDetails } from "../email/i18n/forum-event-details";
import { buildBankTransferRejectedHtml } from "../email/templates/bank-transfer-rejected";
import { buildPaymentConfirmationHtml } from "../email/templates/payment-confirmation";
import { buildThankYouHtml } from "../email/templates/thank-you";
import { buildEmailConfirmationPhysicalAttendanceHtml } from "../email/templates/email-confirmation-physical-attendance";
import { buildAcknowledgeHtml } from "../email/templates/acknowledge";
import { buildPaymentConfirmationEmailHtmlForPreview } from "../email/send-payment-confirmation.js";
import { buildQrCodeImageUrl } from "../email/email-assets";

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

function getEventTitle(): string {
  return process.env.EMAIL_EVENT_TITLE?.trim() || "IAIS Annual Conference";
}

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

function isPaidRegistrationRow(reg: RegistrationRow): boolean {
  return (
    reg.payment_status === "verified" ||
    reg.payment_status === "completed" ||
    Boolean(reg.webhook_verified_at?.trim())
  );
}

async function fetchRegistrationRow(
  reference: string,
): Promise<RegistrationRow | null> {
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
    WHERE reference = ${reference}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return rows[0] as unknown as RegistrationRow;
}

/**
 * Renders the same HTML as bulk/transactional sends for admin preview (no email send).
 */
export async function buildRegistrationEmailTemplateHtml(
  reference: string,
  templateKey: string,
  options?: { rejectionNote?: string | null },
): Promise<{ html: string } | { error: string }> {
  const reg = await fetchRegistrationRow(reference);
  if (!reg) return { error: "Registration not found" };

  const eventTitle = getEventTitle();
  const payload = reg.payload;
  const emailLoc = normalizeEmailLocale(reg.locale);

  try {
    switch (templateKey) {
      case "bank_transfer_rejected": {
        const html = buildBankTransferRejectedHtml({
          eventTitle,
          recipientTitle: String(payload.title ?? "").trim() || undefined,
          recipientFirstName: String(payload.firstName ?? "").trim() || "—",
          recipientLastName: String(payload.lastName ?? "").trim() || "—",
          reference: reg.reference,
          rejectionNote: options?.rejectionNote?.trim() || undefined,
          locale: reg.locale,
        });
        return { html };
      }
      case "payment_confirmation": {
        if (isPaidRegistrationRow(reg)) {
          const html = await buildPaymentConfirmationEmailHtmlForPreview({
            reference: reg.reference,
            email: reg.email,
            amountHkd: Number.parseFloat(reg.fee_hkd) || 0,
            attendance: payload.attendance,
            payload,
            paymentMethod: mapPaymentMethodForBulk(reg),
            locale: reg.locale,
            discountCode: reg.discount_code,
          });
          return { html };
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
        return { html: buildPaymentConfirmationHtml(input) };
      }
      case "thank_you": {
        const first = String(payload.firstName ?? "").trim();
        const last = String(payload.lastName ?? "").trim();
        const recipientDisplayName =
          [first, last].filter(Boolean).join(" ") || reg.email.trim();
        const html = buildThankYouHtml({
          eventTitle,
          recipientDisplayName,
          copy: getThankYouEmailCopy(emailLoc),
          forum: getForumEventDetails(emailLoc),
        });
        return { html };
      }
      case "email_confirmation_physical_attendance": {
        const html = buildEmailConfirmationPhysicalAttendanceHtml({
          eventTitle,
          recipientTitle: String(payload.title ?? "").trim() || undefined,
          recipientFirstName: String(payload.firstName ?? "").trim() || "—",
          recipientLastName: String(payload.lastName ?? "").trim() || "—",
          recipientCompany: String(payload.company ?? "").trim() || undefined,
          qrCodeImageUrl: buildQrCodeImageUrl(reg.reference),
          websiteUrl: process.env.EMAIL_IAIS_WEBSITE_URL?.trim(),
          enquiryEmail: process.env.EMAIL_ENQUIRY_ADDRESS?.trim(),
          cpdGuidelineCode: process.env.EMAIL_CPD_GUIDELINE_CODE?.trim(),
        });
        return { html };
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
        const attendanceLabelText = attendanceLabelForEmail(
          payload.attendance,
          emailLoc,
        );
        const html = buildAcknowledgeHtml({
          eventTitle,
          recipientTitle: payload.title,
          recipientFirstName: payload.firstName,
          recipientLastName: payload.lastName,
          recipientCompany: payload.company,
          reference: reg.reference,
          amountHkd: Number.parseFloat(reg.fee_hkd) || 0,
          attendanceLabel: attendanceLabelText,
          resumeUrl,
          locale: reg.locale,
        });
        return { html };
      }
      default:
        return { error: `Unknown template: ${templateKey}` };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}
