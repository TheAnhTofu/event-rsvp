/**
 * Upload email header PNG to S3 for EMAIL_HEADER_IMAGE_URL.
 *
 * Usage:
 *   node scripts/upload-email-header-to-s3.mjs /path/to/header.png
 *
 * Requires: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (or default profile),
 *           S3_BUCKET, optional EMAIL_ASSETS_S3_KEY (default email-assets/email-header.png)
 */
import { readFile } from "node:fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const filePath = process.argv[2];
if (!filePath) {
  console.error(
    "Usage: node scripts/upload-email-header-to-s3.mjs <path-to.png>",
  );
  process.exit(1);
}

const bucket =
  process.env.S3_BUCKET?.trim() || process.env.EMAIL_ASSETS_S3_BUCKET?.trim();
const key =
  process.env.EMAIL_ASSETS_S3_KEY?.trim() || "email-assets/email-header.png";
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

if (!bucket || !region) {
  console.error("Set S3_BUCKET (or EMAIL_ASSETS_S3_BUCKET) and AWS_REGION.");
  process.exit(1);
}

const body = await readFile(filePath);
const client = new S3Client({ region });

await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000",
  }),
);

const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
console.log("Uploaded:", url);
console.log("Set EMAIL_HEADER_IMAGE_URL=" + url);
