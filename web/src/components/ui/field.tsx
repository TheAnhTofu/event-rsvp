import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label className="text-heading text-[16px] font-normal leading-6 md:text-[18px] md:leading-[30px]">
        {label}
        {required ? <span className="text-error ml-0.5">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="m-0 p-0 text-sm leading-snug text-text-muted">{hint}</p>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
