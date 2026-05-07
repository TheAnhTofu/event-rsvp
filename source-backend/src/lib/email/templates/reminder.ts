import { getEmailHeaderImageUrl } from "../email-assets";
import { escapeHtml } from "../escape-html";
import { normalizeEmailLocale } from "../i18n/email-locale";
import { getForumEventDetails } from "../i18n/forum-event-details";
import { getReminderEmailCopy } from "../i18n/reminder-email-copy";
import {
  getForumDetailCalendarIconUrl,
  getForumDetailLocationIconUrl,
} from "./forum-detail-icons";

const C = {
  pageBg: "#f2f3f5",
  surface: "#ffffff",
  heading: "#161616",
  text: "#262626",
  link: "#237ee6",
  border: "#bdbdbd",
} as const;

export type ReminderTemplateInput = {
  eventTitle: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientTitle?: string;
  reference: string;
  attendanceLabel: string;
  locale?: string | null;
};

export function buildReminderSubject(
  input: Pick<ReminderTemplateInput, "eventTitle" | "locale">,
): string {
  const copy = getReminderEmailCopy(normalizeEmailLocale(input.locale));
  return copy.subjectLine(input.eventTitle.trim());
}

export function buildReminderHtml(input: ReminderTemplateInput): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getReminderEmailCopy(loc);
  const forum = getForumEventDetails(loc);

  const title = escapeHtml(input.eventTitle);
  const personTitle = input.recipientTitle?.trim()
    ? `${escapeHtml(input.recipientTitle.trim())} `
    : "";
  const first = escapeHtml(input.recipientFirstName.trim());
  const last = escapeHtml(input.recipientLastName.trim());
  const ref = escapeHtml(input.reference.trim());
  const attendance = escapeHtml(input.attendanceLabel);
  const enquiryEmail = "iais@ia.org.hk";
  const headerImageUrl = escapeHtml(getEmailHeaderImageUrl());
  const iconCal = escapeHtml(getForumDetailCalendarIconUrl());
  const iconLoc = escapeHtml(getForumDetailLocationIconUrl());
  const headerAlt = escapeHtml(copy.headerImageAlt);
  const dateEsc = escapeHtml(forum.dateTime);
  const venueEsc = escapeHtml(forum.venue);

  const dearLine = `${escapeHtml(copy.dearPrefix)}${personTitle}${first} ${last}${escapeHtml(copy.dearSuffix)}`;

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
            </td>
          </tr>
          <tr>
            <td style="padding:0 80px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${C.border};background:${C.pageBg};">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-size:20px;line-height:1.2;font-weight:700;color:${C.text};">${escapeHtml(copy.yourRegistrationHeading)}</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 8px 0;">
                          <img src="${iconCal}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">${dateEsc}</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 0 0;">
                          <img src="${iconLoc}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">${venueEsc}</td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0;font-size:13px;line-height:1.55;color:${C.text};">
                      ${escapeHtml(copy.labelReference)} <strong>${ref}</strong><br />
                      ${escapeHtml(copy.labelAttendance)} <strong>${attendance}</strong>
                    </p>
                  </td>
                </tr>
              </table>
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

export function buildReminderText(input: ReminderTemplateInput): string {
  const loc = normalizeEmailLocale(input.locale);
  const copy = getReminderEmailCopy(loc);
  const forum = getForumEventDetails(loc);

  const personTitle = input.recipientTitle?.trim()
    ? `${input.recipientTitle.trim()} `
    : "";
  return [
    input.eventTitle,
    "",
    `${copy.dearPrefix}${personTitle}${input.recipientFirstName.trim()} ${input.recipientLastName.trim()}${copy.dearSuffix}`,
    "",
    `${copy.leadParagraphBeforeTitle}${input.eventTitle.trim()}${copy.leadParagraphAfterTitle}`,
    "",
    copy.yourRegistrationHeading,
    forum.dateTime,
    forum.venue,
    `${copy.labelReference} ${input.reference.trim()}`,
    `${copy.labelAttendance} ${input.attendanceLabel}`,
    "",
    `${copy.contactQuestionsPrefix}iais@ia.org.hk${copy.contactQuestionsSuffix}`,
    "",
    copy.bestRegards,
    copy.signature,
  ].join("\n");
}
