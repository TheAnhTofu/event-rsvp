"use client";

import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { FigmaIcon } from "@/components/icons/figma-icon";
import { PaymentRequiredBanner } from "@/components/registration/summary-primitives";
import {
  PayPendingFigmaSummary,
  type PayPendingFigmaSummaryProps,
} from "@/components/registration/step-pay/pay-pending-figma-summary";

type Props = {
  summary: PayPendingFigmaSummaryProps;
  discountCodeInput: string;
  onDiscountCodeInputChange: (value: string) => void;
  onApplyDiscount: () => void;
  onDiscountInputKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  discountPreviewLoading: boolean;
  discountPreviewError: string | null;
  totalAmountLabel: string;
  onContinueToMethodSelect: () => void;
};

export function PaymentRequiredPhase({
  summary,
  discountCodeInput,
  onDiscountCodeInputChange,
  onApplyDiscount,
  onDiscountInputKeyDown,
  discountPreviewLoading,
  discountPreviewError,
  totalAmountLabel,
  onContinueToMethodSelect,
}: Props) {
  const t = useTranslations("Pay");

  return (
    <div className="mx-auto flex w-full max-w-[1020px] flex-col items-stretch">
      <PaymentRequiredBanner
        title={t("paymentRequiredTitle")}
        description={t("paymentRequiredDescription")}
        expiryLabel={t("paymentLinkExpiresIn", { hours: 72 })}
        discountSlot={
          <div className="flex w-full flex-col gap-2">
            <p className="m-0 text-[14px] font-normal leading-normal text-[#333]">
              {t("addDiscountCode")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
              <label htmlFor="discount-code-payment-required" className="sr-only">
                {t("discountCode")}
              </label>
              <input
                id="discount-code-payment-required"
                type="text"
                value={discountCodeInput}
                onChange={(e) => onDiscountCodeInputChange(e.target.value)}
                onKeyDown={onDiscountInputKeyDown}
                autoComplete="off"
                placeholder={t("discountPlaceholder")}
                className="h-12 min-w-0 flex-1 rounded-lg border border-[#e1e3e6] bg-white px-3 text-[16px] leading-6 text-heading outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={onApplyDiscount}
                className="h-12 w-full shrink-0 rounded-lg bg-[#0057b8] px-6 text-[15px] font-normal leading-6 text-white shadow-sm transition hover:opacity-95 sm:w-[300px] sm:px-[43px]"
              >
                {t("applyDiscount")}
              </button>
            </div>
            {discountPreviewLoading ? (
              <p className="m-0 text-sm text-ink-soft">{t("pleaseWait")}</p>
            ) : null}
            {discountPreviewError ? (
              <p className="m-0 text-sm text-red-600">{discountPreviewError}</p>
            ) : null}
          </div>
        }
        completeSlot={
          <button
            type="button"
            onClick={onContinueToMethodSelect}
            className="flex h-[54px] w-full items-center justify-center gap-[6.67px] rounded-[12px] bg-white px-4 py-2.5 text-[18px] font-normal leading-[20px] text-[#333] shadow-sm transition hover:bg-white/95"
          >
            <FigmaIcon
              name="card-large-60"
              size={28}
              className="size-7 shrink-0 text-[#333]"
            />
            <span>{t("completePaymentAmount", { amount: totalAmountLabel })}</span>
          </button>
        }
      />
      <PayPendingFigmaSummary {...summary} />
    </div>
  );
}
