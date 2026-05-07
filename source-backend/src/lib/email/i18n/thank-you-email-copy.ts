import type { EmailLocale } from "./email-locale";

export type ThankYouEmailCopy = {
  htmlLang: string;
  /** Subject: `{eventTitle} — {subjectSuffix}` */
  subjectSuffix: string;
  dearPrefix: string;
  dearSuffix: string;
  participateBeforeTitle: string;
  participateAfterTitle: string;
  appreciateParagraph: string;
  forumDetailHeading: string;
  cpdParagraph: string;
  feedbackIntroParagraph: string;
  feedbackFormLabel: string;
  feedbackLinkDisplay: string;
  feedbackImportantParagraph: string;
  websiteVisitPrefix: string;
  websiteVisitAfterLink: string;
  closingParagraph: string;
  bestRegards: string;
  signature: string;
  headerImageAlt: string;
};

const COPY: Record<EmailLocale, ThankYouEmailCopy> = {
  en: {
    htmlLang: "en",
    subjectSuffix: "Thank you for your participation",
    dearPrefix: "Dear ",
    dearSuffix: ",",
    participateBeforeTitle: "Thank you for participating in ",
    participateAfterTitle: ".",
    appreciateParagraph:
      "We sincerely appreciate your support and participation, and we hope you found the event informative and valuable.",
    forumDetailHeading: "Forum Detail",
    cpdParagraph:
      "If applicable, CPD certificates / post-event materials will be sent separately after attendance records have been verified and finalized.",
    feedbackIntroParagraph:
      "We would be grateful if you could take a few moments to complete the post-event feedback survey below:",
    feedbackFormLabel: "Feedback Form:",
    feedbackLinkDisplay: "www.iais.org/feedback",
    feedbackImportantParagraph:
      "Your feedback is important to us and will help us improve future events.",
    websiteVisitPrefix: "Please visit the event website ",
    websiteVisitAfterLink: " for event updates and related information.",
    closingParagraph:
      "Thank you once again for your participation. We look forward to welcoming you again in the future.",
    bestRegards: "Best regards,",
    signature: "Insurance Authority",
    headerImageAlt: "Insurance Authority",
  },
  "zh-Hant": {
    htmlLang: "zh-Hant",
    subjectSuffix: "感謝閣下參與",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    participateBeforeTitle: "感謝閣下參與",
    participateAfterTitle: "。",
    appreciateParagraph:
      "我們衷心感謝閣下的支持與參與，並期望活動能為閣下帶來豐富收穫。",
    forumDetailHeading: "論壇詳情",
    cpdParagraph:
      "如適用，持續專業進修（CPD）證書／活動後資料將於出席紀錄核實及定稿後另行發送。",
    feedbackIntroParagraph: "誠邀閣下抽空填寫以下活動後意見調查：",
    feedbackFormLabel: "意見調查表格：",
    feedbackLinkDisplay: "www.iais.org/feedback",
    feedbackImportantParagraph:
      "閣下的意見對我們非常重要，有助我們改進日後活動。",
    websiteVisitPrefix: "請瀏覽活動網站",
    websiteVisitAfterLink: "以獲取活動最新消息及相關資訊。",
    closingParagraph: "再次感謝閣下參與，期待日後再與閣下相聚。",
    bestRegards: "此致",
    signature: "保險業監管局",
    headerImageAlt: "保險業監管局",
  },
  "zh-Hans": {
    htmlLang: "zh-Hans",
    subjectSuffix: "感谢您的参与",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    participateBeforeTitle: "感谢您参与",
    participateAfterTitle: "。",
    appreciateParagraph:
      "我们衷心感谢您的支持与参与，并希望本次活动对您有所裨益。",
    forumDetailHeading: "论坛详情",
    cpdParagraph:
      "如适用，持续专业进修（CPD）证书／活动后资料将在出席记录核实并定稿后另行发送。",
    feedbackIntroParagraph: "诚邀您抽空填写以下活动后意见调查：",
    feedbackFormLabel: "意见调查表格：",
    feedbackLinkDisplay: "www.iais.org/feedback",
    feedbackImportantParagraph:
      "您的意见对我们非常重要，有助于我们改进今后的活动。",
    websiteVisitPrefix: "请浏览活动网站",
    websiteVisitAfterLink: "以获取活动最新消息及相关信息。",
    closingParagraph: "再次感谢您的参与，期待日后与您再会。",
    bestRegards: "此致",
    signature: "保险业监管局",
    headerImageAlt: "保险业监管局",
  },
};

export function getThankYouEmailCopy(locale: EmailLocale): ThankYouEmailCopy {
  return COPY[locale];
}
