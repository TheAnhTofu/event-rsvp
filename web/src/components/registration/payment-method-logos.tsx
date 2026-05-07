import type { ReactNode } from "react";

/**
 * Payment brand marks exported from Figma (IAIS Registration — Payment Detail).
 * Assets live in /public/payment/*.svg — SVG roots use preserveAspectRatio xMidYMid meet
 * so marks are not stretched inside the fixed 30×20 slots.
 *
 * Supported: Visa, Mastercard, Amex, UnionPay, JCB, Discover/Diners,
 *            Apple Pay, Google Pay, Alipay, WeChat Pay
 */

function LogoBox({ children }: { children: ReactNode }) {
  return (
    <div className="relative box-border flex h-5 w-[30px] shrink-0 items-center justify-center rounded-[2.5px] border border-[#bababa] bg-white px-0.5">
      {children}
    </div>
  );
}

/** Cards, UnionPay, JCB, Discover, Google Pay, Apple Pay — no Alipay / WeChat (those sit under QFPay). */
export function StripePaymentMethodLogos() {
  return (
    <div
      role="img"
      aria-label="Visa, Mastercard, Amex, UnionPay, JCB, Discover, Google Pay, Apple Pay"
      className="flex flex-wrap items-center gap-[3.75px]"
    >
      <img
        src="/payment/visa.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <img
        src="/payment/mastercard.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <img
        src="/payment/amex.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <img
        src="/payment/unionpay.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <img
        src="/payment/jcb.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <img
        src="/payment/discover.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <LogoBox>
        <span className="flex items-center justify-center gap-px">
          <img
            src="/payment/google-pay-g.svg"
            alt=""
            width={12}
            height={12}
            className="h-2.5 w-auto object-contain"
          />
          <img
            src="/payment/google-pay-pay.svg"
            alt=""
            width={14}
            height={8}
            className="h-2 w-auto object-contain"
          />
        </span>
      </LogoBox>
      <LogoBox>
        <img
          src="/payment/apple-pay.svg"
          alt=""
          width={26}
          height={12}
          className="h-2.5 max-w-[26px] object-contain"
        />
      </LogoBox>
    </div>
  );
}

/** Alipay and WeChat Pay marks (legacy / generic). */
export function AlipayWeChatPaymentLogos() {
  return (
    <div
      role="img"
      aria-label="Alipay, WeChat Pay"
      className="flex flex-wrap items-center gap-[3.75px]"
    >
      <LogoBox>
        <img
          src="/payment/alipay.svg"
          alt=""
          width={24}
          height={10}
          className="h-2.5 max-w-[24px] object-contain"
        />
      </LogoBox>
      <LogoBox>
        <img
          src="/payment/wechat-pay.svg"
          alt=""
          width={20}
          height={12}
          className="h-2.5 max-w-[20px] object-contain"
        />
      </LogoBox>
    </div>
  );
}

/** Card brands + Apple Pay / Google Pay + Alipay / WeChat — used for the PaymentAsia "wallet" option preview. */
export function PaymentAsiaMethodLogos() {
  return (
    <div
      role="img"
      aria-label="Visa, Mastercard, Apple Pay, Google Pay, Alipay, WeChat Pay"
      className="flex flex-wrap items-center gap-[3.75px]"
    >
      <img
        src="/payment/visa.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <img
        src="/payment/mastercard.svg"
        alt=""
        width={30}
        height={20}
        className="h-5 w-[30px] shrink-0 object-contain object-center"
      />
      <LogoBox>
        <span className="flex items-center justify-center gap-px">
          <img
            src="/payment/google-pay-g.svg"
            alt=""
            width={12}
            height={12}
            className="h-2.5 w-auto object-contain"
          />
          <img
            src="/payment/google-pay-pay.svg"
            alt=""
            width={14}
            height={8}
            className="h-2 w-auto object-contain"
          />
        </span>
      </LogoBox>
      <LogoBox>
        <img
          src="/payment/apple-pay.svg"
          alt=""
          width={26}
          height={12}
          className="h-2.5 max-w-[26px] object-contain"
        />
      </LogoBox>
      <LogoBox>
        <img
          src="/payment/alipay.svg"
          alt=""
          width={24}
          height={10}
          className="h-2.5 max-w-[24px] object-contain"
        />
      </LogoBox>
      <LogoBox>
        <img
          src="/payment/wechat-pay.svg"
          alt=""
          width={20}
          height={12}
          className="h-2.5 max-w-[20px] object-contain"
        />
      </LogoBox>
    </div>
  );
}

/** Full row: Stripe wallets + Alipay + WeChat (legacy / generic). */
export function PaymentMethodLogos() {
  return (
    <div className="flex flex-col items-end gap-2 md:items-end">
      <StripePaymentMethodLogos />
      <AlipayWeChatPaymentLogos />
    </div>
  );
}
