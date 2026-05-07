"use client";

import { useTranslations } from "next-intl";

type StepIndicatorProps = {
  current: 0 | 1 | 2 | 3;
};

/** Figma: 393p track ~345×6.5; 834p ~584; 1440p 1000×8 — four steps */
export function StepIndicator({ current }: StepIndicatorProps) {
  const t = useTranslations("Steps");
  const labels = [
    t("registration"),
    t("review"),
    t("pay"),
    t("complete"),
  ] as const;
  const pct =
    current === 0 ? 25 : current === 1 ? 50 : current === 2 ? 75 : 100;
  const labelColors = [
    "text-accent",
    "text-accent-mid",
    "text-accent-strong",
    "text-accent-strong",
  ] as const;

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-md md:gap-4">
      <div
        className="h-1.5 w-full overflow-hidden rounded-[5px] bg-border md:h-2"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-[5px] bg-gradient-to-r from-accent via-accent-mid to-accent-strong transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between gap-0.5 text-center text-[11px] leading-[14px] md:gap-2 md:text-sm md:leading-5 lg:text-base">
        {labels.map((label, i) => {
          const reached = i <= current;
          return (
            <div
              key={i}
              className={`min-w-0 flex-1 basis-0 font-normal ${
                reached ? labelColors[Math.min(i, labelColors.length - 1)] : "text-step-inactive"
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
