/**
 * One-off: sample Payment Confirmation email (+ receipt PDF) for QA.
 * Run: `cd source-backend && npx tsx scripts/send-test-payment-confirmation.ts`
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import type { RegistrationFormValues } from "../../web/src/lib/registration-schema.js";
import { sendPaymentConfirmationEmail } from "../src/lib/email/send-payment-confirmation.js";

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

const samplePayload: RegistrationFormValues = {
  attendance: "in_person",
  lunchSession: "nov12",
  dietaryYesNo: "no",
  dietary: undefined,
  dietaryOtherDetails: "",
  title: "Mr",
  firstName: "Michael",
  lastName: "Lee",
  company: "FinCorp Industries",
  jobTitle: "Analyst",
  email: "htheanh2000@gmail.com",
  phoneCountry: "852",
  phoneNumber: "38999700",
  country: "Hong Kong",
  sameContact: true,
  cpdApply: "no",
  consent: true,
};

async function main(): Promise<void> {
  await sendPaymentConfirmationEmail({
    reference: "AGM2026-000123",
    email: "htheanh2000@gmail.com",
    amountHkd: 150,
    attendance: "in_person",
    payload: samplePayload,
    paymentMethod: "bank_transfer",
    locale: "en",
  });

  console.log("Done. If email is configured, check inbox.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
