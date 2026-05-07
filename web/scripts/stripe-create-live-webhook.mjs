/**
 * Tạo webhook endpoint **live** trên Stripe (Dashboard API) — cần quyền của **secret key** sk_live_,
 * không dùng được restricted key mặc định của `stripe login`.
 *
 *   npm run stripe:webhook:create-live --workspace web
 * hoặc từ web/:  npm run stripe:webhook:create-live
 *
 * Tuỳ chỉnh URL public (Next rewrite → source-backend /api/stripe/webhook):
 *   WEBHOOK_PUBLIC_URL=https://your-domain.com/api/stripe/webhook npm run ...
 */
import { execFileSync } from "node:child_process";

const base =
  process.env.WEBHOOK_PUBLIC_URL?.trim() ||
  "https://registration.newtofuevents.com/api/stripe/webhook";
const apiKey = process.env.STRIPE_SECRET_KEY_LIVE?.trim();
if (!apiKey || !apiKey.startsWith("sk_live_")) {
  console.error(
    "Set STRIPE_SECRET_KEY_LIVE (sk_live_…) in repo root .env.local and run:\n" +
      "  cd web && node --env-file=../.env.local scripts/stripe-create-live-webhook.mjs",
  );
  process.exit(1);
}

const args = [
  "webhook_endpoints",
  "create",
  "--live",
  "--api-key",
  apiKey,
  "--url",
  base,
  "--enabled-events",
  "checkout.session.completed",
  "--description",
  "Event RSVP live — checkout.session.completed",
  "-c",
];

execFileSync("stripe", args, { stdio: "inherit" });
