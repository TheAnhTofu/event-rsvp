"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { CookiesModalProvider } from "@/components/cookies/cookies-modal-context";
import { CookiesSearchParamsSync } from "@/components/cookies/cookies-search-params-sync";
import { CookieConsentBanner } from "@/components/cookies/cookie-consent-banner";
import { CookiesSettingsModal } from "@/components/cookies/cookies-settings-modal";
import { LaunchGate } from "@/components/launch-gate";

type Props = {
  locale: string;
  messages: Record<string, unknown>;
  timeZone: string;
  children: ReactNode;
};

export function LocaleClientProviders({
  locale,
  messages,
  timeZone,
  children,
}: Props) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={timeZone}
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
  );
}
