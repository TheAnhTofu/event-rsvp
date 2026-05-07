"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { HeroBanner } from "@/components/layout/hero-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Link } from "@/i18n/navigation";

type RegistrationPageShellProps = {
  step: 0 | 1 | 2 | 3;
  /**
   * @deprecated Figma `1149:41673` removed the centered title/subtitle row
   * between hero and content. Prop retained for backwards-compat only.
   */
  subtitle?: string;
  contentMaxClassName?: string;
  /**
   * @deprecated Figma `1149:41673` no longer renders the event title/subtitle
   * stack above the wizard content; prop retained for compat but ignored.
   */
  hideEventHeader?: boolean;
  /** Hide top nav (IAIS / Register) — registration wizard chrome. */
  hideSiteHeader?: boolean;
  /** Hide the top utility row (e.g. Review/Pay steps). */
  hideLanguageSwitcher?: boolean;
  /**
   * @deprecated Figma `1149:41673` removed the "Almost done" pay header so
   * the orange Payment Required banner sits flush below the hero. Ignored.
   */
  payHeaderBelowStepper?: boolean;
  /**
   * @deprecated Same reason as `payHeaderBelowStepper`. Ignored.
   */
  hidePayHeaderBlock?: boolean;
  /** Registration step entered from homepage audience cards. */
  showChangeAttendanceType?: boolean;
  /**
   * @deprecated Figma `1149:41673` retired the multi-step progress bar
   * across the wizard. Prop kept for backwards-compat with old call sites
   * but is ignored — the stepper is never rendered anymore.
   */
  hideStepIndicator?: boolean;
  children: ReactNode;
};

export function RegistrationPageShell({
  contentMaxClassName = "max-w-none",
  hideSiteHeader = false,
  hideLanguageSwitcher = false,
  showChangeAttendanceType = false,
  // step / subtitle / hideEventHeader / payHeaderBelowStepper /
  // hidePayHeaderBlock / hideStepIndicator: deprecated, see prop docs.
  children,
}: RegistrationPageShellProps) {
  const t = useTranslations("Shell");

  const showTopUtilityRow =
    !hideLanguageSwitcher && showChangeAttendanceType;

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      {hideSiteHeader ? null : <SiteHeader />}
      <HeroBanner />
      {/* Figma 1149:41673: 1020px content column, hero flows directly into
          the wizard content (no centered event title/subtitle anymore). */}
      <div className="flex w-full flex-1 flex-col items-stretch bg-[#f3f6ff]">
        <div className="mx-auto flex w-full max-w-[1020px] flex-col px-4 pb-10 pt-3 sm:px-6 md:px-10 md:pb-14 md:pt-[60px] lg:px-20 lg:pb-16">
          {showTopUtilityRow ? (
            <div className="relative mb-6 flex min-h-9 w-full items-center justify-between gap-4 md:mb-10 md:min-h-12 lg:mb-12">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center gap-1 rounded-lg border border-[#4c4c4c] bg-white px-3 py-2 text-[13px] font-medium leading-5 text-[#4c4c4c] transition hover:bg-border-subtle/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:px-4 md:text-[16px] md:leading-6"
              >
                <svg
                  aria-hidden
                  className="size-4 md:size-5"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M12.5 4.5 7 10l5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("changeAttendanceType")}
              </Link>
            </div>
          ) : null}
          <div className={`w-full ${contentMaxClassName}`}>{children}</div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
