#!/usr/bin/env node
/**
 * Gộp một hoặc nhiều file .env (KEY=value) thành JSON và đẩy lên AWS Secrets Manager.
 *
 * Không commit file env thật. Chạy trên máy có AWS CLI đã cấu hình (aws sts get-caller-identity).
 *
 * Ví dụ (từ thư mục web/):
 *   node scripts/push-env-to-secrets-manager.mjs \
 *     --secret-id event-rsvp/prod/config \
 *     --region ap-southeast-1 \
 *     --files .env.local,../source-backend/.env
 *
 * Chỉ in JSON, không gọi AWS:
 *   node scripts/push-env-to-secrets-manager.mjs --dry-run --files .env.local
 *
 * Bỏ qua một số key (phân tách bằng dấu phẩy):
 *   --skip-keys BACKEND_URL,PORT
 */

import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { join, resolve, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const out = {
    files: [],
    secretId: "",
    region: process.env.AWS_REGION || "ap-southeast-1",
    dryRun: false,
    skipKeys: new Set(),
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (a === "--files" && argv[i + 1]) {
      out.files.push(
        ...argv[++i].split(",").map((s) => s.trim()).filter(Boolean),
      );
      continue;
    }
    if (a === "--secret-id" && argv[i + 1]) {
      out.secretId = argv[++i];
      continue;
    }
    if (a === "--region" && argv[i + 1]) {
      out.region = argv[++i];
      continue;
    }
    if (a === "--skip-keys" && argv[i + 1]) {
      for (const k of argv[++i].split(",")) {
        const t = k.trim();
        if (t) out.skipKeys.add(t);
      }
      continue;
    }
    if (a === "--help" || a === "-h") {
      console.error(`Usage:
  node scripts/push-env-to-secrets-manager.mjs \\
    --secret-id event-rsvp/prod/config \\
    --region ap-southeast-1 \\
    --files .env.local,../source-backend/.env

Options:
  --files       Danh sách file .env, cách nhau bằng dấu phẩy (file sau ghi đè key trùng).
  --secret-id   Tên hoặc ARN secret trên AWS.
  --region      Mặc định: ap-southeast-1 hoặc biến AWS_REGION.
  --skip-keys   Các biến không đưa lên (vd: BACKEND_URL,PORT).
  --dry-run     Chỉ in JSON ra stdout, không gọi AWS CLI.
`);
      process.exit(0);
    }
  }
  return out;
}

function parseEnvContent(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    if (!key) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function mergeEnvFiles(paths) {
  const merged = {};
  const cwd = process.cwd();
  for (const p of paths) {
    const abs = isAbsolute(p) ? p : resolve(cwd, p);
    const raw = readFileSync(abs, "utf8");
    Object.assign(merged, parseEnvContent(raw));
  }
  return merged;
}

function toSecretJson(merged, skipKeys) {
  const obj = {};
  for (const [k, v] of Object.entries(merged)) {
    if (skipKeys.has(k)) continue;
    if (v === undefined || v === null) continue;
    if (typeof v !== "string") continue;
    obj[k] = v;
  }
  return obj;
}

function aws(args) {
  const r = spawnSync("aws", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: r.status ?? 1,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.dryRun && !args.secretId) {
    console.error("Thiếu --secret-id (hoặc dùng --dry-run).");
    process.exit(1);
  }
  if (args.files.length === 0) {
    console.error("Thiếu --files (vd: --files .env.local,../source-backend/.env).");
    process.exit(1);
  }

  let merged;
  try {
    merged = mergeEnvFiles(args.files);
  } catch (e) {
    console.error("Không đọc được file:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const payload = toSecretJson(merged, args.skipKeys);
  const json = JSON.stringify(payload, null, 2);

  if (args.dryRun) {
    console.log(json);
    console.error(
      `\n[dry-run] ${Object.keys(payload).length} keys (sau khi --skip-keys).`,
    );
    return;
  }

  const dir = mkdtempSync(join(tmpdir(), "event-rsvp-secret-"));
  const jsonPath = join(dir, "secret.json");
  writeFileSync(jsonPath, json, { mode: 0o600 });

  const describe = aws([
    "secretsmanager",
    "describe-secret",
    "--secret-id",
    args.secretId,
    "--region",
    args.region,
  ]);

  const exists = describe.status === 0;

  let result;
  if (exists) {
    result = aws([
      "secretsmanager",
      "put-secret-value",
      "--secret-id",
      args.secretId,
      "--secret-string",
      `file://${jsonPath}`,
      "--region",
      args.region,
    ]);
  } else {
    result = aws([
      "secretsmanager",
      "create-secret",
      "--name",
      args.secretId,
      "--secret-string",
      `file://${jsonPath}`,
      "--region",
      args.region,
    ]);
  }

  try {
    unlinkSync(jsonPath);
  } catch {
    /* ignore */
  }

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || "aws CLI failed");
    process.exit(result.status ?? 1);
  }

  console.error(
    exists
      ? `Đã cập nhật secret: ${args.secretId} (${Object.keys(payload).length} keys)`
      : `Đã tạo secret: ${args.secretId} (${Object.keys(payload).length} keys)`,
  );
}

main();
