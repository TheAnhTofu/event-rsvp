"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useParams } from "next/navigation";
import { DEFAULT_TIME_ZONE, routing } from "@/i18n/routing";
import { CookiesModalProvider } from "@/components/cookies/cookies-modal-context";
import { CookiesSearchParamsSync } from "@/components/cookies/cookies-search-params-sync";
import { CookieConsentBanner } from "@/components/cookies/cookie-consent-banner";
import { CookiesSettingsModal } from "@/components/cookies/cookies-settings-modal";
import { LaunchGate } from "@/components/launch-gate";
import en from "@/messages/en.json";

const MESSAGES: Record<(typeof routing.locales)[number], typeof en> = {
  en,
};

type Props = {
  children: ReactNode;
};

export default function LocaleLayout({ children }: Props) {
  const params = useParams();
  const locale = params.locale as (typeof routing.locales)[number];
  const messages = MESSAGES[locale] ?? MESSAGES[routing.defaultLocale];

  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  return (
    <div className="h-full min-h-screen antialiased">
      <div className="flex min-h-screen flex-col font-sans text-text">
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone={DEFAULT_TIME_ZONE}
        >
          <CookiesModalProvider>
            <Suspense fallback={null}>
              <CookiesSearchParamsSync />
            </Suspense>
            <LaunchGate>{children}</LaunchGate>
            <CookieConsentBanner />
            <CookiesSettingsModal />
          </CookiesModalProvider>
        </NextIntlClientProvider>
      </div>
    </div>
  );
}
