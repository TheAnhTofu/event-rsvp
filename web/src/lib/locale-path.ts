import { routing } from "@/i18n/routing";

/** URL path for `app/[locale]/…` with default locale prefix omitted (next-intl `as-needed`). */
export function localizedHref(locale: string, pathname: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === routing.defaultLocale) return p;
  return `/${locale}${p}`;
}
