import { getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import type { AppLocale } from "@/i18n/routing";
import countriesJson from "@/lib/data/countries.json";
import phoneDialExtra from "@/lib/data/phone-dial-extra.json";
import {
  getCountryLabel,
  type CountryRow,
} from "@/lib/countries-data";

/** Optional rows merged into phone dial list when ISO2 is absent from `countries.json`. */
type PhoneDialExtraRow = {
  ISO2: string;
  English: string;
  China?: string;
  Taiwan?: string;
  Hongkong?: string;
  /** ITU prefix without + if `getCountryCallingCode` cannot resolve this ISO2. */
  dial?: string;
};

function extraRowAsCountryRow(e: PhoneDialExtraRow): CountryRow {
  return {
    ISO2: e.ISO2,
    ISO3: e.ISO2,
    DIGITS: "",
    "ISO-3166-2": "",
    English: e.English,
    China: e.China ?? "",
    Taiwan: e.Taiwan ?? "",
    Hongkong: e.Hongkong ?? "",
    Memo: "",
  } as CountryRow;
}

function dialForExtra(e: PhoneDialExtraRow): string {
  if (e.dial?.trim()) {
    return `+${e.dial.replace(/^\+/, "").trim()}`;
  }
  return `+${getCountryCallingCode(e.ISO2 as CountryCode)}`;
}

/**
 * Phone country picker: one row per territory (same idea as
 * [countrycode.org](https://countrycode.org/)). `value` is ISO2 so
 * +1 / +7 duplicates stay distinct in the UI.
 */
export type PhoneDialOption = {
  /** ISO 3166-1 alpha-2 (matches form field `phoneCountry`). */
  value: string;
  label: string;
  id: string;
};

export function buildPhoneDialOptions(locale: AppLocale): PhoneDialOption[] {
  const rows = countriesJson as CountryRow[];
  const out: PhoneDialOption[] = [];

  const seen = new Set<string>();

  for (const row of rows) {
    try {
      const code = getCountryCallingCode(row.ISO2 as CountryCode);
      const dial = `+${code}`;
      const name = getCountryLabel(row, locale);
      out.push({
        id: row.ISO2,
        value: row.ISO2,
        label: `${name} (${dial})`,
      });
      seen.add(row.ISO2);
    } catch {
      // ISO2 not in libphonenumber metadata
    }
  }

  for (const extra of phoneDialExtra as PhoneDialExtraRow[]) {
    const iso = extra.ISO2?.trim();
    if (!iso || seen.has(iso)) continue;
    try {
      const dial = dialForExtra({ ...extra, ISO2: iso });
      const name = getCountryLabel(extraRowAsCountryRow({ ...extra, ISO2: iso }), locale);
      out.push({
        id: iso,
        value: iso,
        label: `${name} (${dial})`,
      });
      seen.add(iso);
    } catch {
      // skip invalid extra row
    }
  }

  const hk = out.find((o) => o.id === "HK");
  const rest = out
    .filter((o) => o.id !== "HK")
    .sort((a, b) => a.label.localeCompare(b.label, locale));
  return hk ? [hk, ...rest] : rest.sort((a, b) => a.label.localeCompare(b.label, locale));
}

/** Review / summary: show localized name + dial from stored ISO2. */
export function formatPhoneCountryForDisplay(
  iso2: string | undefined,
  locale: AppLocale,
): string {
  if (!iso2?.trim()) return "";
  const t = iso2.trim();
  if (t.startsWith("+")) {
    return t;
  }
  try {
    const row = (countriesJson as CountryRow[]).find((r) => r.ISO2 === t);
    if (row) {
      const dial = `+${getCountryCallingCode(t as CountryCode)}`;
      return `${getCountryLabel(row, locale)} (${dial})`;
    }
    const extra = (phoneDialExtra as PhoneDialExtraRow[]).find(
      (e) => e.ISO2?.trim() === t,
    );
    if (extra) {
      const dial = dialForExtra(extra);
      return `${getCountryLabel(extraRowAsCountryRow(extra), locale)} (${dial})`;
    }
    const dial = `+${getCountryCallingCode(t as CountryCode)}`;
    return dial;
  } catch {
    return t;
  }
}
