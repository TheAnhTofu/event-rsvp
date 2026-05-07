import type { ReactNode } from "react";

export type CardBrandLogosVariant = "cardForm" | "paymentMethodList";

/** Card brands row — MC / Visa / Amex (Figma payment form vs Payment Method list sizing). */
export function CardBrandLogosCompact({
  variant = "cardForm",
}: {
  variant?: CardBrandLogosVariant;
}) {
  const imgClass =
    variant === "paymentMethodList"
      ? "h-[28px] w-[42px] shrink-0 object-contain object-center"
      : "h-5 w-[30px] object-contain object-center";
  return (
    <div className="flex shrink-0 items-center gap-[5.6px]" aria-hidden>
      <img src="/payment/mastercard.svg" alt="" width={42} height={28} className={imgClass} />
      <img src="/payment/visa.svg" alt="" width={42} height={28} className={imgClass} />
      <img src="/payment/amex.svg" alt="" width={42} height={28} className={imgClass} />
    </div>
  );
}

/** Figma Payment Method list — card glyph (vuesax/bold/card), no border. */
export function PaymentMethodCardGlyph() {
  return (
    <div
      className="flex h-[28px] w-[42px] shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-6 text-[#292d32]" fill="none">
        <rect x="2.5" y="5" width="19" height="14" rx="2" fill="currentColor" />
        <rect x="2.5" y="9.25" width="19" height="2" fill="white" />
      </svg>
    </div>
  );
}

/** Figma: white rounded box, border #bababa — for Alipay / WeChat / Apple / Google marks. */
export function PaymentMethodListIconBox({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-[28px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[2.5px] border border-[#bababa] bg-white">
      {children}
    </div>
  );
}

export function CvcHintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect
        x="2.5"
        y="4.5"
        width="15"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <rect x="5" y="7" width="10" height="1.5" rx="0.5" fill="currentColor" />
      <rect x="11" y="11" width="5" height="3" rx="0.5" fill="currentColor" />
    </svg>
  );
}
