import { createHash } from "node:crypto";
import qs from "node:querystring";

/**
 * PA-SYS request signing: ksort fields (excluding `sign`), PHP `http_build_query` + secret → SHA-512 hex.
 * Node's `querystring.stringify` encodes spaces as `%20`; PHP defaults to `+` (RFC 1738). The gateway
 * verifies like PHP — we must match that string before hashing.
 * @see agent/knowledge/06-paymentasia-pa-sys-integration.md
 */
function phpHttpBuildQuery(fields: Record<string, string>): string {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(fields).sort()) {
    if (key === "sign") continue;
    sorted[key] = fields[key];
  }
  return qs.stringify(sorted).replace(/%20/g, "+");
}

export function paymentAsiaSign(
  fields: Record<string, string>,
  secret: string,
): string {
  const base = phpHttpBuildQuery(fields);
  return createHash("sha512")
    .update(base + secret, "utf8")
    .digest("hex");
}

/** Verify data-feed POST: drop `sign`, ksort, SHA512(query + secret) === sign */
export function paymentAsiaVerifySign(
  fields: Record<string, string>,
  secret: string,
  signHex: string,
): boolean {
  const expected = paymentAsiaSign(fields, secret);
  return expected.toLowerCase() === signHex.trim().toLowerCase();
}
