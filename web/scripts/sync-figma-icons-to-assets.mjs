#!/usr/bin/env node
/**
 * Copies Figma registration icons from public/icons into src/assets/figma-icons
 * (optional mirror for design tooling; runtime uses `/icons/*.svg` from public).
 * Run from web/: node scripts/sync-figma-icons-to-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const pub = path.join(webRoot, "public", "icons");
const dest = path.join(webRoot, "src", "assets", "figma-icons");

const names = [
  "calendar-24",
  "calendar-16",
  "location-24",
  "global-24",
  "ion-earth",
  "chevron-down",
  "card-pos",
  "bank",
  "user-bold-24",
  "note-text-bold-24",
  "bookmark-2-bold-24",
  "airplane-bold-24",
  "info-circle-bold-24",
  "document-copy-bold-24",
  "fork-spoon-rounded-24",
  "radio-outline",
  "radio-on",
  "radio-on-muted",
];

fs.mkdirSync(dest, { recursive: true });
for (const n of names) {
  fs.copyFileSync(path.join(pub, `${n}.svg`), path.join(dest, `${n}.svg`));
}
console.log("Synced", names.length, "SVGs →", dest);
