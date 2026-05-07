/**
 * Aligns with web `i18n/routing.ts` locales: en, zh-Hant, zh-Hans.
 * Used when sending transactional emails so copy matches the user's UI language.
 */
export type EmailLocale = "en" | "zh-Hant" | "zh-Hans";

export function normalizeEmailLocale(
  raw: string | null | undefined,
): EmailLocale {
  const s = raw?.trim();
  if (s === "zh-Hans" || s === "zh-Hant") return s;
  const lower = s?.toLowerCase() ?? "";
  if (lower === "zh-hans" || lower === "zhcn") return "zh-Hans";
  if (
    lower === "zh-hant" ||
    lower === "zh-hk" ||
    lower === "zh-tw" ||
    lower === "zhhk"
  ) {
    return "zh-Hant";
  }
  if (lower.startsWith("zh")) return "zh-Hant";
  return "en";
}

const LOCALE_DATE_MAP: Record<EmailLocale, string> = {
  en: "en-GB",
  "zh-Hant": "zh-HK",
  "zh-Hans": "zh-CN",
};

/** Formats payment / receipt dates in email bodies per recipient locale. */
export function formatPaymentDateForEmail(
  iso: string | null | undefined,
  locale: EmailLocale,
): string {
  const d =
    iso?.trim() && !Number.isNaN(Date.parse(iso)) ? new Date(iso) : new Date();
  try {
    return d.toLocaleDateString(LOCALE_DATE_MAP[locale], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
}
