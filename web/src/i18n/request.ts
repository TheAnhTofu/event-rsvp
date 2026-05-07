import { getRequestConfig } from "next-intl/server";
import { DEFAULT_TIME_ZONE, routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    timeZone: DEFAULT_TIME_ZONE,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
