import type { ReactNode } from "react";

export const INPUT_CLASS =
  "w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-[15px] text-black outline-none focus:border-admin-navy focus:ring-1 focus:ring-admin-navy/20";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[14px] font-medium leading-6 text-[#001742]">{children}</p>
  );
}

export function FieldValue({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-6 text-black">{children}</p>;
}

export function InfoGridTwo({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function InfoBlock({
  label,
  value,
}: {
  label: ReactNode;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="min-w-0 break-words">
        {typeof value === "string" || typeof value === "number" ? (
          <FieldValue>{value}</FieldValue>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

export function ReadOnlyRadioYesSelected() {
  return (
    <div className="flex w-full max-w-md items-start gap-2 rounded-lg border border-[#686868] bg-[rgba(47,47,47,0.08)] px-3 py-2.5">
      <span
        className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#686868] bg-white"
        aria-hidden
      >
        <span className="size-2.5 rounded-full bg-[#686868]" />
      </span>
      <span className="text-[11px] font-medium leading-[17px] text-black">Yes</span>
    </div>
  );
}

export function ReadOnlyRadioNoSelected() {
  return (
    <div className="flex w-full max-w-md items-start gap-2 rounded-lg border border-[#686868] bg-[rgba(47,47,47,0.08)] px-3 py-2.5">
      <span
        className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#686868] bg-white"
        aria-hidden
      >
        <span className="size-2.5 rounded-full bg-[#686868]" />
      </span>
      <span className="text-[11px] font-medium leading-[17px] text-black">No</span>
    </div>
  );
}

export function ReadOnlyConsentRow({
  checked,
  children,
}: {
  checked: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full items-start gap-2 rounded-lg border border-[#686868] bg-[rgba(47,47,47,0.08)] px-3 py-2.5">
      {checked ? (
        <svg
          className="mt-0.5 size-5 shrink-0 text-emerald-600"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <circle cx={12} cy={12} r={10} fill="currentColor" />
          <path
            d="M8 12l2.5 2.5L16 9"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span
          className="mt-0.5 size-5 shrink-0 rounded-full border-2 border-neutral-400 bg-white"
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1 text-[13px] font-medium leading-5 text-black">
        {children}
      </div>
    </div>
  );
}
