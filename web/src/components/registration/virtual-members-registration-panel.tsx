"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { COMMITTEE_MEETING_DAY_GROUPS } from "@/lib/committee-meetings";
import type { CommitteeMeetingId } from "@/lib/committee-meetings";
import { formatRegistrationFeeLeadLine, getFeesHkd, type RegistrationFormValues } from "@/lib/registration-schema";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RadioToggleCard } from "@/components/registration/radio-toggle-card";
import { inputClassName } from "@/components/registration/input-classes";
import { MembersCheckboxCard } from "@/components/registration/members-registration-panel";
import type { AppLocale } from "@/i18n/routing";
import { buildCountryOptions } from "@/lib/countries-data";

function toggleMeeting(
  values: CommitteeMeetingId[] | undefined,
  id: CommitteeMeetingId,
): CommitteeMeetingId[] {
  const current = values ?? [];
  return current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
}

/** Figma `1291:9924` — Virtual for IAIS Members only. */
export function VirtualMembersRegistrationPanel() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Registration");
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<RegistrationFormValues>();

  const countryOptions = useMemo(
    () => buildCountryOptions(locale),
    [locale],
  );

  const committeeMeetings = watch("committeeMeetings") ?? [];
  const participationFeeHkd = getFeesHkd(watch("attendance"), {
    audienceType: "virtual",
  });
  const registrationFeeLead =
    formatRegistrationFeeLeadLine(participationFeeHkd);

  return (
    <div className="flex flex-col gap-9">
      <p className="w-full text-[16px] leading-6 text-[#333]">
        {registrationFeeLead}
      </p>

      <div className="flex flex-col gap-4">
        <Field
          label="Jurisdiction"
          required
          error={errors.jurisdiction?.message}
        >
          <Controller
            name="jurisdiction"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value ?? ""}
                onChange={(code) => {
                  field.onChange(code);
                  setValue("country", code, { shouldValidate: true });
                }}
                options={countryOptions}
                placeholder="Select your jurisdiction..."
                searchPlaceholder={t("searchCountry")}
                emptyText={t("noSearchResults")}
                aria-label="Jurisdiction"
              />
            )}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2 md:gap-4">
          <Field
            label="Full Name"
            required
            error={errors.firstName?.message}
          >
            <input
              {...register("firstName")}
              className={inputClassName}
              placeholder="Please provide all your name/s and surname/s"
              autoComplete="name"
            />
          </Field>
          <Field label={t("email")} required error={errors.email?.message}>
            <input
              {...register("email")}
              type="email"
              className={inputClassName}
              placeholder="Email Address"
              autoComplete="email"
            />
          </Field>
        </div>
      </div>

      <section className="flex flex-col gap-3 rounded-xl bg-[#e9f0f8] p-4 sm:gap-4 sm:rounded-2xl sm:p-5">
        <h2 className="text-xl font-bold leading-tight text-[#0356af] sm:text-[22px] sm:leading-none">
          Committee meetings
        </h2>
        <p className="text-[14px] leading-normal text-[#4b4b4b] sm:text-[15px]">
          All IAIS Committee meetings are open to all IAIS members, unless
          indicated as restricted. Please select all meetings that you will
          attend:
        </p>
        <div className="mt-0 flex flex-col gap-3 sm:mt-1 sm:gap-4">
          {COMMITTEE_MEETING_DAY_GROUPS.map((group) => (
            <div
              key={group.day}
              className="overflow-hidden rounded-xl border border-[#f2f2f2] bg-white shadow-[0px_2px_4px_rgba(0,0,0,0.12)] sm:rounded-2xl sm:shadow-[0px_4px_5px_rgba(0,0,0,0.15)]"
            >
              <div className="bg-[#fafcff] px-3 py-2.5 sm:px-4 sm:py-3">
                <h3 className="text-[14px] font-bold leading-snug text-[#0356af] sm:text-[15px] sm:leading-[30px]">
                  {group.day}
                </h3>
              </div>
              <div className="flex flex-col gap-3 border-t border-[#e1e3e6] p-3 sm:gap-4 sm:border-[#f2f2f2] sm:p-4">
                {group.meetings.map((m) => (
                  <MembersCheckboxCard
                    key={m.id}
                    selected={committeeMeetings.includes(m.id)}
                    onClick={() =>
                      setValue(
                        "committeeMeetings",
                        toggleMeeting(committeeMeetings, m.id),
                        { shouldValidate: true },
                      )
                    }
                    tag={m.tag}
                    tagVariant={m.tag ? "yellow" : "soft"}
                  >
                    {m.label}
                  </MembersCheckboxCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <RadioToggleCard
          variant="minimal"
          selected={!!watch("consent")}
          onChange={(v) => setValue("consent", v, { shouldValidate: true })}
        >
          <span className="leading-6">
            {t.rich("consentPdpoRich", {
              notice: (chunks) => (
                <a
                  className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
                  href="https://www.iais.org/privacy-notice"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
              req: (chunks) => (
                <span className="text-error">{chunks}</span>
              ),
            })}
          </span>
        </RadioToggleCard>
        {errors.consent ? (
          <p className="text-sm text-error">{errors.consent.message}</p>
        ) : null}

        <div className="flex flex-col gap-3 text-[15px] leading-[22px] text-[#333]">
          <p className="font-display text-[15px] font-bold text-heading">
            {t("formFooterPrivacyTitle")}
          </p>
          <p className="font-normal">
            {t.rich("formFooterPrivacyBodyRich", {
              notice: (chunks) => (
                <a
                  className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
                  href="https://www.iais.org/privacy-notice"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </section>
    </div>
  );
}
