import type { ReactNode } from "react";
import { FigmaIcon } from "@/components/icons/figma-icon";

/** Default review/forms asterisk; pass `className` e.g. Figma `#eb5757` on consent rows. */
export function RequiredMark({ className }: { className?: string }) {
  return <span className={className ?? "text-error"}>*</span>;
}

export function LabelAbove({
  label,
  required,
  hint,
  children,
  /** Figma `1296:40503` members review — label Arial Bold 15px `#333`. */
  labelTone = "default",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  labelTone?: "default" | "inkBold";
}) {
  const labelClass =
    labelTone === "inkBold"
      ? "text-[15px] font-bold leading-[30px] text-[#333]"
      : "text-[15px] leading-[30px] text-heading";
  return (
    <div className="flex flex-col gap-1">
      <p className={labelClass}>
        {label}
        {required ? <RequiredMark /> : null}
      </p>
      {hint ? (
        <p className="text-[13px] leading-5 text-[#868686]">{hint}</p>
      ) : null}
      <div className="text-[16px] leading-6 text-ink">{children}</div>
    </div>
  );
}

export function InlineReviewLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="font-medium text-[#2f80ed] underline decoration-solid [text-decoration-skip-ink:none]"
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function DayGroup({
  day,
  children,
}: {
  day: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#f2f2f2] shadow-[0px_4px_5px_rgba(0,0,0,0.15)]">
      <div className="bg-[#fafcff] px-4 py-4">
        <h3 className="text-[15px] font-bold leading-normal text-[#0356af]">
          {day}
        </h3>
      </div>
      <div className="flex flex-col gap-4 border-t border-[#f2f2f2] bg-white px-4 py-4">
        {children}
      </div>
    </div>
  );
}
