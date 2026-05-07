/**
 * Email image URLs: mặc định trỏ S3 public (`email-assets/*` trên bucket prod).
 * Override bằng `EMAIL_*` env khi cần bucket/CDN khác.
 *
 * Đồng bộ lên S3 (cần AWS + `S3_BUCKET`): `node web/scripts/sync-figma-email-assets-to-s3.mjs`
 * — Ba icon forum (calendar/location/globe) PNG từ Figma: `node web/scripts/export-figma-forum-icons-to-s3.mjs`
 * (cần `FIGMA_ACCESS_TOKEN`). Các object SVG cũ gắn nhầm `Content-Type: image/png` sẽ vỡ trong email client.
 */

/** Bucket prod — public read `email-assets/*` (xem `ops/s3-email-assets-public-read-policy.json`). */
const S3_EMAIL_ASSETS_BASE =
  "https://event-rsvp-bank-slips-prod.s3.ap-southeast-1.amazonaws.com/email-assets";

/** Header banner (Figma node 321-24867) */
const DEFAULT_EMAIL_HEADER_IMAGE_URL = `${S3_EMAIL_ASSETS_BASE}/email-header.png`;

/** Forum row icons — thank-you / payment-confirmation */
const DEFAULT_FORUM_CALENDAR_URL = `${S3_EMAIL_ASSETS_BASE}/forum-calendar.png`;
const DEFAULT_FORUM_LOCATION_URL = `${S3_EMAIL_ASSETS_BASE}/forum-location.png`;
const DEFAULT_FORUM_GLOBE_URL = `${S3_EMAIL_ASSETS_BASE}/forum-globe.png`;

/** QR placeholder (physical attendance email) — Figma node 321:25059 */
const DEFAULT_QR_PLACEHOLDER_URL = `${S3_EMAIL_ASSETS_BASE}/qr-placeholder.png`;

/**
 * Insurance Authority banner image URL for transactional HTML emails.
 *
 * **Production:** `EMAIL_HEADER_IMAGE_URL` = full HTTPS URL (S3/CloudFront) nếu khác mặc định.
 */
export function getEmailHeaderImageUrl(): string {
  const explicit = process.env.EMAIL_HEADER_IMAGE_URL?.trim();
  if (explicit) return explicit;
  return DEFAULT_EMAIL_HEADER_IMAGE_URL;
}

/** Icon lịch — hàng "Forum Detail" trong email HTML */
export function getForumDetailCalendarIconUrl(): string {
  return (
    process.env.EMAIL_ASSET_FORUM_CALENDAR_URL?.trim() || DEFAULT_FORUM_CALENDAR_URL
  );
}

/** Icon địa điểm */
export function getForumDetailLocationIconUrl(): string {
  return (
    process.env.EMAIL_ASSET_FORUM_LOCATION_URL?.trim() || DEFAULT_FORUM_LOCATION_URL
  );
}

/** Icon ngôn ngữ / globe */
export function getForumDetailGlobeIconUrl(): string {
  return (
    process.env.EMAIL_ASSET_FORUM_GLOBE_URL?.trim() || DEFAULT_FORUM_GLOBE_URL
  );
}

/** Ảnh QR mặc định (physical attendance) khi chưa có `qrCodeImageUrl` tùy chỉnh */
export function getEmailQrPlaceholderImageUrl(): string {
  return (
    process.env.EMAIL_ASSET_QR_PLACEHOLDER_URL?.trim() || DEFAULT_QR_PLACEHOLDER_URL
  );
}

/**
 * Generate a QR code image URL (via api.qrserver.com) that encodes the
 * admin check-in lookup endpoint for a specific registration reference.
 *
 * When scanned, the QR data is a URL like:
 *   `https://<APP>/api/admin/check-in/lookup?ref=REF-XXXX`
 *
 * The on-site check-in scanner's `parseQrPayload` extracts `ref` from
 * the URL query string automatically.
 */
export function buildQrCodeImageUrl(reference: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "https://registration.newtofuevents.com";
  const lookupUrl = `${base}/api/admin/check-in/lookup?ref=${encodeURIComponent(reference)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=329x329&margin=10&data=${encodeURIComponent(lookupUrl)}`;
}

/**
 * @deprecated Dùng {@link getEmailHeaderImageUrl}. Giữ tên để grep/ADR cũ.
 */
export const EMAIL_HEADER_FIGMA_IMAGE_URL = DEFAULT_EMAIL_HEADER_IMAGE_URL;

/**
 * App-hosted PNG logo (receipt/PDF attachments, etc.). Do not use as the default HTML email header.
 */
export function getReceiptLogoUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "https://registration.newtofuevents.com";
  return `${base}/email/insurance-authority-logo.png`;
}
