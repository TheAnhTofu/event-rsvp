/**
 * Download canonical email PNGs (from prod S3 public URLs) and upload to your bucket,
 * print suggested EMAIL_* env lines.
 *
 * Source URLs match `source-backend/src/lib/email/email-assets.ts` defaults
 * (`event-rsvp-bank-slips-prod` + `email-assets/`). To seed from Figma instead,
 * export PNGs locally and use `aws s3 cp`, or temporarily set `url` in ASSETS.
 *
 * Usage:
 *   node scripts/sync-figma-email-assets-to-s3.mjs
 *
 * Requires: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (or default profile),
 *           S3_BUCKET (hoặc EMAIL_ASSETS_S3_BUCKET legacy)
 *
 * Optional: EMAIL_ASSETS_S3_PREFIX (default email-assets)
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/** Canonical prod bucket — same PNGs as committed defaults in `email-assets.ts`. */
const S3_SOURCE_BASE =
  "https://event-rsvp-bank-slips-prod.s3.ap-southeast-1.amazonaws.com/email-assets";

/** @type {{ key: string; url: string; envVar: string; contentType: string }[]} */
const ASSETS = [
  {
    envVar: "EMAIL_HEADER_IMAGE_URL",
    key: "email-header.png",
    url: `${S3_SOURCE_BASE}/email-header.png`,
    contentType: "image/png",
  },
  {
    envVar: "EMAIL_ASSET_FORUM_CALENDAR_URL",
    key: "forum-calendar.png",
    url: `${S3_SOURCE_BASE}/forum-calendar.png`,
    contentType: "image/png",
  },
  {
    envVar: "EMAIL_ASSET_FORUM_LOCATION_URL",
    key: "forum-location.png",
    url: `${S3_SOURCE_BASE}/forum-location.png`,
    contentType: "image/png",
  },
  {
    envVar: "EMAIL_ASSET_FORUM_GLOBE_URL",
    key: "forum-globe.png",
    url: `${S3_SOURCE_BASE}/forum-globe.png`,
    contentType: "image/png",
  },
  {
    envVar: "EMAIL_ASSET_QR_PLACEHOLDER_URL",
    key: "qr-placeholder.png",
    url: `${S3_SOURCE_BASE}/qr-placeholder.png`,
    contentType: "image/png",
  },
];

const bucket =
  process.env.S3_BUCKET?.trim() || process.env.EMAIL_ASSETS_S3_BUCKET?.trim();
const prefix = (process.env.EMAIL_ASSETS_S3_PREFIX?.trim() || "email-assets").replace(
  /\/$/,
  "",
);
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

if (!bucket || !region) {
  console.error("Set S3_BUCKET (or EMAIL_ASSETS_S3_BUCKET) and AWS_REGION.");
  process.exit(1);
}

const client = new S3Client({ region });

for (const asset of ASSETS) {
  const Key = `${prefix}/${asset.key}`;
  const res = await fetch(asset.url);
  if (!res.ok) {
    console.error(`Failed to download ${asset.url}: ${res.status}`);
    process.exit(1);
  }
  const body = Buffer.from(await res.arrayBuffer());
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key,
      Body: body,
      ContentType: asset.contentType,
      CacheControl: "public, max-age=31536000",
    }),
  );
  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${Key}`;
  console.log(`Uploaded ${asset.key} → ${publicUrl}`);
  console.log(`${asset.envVar}=${publicUrl}`);
  console.log("");
}

console.log("Add the lines above to web/.env.local (and production env).");
