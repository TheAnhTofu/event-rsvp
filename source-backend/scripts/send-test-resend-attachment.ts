/**
 * Smoke test: Resend API with a small attachment (verifies base64 encoding path).
 * Run: `cd source-backend && npx tsx scripts/send-test-resend-attachment.ts you@example.com`
 * Requires RESEND_API_KEY, RESEND_FROM_EMAIL (loads source-backend/.env and web/.env.local).
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { isResendConfigured, sendResendEmail } from "../src/lib/email/resend-send.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(join(root, "source-backend/.env"));
loadEnvFile(join(root, "web/.env.local"));

async function main(): Promise<void> {
  const to = process.argv[2]?.trim();
  if (!to) {
    console.error("Usage: npx tsx scripts/send-test-resend-attachment.ts <recipient@email.com>");
    process.exit(1);
  }
  if (!isResendConfigured()) {
    console.error("Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    process.exit(1);
  }

  const body = new TextEncoder().encode("Resend attachment smoke test.\n");
  await sendResendEmail({
    to,
    subject: "[smoke] Resend attachment test",
    htmlBody: "<p>If <strong>test.txt</strong> is attached, the Resend path is OK.</p>",
    textBody: "If test.txt is attached, the Resend path is OK.",
    attachments: [
      {
        fileName: "test.txt",
        contentType: "text/plain; charset=utf-8",
        rawContent: body,
      },
    ],
  });

  console.log("Sent. Check inbox for test.txt attachment.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
