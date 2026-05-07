import { getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import { inferDietaryYesNo } from "@/lib/registration-schema";
import type { RegistrationDetailResponse } from "@/types/crm";

export function str(payload: Record<string, unknown>, key: string): string {
  const v = payload[key];
  return typeof v === "string" ? v : "";
}

export function bool(payload: Record<string, unknown>, key: string): boolean {
  return payload[key] === true;
}

export function formatPhoneLine(
  phoneCountryIso: string | undefined,
  phoneNumber: string | undefined,
): string {
  if (!phoneNumber?.trim()) return "—";
  const n = phoneNumber.trim();
  const iso = phoneCountryIso?.trim();
  if (!iso) return n;
  if (iso.startsWith("+")) return `${iso} ${n}`;
  try {
    const dial = `+${getCountryCallingCode(iso as CountryCode)}`;
    return `${dial} ${n}`;
  } catch {
    return `${iso} ${n}`;
  }
}

export function dietaryPreferenceDisplay(p: Record<string, unknown>): string {
  const yesNo = str(p, "dietaryYesNo");
  const raw = str(p, "dietary");
  const details = str(p, "dietaryOtherDetails");
  const yn = inferDietaryYesNo({
    dietaryYesNo:
      yesNo === "yes" || yesNo === "no" ? yesNo : undefined,
    dietary: raw || undefined,
  });
  if (yn === "no") return "No preference";
  if (yn === "yes") {
    if (raw === "vegan") return "Vegan";
    if (raw === "vegetarian") return "Vegetarian";
    if (raw === "halal") return "Halal";
    if (raw === "gluten_free") return "Gluten free";
    if (raw === "other") {
      const d = details.trim();
      return d ? `Other (${d})` : "Other";
    }
    return "—";
  }
  return "—";
}

export function buildQrPayload(
  row: RegistrationDetailResponse,
  locale: string,
  payload: Record<string, unknown>,
): string {
  const explicit = typeof payload.qrCodePayload === "string" ? payload.qrCodePayload.trim() : "";
  if (explicit) return explicit;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (base) {
    const params = new URLSearchParams({ ref: row.reference, email: row.email });
    return `${base}/${locale}/register/thank-you?${params.toString()}`;
  }
  return `${row.reference} | ${row.email}`;
}
