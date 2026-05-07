import type { RegistrationFormValues } from "@/lib/registration-schema";

/** Homepage / wizard participant category (four registration forms). */
export type AudienceFormType = RegistrationFormValues["audienceType"];

/** Figma « Registration Type » badges — IAIS AIF registration admin table. */
const LABELS: Record<AudienceFormType, string> = {
  members: "IAIS Members, IAIS Secretariat, AMF",
  fellow:
    "IAIS Distinguished Fellow, Press, Consumer Group and External Speaker",
  industry: "Industry representative",
  virtual: "Virtual for IAIS Members only",
};

const BADGE_BG: Record<AudienceFormType, string> = {
  members: "bg-[#27ae60]",
  fellow: "bg-[#2f80ed]",
  industry: "bg-[#bb6bd9]",
  virtual: "bg-[#f2994a]",
};

export function canonicalAudienceFormType(
  raw: string | null | undefined,
): AudienceFormType | null {
  if (raw == null || !String(raw).trim()) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "members" || v === "industry" || v === "fellow" || v === "virtual") {
    return v;
  }
  return null;
}

/** Admin list / badge copy aligned with Figma registration-type chips. */
export function registrationFormCategoryLabel(
  raw: string | null | undefined,
): string {
  const c = canonicalAudienceFormType(raw);
  if (c) return LABELS[c];
  if (!raw?.trim()) return "—";
  const t = raw.trim().toLowerCase();
  if (t === "unknown") return "—";
  return raw.trim().replace(/_/g, " ");
}

export function registrationFormCategoryBadgeClass(
  raw: string | null | undefined,
): string {
  const c = canonicalAudienceFormType(raw);
  if (c) return BADGE_BG[c];
  return "bg-[#757575]";
}
