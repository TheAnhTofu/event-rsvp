"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Link } from "@/i18n/navigation";
import type { RegistrationFormValues } from "@/lib/registration-schema";

/**
 * Figma `2:824` — gradient registration title bar + white form body (single card).
 */
export function RegistrationStep0Card({ children }: { children: ReactNode }) {
  const t = useTranslations("Registration");
  const tShell = useTranslations("Shell");
  const { watch } = useFormContext<RegistrationFormValues>();
  const audienceType = watch("audienceType");

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-dashed border-[#9dc4f0] shadow-[0_4px_2px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col items-center gap-5 bg-linear-to-r from-[#0d33c2] to-[#3ac8f6] px-5 py-8 text-center text-white sm:px-10 lg:px-[80px] lg:py-10">
        <h1 className="max-w-full font-display text-[22px] font-bold leading-tight md:text-[28px] md:leading-[40px] lg:text-[32px] lg:leading-[40px]">
          {t("registrationTitle", {
            audience: t(`audience.${audienceType}`),
          })}
        </h1>
        <Link
          href="/"
          className="text-[18px] font-normal leading-normal underline decoration-solid [text-decoration-skip-ink:none] underline-offset-2 md:text-[20px] md:leading-6"
        >
          {tShell("changeAttendanceType")}
        </Link>
      </div>
      <div className="flex flex-col gap-9 bg-white p-10 md:gap-9">
        {children}
      </div>
    </div>
  );
}
