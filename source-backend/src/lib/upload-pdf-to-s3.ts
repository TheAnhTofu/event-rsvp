import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { resolveS3Bucket } from "./s3-bucket";

/**
 * Upload a PDF to S3 under the `documents/` prefix.
 *
 * Key pattern: `documents/{reference}/{fileName}`
 * e.g. `documents/IAIS-2026-0001/IAIS-payment-receipt.pdf`
 *
 * Fails silently (logs error) so callers never block on S3 issues.
 */
export async function uploadPdfToS3(
  reference: string,
  fileName: string,
  pdfBytes: Uint8Array,
): Promise<string | null> {
  const bucket = resolveS3Bucket();
  if (!bucket) {
    console.warn("[s3] Skipped PDF upload: S3_BUCKET not configured");
    return null;
  }

  const region =
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "ap-southeast-1";
  const client = new S3Client({ region });
  const key = `documents/${reference}/${fileName}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: pdfBytes,
        ContentType: "application/pdf",
        ContentDisposition: `inline; filename="${fileName}"`,
      }),
    );
    console.info(`[s3] Uploaded ${key} (${pdfBytes.byteLength} bytes)`);
    return key;
  } catch (e) {
    console.error("[s3] PDF upload failed:", e);
    return null;
  }
}
