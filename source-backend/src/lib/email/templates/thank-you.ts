import { getEmailHeaderImageUrl } from "../email-assets";
import { escapeHtml } from "../escape-html";
import {
  getForumDetailCalendarIconUrl,
  getForumDetailGlobeIconUrl,
  getForumDetailLocationIconUrl,
} from "./forum-detail-icons";
import type { ThankYouEmailCopy } from "../i18n/thank-you-email-copy";
import type { ForumEventDetailsCopy } from "../i18n/forum-event-details";

/** Thank-you (post-event) email — copy from `getThankYouEmailCopy` + forum details. */
const C = {
  pageBg: "#f2f3f5",
  surface: "#ffffff",
  heading: "#161616",
  text: "#262626",
  border: "#bdbdbd",
  link: "#237ee6",
} as const;

export type ThankYouTemplateInput = {
  eventTitle: string;
  recipientDisplayName: string;
  feedbackUrl?: string;
  websiteUrl?: string;
  copy: ThankYouEmailCopy;
  forum: ForumEventDetailsCopy;
};

export function buildThankYouSubject(
  input: Pick<ThankYouTemplateInput, "eventTitle" | "copy">,
): string {
  return `${input.eventTitle.trim()} — ${input.copy.subjectSuffix}`;
}

export function buildThankYouHtml(input: ThankYouTemplateInput): string {
  const title = escapeHtml(input.eventTitle.trim());
  const recipient = escapeHtml(input.recipientDisplayName.trim());
  const { copy, forum } = input;
  const feedbackUrl = escapeHtml(
    input.feedbackUrl?.trim() || "https://www.iais.org/feedback",
  );
  const websiteUrl = escapeHtml(input.websiteUrl?.trim() || "https://www.iais.org");
  const feedbackLabel = escapeHtml(copy.feedbackLinkDisplay);
  const websiteLabel = "www.iais.org";
  const headerImageUrl = escapeHtml(getEmailHeaderImageUrl());
  const iconCal = escapeHtml(getForumDetailCalendarIconUrl());
  const iconLoc = escapeHtml(getForumDetailLocationIconUrl());
  const iconGlobe = escapeHtml(getForumDetailGlobeIconUrl());
  const headerAlt = escapeHtml(copy.headerImageAlt);
  const dateEsc = escapeHtml(forum.dateTime);
  const venueEsc = escapeHtml(forum.venue);
  const langEsc = escapeHtml(forum.language);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeHtml(copy.htmlLang)}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
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
              <p style="margin:0 0 28px;font-size:16px;line-height:1.4;color:${C.text};">${escapeHtml(copy.dearPrefix)}${recipient}${escapeHtml(copy.dearSuffix)}</p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.participateBeforeTitle)}<strong>${title}</strong>${escapeHtml(copy.participateAfterTitle)}</p>
              <p style="margin:0 0 32px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.appreciateParagraph)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 80px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${C.border};background:${C.pageBg};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:20px;line-height:1.25;font-weight:700;color:${C.text};">${escapeHtml(copy.forumDetailHeading)}</p>
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
            <td style="padding:30px 80px 0;">
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.cpdParagraph)}</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.feedbackIntroParagraph)}</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.feedbackFormLabel)} <a href="${feedbackUrl}" style="color:${C.link};text-decoration:underline;">${feedbackLabel}</a>.</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.feedbackImportantParagraph)}</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.websiteVisitPrefix)}<a href="${websiteUrl}" style="color:${C.link};text-decoration:underline;">${escapeHtml(websiteLabel)}</a>${escapeHtml(copy.websiteVisitAfterLink)}</p>
              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${C.text};">${escapeHtml(copy.closingParagraph)}</p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:${C.text};">${escapeHtml(copy.bestRegards)}<br />${escapeHtml(copy.signature)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 0 0;">
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

export function buildThankYouText(input: ThankYouTemplateInput): string {
  const { copy, forum } = input;
  const feedbackUrl = input.feedbackUrl?.trim() || "https://www.iais.org/feedback";
  const websiteUrl = input.websiteUrl?.trim() || "https://www.iais.org";
  const title = input.eventTitle.trim();
  const name = input.recipientDisplayName.trim();

  return [
    title,
    "",
    `${copy.dearPrefix}${name}${copy.dearSuffix}`,
    "",
    `${copy.participateBeforeTitle}${title}${copy.participateAfterTitle}`,
    copy.appreciateParagraph,
    "",
    copy.forumDetailHeading,
    forum.dateTime,
    forum.venue,
    forum.language,
    "",
    copy.cpdParagraph,
    copy.feedbackIntroParagraph,
    `${copy.feedbackFormLabel} ${feedbackUrl}.`,
    copy.feedbackImportantParagraph,
    `${copy.websiteVisitPrefix}${websiteUrl}${copy.websiteVisitAfterLink}`,
    copy.closingParagraph,
    "",
    copy.bestRegards,
    copy.signature,
  ].join("\n");
}
