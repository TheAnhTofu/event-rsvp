import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

/** Skip health, Stripe webhook (raw body route), and internal queue workers. */
function skipRateLimit(req: { path: string }): boolean {
  const p = req.path;
  if (p === "/api/health") return true;
  if (p.startsWith("/api/internal/")) return true;
  if (p === "/api/stripe/webhook") return true;
  return false;
}

/**
 * General API throttle (per IP). Tune with RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX.
 */
export const apiLimiter: RequestHandler = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipRateLimit,
  message: { error: "Too many requests, please try again later." },
});

/**
 * Stricter limit for admin bulk email send (large payloads).
 */
export const adminBulkEmailSendLimiter: RequestHandler = rateLimit({
  windowMs: Number(process.env.ADMIN_BULK_EMAIL_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.ADMIN_BULK_EMAIL_MAX) || 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many bulk send requests, please wait and try again." },
});
