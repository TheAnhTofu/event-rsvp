"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type StepCompleteProps = {
  reference: string;
};

export function StepComplete({ reference }: StepCompleteProps) {
  const t = useTranslations("Wizard");

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-6 rounded-2xl border border-card-border bg-surface px-6 py-10 text-center shadow-sm md:px-10 md:py-12">
      <div className="flex size-14 items-center justify-center rounded-full bg-[#e8f5e9] text-2xl text-[#2e7d32] md:size-16">
        ✓
      </div>
      <h2 className="font-display text-[22px] font-semibold leading-tight text-brand-deep md:text-[28px]">
        {t("completeHeading")}
      </h2>
      <p className="text-[15px] leading-relaxed text-ink md:text-base">
        {t("completeBody")}
      </p>
      <p className="rounded-lg bg-border-subtle/50 px-4 py-3 font-mono text-[14px] text-heading md:text-[15px]">
        {t("referenceLabel")}: {reference}
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex min-w-[200px] justify-center rounded-lg bg-[linear-gradient(90deg,var(--color-brand-deep)_0%,var(--color-accent)_100%)] px-8 py-3 text-[15px] font-semibold text-surface shadow-md transition hover:opacity-95"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
