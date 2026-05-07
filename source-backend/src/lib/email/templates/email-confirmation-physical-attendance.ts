import {
  getEmailHeaderImageUrl,
  getEmailQrPlaceholderImageUrl,
} from "../email-assets";
import { escapeHtml } from "../escape-html";
import {
  getForumDetailCalendarIconUrl,
  getForumDetailGlobeIconUrl,
  getForumDetailLocationIconUrl,
} from "./forum-detail-icons";

/** Email confirmation template aligned to Figma node 321:25059. */
const C = {
  pageBg: "#f7f8fc",
  surface: "#ffffff",
  heading: "#161616",
  text: "#262626",
  muted: "#4f4f4f",
  border: "#bdbdbd",
  link: "#237ee6",
} as const;

export type EmailConfirmationPhysicalAttendanceTemplateInput = {
  eventTitle: string;
  recipientTitle?: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientCompany?: string;
  qrCodeImageUrl?: string;
  websiteUrl?: string;
  enquiryEmail?: string;
  cpdGuidelineCode?: string;
};

export function buildEmailConfirmationPhysicalAttendanceSubject(
  input: Pick<EmailConfirmationPhysicalAttendanceTemplateInput, "eventTitle">,
): string {
  return `${input.eventTitle} | Email Confirmation | Physical Attendance`;
}

export function buildEmailConfirmationPhysicalAttendanceHtml(
  input: EmailConfirmationPhysicalAttendanceTemplateInput,
): string {
  const title = escapeHtml(input.eventTitle.trim());
  const personTitle = input.recipientTitle?.trim()
    ? `${escapeHtml(input.recipientTitle.trim())} `
    : "";
  const first = escapeHtml(input.recipientFirstName.trim());
  const last = escapeHtml(input.recipientLastName.trim());
  const company = input.recipientCompany?.trim()
    ? `, ${escapeHtml(input.recipientCompany.trim())}`
    : "";
  const qrCodeImageUrl = escapeHtml(
    input.qrCodeImageUrl?.trim() || getEmailQrPlaceholderImageUrl(),
  );
  const websiteUrl = escapeHtml(input.websiteUrl?.trim() || "https://iais.ia.org.hk");
  const enquiryEmail = escapeHtml(input.enquiryEmail?.trim() || "iais@ia.org.hk");
  const cpdGuidelineCode = escapeHtml(input.cpdGuidelineCode?.trim() || "GL24");
  const headerImageUrl = escapeHtml(getEmailHeaderImageUrl());
  const iconCal = escapeHtml(getForumDetailCalendarIconUrl());
  const iconLoc = escapeHtml(getForumDetailLocationIconUrl());
  const iconGlobe = escapeHtml(getForumDetailGlobeIconUrl());

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${C.pageBg};padding:0;">
    <tr>
      <td align="center">
        <table role="presentation" width="973" cellspacing="0" cellpadding="0" border="0" style="max-width:973px;width:100%;background:${C.surface};">
          <tr>
            <td align="center" style="padding:0;line-height:0;font-size:0;background:${C.surface};">
              <img src="${headerImageUrl}" alt="Insurance Authority" width="973" style="display:block;width:100%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;vertical-align:top;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 80px 0;">
              <h1 style="margin:0 0 30px;font-size:32px;line-height:40px;font-weight:700;color:${C.heading};text-align:center;letter-spacing:0.2px;text-transform:uppercase;">${title}</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.4;color:${C.text};">Dear ${personTitle}${first} ${last}${company},</p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:${C.text};">Thank you for registering for <strong>${title}</strong>, which will be held on 9-13 November. We are pleased to confirm your registration.</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.55;color:${C.text};">Please <strong><u>print or show this email</u></strong> and present your business card for registration at the guest reception counter on the event day.</p>
              <div style="text-align:center;padding:4px 0 0;">
                <img src="${qrCodeImageUrl}" alt="Event QR code" width="329" style="display:inline-block;width:329px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              </div>
              <p style="margin:18px 0 8px;font-size:14px;line-height:1.45;color:${C.muted};text-align:center;font-style:italic;">(If the QR code cannot be displayed properly, please download the attachment.)</p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.45;color:${C.text};text-align:center;font-style:italic;font-weight:600;">Please note that the QR code is only for your personal use and is non-transferable.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 80px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${C.border};background:${C.surface};">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px;font-size:20px;line-height:1.25;font-weight:700;color:${C.text};">Forum Detail</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 8px 0;">
                          <img src="${iconCal}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">12-13 November 2026, 9:00 am - 5:00 pm (HK Time)</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 8px 0;">
                          <img src="${iconLoc}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">Venue: Kerry Hotel Hong Kong</td>
                      </tr>
                      <tr>
                        <td width="24" valign="top" style="padding:2px 8px 0 0;">
                          <img src="${iconGlobe}" alt="" width="18" height="18" style="display:block;border:0;outline:none;text-decoration:none;" />
                        </td>
                        <td valign="top" style="padding:0;font-size:15px;line-height:1.5;color:${C.text};">English, supplemented by Putonghua simultaneous interpretation</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 80px 0;">
              <p style="margin:0 0 10px;font-size:20px;line-height:1.3;font-weight:700;color:${C.text};">Continuing Professional Development (CPD) hours</p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:${C.text};">AIF 2023 is a Type 7 Qualified CPD Activity, specified under the CPD Guideline (<a href="${websiteUrl}" style="color:${C.link};text-decoration:underline;">${cpdGuidelineCode}</a>) issued by the Insurance Authority. If you have applied for the CPD hours, please note the requirements as follows:</p>
              <ul style="margin:0 0 18px 20px;padding:0;font-size:13px;line-height:1.55;color:${C.text};">
                <li>You are required to attend the entire event from <strong>9:30 am to 5:05 pm</strong> (excluding lunch session) in order to earn 5.5 CPD hours.</li>
                <li>You must sign in no later than 9:30 am and sign out after 5:05 pm <strong>by scanning a designated QR code</strong> at the CPD hour registration counter to confirm your attendance.</li>
                <li>If you fail to attend the entire event according to our records, you will not be entitled to any CPD hours. You may be required to provide proof or evidence of attendance in case of any dispute.</li>
                <li>You will receive your CPD certificate via your registered email address within <strong>two months</strong> from the event day after your attendance record has been verified. The award of the CPD certificate will be subject to the final decision of the Insurance Authority.</li>
              </ul>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:${C.text};">We will communicate with you via email should there be any changes in our arrangements.<br />Please visit the IAIS website (<a href="${websiteUrl}" style="color:${C.link};text-decoration:underline;">https://iais.ia.org.hk</a>) for the most up-to-date information.</p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:${C.text};">If at any stage you find that you are no longer able to attend, please let us know as soon as possible.<br />For enquiries, please email us at <a href="mailto:${enquiryEmail}" style="color:${C.link};text-decoration:underline;">${enquiryEmail}</a>.</p>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:${C.text};">We look forward to seeing you at the event. Thank you.</p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:${C.text};">Best regards,<br />Insurance Authority</p>
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

export function buildEmailConfirmationPhysicalAttendanceText(
  input: EmailConfirmationPhysicalAttendanceTemplateInput,
): string {
  const personTitle = input.recipientTitle?.trim()
    ? `${input.recipientTitle.trim()} `
    : "";
  const company = input.recipientCompany?.trim()
    ? `, ${input.recipientCompany.trim()}`
    : "";
  const websiteUrl = input.websiteUrl?.trim() || "https://iais.ia.org.hk";
  const enquiryEmail = input.enquiryEmail?.trim() || "iais@ia.org.hk";
  const cpdGuidelineCode = input.cpdGuidelineCode?.trim() || "GL24";

  return [
    input.eventTitle.trim(),
    "",
    `Dear ${personTitle}${input.recipientFirstName.trim()} ${input.recipientLastName.trim()}${company},`,
    "",
    `Thank you for registering for ${input.eventTitle.trim()}, which will be held on 9-13 November. We are pleased to confirm your registration.`,
    "Please print or show this email and present your business card for registration at the guest reception counter on the event day.",
    "",
    "(If the QR code cannot be displayed properly, please download the attachment.)",
    "Please note that the QR code is only for your personal use and is non-transferable.",
    "",
    "Forum Detail",
    "12-13 November 2026, 9:00 am - 5:00 pm (HK Time)",
    "Venue: Kerry Hotel Hong Kong",
    "English, supplemented by Putonghua simultaneous interpretation",
    "",
    "Continuing Professional Development (CPD) hours",
    `AIF 2023 is a Type 7 Qualified CPD Activity, specified under the CPD Guideline (${cpdGuidelineCode}) issued by the Insurance Authority. If you have applied for the CPD hours, please note the requirements as follows:`,
    "- You are required to attend the entire event from 9:30 am to 5:05 pm (excluding lunch session) in order to earn 5.5 CPD hours.",
    "- You must sign in no later than 9:30 am and sign out after 5:05 pm by scanning a designated QR code at the CPD hour registration counter to confirm your attendance.",
    "- If you fail to attend the entire event according to our records, you will not be entitled to any CPD hours. You may be required to provide proof or evidence of attendance in case of any dispute.",
    "- You will receive your CPD certificate via your registered email address within two months from the event day after your attendance record has been verified. The award of the CPD certificate will be subject to the final decision of the Insurance Authority.",
    "",
    "We will communicate with you via email should there be any changes in our arrangements.",
    `Please visit the IAIS website (${websiteUrl}) for the most up-to-date information.`,
    "If at any stage you find that you are no longer able to attend, please let us know as soon as possible.",
    `For enquiries, please email us at ${enquiryEmail}.`,
    "We look forward to seeing you at the event. Thank you.",
    "",
    "Best regards,",
    "Insurance Authority",
  ].join("\n");
}
