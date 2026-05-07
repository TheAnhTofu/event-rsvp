/**
 * Export 3 forum-row icons from Figma as PNG (REST `/v1/images`) and upload to S3.
 *
 * Design: [IAIS | AIF | Registration Form Web](https://www.figma.com/design/DHXxjezs7iMK1vq3IEQ18R/)
 * Parent frame `321:24877` — instances:
 *   - calendar → `forum-calendar.png` (321:24880)
 *   - location → `forum-location.png` (321:24883)
 *   - globe    → `forum-globe.png` (321:24886)
 *
 * Requires:
 *   - `FIGMA_ACCESS_TOKEN` — Figma → Settings → Security → Personal access tokens
 *   - `S3_BUCKET` (or `EMAIL_ASSETS_S3_BUCKET`), `AWS_REGION`, AWS credentials
 *
 * Usage:
 *   cd web && node --env-file=../.env.local scripts/export-figma-forum-icons-to-s3.mjs
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const FILE_KEY = "DHXxjezs7iMK1vq3IEQ18R";

/** @type {{ figmaId: string; s3Key: string }[]} */
const ICONS = [
  { figmaId: "321:24880", s3Key: "forum-calendar.png" },
  { figmaId: "321:24883", s3Key: "forum-location.png" },
  { figmaId: "321:24886", s3Key: "forum-globe.png" },
];

const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
const bucket =
  process.env.S3_BUCKET?.trim() || process.env.EMAIL_ASSETS_S3_BUCKET?.trim();
const prefix = (process.env.EMAIL_ASSETS_S3_PREFIX?.trim() || "email-assets").replace(
  /\/$/,
  "",
);
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
/** @type {1 | 2 | 3 | 4} */
const scale = Number(process.env.FIGMA_EXPORT_SCALE || 3) || 3;

if (!token) {
  console.error(
    "Set FIGMA_ACCESS_TOKEN (Figma → Settings → Security → Personal access tokens).",
  );
  process.exit(1);
}
if (!bucket || !region) {
  console.error("Set S3_BUCKET (or EMAIL_ASSETS_S3_BUCKET) and AWS_REGION.");
  process.exit(1);
}

const imagesUrl = new URL(`https://api.figma.com/v1/images/${FILE_KEY}`);
imagesUrl.searchParams.set("ids", ICONS.map((i) => i.figmaId).join(","));
imagesUrl.searchParams.set("format", "png");
imagesUrl.searchParams.set("scale", String(scale));

const metaRes = await fetch(imagesUrl.toString(), {
  headers: { "X-Figma-Token": token },
});
if (!metaRes.ok) {
  const t = await metaRes.text();
  console.error(`Figma images API ${metaRes.status}:`, t);
  process.exit(1);
}

/** @type {{ err?: string; images: Record<string, string | null> }} */
const meta = await metaRes.json();
if (meta.err) {
  console.error("Figma API error:", meta.err);
  process.exit(1);
}

const client = new S3Client({ region });

for (const { figmaId, s3Key } of ICONS) {
  const url = meta.images?.[figmaId];
  if (!url) {
    console.error(`No export URL for node ${figmaId}. Response:`, meta.images);
    process.exit(1);
  }
  const pngRes = await fetch(url);
  if (!pngRes.ok) {
    console.error(`Failed to download PNG for ${figmaId}: ${pngRes.status}`);
    process.exit(1);
  }
  const buf = Buffer.from(await pngRes.arrayBuffer());
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    console.error(`${s3Key}: not a valid PNG (wrong magic bytes).`);
    process.exit(1);
  }
  const Key = `${prefix}/${s3Key}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body: buf,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000",
    }),
  );
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${Key}`;
  console.log(`Uploaded ${s3Key} (${buf.length} bytes, scale=${scale}) → ${publicUrl}`);
}

console.log("\nDone. Env lines (if needed):");
for (const { s3Key } of ICONS) {
  const envVar =
    s3Key === "forum-calendar.png"
      ? "EMAIL_ASSET_FORUM_CALENDAR_URL"
      : s3Key === "forum-location.png"
        ? "EMAIL_ASSET_FORUM_LOCATION_URL"
        : "EMAIL_ASSET_FORUM_GLOBE_URL";
  const Key = `${prefix}/${s3Key}`;
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${Key}`;
  console.log(`${envVar}=${publicUrl}`);
}
