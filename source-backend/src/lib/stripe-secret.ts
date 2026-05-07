/**
 * Stripe keys: test vs live via `STRIPE_USE_LIVE_MODE` / `APP_CONFIG_STRIPE_LIVE`,
 * or admin **Runtime config** (DB) override — see `getEffectiveStripeLiveMode`.
 *
 * Live mode (first match wins):
 * - `STRIPE_PRODUCTION_SECRET_KEY` / `STRIPE_PRODUCTION_WEBHOOK_SECRET` — App Config / Secrets Manager
 * - `STRIPE_SECRET_KEY_LIVE` / `STRIPE_WEBHOOK_SECRET_LIVE`
 * - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
 */
import { getEffectiveStripeLiveMode } from "./app-runtime-settings-cache.js";

export function stripeUseLiveMode(): boolean {
  return getEffectiveStripeLiveMode();
}

export function resolveStripeSecretKey(): string {
  if (stripeUseLiveMode()) {
    return (
      process.env.STRIPE_PRODUCTION_SECRET_KEY?.trim() ||
      process.env.STRIPE_SECRET_KEY_LIVE?.trim() ||
      process.env.STRIPE_SECRET_KEY?.trim() ||
      ""
    );
  }
  return (
    process.env.STRIPE_SECRET_KEY_TEST?.trim() ||
    process.env.STRIPE_SECRET_KEY?.trim() ||
    ""
  );
}

export function resolveStripeWebhookSecret(): string {
  if (stripeUseLiveMode()) {
    return (
      process.env.STRIPE_PRODUCTION_WEBHOOK_SECRET?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET_LIVE?.trim() ||
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      ""
    );
  }
  return (
    process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim() ||
    process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
    ""
  );
}

/** Prefix-only diagnostic for admin UI (never exposes the full key). */
export function describeResolvedStripeSecretKey(): "unset" | "test" | "live" | "other" {
  const key = resolveStripeSecretKey();
  if (!key) return "unset";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "other";
}

/**
 * Publishable key for Stripe.js — must match effective live mode (env + DB runtime config).
 * Test: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` or `STRIPE_PUBLISHABLE_KEY_TEST`.
 * Live: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE` or `STRIPE_PUBLISHABLE_KEY_LIVE`.
 * Call after `await refreshRuntimeSettingsCache()` so DB overrides apply.
 */
export function resolveStripePublishableKey(): string {
  if (stripeUseLiveMode()) {
    return (
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE?.trim() ||
      process.env.STRIPE_PUBLISHABLE_KEY_LIVE?.trim() ||
      ""
    );
  }
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY_TEST?.trim() ||
    ""
  );
}

