"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useCookiesModal } from "@/components/cookies/cookies-modal-context";

const STORAGE_KEY = "iais_cookie_banner_accepted";

function ExternalLinkGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="15 3 21 3 21 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="10"
        y1="14"
        x2="21"
        y2="3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CookieConsentBanner() {
  const t = useTranslations("CookieBanner");
  const { open: openCookiesModal } = useCookiesModal();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  const isAdminRoute = pathname?.includes("/admin") ?? false;

  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
      } catch {
        setDismissed(false);
      }
    });
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (isAdminRoute || dismissed === null || dismissed) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e0e0e0] bg-[#f9f9f9] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
      role="region"
      aria-label={t("ariaLabel")}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 md:px-10 md:py-5">
        <p className="text-[13px] leading-normal text-[#3a3a3a] sm:text-[14px]">
          {t.rich("body", {
            settings: (chunks) => (
              <button
                type="button"
                onClick={openCookiesModal}
                className="inline-flex items-center gap-1 align-baseline font-inherit text-[#186ddf] underline decoration-[#186ddf] [text-decoration-skip-ink:none] transition hover:opacity-90"
              >
                <span>{chunks}</span>
                <ExternalLinkGlyph className="shrink-0 translate-y-px" />
              </button>
            ),
          })}
        </p>
        <div className="flex shrink-0 justify-end sm:justify-end">
          <button
            type="button"
            onClick={accept}
            className="rounded-md bg-[#5c85f2] px-6 py-2.5 text-[13px] font-bold leading-tight text-white shadow-sm transition hover:opacity-95 sm:px-7 sm:text-[14px]"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
