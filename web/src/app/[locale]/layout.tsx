import type { ReactNode } from "react";
import { getMessages } from "next-intl/server";
import { DEFAULT_TIME_ZONE, routing, type AppLocale } from "@/i18n/routing";
import { LocaleClientProviders } from "@/components/layout/locale-client-providers";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: AppLocale = routing.locales.includes(rawLocale as AppLocale)
    ? (rawLocale as AppLocale)
    : routing.defaultLocale;
  const messages = await getMessages({ locale });

  return (
    <div className="h-full min-h-screen antialiased">
      <div className="flex min-h-screen flex-col font-sans text-text">
        <LocaleClientProviders
          locale={locale}
          messages={messages}
          timeZone={DEFAULT_TIME_ZONE}
        >
          {children}
        </LocaleClientProviders>
      </div>
    </div>
  );
}
