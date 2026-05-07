import type { Request, Response } from "express";
import { getRuntimeConfigSnapshot } from "../lib/app-runtime-settings-cache.js";
import { resolveStripePublishableKey } from "../lib/stripe-secret.js";

/**
 * Public: returns the publishable key for the current effective Stripe mode (env + DB).
 * Used by the registration payment step so `pk_test` / `pk_live` track admin runtime toggles.
 */
export async function getStripePublishableConfig(
  _req: Request,
  res: Response,
): Promise<void> {
  let snapshot;
  try {
    snapshot = await getRuntimeConfigSnapshot();
  } catch {
    res.status(503).json({ error: "runtime_config_unavailable" });
    return;
  }

  const publishableKey = resolveStripePublishableKey();
  const live = snapshot.effective.stripeLiveMode;
  const rawDb = snapshot.db.stripe_live_mode;

  res.setHeader("Cache-Control", "no-store");
  res.json({
    publishableKey,
    live,
    /** Env file only (before admin DB override). */
    envStripeLiveMode: snapshot.env.stripeLiveMode,
    /** When set, admin DB overrides env for live vs test. */
    dbStripeLiveMode:
      rawDb === undefined
        ? null
        : rawDb === "true" || rawDb === "1",
  });
}
