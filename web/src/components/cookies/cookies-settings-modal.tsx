"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/navigation";
import { useCookiesModal } from "@/components/cookies/cookies-modal-context";

export function CookiesSettingsModal() {
  const { isOpen, close } = useCookiesModal();
  const t = useTranslations("CookiesPage");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [experience, setExperience] = useState(true);
  const [ads, setAds] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current?.focus();
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  function save() {
    try {
      localStorage.setItem(
        "iais_cookie_preferences",
        JSON.stringify({
          experience,
          ads,
          analytics,
          savedAt: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    close();
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(112,112,112,0.6)] backdrop-blur-[2px]"
        aria-label={t("closeOverlay")}
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-101 max-h-[min(900px,calc(100vh-2rem))] w-full max-w-[800px] overflow-y-auto rounded-xl border border-border-subtle bg-surface p-8 shadow-xl md:p-10"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="font-display text-[26px] font-bold leading-tight text-[#0a2540] md:text-[28px]"
          >
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg p-2 text-heading transition hover:bg-border-subtle/60"
            aria-label={t("close")}
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <p className="mt-4 text-[15px] leading-normal text-[#1b1b1b]">
          {t("introBefore")}
          <Link
            href="/privacy#cookies-consent"
            className="font-bold text-[#186ddf] underline [text-decoration-skip-ink:none]"
            onClick={close}
          >
            {t("introLink")}
          </Link>
          {t("introAfter")}
        </p>
        <hr className="my-6 border-border-subtle" />
        <p className="text-[14px] leading-normal text-[#1b1b1b]">
          {t("essentialBody")}
        </p>
        <div className="mt-8 flex flex-col gap-8">
          <OptionalBlock
            title={t("experienceTitle")}
            body={t("experienceBody")}
            checked={experience}
            onChange={setExperience}
          />
          <OptionalBlock
            title={t("adsTitle")}
            body={t("adsBody")}
            checked={ads}
            onChange={setAds}
          />
          <OptionalBlock
            title={t("analyticsTitle")}
            body={t("analyticsBody")}
            checked={analytics}
            onChange={setAnalytics}
          />
        </div>
        <div className="mt-10">
          <button
            type="button"
            onClick={save}
            className="w-full rounded-lg bg-[linear-gradient(180deg,#6989fe_0%,#3c64f4_100%)] px-10 py-3 text-[16px] font-bold leading-6 text-white shadow-sm transition hover:opacity-95"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function OptionalBlock({
  title,
  body,
  checked,
  onChange,
}: {
  title: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[#186ddf]"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-[16px] font-bold leading-7 text-[#3a3a3a]">
          {title}
        </span>
      </label>
      <p className="pl-8 text-[14px] leading-normal text-[#1b1b1b]">{body}</p>
    </div>
  );
}
