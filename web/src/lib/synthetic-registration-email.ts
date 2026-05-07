import type { RegistrationFormValues } from "@/lib/registration-schema";

/** RFC-safe placeholder domain for receipts when the form does not collect email. */
const PLACEHOLDER_DOMAIN = "example.com";

/**
 * Builds a deterministic placeholder address from phone + name so Stripe/API receive a valid email
 * without showing an email field in the registration UI.
 */
export function buildSyntheticRegistrationEmail(
  v: Pick<
    RegistrationFormValues,
    "phoneCountry" | "phoneNumber" | "firstName" | "lastName"
  >,
): string {
  const raw = `${v.phoneCountry}|${v.phoneNumber}|${v.firstName}|${v.lastName}`
    .trim()
    .toLowerCase();
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = Math.imul(31, h) + raw.charCodeAt(i);
  }
  const id = Math.abs(h >>> 0).toString(36);
  return `registration.${id}@${PLACEHOLDER_DOMAIN}`;
}

export function ensureRegistrationEmail(
  v: RegistrationFormValues,
): RegistrationFormValues {
  const trimmed = v.email?.trim() ?? "";
  if (trimmed) return { ...v, email: trimmed };
  return { ...v, email: buildSyntheticRegistrationEmail(v) };
}
