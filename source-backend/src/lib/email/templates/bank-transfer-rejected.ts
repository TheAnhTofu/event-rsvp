import { getEmailHeaderImageUrl } from "../email-assets";
import { escapeHtml } from "../escape-html";
import { normalizeEmailLocale } from "../i18n/email-locale";
import { getBankTransferRejectedEmailCopy } from "../i18n/bank-transfer-rejected-email-copy";

const C = {
  pageBg: "#f2f3f5",
  surface: "#ffffff",
  heading: "#161616",
  text: "#262626",
  link: "#237ee6",
} as const;

export type BankTransferRejectedTemplateInput = {
  eventTitle: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientTitle?: string;
  reference: string;
  /** Optional note shown under the main message (e.g. from admin when rejecting a slip). */
  rejectionNote?: string;
  locale?: string | null;
};

export function buildBankTransferRejectedSubject(
  input: Pick<BankTransferRejectedTemplateInput, "eventTitle" | "reference" | "locale">,
): string {
  const copy = getBankTransferRejectedEmailCopy(normalizeEmailLocale(input.locale));
  const eventTitle = input.eventTitle.trim();
  const ref = input.reference.trim();
  return `${eventTitle} — ${copy.subjectTag} (${ref})`;
}

export function buildBankTransferRejectedHtml(
  input: BankTransferRejectedTemplateInput,
): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getBankTransferRejectedEmailCopy(loc);

  const title = escapeHtml(input.eventTitle);
  const personTitle = input.recipientTitle?.trim()
    ? `${escapeHtml(input.recipientTitle.trim())} `
    : "";
  const first = escapeHtml(input.recipientFirstName.trim());
  const last = escapeHtml(input.recipientLastName.trim());
  const ref = escapeHtml(input.reference.trim());
  const enquiryEmail = "iais@ia.org.hk";
  const headerImageUrl = escapeHtml(getEmailHeaderImageUrl());
  const headerAlt = escapeHtml(copy.headerImageAlt);

  const dearLine = `${escapeHtml(copy.dearPrefix)}${personTitle}${first} ${last}${escapeHtml(copy.dearSuffix)}`;

  const unableBefore = escapeHtml(copy.unableVerifyBeforeRef);
  const unableAfter = escapeHtml(copy.unableVerifyAfterRef);
  const noteTrim = input.rejectionNote?.trim();
  const noteBlock = noteTrim
    ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${C.text};"><strong>${escapeHtml(copy.noteFromOrganiserLabel)}</strong> ${escapeHtml(noteTrim)}</p>`
    : "";
  const resubmitLine = escapeHtml(copy.resubmitLine);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeHtml(copy.htmlLang)}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ${escapeHtml(copy.documentTitleSuffix)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${C.pageBg};">
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
              <h1 style="margin:0 0 30px;font-size:28px;font-weight:700;color:${C.heading};text-align:center;text-transform:uppercase;">${title}</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.45;color:${C.text};">${dearLine}</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${C.text};">${escapeHtml(copy.leadParagraphBeforeTitle)}<strong>${title}</strong>${escapeHtml(copy.leadParagraphAfterTitle)}</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${C.text};">${unableBefore}<strong>${ref}</strong>${unableAfter}</p>
              ${noteBlock}
              <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${C.text};">${resubmitLine}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 80px 0;">
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

export function buildBankTransferRejectedText(
  input: BankTransferRejectedTemplateInput,
): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getBankTransferRejectedEmailCopy(loc);

  const personTitle = input.recipientTitle?.trim()
    ? `${input.recipientTitle.trim()} `
    : "";
  const ref = input.reference.trim();
  const noteTrim = input.rejectionNote?.trim();
  const lines = [
    input.eventTitle,
    "",
    `${copy.dearPrefix}${personTitle}${input.recipientFirstName.trim()} ${input.recipientLastName.trim()}${copy.dearSuffix}`,
    "",
    `${copy.leadParagraphBeforeTitle}${input.eventTitle.trim()}${copy.leadParagraphAfterTitle}`,
    "",
    `${copy.unableVerifyBeforeRef}${ref}${copy.unableVerifyAfterRef}`,
  ];
  if (noteTrim) {
    lines.push("", `${copy.noteFromOrganiserLabel} ${noteTrim}`);
  }
  lines.push("", copy.resubmitLine, "", `${copy.contactQuestionsPrefix}iais@ia.org.hk${copy.contactQuestionsSuffix}`);
  return [
    ...lines,
    "",
    copy.bestRegards,
    copy.signature,
  ].join("\n");
}

