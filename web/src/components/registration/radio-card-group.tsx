"use client";

import type { ReactNode } from "react";
import { FigmaIcon } from "@/components/icons/figma-icon";

type Option<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  /** Optional leading icon after the radio (e.g. Figma dietary icons). */
  icon?: ReactNode;
};

type RadioCardGroupProps<T extends string> = {
  name: string;
  value: T | undefined;
  onChange: (v: T) => void;
  options: Option<T>[];
  error?: string;
  layout?: "row" | "stack";
  /** Figma node `2:824` delegate radios — white rows, no outline cards. */
  appearance?: "card" | "minimal";
  /** Extra classes on the radiogroup wrapper (e.g. dietary two-column grid). */
  listClassName?: string;
};

export function RadioCardGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  error,
  layout = "row",
  appearance = "card",
  listClassName,
}: RadioCardGroupProps<T>) {
  const minimal = appearance === "minimal";
  return (
    <div className="flex flex-col gap-2">
      <div
        className={
          [
            minimal
              ? "flex flex-col gap-4"
              : layout === "row"
                ? "flex flex-col gap-3 lg:flex-row lg:flex-wrap"
                : "flex flex-col gap-3",
            listClassName,
          ]
            .filter(Boolean)
            .join(" ")
        }
        role="radiogroup"
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? `${name}-error` : undefined}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={[
                minimal
                  ? [
                      "relative flex min-h-0 w-full items-center gap-2 rounded-lg py-0 text-left text-[15px] leading-6 text-[#333] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-solid",
                    ].join(" ")
                  : [
                      "relative flex min-h-[52px] w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors lg:min-w-[140px] lg:flex-1",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-solid",
                      selected
                        ? "border border-border-subtle bg-surface"
                        : "border border-border-subtle bg-surface hover:border-border",
                    ].join(" "),
              ].join(" ")}
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center"
                aria-hidden
              >
                {selected ? (
                  <FigmaIcon name="radio-on" size={24} className="size-6" />
                ) : (
                  <FigmaIcon name="radio-outline" size={24} className="size-6" />
                )}
              </span>
              {opt.icon ? (
                <span className="flex shrink-0 items-center">{opt.icon}</span>
              ) : null}
              <span className="min-w-0 flex-1">
                <span
                  className={
                    minimal
                      ? "block font-normal text-[#333]"
                      : "text-text block text-base font-normal"
                  }
                >
                  {opt.label}
                </span>
                {opt.hint ? (
                  <span className="text-text-muted mt-0.5 block text-sm">
                    {opt.hint}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={`${name}-error`} className="text-error text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
