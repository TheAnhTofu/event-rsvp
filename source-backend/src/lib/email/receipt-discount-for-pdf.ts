import type { RegistrationFormValues } from "../registration-schema.ts";
import { resolveFeesHkdForApi } from "../registration-schema.ts";
import { resolveDiscountForPayment } from "../resolve-discount.js";

/**
 * Builds subtotal / discount lines for payment receipt PDF when codes match paid amount.
 */
export async function resolveReceiptDiscountForPdf(params: {
  attendance: RegistrationFormValues["attendance"];
  audienceType: RegistrationFormValues["audienceType"];
  discountCode: string | null | undefined;
  amountPaidHkd: number;
}): Promise<{
  subtotalHkd: number;
  discountAmountHkd: number;
  discountCodesLabel: string;
} | null> {
  const baseFee = await resolveFeesHkdForApi(params.attendance, params.audienceType);
  const resolved = await resolveDiscountForPayment(baseFee, params.discountCode ?? null, {
    allowAutomaticDiscount: true,
  });
  if (!resolved.ok) return null;
  const b = resolved.breakdown;
  if (b.discountAmountHkd <= 0) return null;
  if (Math.abs(b.finalFeeHkd - params.amountPaidHkd) > 0.02) return null;
  const label =
    resolved.normalized?.replace(/,/g, ", ").trim() || b.appliedLabel.trim();
  return {
    subtotalHkd: b.baseFeeHkd,
    discountAmountHkd: b.discountAmountHkd,
    discountCodesLabel: label,
  };
}
