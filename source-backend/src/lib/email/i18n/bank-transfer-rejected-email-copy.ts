import type { EmailLocale } from "./email-locale";

export type BankTransferRejectedEmailCopy = {
  htmlLang: string;
  documentTitleSuffix: string;
  leadParagraphBeforeTitle: string;
  leadParagraphAfterTitle: string;
  subjectTag: string;
  dearPrefix: string;
  dearSuffix: string;
  /** Text before `<strong>{reference}</strong>` */
  unableVerifyBeforeRef: string;
  /** Text after `</strong>` (e.g. closing paren + period) */
  unableVerifyAfterRef: string;
  noteFromOrganiserLabel: string;
  resubmitLine: string;
  contactQuestionsPrefix: string;
  contactQuestionsSuffix: string;
  bestRegards: string;
  signature: string;
  headerImageAlt: string;
};

const COPY: Record<EmailLocale, BankTransferRejectedEmailCopy> = {
  en: {
    htmlLang: "en",
    documentTitleSuffix: "Bank transfer verification",
    leadParagraphBeforeTitle: "Thank you for registering for ",
    leadParagraphAfterTitle: ".",
    subjectTag: "Bank transfer verification issue",
    dearPrefix: "Dear ",
    dearSuffix: ",",
    unableVerifyBeforeRef:
      "We were unable to verify the bank transfer for your registration ",
    unableVerifyAfterRef: ".",
    noteFromOrganiserLabel: "Note from the organiser:",
    resubmitLine:
      "Please re-submit your payment slip or contact us for assistance.",
    contactQuestionsPrefix: "If you have any questions, please contact ",
    contactQuestionsSuffix: ".",
    bestRegards: "Best regards,",
    signature: "Insurance Authority",
    headerImageAlt: "Insurance Authority",
  },
  "zh-Hant": {
    htmlLang: "zh-Hant",
    documentTitleSuffix: "銀行轉賬核實",
    leadParagraphBeforeTitle: "感謝閣下登記參加",
    leadParagraphAfterTitle: "。",
    subjectTag: "銀行轉賬核實問題",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    unableVerifyBeforeRef: "我們未能核實閣下登記（參考編號 ",
    unableVerifyAfterRef: "）的銀行轉賬。",
    noteFromOrganiserLabel: "主辦方備註：",
    resubmitLine: "請重新提交付款憑證或聯絡我們以取得協助。",
    contactQuestionsPrefix: "如有查詢，請聯絡",
    contactQuestionsSuffix: "。",
    bestRegards: "此致",
    signature: "保險業監管局",
    headerImageAlt: "保險業監管局",
  },
  "zh-Hans": {
    htmlLang: "zh-Hans",
    documentTitleSuffix: "银行转账核实",
    leadParagraphBeforeTitle: "感谢您登记参加",
    leadParagraphAfterTitle: "。",
    subjectTag: "银行转账核实问题",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    unableVerifyBeforeRef: "我们未能核实您登记（参考编号 ",
    unableVerifyAfterRef: "）的银行转账。",
    noteFromOrganiserLabel: "主办方备注：",
    resubmitLine: "请重新提交付款凭证或联系我们以取得协助。",
    contactQuestionsPrefix: "如有查询，请联系",
    contactQuestionsSuffix: "。",
    bestRegards: "此致",
    signature: "保险业监管局",
    headerImageAlt: "保险业监管局",
  },
};

export function getBankTransferRejectedEmailCopy(
  locale: EmailLocale,
): BankTransferRejectedEmailCopy {
  return COPY[locale];
}
