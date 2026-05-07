import { getEmailHeaderImageUrl } from "../email-assets";
import { escapeHtml } from "../escape-html";
import { normalizeEmailLocale } from "../i18n/email-locale";
import { getForumEventDetails } from "../i18n/forum-event-details";
import { getPaymentConfirmationEmailCopy } from "../i18n/payment-confirmation-email-copy";
import {
  getForumDetailCalendarIconUrl,
  getForumDetailGlobeIconUrl,
  getForumDetailLocationIconUrl,
} from "./forum-detail-icons";

/** Confirmation email template aligned to Figma node 321:24867. */
const C = {
  pageBg: "#f2f3f5",
  surface: "#ffffff",
  heading: "#161616",
  text: "#262626",
  muted: "#4f4f4f",
  border: "#bdbdbd",
  link: "#237ee6",
} as const;

export type PaymentConfirmationTemplateInput = {
  eventTitle: string;
  recipientTitle?: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientCompany?: string;
  reference: string;
  amountHkd: number;
  /** Localised attendance label (see `attendanceLabelForEmail`). */
  attendanceLabel: string;
  /** Optional line, e.g. payment method label */
  paymentNote?: string;
  /** Shown as "Payment Date" in Payment summary (e.g. local date string). */
  paymentDateFormatted: string;
  /** `paid` = receipt wording; `pending` = payment not recorded yet (no payment link in this template). */
  paymentSummaryState?: "paid" | "pending";
  /** When true, copy mentions a PDF receipt attached (only when email actually attaches PDF). */
  pdfReceiptAttached?: boolean;
  /** Registration UI locale (`en` | `zh-Hant` | `zh-Hans`) — drives template language. */
  locale?: string | null;
};

function formatMoneyHkd(n: number): string {
  return `HKD ${n.toFixed(2)}`;
}

export function buildPaymentConfirmationSubject(
  input: Pick<PaymentConfirmationTemplateInput, "reference" | "eventTitle" | "locale">,
): string {
  const copy = getPaymentConfirmationEmailCopy(normalizeEmailLocale(input.locale));
  const safeRef = input.reference.trim();
  return `${input.eventTitle.trim()} — ${copy.subjectReceived} (${safeRef})`;
}

export function buildPaymentConfirmationHtml(
  input: PaymentConfirmationTemplateInput,
): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getPaymentConfirmationEmailCopy(loc);
  const forum = getForumEventDetails(loc);

  const title = escapeHtml(input.eventTitle);
  const personTitle = input.recipientTitle?.trim()
    ? `${escapeHtml(input.recipientTitle.trim())} `
    : "";
  const first = escapeHtml(input.recipientFirstName.trim());
  const last = escapeHtml(input.recipientLastName.trim());
  const company = input.recipientCompany?.trim()
    ? `, ${escapeHtml(input.recipientCompany.trim())}`
    : "";
  const ref = escapeHtml(input.reference.trim());
  const attendance = escapeHtml(input.attendanceLabel);
  const amount = escapeHtml(formatMoneyHkd(input.amountHkd));
  const note = input.paymentNote?.trim()
    ? escapeHtml(input.paymentNote.trim())
    : "";
  const summaryState = input.paymentSummaryState ?? "paid";
  const paymentDateRaw = input.paymentDateFormatted.trim() || "—";
  const paymentDateEsc = escapeHtml(paymentDateRaw);
  const enquiryEmail = "iais@ia.org.hk";
  const headerImageUrl = escapeHtml(getEmailHeaderImageUrl());
  const iconCal = escapeHtml(getForumDetailCalendarIconUrl());
  const iconLoc = escapeHtml(getForumDetailLocationIconUrl());
  const iconGlobe = escapeHtml(getForumDetailGlobeIconUrl());
  const headerAlt = escapeHtml(copy.headerImageAlt);
  const dateEsc = escapeHtml(forum.dateTime);
  const venueEsc = escapeHtml(forum.venue);
  const langEsc = escapeHtml(forum.language);

  const dearLine = `${escapeHtml(copy.dearPrefix)}${personTitle}${first} ${last}${company}${escapeHtml(copy.dearSuffix)}`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeHtml(copy.htmlLang)}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${ref} — ${amount}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${C.pageBg};padding:0;">
    <tr>
      <td align="center">
        <table role="presentation" width="973" cellspacing="0" cellpadding="0" border="0" style="max-width:973px;width:100%;background:${C.pageBg};">
          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;background:${C.surface};">
              <img src="${headerImageUrl}" alt="${headerAlt}" width="973" style="display:block;width:100%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;vertical-align:top;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 80px 0;">
              <h1 style="margin:0 0 30px;font-size:32px;line-height:1.25;font-weight:700;color:${C.heading};text-align:center;letter-spacing:0.2px;text-transform:uppercase;">${title}</h1>
              <p style="margin:0 0 22px;font-size:16px;line-height:1.45;color:${C.text};">${dearLine}</p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:${C.text};">${escapeHtml(copy.thankPaymentLineBeforeTitle)}<strong>${title}</strong>${escapeHtml(copy.thankPaymentLineAfterTitle)}</p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.55;color:${C.text};">${escapeHtml(copy.paymentReceivedParagraph)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 80px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${C.border};background:${C.pageBg};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:20px;line-height:1.2;font-weight:700;color:${C.text};">${escapeHtml(copy.forumDetailHeading)}</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 8px 0;">
                          <img src="${iconCal}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">${dateEsc}</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 8px 0;">
                          <img src="${iconLoc}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">${venueEsc}</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 0 0;">
                          <img src="${iconGlobe}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">${langEsc}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 80px 0;">
              <p style="margin:0 0 14px;font-size:20px;line-height:1.2;font-weight:700;color:${C.text};">${escapeHtml(copy.paymentSummaryHeading)}</p>
              ${
                summaryState === "pending"
                  ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.45;color:${C.text};">${escapeHtml(copy.summaryPendingParagraph)}</p>`
                  : summaryState === "paid"
                    ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.45;color:${C.text};">${escapeHtml(copy.summaryPaidParagraph)}</p>`
                    : ""
              }
              <p style="margin:0;font-size:13px;line-height:1.55;color:${C.text};">
                ${escapeHtml(copy.labelRegistrationType)} <strong>${attendance}</strong><br />
                ${escapeHtml(copy.labelInvoiceNumber)} <strong>${ref}</strong><br />
                ${escapeHtml(copy.labelPaymentReference)} <strong>${ref}</strong><br />
                ${escapeHtml(copy.labelAmountReceived)} <strong>${amount}</strong><br />
                ${escapeHtml(copy.labelPaymentDate)} <strong>${paymentDateEsc}</strong>
                ${note ? `<br />${escapeHtml(copy.labelPaymentMethod)} <strong>${note}</strong>` : ""}
              </p>
              ${
                input.pdfReceiptAttached && summaryState === "paid"
                  ? `<p style="margin:14px 0 0;font-size:13px;line-height:1.55;color:${C.muted};">${escapeHtml(copy.pdfAttachedNote)}</p>`
                  : ""
              }
            </td>
          </tr>
          <tr>
            <td style="padding:26px 80px 0;">
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.forwardProcessingParagraph)}</p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.confirmationFollowUpParagraph)}</p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.pleaseNoteHeading)}</p>
              <ul style="margin:0 0 10px 24px;padding:0;font-size:13px;line-height:1.75;color:${C.text};">
                <li>${escapeHtml(copy.bulletPaymentOnly)}</li>
                <li>${escapeHtml(copy.bulletAccessLater)}</li>
              </ul>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.contactQuestionsPrefix)}<a href="mailto:${enquiryEmail}" style="color:${C.link};">${enquiryEmail}</a>${escapeHtml(copy.contactQuestionsSuffix)}</p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.thankSupportClosing)}</p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:${C.text};">${escapeHtml(copy.bestRegards)}<br />${escapeHtml(copy.signature)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0 0;">
              <div style="border-top:1px solid #d9d9d9;height:1px;line-height:1px;font-size:1px;">&nbsp;</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildPaymentConfirmationText(
  input: PaymentConfirmationTemplateInput,
): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getPaymentConfirmationEmailCopy(loc);
  const forum = getForumEventDetails(loc);
  const summaryState = input.paymentSummaryState ?? "paid";
  const personTitle = input.recipientTitle?.trim()
    ? `${input.recipientTitle.trim()} `
    : "";
  const company = input.recipientCompany?.trim()
    ? `, ${input.recipientCompany.trim()}`
    : "";
  const enquiryEmail = "iais@ia.org.hk";
  const lines = [
    `${input.eventTitle}`,
    "",
    `${copy.dearPrefix}${personTitle}${input.recipientFirstName.trim()} ${input.recipientLastName.trim()}${company}${copy.dearSuffix}`,
    "",
    `${copy.thankPaymentLineBeforeTitle}${input.eventTitle.trim()}${copy.thankPaymentLineAfterTitle}`,
    copy.paymentReceivedParagraph,
    "",
    copy.forumDetailHeading,
    forum.dateTime,
    forum.venue,
    forum.language,
    "",
    copy.paymentSummaryHeadingText,
    ...(summaryState === "pending"
      ? [copy.summaryPendingParagraph]
      : summaryState === "paid"
        ? [copy.summaryPaidParagraph]
        : []),
    `${copy.labelRegistrationType} ${input.attendanceLabel}`,
    `${copy.labelInvoiceNumber} ${input.reference.trim()}`,
    `${copy.labelPaymentReference} ${input.reference.trim()}`,
    `${copy.labelAmountReceived} ${formatMoneyHkd(input.amountHkd)}`,
    `${copy.labelPaymentDate} ${input.paymentDateFormatted.trim() || "—"}`,
  ];
  if (input.pdfReceiptAttached && summaryState === "paid") {
    lines.push("", copy.pdfAttachedNote);
  }
  if (input.paymentNote?.trim()) {
    lines.push(`${copy.labelPaymentMethod} ${input.paymentNote.trim()}`);
  }
  lines.push(
    "",
    copy.forwardProcessingParagraph,
    copy.confirmationFollowUpParagraph,
    copy.pleaseNoteHeading,
    `- ${copy.bulletPaymentOnly}`,
    `- ${copy.bulletAccessLater}`,
    `${copy.contactQuestionsPrefix}${enquiryEmail}${copy.contactQuestionsSuffix}`,
    copy.thankSupportClosing,
    "",
    copy.bestRegards,
    copy.signature,
  );
  return lines.join("\n");
}
