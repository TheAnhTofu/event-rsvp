import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * IAIS event runs in Hong Kong, so all date/time formatting (deadlines, cookie
 * banner copy, registration confirmations…) is anchored to HKT regardless of
 * the deploy region. Both the server-side request config (`i18n/request.ts`)
 * and the client `NextIntlClientProvider` (`[locale]/layout.tsx`) must pass
 * this value, otherwise next-intl logs an `ENVIRONMENT_FALLBACK` warning and
 * server/client markup can drift (hydration mismatch).
 */
export const DEFAULT_TIME_ZONE = "Asia/Hong_Kong";
