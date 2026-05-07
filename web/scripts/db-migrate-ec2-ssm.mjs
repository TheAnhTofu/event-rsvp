#!/usr/bin/env node
/**
 * Apply web/db/migrations/*.sql trên RDS bằng cách chạy psql trong Docker trên EC2 production
 * (SSM Run Command). RDS private — không kết nối trực tiếp từ laptop.
 *
 * Cần: AWS CLI profile (vd. newtofu), quyền ssm:SendCommand, DATABASE_URL trong web/.env.rds.generated
 * hoặc env DATABASE_URL trỏ tới RDS.
 *
 * Usage: node scripts/db-migrate-ec2-ssm.mjs
 * Env: AWS_PROFILE, AWS_REGION=ap-southeast-1, EC2_INSTANCE_ID (optional)
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

// Giữ khớp với web/scripts/db-migrate-psql.sh (thứ tự file).
const MIGRATIONS = [
  "001_init.sql",
  "002_paypal_to_stripe.sql",
  "003_email_logs.sql",
  "004_audience_type_and_status.sql",
  "005_bank_transfer_slips.sql",
  "006_approval_workflow.sql",
  "007_email_logs_provider.sql",
  "007_registration_status_events.sql",
  "008_admin_users.sql",
  "009_payment_status_pending.sql",
  "010_app_runtime_settings.sql",
  "011_admin_users_profile.sql",
  "012_discount_codes.sql",
  "013_early_bird_discount.sql",
  "014_discount_auto_apply.sql",
  "016_payment_pending_and_amounts.sql",
  "017_additional_discount_code.sql",
  "018_discount10_code.sql",
  "019_registrations_discount_code.sql",
  "020_qfpay.sql",
  "021_paymentasia.sql",
  "022_paymentasia_merchant_refs.sql",
  "023_pipeline_stage_column.sql",
  "024_check_in_logs.sql",
  "025_registration_member_columns.sql",
];

const REGION = process.env.AWS_REGION || "ap-southeast-1";
const INSTANCE_ID = process.env.EC2_INSTANCE_ID || "i-01b8a235413c6061a";

function loadDatabaseUrl() {
  const envFile = join(WEB_ROOT, ".env.rds.generated");
  if (!existsSync(envFile)) {
    if (process.env.DATABASE_URL?.startsWith("postgresql")) {
      return process.env.DATABASE_URL.trim();
    }
    console.error("Missing web/.env.rds.generated (and no DATABASE_URL in env)");
    process.exit(1);
  }
  const text = readFileSync(envFile, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i);
    if (k === "DATABASE_URL") return t.slice(i + 1).trim();
  }
  console.error("DATABASE_URL not found in .env.rds.generated");
  process.exit(1);
}

function bashSingleQuoted(s) {
  return `'${s.replace(/'/g, `'\"'\"'`)}'`;
}

function runAwsSsm(commands) {
  const payload = JSON.stringify({ commands });
  const out = execFileSync(
    "aws",
    [
      "ssm",
      "send-command",
      "--instance-ids",
      INSTANCE_ID,
      "--document-name",
      "AWS-RunShellScript",
      "--comment",
      "event-rsvp DB migration",
      "--parameters",
      payload,
      "--region",
      REGION,
      "--query",
      "Command.CommandId",
      "--output",
      "text",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return out.trim();
}

function waitSsm(commandId) {
  execFileSync(
    "aws",
    [
      "ssm",
      "wait",
      "command-executed",
      "--command-id",
      commandId,
      "--instance-id",
      INSTANCE_ID,
      "--region",
      REGION,
    ],
    { stdio: "inherit" },
  );
}

function getInvocation(commandId) {
  const json = execFileSync(
    "aws",
    [
      "ssm",
      "get-command-invocation",
      "--command-id",
      commandId,
      "--instance-id",
      INSTANCE_ID,
      "--region",
      REGION,
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  );
  return JSON.parse(json);
}

const databaseUrl = loadDatabaseUrl();
const exportUrl = `export DATABASE_URL=${bashSingleQuoted(databaseUrl)}`;

for (const name of MIGRATIONS) {
  const sqlPath = join(WEB_ROOT, "db", "migrations", name);
  if (!existsSync(sqlPath)) {
    console.error(`Missing ${sqlPath}`);
    process.exit(1);
  }
  const b64 = readFileSync(sqlPath).toString("base64");
  const commands = [
    "set -euo pipefail",
    exportUrl,
    `echo ${b64} | base64 -d > /tmp/event-rsvp-migrate.sql`,
    "docker pull postgres:16-alpine",
    `docker run --rm -v /tmp/event-rsvp-migrate.sql:/migrate.sql:ro -e DATABASE_URL postgres:16-alpine sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /migrate.sql'`,
    "rm -f /tmp/event-rsvp-migrate.sql",
  ];

  console.error(`\n>>> ${name}`);
  const commandId = runAwsSsm(commands);
  console.error(`SSM CommandId: ${commandId}`);
  waitSsm(commandId);
  const inv = getInvocation(commandId);
  if (inv.Status !== "Success") {
    console.error(inv.StandardErrorContent || inv.StandardOutputContent);
    console.error(`SSM failed: ${inv.Status}`);
    process.exit(1);
  }
  console.error(inv.StandardOutputContent || "(no stdout)");
}

console.error("\nAll migrations applied on RDS via EC2.");
