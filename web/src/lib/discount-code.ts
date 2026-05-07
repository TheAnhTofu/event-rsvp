/**
 * Pure discount math — must match `source-backend/src/lib/discount-code.ts`.
 * Prefer live preview from GET `/api/discount/preview` (DB-backed rules, including automatic apply_without_code).
 * Stacked codes each apply to the original base fee (additive discounts), not compounding on the running balance.
 */

export const MAX_DISCOUNT_CODES_STACK = 10;

export type DiscountBreakdown = {
  baseFeeHkd: number;
  discountAmountHkd: number;
  finalFeeHkd: number;
  appliedLabel: string;
  stackSteps?: { codeLabel: string; discountAmountHkd: number }[];
};

export type DiscountRule =
  | { type: "percent"; value: number }
  | { type: "fixed"; hkd: number };

export function normalizeDiscountCode(raw: string | undefined | null): string {
  return raw?.trim().toUpperCase() ?? "";
}

export function parseDiscountCodesFromRaw(
  raw: string | undefined | null,
): string[] {
  if (raw == null) return [];
  const s = String(raw).trim();
  if (!s) return [];
  const parts = s
    .split(/[,;\n]+/)
    .map((p) => normalizeDiscountCode(p))
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of parts) {
    if (seen.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= MAX_DISCOUNT_CODES_STACK) break;
  }
  return out;
}

/** Each stacked code applies to the original base fee (not the balance after prior codes). */
function discountAmountForRuleOnBase(base: number, rule: DiscountRule): number {
  if (base <= 0) return 0;
  if (rule.type === "percent") {
    return Math.round(base * (rule.value / 100) * 100) / 100;
  }
  return Math.min(rule.hkd, base);
}

function labelForStep(
  rule: DiscountRule,
  codeLabel: string,
  discountAmountHkd: number,
): string {
  return rule.type === "percent"
    ? `${codeLabel} (−${rule.value}%)`
    : `${codeLabel} (−HKD ${discountAmountHkd.toFixed(2)})`;
}

export function buildStackedDiscountBreakdown(
  baseFeeHkd: number,
  steps: { rule: DiscountRule; codeLabel: string }[],
): DiscountBreakdown {
  if (baseFeeHkd <= 0 || steps.length === 0) {
    return {
      baseFeeHkd,
      discountAmountHkd: 0,
      finalFeeHkd: Math.max(0, baseFeeHkd),
      appliedLabel: "",
    };
  }

  let totalDiscount = 0;
  const labels: string[] = [];
  const stackSteps: { codeLabel: string; discountAmountHkd: number }[] = [];

  for (const { rule, codeLabel } of steps) {
    const discountAmountHkd = discountAmountForRuleOnBase(baseFeeHkd, rule);
    labels.push(labelForStep(rule, codeLabel, discountAmountHkd));
    stackSteps.push({ codeLabel, discountAmountHkd });
    totalDiscount += discountAmountHkd;
  }

  const cappedDiscount = Math.min(
    Math.round(totalDiscount * 100) / 100,
    baseFeeHkd,
  );
  const finalFeeHkd = Math.max(
    0,
    Math.round((baseFeeHkd - cappedDiscount) * 100) / 100,
  );

  const out: DiscountBreakdown = {
    baseFeeHkd,
    discountAmountHkd: cappedDiscount,
    finalFeeHkd,
    appliedLabel: labels.join(" + "),
  };
  if (stackSteps.length > 1) {
    out.stackSteps = stackSteps;
  }
  return out;
}

export function buildDiscountBreakdown(
  baseFeeHkd: number,
  rule: DiscountRule | null | undefined,
  codeLabel: string,
): DiscountBreakdown {
  if (baseFeeHkd <= 0 || !rule) {
    return {
      baseFeeHkd,
      discountAmountHkd: 0,
      finalFeeHkd: Math.max(0, baseFeeHkd),
      appliedLabel: "",
    };
  }
  const stacked = buildStackedDiscountBreakdown(baseFeeHkd, [
    { rule, codeLabel },
  ]);
  return {
    ...stacked,
    stackSteps: undefined,
  };
}
