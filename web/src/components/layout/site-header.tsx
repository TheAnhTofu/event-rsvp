"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Slim global header above the hero — IAIS branding and home link. */
export function SiteHeader() {
  const t = useTranslations("SiteHeader");

  return (
    <header className="w-full border-b border-border-subtle bg-surface">
      <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between px-6 md:h-14 md:px-[60px] lg:px-20">
        <Link
          href="/"
          className="font-display text-[15px] font-medium tracking-wide text-brand-deep transition hover:text-accent md:text-base"
        >
          {t("brand")}
        </Link>
        <nav className="flex items-center gap-4 text-[13px] text-heading md:text-sm">
          <Link
            href="/register"
            className="font-medium text-accent transition hover:underline"
          >
            {t("register")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
