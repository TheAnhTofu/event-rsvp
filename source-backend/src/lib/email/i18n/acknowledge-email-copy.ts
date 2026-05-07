import type { EmailLocale } from "./email-locale";

export type AcknowledgeEmailCopy = {
  htmlLang: string;
  /** Subject fragment between title and (ref) */
  subjectTag: string;
  preheaderSuffix: string;
  dearPrefix: string;
  dearSuffix: string;
  thankRegisterBeforeTitle: string;
  thankRegisterAfterTitle: string;
  invoiceParagraph: string;
  forumDetailHeading: string;
  registrationDetailsHeading: string;
  labelRegistrationRef: string;
  labelRegistrationType: string;
  labelAmountDue: string;
  proceedPaymentParagraph: string;
  resumeLinkIntro: string;
  bankTransferUseRef: string;
  labelBank: string;
  labelAccountName: string;
  labelAccountNo: string;
  labelSwift: string;
  bankTransferDetailsHeading: string;
  finalNoteParagraph: string;
  contactQuestionsPrefix: string;
  contactQuestionsSuffix: string;
  bestRegards: string;
  signature: string;
  headerImageAlt: string;
};

const COPY: Record<EmailLocale, AcknowledgeEmailCopy> = {
  en: {
    htmlLang: "en",
    subjectTag: "Registration application — documents attached",
    preheaderSuffix:
      "Provisional invoice attached — not a payment receipt. Complete payment separately.",
    dearPrefix: "Dear ",
    dearSuffix: ",",
    thankRegisterBeforeTitle: "Thank you for registering for ",
    thankRegisterAfterTitle:
      ". We have received your registration and it is now being processed.",
    invoiceParagraph:
      "Please find your registration summary and amount due below. A provisional invoice (PDF) is attached for your records.",
    forumDetailHeading: "Forum Detail",
    registrationDetailsHeading: "Registration Details",
    labelRegistrationRef: "Registration Reference:",
    labelRegistrationType: "Registration Type:",
    labelAmountDue: "Amount Due:",
    proceedPaymentParagraph:
      "Please proceed to complete your payment to confirm your registration. You can pay online via card or by bank transfer.",
    resumeLinkIntro:
      "You can resume and complete your payment online at any time using the link below:",
    bankTransferUseRef:
      "If paying by bank transfer, please use your registration reference",
    labelBank: "Bank:",
    labelAccountName: "Account Name:",
    labelAccountNo: "Account No.:",
    labelSwift: "SWIFT:",
    bankTransferDetailsHeading: "Bank Transfer Details:",
    finalNoteParagraph:
      "Please note that your registration is subject to final confirmation by the Insurance Authority.",
    contactQuestionsPrefix: "If you have any questions, please contact us at ",
    contactQuestionsSuffix: ".",
    bestRegards: "Best regards,",
    signature: "Insurance Authority",
    headerImageAlt: "Insurance Authority",
  },
  "zh-Hant": {
    htmlLang: "zh-Hant",
    subjectTag: "登記申請已收到（附文件）",
    preheaderSuffix: "附發票草稿—非付款入帳通知；請另完成付款。",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    thankRegisterBeforeTitle: "感謝閣下報名參加",
    thankRegisterAfterTitle: "。我們已收到閣下的登記資料，現正處理中。",
    invoiceParagraph:
      "請參閱以下登記摘要及應付金額。本電郵附有發票草稿（PDF）供閣下存檔。",
    forumDetailHeading: "論壇詳情",
    registrationDetailsHeading: "登記資料",
    labelRegistrationRef: "登記參考編號：",
    labelRegistrationType: "登記類別：",
    labelAmountDue: "應付金額：",
    proceedPaymentParagraph:
      "請完成付款以確認登記。閣下可使用信用卡於網上付款，或以銀行轉賬方式付款。",
    resumeLinkIntro: "閣下可隨時透過以下連結繼續並完成網上付款：",
    bankTransferUseRef: "如以銀行轉賬付款，請註明登記參考編號",
    labelBank: "銀行：",
    labelAccountName: "戶口名稱：",
    labelAccountNo: "戶口號碼：",
    labelSwift: "SWIFT：",
    bankTransferDetailsHeading: "銀行轉賬資料：",
    finalNoteParagraph:
      "請注意，閣下之登記須經保險業監管局最終確認。",
    contactQuestionsPrefix: "如有查詢，請聯絡",
    contactQuestionsSuffix: "。",
    bestRegards: "此致",
    signature: "保險業監管局",
    headerImageAlt: "保險業監管局",
  },
  "zh-Hans": {
    htmlLang: "zh-Hans",
    subjectTag: "登记申请已收到（附文件）",
    preheaderSuffix: "附发票草稿—非付款到账通知；请另行完成付款。",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    thankRegisterBeforeTitle: "感谢您报名参加",
    thankRegisterAfterTitle: "。我们已收到您的登记信息，正在处理中。",
    invoiceParagraph:
      "请参阅以下登记摘要及应付金额。本邮件附有发票草稿（PDF）供您存档。",
    forumDetailHeading: "论坛详情",
    registrationDetailsHeading: "登记信息",
    labelRegistrationRef: "登记参考编号：",
    labelRegistrationType: "登记类别：",
    labelAmountDue: "应付金额：",
    proceedPaymentParagraph:
      "请完成付款以确认登记。您可使用信用卡在网上付款，或以银行转账方式付款。",
    resumeLinkIntro: "您可以随时通过以下链接继续并完成网上付款：",
    bankTransferUseRef: "如以银行转账付款，请注明登记参考编号",
    labelBank: "银行：",
    labelAccountName: "账户名称：",
    labelAccountNo: "账户号码：",
    labelSwift: "SWIFT：",
    bankTransferDetailsHeading: "银行转账信息：",
    finalNoteParagraph:
      "请注意，您的登记须经保险业监管局最终确认。",
    contactQuestionsPrefix: "如有查询，请联系",
    contactQuestionsSuffix: "。",
    bestRegards: "此致",
    signature: "保险业监管局",
    headerImageAlt: "保险业监管局",
  },
};

export function getAcknowledgeEmailCopy(locale: EmailLocale): AcknowledgeEmailCopy {
  return COPY[locale];
}
