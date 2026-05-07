"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type FaqItem = { q: string; a: string };

export function PoliciesFaqAccordion() {
  const t = useTranslations("PoliciesPage");
  const [open, setOpen] = useState(() => new Set([0, 1, 2]));

  const items = useMemo(() => {
    const raw = t.raw("faqItems");
    return Array.isArray(raw) ? (raw as FaqItem[]) : [];
  }, [t]);

  return (
    <section
      className="w-full max-w-[1280px]"
      aria-labelledby="policies-faq-heading"
    >
      <h2
        id="policies-faq-heading"
        className="font-display text-[26px] font-bold leading-normal text-brand-deep md:text-[28px]"
      >
        {t("faqTitle")}
      </h2>
      <div className="mt-4 divide-y divide-black border-b border-black">
        {items.map((item, index) => {
          const isOpen = open.has(index);
          return (
            <div key={index} className="border-t border-[rgba(60,60,67,0.2)]">
              <button
                type="button"
                className="flex w-full items-start gap-4 py-3 text-left"
                onClick={() => {
                  setOpen((prev) => {
                    const next = new Set(prev);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  });
                }}
                aria-expanded={isOpen}
              >
                <span className="flex-1 text-[18px] font-bold leading-tight text-[#3f3f3f]">
                  {item.q}
                </span>
                <span className="inline-flex size-6 shrink-0 items-center justify-center text-[#3f3f3f]">
                  {isOpen ? (
                    <svg
                      viewBox="0 0 24 24"
                      width={24}
                      height={24}
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M6 12h12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width={24}
                      height={24}
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M12 6v12M6 12h12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
              {isOpen ? (
                <div className="pb-4 pr-10">
                  <p className="text-[16px] leading-[1.4] text-[rgba(60,60,67,0.85)]">
                    {item.a}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
