import type { Request, Response } from "express";
import { requireDatabaseUrl } from "@db/postgres";
import { resolveDiscountForPayment } from "../lib/resolve-discount.js";

/**
 * GET /api/discount/preview?code=&baseFeeHkd=
 * Public preview for checkout UI; authoritative validation happens again on payment endpoints.
 */
export async function getDiscountPreview(req: Request, res: Response): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const rawCode = typeof req.query.code === "string" ? req.query.code : "";
  const autoApplyRaw = req.query.autoApply;
  const allowAutomaticDiscount =
    autoApplyRaw === "0" || autoApplyRaw === "false" ? false : true;
  const baseRaw = req.query.baseFeeHkd;
  const baseFee =
    typeof baseRaw === "string" ? Number.parseFloat(baseRaw) : Number.NaN;
  if (!Number.isFinite(baseFee) || baseFee < 0) {
    res.status(400).json({ error: "Invalid baseFeeHkd" });
    return;
  }

  let resolved: Awaited<ReturnType<typeof resolveDiscountForPayment>>;
  try {
    resolved = await resolveDiscountForPayment(baseFee, rawCode || undefined, {
      allowAutomaticDiscount,
    });
  } catch (err) {
    console.error("[getDiscountPreview] resolve failed", err);
    res.status(503).json({
      error: "Discount preview is temporarily unavailable. Please try again.",
    });
    return;
  }

  if (!resolved.ok) {
    res.status(400).json({ error: "Invalid or expired discount code" });
    return;
  }

  res.json({
    breakdown: resolved.breakdown,
    normalized: resolved.normalized,
  });
}
