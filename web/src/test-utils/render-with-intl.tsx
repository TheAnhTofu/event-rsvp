import { NextIntlClientProvider } from "next-intl";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { CookiesModalProvider } from "@/components/cookies/cookies-modal-context";
import { DEFAULT_TIME_ZONE } from "@/i18n/routing";
import en from "@/messages/en.json";

type Messages = typeof en;

export function createIntlWrapper(
  locale = "en",
  messages: Messages = en,
): ({ children }: { children: ReactNode }) => ReactElement {
  return function IntlWrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={DEFAULT_TIME_ZONE}
      >
        <CookiesModalProvider>{children}</CookiesModalProvider>
      </NextIntlClientProvider>
    );
  };
}

export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    locale?: string;
    messages?: Messages;
  },
) {
  const { locale = "en", messages = en, ...rest } = options ?? {};
  return render(ui, {
    wrapper: createIntlWrapper(locale, messages),
    ...rest,
  });
}
