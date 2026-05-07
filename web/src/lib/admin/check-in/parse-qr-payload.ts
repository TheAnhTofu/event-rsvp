/**
 * Extract the registration reference from a scanned QR code value.
 *
 * QR payloads come in several forms:
 * 1. A URL containing `?ref=REFERENCE` (thank-you page link)
 * 2. A pipe-delimited string like "REFERENCE | email@example.com"
 * 3. A raw reference string (e.g. "IAIS-2026-0001")
 * 4. A custom qrCodePayload field (JSON with `reference` key)
 */
export function parseQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Try JSON with a `reference` key
  if (trimmed.startsWith("{")) {
    try {
      const obj = JSON.parse(trimmed);
      if (typeof obj.reference === "string" && obj.reference.trim()) {
        return obj.reference.trim();
      }
    } catch {
      // not JSON
    }
  }

  // 2. Try URL with `ref` query param
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const ref = url.searchParams.get("ref");
      if (ref?.trim()) return ref.trim();
    } catch {
      // not a valid URL
    }
  }

  // 3. Pipe-delimited: "REFERENCE | email"
  if (trimmed.includes("|")) {
    const ref = trimmed.split("|")[0].trim();
    if (ref) return ref;
  }

  // 4. Raw reference string
  return trimmed || null;
}
