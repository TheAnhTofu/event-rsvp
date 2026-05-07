#!/usr/bin/env node
/**
 * Gộp secret hiện có trên AWS Secrets Manager với các key trong file .env patch (chỉ thêm/sửa key có trong patch).
 * Dùng AWS CLI (aws secretsmanager get-secret-value / put-secret-value).
 *
 * Ví dụ:
 *   node scripts/aws-secrets-merge-patch.mjs \
 *     --secret-id event-rsvp/prod/config \
 *     --region ap-southeast-1 \
 *     --patch-file ./patch.env
 *
 * Chỉ in JSON và thoát (không ghi AWS):
 *   node scripts/aws-secrets-merge-patch.mjs --dry-run --patch-file ./patch.env ...
 */

import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { join, resolve, isAbsolute } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const out = {
    secretId: "",
    region: process.env.AWS_REGION || "ap-southeast-1",
    patchFile: "",
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") {
      out.dryRun = true;
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
    if (a === "--patch-file" && argv[i + 1]) {
      out.patchFile = argv[++i];
      continue;
    }
    if (a === "--help" || a === "-h") {
      console.error(`Usage:
  node scripts/aws-secrets-merge-patch.mjs \\
    --secret-id event-rsvp/prod/config \\
    --region ap-southeast-1 \\
    --patch-file ./patch.env

  --dry-run   Chỉ in merged JSON (không gọi put-secret-value)
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

function aws(args) {
  return spawnSync("aws", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.secretId || !args.patchFile) {
    console.error("Thiếu --secret-id hoặc --patch-file. Dùng --help.");
    process.exit(1);
  }

  const cwd = process.cwd();
  const patchPath = isAbsolute(args.patchFile)
    ? args.patchFile
    : resolve(cwd, args.patchFile);

  let patch;
  try {
    patch = parseEnvContent(readFileSync(patchPath, "utf8"));
  } catch (e) {
    console.error("Không đọc được patch file:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const patchKeys = Object.keys(patch);
  if (patchKeys.length === 0) {
    console.error("Patch file không có key nào (bỏ qua dòng trống và #).");
    process.exit(1);
  }

  const get = aws([
    "secretsmanager",
    "get-secret-value",
    "--secret-id",
    args.secretId,
    "--region",
    args.region,
    "--query",
    "SecretString",
    "--output",
    "text",
  ]);

  if (get.status !== 0) {
    console.error(get.stderr || get.stdout || "get-secret-value failed");
    process.exit(get.status ?? 1);
  }

  let current;
  try {
    current = JSON.parse(get.stdout.trim());
  } catch {
    console.error("SecretString không phải JSON hợp lệ.");
    process.exit(1);
  }

  if (typeof current !== "object" || current === null || Array.isArray(current)) {
    console.error("Secret hiện tại phải là object JSON.");
    process.exit(1);
  }

  const merged = { ...current };
  const added = [];
  const updated = [];
  for (const k of patchKeys) {
    const v = patch[k];
    if (v === undefined || v === "") continue;
    if (merged[k] === undefined) added.push(k);
    else if (merged[k] !== v) updated.push(k);
    merged[k] = v;
  }

  const json = JSON.stringify(merged);

  if (args.dryRun) {
    const preview = {};
    for (const k of patchKeys) {
      if (merged[k] !== undefined) preview[k] = "<redacted>";
    }
    console.error(
      `[dry-run] Sẽ ghi ${patchKeys.length} key từ patch (${added.length} mới, ${updated.length} cập nhật). Tổng key sau merge: ${Object.keys(merged).length}.`,
    );
    console.error("[dry-run] Tên key áp dụng:", patchKeys.join(", "));
    console.error("[dry-run] Preview (không in giá trị thật):", JSON.stringify(preview, null, 2));
    return;
  }

  const dir = mkdtempSync(join(tmpdir(), "event-rsvp-merge-"));
  const jsonPath = join(dir, "merged.json");
  writeFileSync(jsonPath, json, { mode: 0o600 });

  const put = aws([
    "secretsmanager",
    "put-secret-value",
    "--secret-id",
    args.secretId,
    "--secret-string",
    `file://${jsonPath}`,
    "--region",
    args.region,
  ]);

  try {
    unlinkSync(jsonPath);
  } catch {
    /* ignore */
  }

  if (put.status !== 0) {
    console.error(put.stderr || put.stdout || "put-secret-value failed");
    process.exit(put.status ?? 1);
  }

  console.error(
    `Đã cập nhật ${args.secretId}: +${added.length} key mới, ${updated.length} key đổi, tổng ${Object.keys(merged).length} key.`,
  );
}

main();
