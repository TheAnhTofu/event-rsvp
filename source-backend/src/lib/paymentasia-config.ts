import { getEffectivePaymentAsiaUseSandbox } from "./app-runtime-settings-cache.js";

export type PaymentAsiaConfig = {
  merchantToken: string;
  secretCode: string;
  /** Full URL for hosted page POST, e.g. https://payment-sandbox.pa-sys.com/app/page/{token} */
  hostedPageUrl: string;
};

function trim(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export function resolvePaymentAsiaConfig(): PaymentAsiaConfig | null {
  const merchantToken = trim(process.env.PAYMENTASIA_MERCHANT_TOKEN);
  const secretCode = trim(process.env.PAYMENTASIA_SECRET_CODE);
  if (!merchantToken || !secretCode) return null;

  const sandbox = getEffectivePaymentAsiaUseSandbox();

  const explicit = trim(process.env.PAYMENTASIA_HOSTED_PAGE_URL);
  const hostedPageUrl =
    explicit ??
    (sandbox
      ? `https://payment-sandbox.pa-sys.com/app/page/${merchantToken}`
      : `https://payment.pa-sys.com/app/page/${merchantToken}`);

  return { merchantToken, secretCode, hostedPageUrl };
}

/**
 * POST target for hosted checkout. Default: one URL for all wallets (PA-SYS behaviour).
 * If PaymentAsia gives channel-specific endpoints, set:
 * `PAYMENTASIA_HOSTED_PAGE_URL_ALIPAY` / `PAYMENTASIA_HOSTED_PAGE_URL_WECHAT` /
 * `PAYMENTASIA_HOSTED_PAGE_URL_CARD`.
 */
export type PaymentAsiaWallet = "alipay" | "wechat" | "card";

export function resolvePaymentAsiaActionUrl(
  wallet: PaymentAsiaWallet,
  cfg: PaymentAsiaConfig,
): string {
  const alipay = trim(process.env.PAYMENTASIA_HOSTED_PAGE_URL_ALIPAY);
  const wechat = trim(process.env.PAYMENTASIA_HOSTED_PAGE_URL_WECHAT);
  const card = trim(process.env.PAYMENTASIA_HOSTED_PAGE_URL_CARD);
  if (wallet === "alipay" && alipay) return alipay;
  if (wallet === "wechat" && wechat) return wechat;
  if (wallet === "card" && card) return card;
  return cfg.hostedPageUrl;
}
