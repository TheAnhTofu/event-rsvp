"use client";

import type { ReactNode } from "react";
import { FigmaIcon } from "@/components/icons/figma-icon";

type RadioToggleCardProps = {
  selected: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  /**
   * `card` — bordered row (industry / generic toggles).
   * `minimal` — Figma members acknowledgement rows (no bordered card shell).
   */
  variant?: "card" | "minimal";
};

/** Figma-style row with circular radio (not square checkbox). */
export function RadioToggleCard({
  selected,
  onChange,
  children,
  variant = "card",
}: RadioToggleCardProps) {
  const minimal = variant === "minimal";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onChange(!selected)}
      className={[
        "flex w-full cursor-pointer items-start gap-3 text-left transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-solid",
        minimal
          ? [
              "rounded-none border-0 bg-transparent px-0 py-2 text-[15px] leading-6 text-[#333]",
              "hover:bg-transparent",
            ].join(" ")
          : [
              "rounded-lg border px-4 py-4 text-[16px] text-text",
              selected
                ? "border border-border-subtle bg-surface"
                : "border border-border-subtle bg-surface hover:border-border",
            ].join(" "),
      ].join(" ")}
    >
      <span
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center"
        aria-hidden
      >
        {selected ? (
          <FigmaIcon name="radio-on" size={24} className="size-6" />
        ) : (
          <FigmaIcon name="radio-outline" size={24} className="size-6" />
        )}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}
