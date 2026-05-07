#!/usr/bin/env node
/**
 * Ghi đè dòng DATABASE_URL trong /opt/event-rsvp/.env trên EC2 bằng URL lấy từ
 * web/.env.rds.generated (hoặc env DATABASE_URL) — ghi DATABASE_URL RDS lên `/opt/event-rsvp/.env` trên EC2.
 *
 * Không dùng `source .env` trên server cho giá trị mới; Python ghi file với repr() để tránh lỗi `&`.
 *
 * Usage (từ web/):
 *   node scripts/set-ec2-database-url-from-rds.mjs
 *
 * Env: AWS_REGION, EC2_INSTANCE_ID, AWS_PROFILE (tuỳ chọn)
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

const REGION = process.env.AWS_REGION || "ap-southeast-1";
const INSTANCE_ID = process.env.EC2_INSTANCE_ID || "i-01b8a235413c6061a";

function bashSingleQuoted(s) {
  return `'${s.replace(/'/g, `'\"'\"'`)}'`;
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.startsWith("postgresql")) {
    return process.env.DATABASE_URL.trim();
  }
  const envFile = join(WEB_ROOT, ".env.rds.generated");
  if (!existsSync(envFile)) {
    console.error("Missing DATABASE_URL or web/.env.rds.generated");
    process.exit(1);
  }
  const text = readFileSync(envFile, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    if (t.slice(0, i) === "DATABASE_URL") return t.slice(i + 1).trim();
  }
  console.error("DATABASE_URL not found in .env.rds.generated");
  process.exit(1);
}

function runAwsSsm(commands) {
  const payload = JSON.stringify({ commands });
  return execFileSync(
    "aws",
    [
      "ssm",
      "send-command",
      "--instance-ids",
      INSTANCE_ID,
      "--document-name",
      "AWS-RunShellScript",
      "--comment",
      "event-rsvp set DATABASE_URL to RDS",
      "--parameters",
      payload,
      "--region",
      REGION,
      "--query",
      "Command.CommandId",
      "--output",
      "text",
    ],
    { encoding: "utf8" },
  ).trim();
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
const urlB64 = Buffer.from(databaseUrl, "utf8").toString("base64");

// Ghi dạng DATABASE_URL=postgresql://... (RDS không có & trong URL; tránh repr + quotes làm sed trong create-admin-ec2-ssm đọc sai).
const py = `import pathlib,base64
p=pathlib.Path("/opt/event-rsvp/.env")
url=base64.b64decode("${urlB64}").decode()
lines=p.read_text().splitlines(keepends=True)
out=[]
seen=False
for line in lines:
    if line.startswith("DATABASE_URL="):
        if not seen:
            out.append("DATABASE_URL="+url+"\\n")
            seen=True
    else:
        out.append(line)
if not seen:
    out.append("DATABASE_URL="+url+"\\n")
p.write_text("".join(out))
print("OK", len(url))
`;

const pyB64 = Buffer.from(py, "utf8").toString("base64");

const commands = [
  "set -euo pipefail",
  "test -r /opt/event-rsvp/.env",
  `cp /opt/event-rsvp/.env /opt/event-rsvp/.env.bak.$(date +%Y%m%d%H%M%S)`,
  `echo ${bashSingleQuoted(pyB64)} | base64 -d > /tmp/set-ec2-db-url.py`,
  "python3 /tmp/set-ec2-db-url.py",
  "rm -f /tmp/set-ec2-db-url.py",
  "grep -n ^DATABASE_URL= /opt/event-rsvp/.env | sed 's/=.*/=***RDS***/'",
];

console.error("Updating /opt/event-rsvp/.env DATABASE_URL → RDS (SSM)…");
const commandId = runAwsSsm(commands);
console.error(`CommandId: ${commandId}`);
waitSsm(commandId);
const inv = getInvocation(commandId);
if (inv.Status !== "Success") {
  console.error(inv.StandardErrorContent || inv.StandardOutputContent);
  console.error(`SSM failed: ${inv.Status}`);
  process.exit(1);
}
console.error(inv.StandardOutputContent || "");
console.error("EC2 .env now points DATABASE_URL to RDS. Redeploy containers to apply.");
