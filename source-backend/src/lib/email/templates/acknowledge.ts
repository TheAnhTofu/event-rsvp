import { getEmailHeaderImageUrl } from "../email-assets";
import { escapeHtml } from "../escape-html";
import { normalizeEmailLocale } from "../i18n/email-locale";
import { getForumEventDetails } from "../i18n/forum-event-details";
import { getAcknowledgeEmailCopy } from "../i18n/acknowledge-email-copy";
import {
  getForumDetailCalendarIconUrl,
  getForumDetailGlobeIconUrl,
  getForumDetailLocationIconUrl,
} from "./forum-detail-icons";

const C = {
  pageBg: "#f2f3f5",
  surface: "#ffffff",
  heading: "#161616",
  text: "#262626",
  muted: "#4f4f4f",
  border: "#bdbdbd",
  link: "#237ee6",
} as const;

export type AcknowledgeTemplateInput = {
  eventTitle: string;
  recipientTitle?: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientCompany?: string;
  reference: string;
  amountHkd: number;
  attendanceLabel: string;
  resumeUrl?: string;
  locale?: string | null;
};

function formatMoneyHkd(n: number): string {
  return `HKD ${n.toFixed(2)}`;
}

export function buildAcknowledgeSubject(
  input: Pick<AcknowledgeTemplateInput, "reference" | "eventTitle" | "locale">,
): string {
  const copy = getAcknowledgeEmailCopy(normalizeEmailLocale(input.locale));
  return `${input.eventTitle.trim()} — ${copy.subjectTag} (${input.reference.trim()})`;
}

export function buildAcknowledgeHtml(
  input: AcknowledgeTemplateInput,
): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getAcknowledgeEmailCopy(loc);
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
  const enquiryEmail = "iais@ia.org.hk";
  const resumeUrl = input.resumeUrl?.trim()
    ? escapeHtml(input.resumeUrl.trim())
    : "";
  const headerImageUrl = escapeHtml(getEmailHeaderImageUrl());
  const iconCal = escapeHtml(getForumDetailCalendarIconUrl());
  const iconLoc = escapeHtml(getForumDetailLocationIconUrl());
  const iconGlobe = escapeHtml(getForumDetailGlobeIconUrl());
  const headerAlt = escapeHtml(copy.headerImageAlt);
  const dateEsc = escapeHtml(forum.dateTime);
  const venueEsc = escapeHtml(forum.venue);
  const langEsc = escapeHtml(forum.language);

  const dearLine = `${escapeHtml(copy.dearPrefix)}${personTitle}${first} ${last}${company}${escapeHtml(copy.dearSuffix)}`;
  const preheader = `${ref} — ${escapeHtml(copy.preheaderSuffix)}`;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeHtml(copy.htmlLang)}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
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
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:${C.text};">${escapeHtml(copy.thankRegisterBeforeTitle)}<strong>${title}</strong>${escapeHtml(copy.thankRegisterAfterTitle)}</p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.55;color:${C.text};">${escapeHtml(copy.invoiceParagraph)}</p>
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
              <p style="margin:0 0 14px;font-size:20px;line-height:1.2;font-weight:700;color:${C.text};">${escapeHtml(copy.registrationDetailsHeading)}</p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:${C.text};">
                ${escapeHtml(copy.labelRegistrationRef)} <strong>${ref}</strong><br />
                ${escapeHtml(copy.labelRegistrationType)} <strong>${attendance}</strong><br />
                ${escapeHtml(copy.labelAmountDue)} <strong>${amount}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 80px 0;">
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.proceedPaymentParagraph)}</p>
              ${
                resumeUrl
                  ? `<p style="margin:0 0 12px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.resumeLinkIntro)}<br /><a href="${resumeUrl}" style="color:${C.link};word-break:break-all;">${resumeUrl}</a></p>`
                  : ""
              }
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.bankTransferUseRef)} <strong>${ref}</strong></p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">
                <tr><td style="padding:0 12px 2px 0;font-weight:bold;">${escapeHtml(copy.labelBank)}</td><td style="padding:0 0 2px;">Bank of Asia Mercantile (BAM)</td></tr>
                <tr><td style="padding:0 12px 2px 0;font-weight:bold;">${escapeHtml(copy.labelAccountName)}</td><td style="padding:0 0 2px;">IAIS Annual Conference 2026</td></tr>
                <tr><td style="padding:0 12px 2px 0;font-weight:bold;">${escapeHtml(copy.labelAccountNo)}</td><td style="padding:0 0 2px;">012-345-6789-012</td></tr>
                <tr><td style="padding:0 12px 2px 0;font-weight:bold;">${escapeHtml(copy.labelSwift)}</td><td style="padding:0 0 2px;">BAMCHKHH</td></tr>
              </table>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.finalNoteParagraph)}</p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.75;color:${C.text};">${escapeHtml(copy.contactQuestionsPrefix)}<a href="mailto:${enquiryEmail}" style="color:${C.link};">${enquiryEmail}</a>${escapeHtml(copy.contactQuestionsSuffix)}</p>
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

export function buildAcknowledgeText(
  input: AcknowledgeTemplateInput,
): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getAcknowledgeEmailCopy(loc);
  const forum = getForumEventDetails(loc);

  const personTitle = input.recipientTitle?.trim()
    ? `${input.recipientTitle.trim()} `
    : "";
  const company = input.recipientCompany?.trim()
    ? `, ${input.recipientCompany.trim()}`
    : "";
  const lines = [
    input.eventTitle,
    "",
    `${copy.dearPrefix}${personTitle}${input.recipientFirstName.trim()} ${input.recipientLastName.trim()}${company}${copy.dearSuffix}`,
    "",
    `${copy.thankRegisterBeforeTitle}${input.eventTitle.trim()}${copy.thankRegisterAfterTitle}`,
    "",
    copy.invoiceParagraph,
    "",
    copy.forumDetailHeading,
    forum.dateTime,
    forum.venue,
    forum.language,
    "",
    copy.registrationDetailsHeading,
    `${copy.labelRegistrationRef} ${input.reference.trim()}`,
    `${copy.labelRegistrationType} ${input.attendanceLabel}`,
    `${copy.labelAmountDue} ${formatMoneyHkd(input.amountHkd)}`,
    "",
    copy.proceedPaymentParagraph,
  ];
  if (input.resumeUrl?.trim()) {
    lines.push("", copy.resumeLinkIntro, input.resumeUrl.trim());
  }
  lines.push(
    "",
    `${copy.bankTransferUseRef} ${input.reference.trim()}`,
    "",
    copy.bankTransferDetailsHeading,
    `${copy.labelBank} Bank of Asia Mercantile (BAM)`,
    `${copy.labelAccountName} IAIS Annual Conference 2026`,
    `${copy.labelAccountNo} 012-345-6789-012`,
    `${copy.labelSwift} BAMCHKHH`,
    "",
    copy.finalNoteParagraph,
    "",
    `${copy.contactQuestionsPrefix}iais@ia.org.hk${copy.contactQuestionsSuffix}`,
    "",
    copy.bestRegards,
    copy.signature,
  );
  return lines.join("\n");
}
