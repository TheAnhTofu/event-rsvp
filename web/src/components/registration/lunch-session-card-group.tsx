"use client";

import type { RegistrationFormValues } from "@/lib/registration-schema";
import { FigmaIcon } from "@/components/icons/figma-icon";

type Props = {
  name: string;
  value: RegistrationFormValues["lunchSession"];
  onChange: (v: RegistrationFormValues["lunchSession"]) => void;
  labelNov12: string;
  labelNov13: string;
  labelNone: string;
};

function toggleNov12(
  current: RegistrationFormValues["lunchSession"],
): RegistrationFormValues["lunchSession"] {
  if (current === "none") return "nov12";
  if (current === undefined) return "nov12";
  if (current === "nov12") return undefined;
  if (current === "nov13") return "both";
  if (current === "both") return "nov13";
  return "nov12";
}

function toggleNov13(
  current: RegistrationFormValues["lunchSession"],
): RegistrationFormValues["lunchSession"] {
  if (current === "none") return "nov13";
  if (current === undefined) return "nov13";
  if (current === "nov13") return undefined;
  if (current === "nov12") return "both";
  if (current === "both") return "nov12";
  return "nov13";
}

/**
 * Two day cards behave like multi-select; "Will not Attend" clears day selections and vice versa.
 */
export function LunchSessionCardGroup({
  name,
  value,
  onChange,
  labelNov12,
  labelNov13,
  labelNone,
}: Props) {
  const nov12On = value === "nov12" || value === "both";
  const nov13On = value === "nov13" || value === "both";
  const noneOn = value === "none";

  const cardClass = (selected: boolean) =>
    [
      "relative flex min-h-[52px] w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors lg:min-w-[140px] lg:flex-1",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-solid",
      selected
        ? "border border-border-subtle bg-surface"
        : "border border-border-subtle bg-surface hover:border-border",
    ].join(" ");

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex flex-col gap-3 lg:flex-row lg:flex-wrap"
        role="group"
        aria-label={name}
      >
        <button
          type="button"
          className={cardClass(nov12On)}
          aria-pressed={nov12On}
          onClick={() => onChange(toggleNov12(value))}
        >
          <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
            {nov12On ? (
              <FigmaIcon name="radio-on" size={24} className="size-6" />
            ) : (
              <FigmaIcon name="radio-outline" size={24} className="size-6" />
            )}
          </span>
          <span className="text-text min-w-0 flex-1 text-base font-normal">
            {labelNov12}
          </span>
        </button>
        <button
          type="button"
          className={cardClass(nov13On)}
          aria-pressed={nov13On}
          onClick={() => onChange(toggleNov13(value))}
        >
          <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
            {nov13On ? (
              <FigmaIcon name="radio-on" size={24} className="size-6" />
            ) : (
              <FigmaIcon name="radio-outline" size={24} className="size-6" />
            )}
          </span>
          <span className="text-text min-w-0 flex-1 text-base font-normal">
            {labelNov13}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={noneOn}
          className={cardClass(noneOn)}
          onClick={() => onChange("none")}
        >
          <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
            {noneOn ? (
              <FigmaIcon name="radio-on" size={24} className="size-6" />
            ) : (
              <FigmaIcon name="radio-outline" size={24} className="size-6" />
            )}
          </span>
          <span className="text-text min-w-0 flex-1 text-base font-normal">
            {labelNone}
          </span>
        </button>
      </div>
    </div>
  );
}
