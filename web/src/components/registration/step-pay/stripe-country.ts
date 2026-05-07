/**
 * ISO alpha-2 codes accepted by `stripe.paymentRequest({ country })`.
 * Source: Stripe IntegrationError when an unsupported code is passed.
 * Anything else (e.g. "AX", "VN") falls back to "HK" — the event location.
 */
const STRIPE_PAYMENT_REQUEST_COUNTRIES = new Set<string>([
  "AE", "AT", "AU", "BE", "BG", "BR", "CA", "CH", "CY", "CZ",
  "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GI", "GR", "GT",
  "HK", "HR", "HU", "ID", "IE", "IN", "IT", "JP", "LI", "LT",
  "LU", "LV", "MT", "MX", "MY", "NL", "NO", "NZ", "PE", "PH",
  "PL", "PT", "RO", "SE", "SG", "SI", "SK", "SM", "TH", "TT",
  "US", "UY",
]);

export function stripeSupportedPaymentRequestCountry(input: string | undefined): string {
  const code = (input ?? "").trim().toUpperCase();
  return STRIPE_PAYMENT_REQUEST_COUNTRIES.has(code) ? code : "HK";
}
