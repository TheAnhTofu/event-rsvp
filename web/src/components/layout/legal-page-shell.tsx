"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { HeroBanner } from "@/components/layout/hero-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { Link } from "@/i18n/navigation";

type LegalPageShellProps = {
  children: ReactNode;
};

export function LegalPageShell({ children }: LegalPageShellProps) {
  const t = useTranslations("PoliciesPage");

  return (
    <div className="flex min-h-screen flex-col items-center bg-page-bg">
      <HeroBanner />
      <div className="flex w-full max-w-[1440px] flex-1 flex-col bg-surface px-6 pb-12 pt-5 md:px-[60px] md:pb-16 md:pt-5 lg:px-20">
        <div className="mb-8 flex min-h-9 w-full max-w-[1400px] md:mb-10 md:min-h-12 lg:mb-12">
          <Link
            href="/register"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#4e73f8] px-3 py-3 text-[16px] font-bold leading-6 text-[#4e73f8] transition hover:bg-[#4e73f8]/5"
          >
            <svg
              className="size-6 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("backToRegistration")}
          </Link>
        </div>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
