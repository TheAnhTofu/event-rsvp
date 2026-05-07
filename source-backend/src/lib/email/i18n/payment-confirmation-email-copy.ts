import type { EmailLocale } from "./email-locale";

export type PaymentConfirmationEmailCopy = {
  htmlLang: string;
  /** `{eventTitle} — … ({reference})` */
  subjectReceived: string;
  dearPrefix: string;
  dearSuffix: string;
  thankPaymentLineBeforeTitle: string;
  thankPaymentLineAfterTitle: string;
  paymentReceivedParagraph: string;
  forumDetailHeading: string;
  paymentSummaryHeading: string;
  summaryPendingParagraph: string;
  summaryPaidParagraph: string;
  labelRegistrationType: string;
  labelInvoiceNumber: string;
  labelPaymentReference: string;
  labelAmountReceived: string;
  labelPaymentDate: string;
  labelPaymentMethod: string;
  pdfAttachedNote: string;
  forwardProcessingParagraph: string;
  confirmationFollowUpParagraph: string;
  pleaseNoteHeading: string;
  bulletPaymentOnly: string;
  bulletAccessLater: string;
  contactQuestionsPrefix: string;
  contactQuestionsSuffix: string;
  thankSupportClosing: string;
  bestRegards: string;
  signature: string;
  headerImageAlt: string;
  /** For plain-text multiline */
  paymentSummaryHeadingText: string;
};

const COPY: Record<EmailLocale, PaymentConfirmationEmailCopy> = {
  en: {
    htmlLang: "en",
    subjectReceived: "Payment received",
    dearPrefix: "Dear ",
    dearSuffix: ",",
    thankPaymentLineBeforeTitle: "Thank you for your payment for ",
    thankPaymentLineAfterTitle: ".",
    paymentReceivedParagraph:
      "We are pleased to confirm that your payment has been successfully received and your registration is now being processed.",
    forumDetailHeading: "Forum Detail",
    paymentSummaryHeading: "Payment summary",
    summaryPendingParagraph:
      "Payment is not marked as received yet. Use the payment link from your registration confirmation or open the checkout again from the event site.",
    summaryPaidParagraph: "We have recorded the payment details below.",
    labelRegistrationType: "Registration Type:",
    labelInvoiceNumber: "Invoice Number:",
    labelPaymentReference: "Payment Reference:",
    labelAmountReceived: "Amount Received:",
    labelPaymentDate: "Payment Date:",
    labelPaymentMethod: "Payment Method:",
    pdfAttachedNote: "A PDF receipt is attached to this email.",
    forwardProcessingParagraph:
      "Your registration details will now be forwarded for final processing.",
    confirmationFollowUpParagraph:
      "A separate Confirmation Email containing your event access details will be sent to you once your registration has been finalized.",
    pleaseNoteHeading: "Please note that:",
    bulletPaymentOnly: "this email confirms receipt of payment only; and",
    bulletAccessLater:
      "event admission / online access details will be provided in the subsequent confirmation email.",
    contactQuestionsPrefix: "If you have any questions, please contact us at ",
    contactQuestionsSuffix: ".",
    thankSupportClosing:
      "Thank you for your support, and we look forward to welcoming you to the event.",
    bestRegards: "Best regards,",
    signature: "Insurance Authority",
    headerImageAlt: "Insurance Authority",
    paymentSummaryHeadingText: "Payment summary",
  },
  "zh-Hant": {
    htmlLang: "zh-Hant",
    subjectReceived: "已收到款項",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    thankPaymentLineBeforeTitle: "感謝閣下就",
    thankPaymentLineAfterTitle: "繳付費用。",
    paymentReceivedParagraph:
      "我們確認已收到閣下的付款，閣下的登記現正處理中。",
    forumDetailHeading: "論壇詳情",
    paymentSummaryHeading: "付款摘要",
    summaryPendingParagraph:
      "系統尚未標示為已收款。請使用登記確認電郵內的付款連結，或從活動網站重新開啟結帳頁面。",
    summaryPaidParagraph: "我們已記錄以下付款資料。",
    labelRegistrationType: "登記類別：",
    labelInvoiceNumber: "發票編號：",
    labelPaymentReference: "付款參考編號：",
    labelAmountReceived: "收取金額：",
    labelPaymentDate: "付款日期：",
    labelPaymentMethod: "付款方式：",
    pdfAttachedNote: "本電郵附有 PDF 格式收據。",
    forwardProcessingParagraph: "閣下的登記資料將轉交作進一步處理。",
    confirmationFollowUpParagraph:
      "待登記完成後，我們將另發確認電郵，當中載有活動參與／網上登入詳情。",
    pleaseNoteHeading: "請注意：",
    bulletPaymentOnly: "本電郵僅確認收到付款；及",
    bulletAccessLater: "活動入場／網上登入詳情將於其後的確認電郵中提供。",
    contactQuestionsPrefix: "如有查詢，請聯絡",
    contactQuestionsSuffix: "。",
    thankSupportClosing: "感謝閣下支持，期待與閣下在活動中見面。",
    bestRegards: "此致",
    signature: "保險業監管局",
    headerImageAlt: "保險業監管局",
    paymentSummaryHeadingText: "付款摘要",
  },
  "zh-Hans": {
    htmlLang: "zh-Hans",
    subjectReceived: "已收到款项",
    dearPrefix: "尊敬的",
    dearSuffix: "：",
    thankPaymentLineBeforeTitle: "感谢阁下就",
    thankPaymentLineAfterTitle: "支付费用。",
    paymentReceivedParagraph:
      "我们确认已收到您的付款，您的登记正在处理中。",
    forumDetailHeading: "论坛详情",
    paymentSummaryHeading: "付款摘要",
    summaryPendingParagraph:
      "系统尚未标记为已收款。请使用登记确认邮件中的付款链接，或从活动网站重新打开结账页面。",
    summaryPaidParagraph: "我们已记录以下付款信息。",
    labelRegistrationType: "登记类别：",
    labelInvoiceNumber: "发票编号：",
    labelPaymentReference: "付款参考编号：",
    labelAmountReceived: "收取金额：",
    labelPaymentDate: "付款日期：",
    labelPaymentMethod: "付款方式：",
    pdfAttachedNote: "本邮件附有 PDF 格式收据。",
    forwardProcessingParagraph: "您的登记资料将转交作进一步处理。",
    confirmationFollowUpParagraph:
      "待登记完成后，我们将另发确认邮件，其中载有活动参与／网上登录详情。",
    pleaseNoteHeading: "请注意：",
    bulletPaymentOnly: "本邮件仅确认收到付款；及",
    bulletAccessLater: "活动入场／网上登录详情将在随后的确认邮件中提供。",
    contactQuestionsPrefix: "如有查询，请联系",
    contactQuestionsSuffix: "。",
    thankSupportClosing: "感谢支持，期待在活动中与您见面。",
    bestRegards: "此致",
    signature: "保险业监管局",
    headerImageAlt: "保险业监管局",
    paymentSummaryHeadingText: "付款摘要",
  },
};

export function getPaymentConfirmationEmailCopy(
  locale: EmailLocale,
): PaymentConfirmationEmailCopy {
  return COPY[locale];
}
