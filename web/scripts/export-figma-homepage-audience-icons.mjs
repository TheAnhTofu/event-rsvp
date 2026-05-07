#!/usr/bin/env node
/**
 * Export the four homepage audience-card illustrations from Figma as SVG into
 * `public/figma-assets/homepage/`.
 *
 * Frame: 1440p Home Page — audience cards (node `1137:21319`), icon wrappers:
 *   - members  → `1451:25860` → homepage-members.svg
 *   - industry → `1451:25923` → homepage-industry.svg
 *   - fellow   → `1451:25992` → homepage-fellow.svg
 *   - virtual  → `1451:25861` → homepage-virtual.svg
 *
 * Requires `FIGMA_ACCESS_TOKEN` (Figma → Settings → Security → Personal access tokens).
 *
 * Usage:
 *   cd web && node --env-file=../.env.local scripts/export-figma-homepage-audience-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const OUT_DIR = path.join(webRoot, "public", "figma-assets", "homepage");

const FILE_KEY = "DHXxjezs7iMK1vq3IEQ18R";

/** @type {{ figmaId: string; filename: string }[]} */
const ICONS = [
  { figmaId: "1451:25860", filename: "homepage-members.svg" },
  { figmaId: "1451:25923", filename: "homepage-industry.svg" },
  { figmaId: "1451:25992", filename: "homepage-fellow.svg" },
  { figmaId: "1451:25861", filename: "homepage-virtual.svg" },
];

const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
if (!token) {
  console.error(
    "Set FIGMA_ACCESS_TOKEN (Figma → Settings → Security → Personal access tokens).",
  );
  process.exit(1);
}

const imagesUrl = new URL(`https://api.figma.com/v1/images/${FILE_KEY}`);
imagesUrl.searchParams.set("ids", ICONS.map((i) => i.figmaId).join(","));
imagesUrl.searchParams.set("format", "svg");

const metaRes = await fetch(imagesUrl.toString(), {
  headers: { "X-Figma-Token": token },
});
if (!metaRes.ok) {
  console.error(`Figma images API ${metaRes.status}:`, await metaRes.text());
  process.exit(1);
}

/** @type {{ err?: string; images: Record<string, string | null> }} */
const meta = await metaRes.json();
if (meta.err) {
  console.error("Figma API error:", meta.err);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const { figmaId, filename } of ICONS) {
  const url = meta.images?.[figmaId];
  if (!url) {
    console.error(`No export URL for node ${figmaId}. Response:`, meta.images);
    process.exit(1);
  }
  const svgRes = await fetch(url);
  if (!svgRes.ok) {
    console.error(`Failed to download SVG for ${figmaId}: ${svgRes.status}`);
    process.exit(1);
  }
  const text = await svgRes.text();
  if (!text.includes("<svg") && !text.includes("<?xml")) {
    console.error(`${filename}: response does not look like SVG (first 200 chars):`, text.slice(0, 200));
    process.exit(1);
  }
  const dest = path.join(OUT_DIR, filename);
  fs.writeFileSync(dest, text, "utf8");
  console.log(`Wrote ${path.relative(webRoot, dest)} (${text.length} chars)`);
}

console.log("Done.");
