import countriesJson from "@/lib/data/countries.json";
import type { AppLocale } from "@/i18n/routing";

export type CountryRow = (typeof countriesJson)[number];

function trimEn(row: CountryRow): string {
  return row.English.trim();
}

/** Localised country name; English uses “Hong Kong SAR” for HK to match product copy. */
export function getCountryLabel(row: CountryRow, locale: AppLocale): string {
  if (locale === "en" && row.ISO2 === "HK") {
    return "Hong Kong SAR";
  }
  return trimEn(row);
}

export function buildCountryOptions(
  locale: AppLocale,
): { value: string; label: string }[] {
  const rows = countriesJson as CountryRow[];
  const opts = rows.map((row) => ({
    value: row.ISO2,
    label: getCountryLabel(row, locale),
  }));
  const hk = opts.find((o) => o.value === "HK");
  const rest = opts
    .filter((o) => o.value !== "HK")
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  return hk ? [hk, ...rest] : rest;
}

export function getCountryLabelByIso(
  iso2: string | undefined,
  locale: AppLocale,
): string {
  if (!iso2?.trim()) return "";
  const row = (countriesJson as CountryRow[]).find(
    (r) => r.ISO2 === iso2.trim(),
  );
  if (!row) return iso2;
  return getCountryLabel(row, locale);
}

/** Supports ISO2 codes or legacy full-name strings already stored in drafts/API. */
export function formatStoredCountry(
  stored: string | undefined,
  locale: AppLocale,
): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  if (/^[A-Za-z]{2}$/.test(t)) {
    return getCountryLabelByIso(t.toUpperCase(), locale) || t;
  }
  return t;
}
