import {
  findActiveDiscountCode,
  findAutomaticDiscountCode,
} from "@db/discount-codes";
import {
  buildDiscountBreakdown,
  buildStackedDiscountBreakdown,
  normalizeDiscountCode,
  parseDiscountCodesFromRaw,
  type DiscountBreakdown,
  type DiscountRule,
} from "./discount-code.js";

export type ResolveDiscountOk = {
  ok: true;
  breakdown: DiscountBreakdown;
  /** DB row id of first applied code (multi-stack: first in list) */
  codeId: string | null;
  /** Comma-separated normalized codes, or single code, or null */
  normalized: string | null;
};

export type ResolveDiscountErr = { ok: false; error: "invalid_code" };

function rowToRule(row: {
  discount_type: string;
  percent_value: string | null;
  fixed_hkd: string | null;
}): DiscountRule | null {
  if (row.discount_type === "percent" && row.percent_value != null) {
    const v = Number.parseFloat(row.percent_value);
    if (!Number.isFinite(v)) return null;
    return { type: "percent", value: v };
  }
  if (row.discount_type === "fixed" && row.fixed_hkd != null) {
    const v = Number.parseFloat(row.fixed_hkd);
    if (!Number.isFinite(v)) return null;
    return { type: "fixed", hkd: v };
  }
  return null;
}

export type ResolveDiscountOptions = {
  /** When false and there is no typed code, do not apply `apply_without_code` (e.g. user removed auto discount). Default true. */
  allowAutomaticDiscount?: boolean;
};

/**
 * Server-only: load rule(s) from DB and compute breakdown.
 * Empty / whitespace → optional automatic rule (`apply_without_code`), else no discount.
 * Non-empty: one or more codes separated by comma / semicolon / newline — stacked on remaining balance.
 * Any missing or ineligible code → invalid_code.
 */
export async function resolveDiscountForPayment(
  baseFeeHkd: number,
  rawCode: string | undefined | null,
  options?: ResolveDiscountOptions,
): Promise<ResolveDiscountOk | ResolveDiscountErr> {
  const codes = parseDiscountCodesFromRaw(rawCode);
  const allowAuto = options?.allowAutomaticDiscount !== false;

  if (codes.length === 0) {
    if (!allowAuto) {
      return {
        ok: true,
        breakdown: buildDiscountBreakdown(baseFeeHkd, null, ""),
        codeId: null,
        normalized: null,
      };
    }
    const auto = await findAutomaticDiscountCode();
    if (auto) {
      const rule = rowToRule(auto);
      if (!rule) {
        return {
          ok: true,
          breakdown: buildDiscountBreakdown(baseFeeHkd, null, ""),
          codeId: null,
          normalized: null,
        };
      }
      const label = normalizeDiscountCode(auto.code);
      const breakdown = buildDiscountBreakdown(baseFeeHkd, rule, label);
      return {
        ok: true,
        breakdown,
        codeId: auto.id,
        normalized: label,
      };
    }
    return {
      ok: true,
      breakdown: buildDiscountBreakdown(baseFeeHkd, null, ""),
      codeId: null,
      normalized: null,
    };
  }

  const steps: { rule: DiscountRule; codeLabel: string }[] = [];
  let firstId: string | null = null;

  /** Stack auto EARLYBIRD (apply_without_code) before typed codes when still allowed. */
  if (allowAuto) {
    const autoRow = await findAutomaticDiscountCode();
    if (autoRow) {
      const autoLabel = normalizeDiscountCode(autoRow.code);
      const alreadyTyped = codes.some((c) => c === autoLabel);
      if (!alreadyTyped) {
        const autoRule = rowToRule(autoRow);
        if (autoRule) {
          steps.push({ rule: autoRule, codeLabel: autoLabel });
          firstId = autoRow.id;
        }
      }
    }
  }

  for (const normalized of codes) {
    const row = await findActiveDiscountCode(normalized);
    if (!row) {
      return { ok: false, error: "invalid_code" };
    }
    if (firstId === null) {
      firstId = row.id;
    }
    const rule = rowToRule(row);
    if (!rule) {
      return { ok: false, error: "invalid_code" };
    }
    steps.push({ rule, codeLabel: normalized });
  }

  const breakdown = buildStackedDiscountBreakdown(baseFeeHkd, steps);
  const normalizedJoined = steps.map((s) => s.codeLabel).join(",");

  return {
    ok: true,
    breakdown,
    codeId: firstId,
    normalized: normalizedJoined,
  };
}
