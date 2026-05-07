import type { EmailLocale } from "./email-locale";

export type ReminderEmailCopy = {
  htmlLang: string;
  documentTitleSuffix: string;
  /** Subject line — full line including event title */
  subjectLine: (eventTitle: string) => string;
  dearPrefix: string;
  dearSuffix: string;
  leadParagraphBeforeTitle: string;
  leadParagraphAfterTitle: string;
  yourRegistrationHeading: string;
  labelReference: string;
  labelAttendance: string;
  contactQuestionsPrefix: string;
  contactQuestionsSuffix: string;
  bestRegards: string;
  signature: string;
  headerImageAlt: string;
};

const COPY: Record<EmailLocale, ReminderEmailCopy> = {
  en: {
    htmlLang: "en",
    documentTitleSuffix: "Reminder",
    subjectLine: (t) => `Reminder: ${t} is approaching`,
    dearPrefix: "Dear ",
    dearSuffix: ",",
    leadParagraphBeforeTitle: "This is a friendly reminder that ",
    leadParagraphAfterTitle:
      " is approaching. We look forward to welcoming you!",
    yourRegistrationHeading: "Your Registration",
    labelReference: "Reference:",
    labelAttendance: "Attendance:",
    contactQuestionsPrefix: "If you have any questions, please contact ",
    contactQuestionsSuffix: ".",
    bestRegards: "Best regards,",
    signature: "Insurance Authority",
    headerImageAlt: "Insurance Authority",
  },
  "zh-Hant": {
    htmlLang: "zh-Hant",
    documentTitleSuffix: "提醒",
    subjectLine: (t) => `提醒：${t}即將舉行`,
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    leadParagraphBeforeTitle: "謹此提醒，",
    leadParagraphAfterTitle: "即將舉行，期待與閣下見面！",
    yourRegistrationHeading: "閣下之登記",
    labelReference: "參考編號：",
    labelAttendance: "出席方式：",
    contactQuestionsPrefix: "如有查詢，請聯絡",
    contactQuestionsSuffix: "。",
    bestRegards: "此致",
    signature: "保險業監管局",
    headerImageAlt: "保險業監管局",
  },
  "zh-Hans": {
    htmlLang: "zh-Hans",
    documentTitleSuffix: "提醒",
    subjectLine: (t) => `提醒：${t}即将举行`,
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    leadParagraphBeforeTitle: "特此提醒，",
    leadParagraphAfterTitle: "即将举行，期待与您见面！",
    yourRegistrationHeading: "您的登记",
    labelReference: "参考编号：",
    labelAttendance: "出席方式：",
    contactQuestionsPrefix: "如有查询，请联系",
    contactQuestionsSuffix: "。",
    bestRegards: "此致",
    signature: "保险业监管局",
    headerImageAlt: "保险业监管局",
  },
};

export function getReminderEmailCopy(locale: EmailLocale): ReminderEmailCopy {
  return COPY[locale];
}
