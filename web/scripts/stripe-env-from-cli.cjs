#!/usr/bin/env node
/**
 * Đồng bộ STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET (và tuỳ chọn publishable key)
 * từ Stripe CLI:
 *   - Secret keys: ~/.config/stripe/config.toml (sau `stripe login`)
 *   - Webhook signing secret: `stripe listen --print-secret`
 *
 * Ghi đè / hợp nhất vào web/.env.local (giữ các biến khác như DATABASE_URL).
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const webRoot = path.resolve(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");
const stripeConfigPath = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".config/stripe/config.toml",
);

function parseTomlQuotedValue(text, key) {
  const re = new RegExp(
    `^${key}\\s*=\\s*['"]([^'"]+)['"]`,
    "m",
  );
  const m = text.match(re);
  return m ? m[1] : null;
}

function loadStripeListenSecret() {
  try {
    return execFileSync("stripe", ["listen", "--print-secret"], {
      encoding: "utf8",
    }).trim();
  } catch (e) {
    console.error(
      "Không chạy được `stripe listen --print-secret`. Đã cài Stripe CLI và chạy `stripe login` chưa?",
    );
    throw e;
  }
}

function loadKeysFromStripeConfig() {
  if (!fs.existsSync(stripeConfigPath)) {
    console.error("Không thấy file:", stripeConfigPath);
    console.error("Chạy: stripe login");
    process.exit(1);
  }
  const raw = fs.readFileSync(stripeConfigPath, "utf8");
  const secret = parseTomlQuotedValue(raw, "test_mode_api_key");
  const publishable = parseTomlQuotedValue(raw, "test_mode_pub_key");
  if (!secret) {
    console.error("Không đọc được test_mode_api_key trong config Stripe.");
    process.exit(1);
  }
  return { secret, publishable };
}

function parseEnvFile(content) {
  const map = new Map();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    map.set(k, v);
  }
  return map;
}

function serializeEnv(map) {
  const order = [
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];
  const used = new Set();
  const out = [];
  for (const k of order) {
    if (map.has(k)) {
      out.push(`${k}=${map.get(k)}`);
      used.add(k);
    }
  }
  for (const [k, v] of map) {
    if (!used.has(k)) out.push(`${k}=${v}`);
  }
  return `${out.join("\n")}\n`;
}

function main() {
  console.log("Đang lấy webhook signing secret từ Stripe CLI…");
  const webhookSecret = loadStripeListenSecret();
  if (!webhookSecret.startsWith("whsec_")) {
    console.error("Kỳ vọng whsec_…, nhận được:", webhookSecret.slice(0, 12) + "…");
    process.exit(1);
  }

  console.log("Đang đọc test keys từ Stripe CLI config…");
  const { secret, publishable } = loadKeysFromStripeConfig();

  let map = new Map();
  if (fs.existsSync(envPath)) {
    map = parseEnvFile(fs.readFileSync(envPath, "utf8"));
  }

  map.set("STRIPE_SECRET_KEY", secret);
  map.set("STRIPE_WEBHOOK_SECRET", webhookSecret);
  if (publishable) {
    map.set("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", publishable);
  }

  fs.writeFileSync(envPath, serializeEnv(map), "utf8");
  console.log("Đã cập nhật:", envPath);
  console.log(
    "Tiếp theo (terminal khác): npm run stripe:listen — để forward webhook về Next.js khi dev.",
  );
}

main();
