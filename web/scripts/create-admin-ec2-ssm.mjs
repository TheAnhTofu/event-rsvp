#!/usr/bin/env node
/**
 * Upsert admin_users trên database mà **production EC2** đang dùng
 * (đọc DATABASE_URL từ /opt/event-rsvp/.env trên instance), qua SSM + Docker psql.
 *
 * Khác với create-admin-user.mjs chạy từ máy local: script đó trỏ vào DB trong
 * DATABASE_URL local (vd. .env.rds.generated). Nếu .env máy local khác DATABASE_URL trên EC2,
 * đăng nhập CRM sẽ "Invalid credentials" dù user đã tạo ở DB kia.
 *
 * Usage (từ web/):
 *   node scripts/create-admin-ec2-ssm.mjs <email> <plain-password> [admin|viewer]
 *
 * Env: AWS_PROFILE, AWS_REGION=ap-southeast-1, EC2_INSTANCE_ID (optional)
 */

import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";

const REGION = process.env.AWS_REGION || "ap-southeast-1";
const INSTANCE_ID = process.env.EC2_INSTANCE_ID || "i-01b8a235413c6061a";

function bashSingleQuoted(s) {
  return `'${s.replace(/'/g, `'\"'\"'`)}'`;
}

const emailArg = process.argv[2]?.trim().toLowerCase();
const passwordArg = process.argv[3];
const roleArg = (process.argv[4] ?? "admin").toLowerCase();

if (!emailArg || !passwordArg) {
  console.error(
    "Usage: node scripts/create-admin-ec2-ssm.mjs <email> <password> [admin|viewer]",
  );
  process.exit(1);
}

if (roleArg !== "admin" && roleArg !== "viewer") {
  console.error("Role must be admin or viewer");
  process.exit(1);
}

const hash = await bcrypt.hash(passwordArg, 12);

/** PostgreSQL dollar-quote: avoid collisions with $ in bcrypt hash */
function dollarQuoteLiteral(content) {
  let tag = "a";
  for (let i = 0; i < 50; i += 1) {
    const open = `$${tag}$`;
    const close = `$${tag}$`;
    if (!content.includes(close)) {
      return open + content + close;
    }
    tag += "x";
  }
  throw new Error("Could not build dollar-quoted literal");
}

const emailSql = emailArg.replace(/'/g, "''");
const hashSql = dollarQuoteLiteral(hash);

const sql = `
INSERT INTO admin_users (email, password_hash, role)
VALUES (
  '${emailSql}',
  ${hashSql},
  '${roleArg}'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = now();
`.trim();

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
      "event-rsvp create-admin production DB",
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

const b64 = Buffer.from(sql, "utf8").toString("base64");

const commands = [
  "set -euo pipefail",
  "test -r /opt/event-rsvp/.env",
  // Không dùng `. .env`: `&` trong query string URL bị shell hiểu là background.
  `RAW=$(sed -n 's/^DATABASE_URL=//p' /opt/event-rsvp/.env | head -1)`,
  `RAW=$(printf '%s' "$RAW" | sed -e "s/^'//" -e "s/'$//" -e 's/^"//' -e 's/"$//')`,
  `export DATABASE_URL="$RAW"`,
  'test -n "${DATABASE_URL:-}"',
  `echo ${bashSingleQuoted(b64)} | base64 -d > /tmp/event-rsvp-admin.sql`,
  "docker pull postgres:16-alpine",
  `docker run --rm -e DATABASE_URL -v /tmp/event-rsvp-admin.sql:/admin.sql:ro postgres:16-alpine sh -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /admin.sql'`,
  "rm -f /tmp/event-rsvp-admin.sql",
];

console.error("SSM create-admin on EC2 (DATABASE_URL from /opt/event-rsvp/.env)…");
const commandId = runAwsSsm(commands);
console.error(`CommandId: ${commandId}`);
waitSsm(commandId);
const inv = getInvocation(commandId);
if (inv.Status !== "Success") {
  console.error(inv.StandardErrorContent || inv.StandardOutputContent);
  console.error(`SSM failed: ${inv.Status}`);
  process.exit(1);
}
console.error(inv.StandardOutputContent || "(ok)");
console.error(`Upserted ${roleArg} user: ${emailArg} on production DATABASE_URL.`);
