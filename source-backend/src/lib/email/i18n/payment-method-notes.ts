import type { EmailLocale } from "./email-locale";

type Method =
  | "stripe"
  | "demo"
  | "bank_transfer"
  | "no_payment"
  | "paymentasia";

const STRIPE: Record<EmailLocale, string> = {
  en: "Payment processed securely via card (Stripe).",
  "zh-Hant": "款項已透過信用卡（Stripe）安全處理。",
  "zh-Hans": "款项已通过信用卡（Stripe）安全处理。",
};

const DEMO: Record<EmailLocale, string> = {
  en: "Demo mode — no live card charge.",
  "zh-Hant": "示範模式 — 不會進行實際信用卡扣款。",
  "zh-Hans": "演示模式 — 不会进行实际信用卡扣款。",
};

const BANK: Record<EmailLocale, string> = {
  en: "Bank transfer — please follow any separate instructions from the organiser.",
  "zh-Hant": "銀行轉賬 — 請遵照主辦方另行提供的指示。",
  "zh-Hans": "银行转账 — 请遵照主办方另行提供的指示。",
};

const NO_PAY: Record<EmailLocale, string> = {
  en: "No payment required for this registration.",
  "zh-Hant": "此登記無須付款。",
  "zh-Hans": "此登记无须付款。",
};

const PAYMENTASIA: Record<EmailLocale, string> = {
  en: "Payment received via Alipay or WeChat Pay (PaymentAsia).",
  "zh-Hant": "款項已透過支付寶或微信支付（PaymentAsia）收取。",
  "zh-Hans": "款项已通过支付宝或微信支付（PaymentAsia）收取。",
};

export function paymentNoteForMethodEmail(
  method: Method,
  locale: EmailLocale,
): string | undefined {
  switch (method) {
    case "stripe":
      return STRIPE[locale];
    case "demo":
      return DEMO[locale];
    case "bank_transfer":
      return BANK[locale];
    case "no_payment":
      return NO_PAY[locale];
    case "paymentasia":
      return PAYMENTASIA[locale];
    default: {
      const _e: never = method;
      return _e;
    }
  }
}
