"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import {
  formatRegistrationFeeLeadLine,
  getFeesHkd,
  type guestTypeValues,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RadioCardGroup } from "@/components/registration/radio-card-group";
import { RadioToggleCard } from "@/components/registration/radio-toggle-card";
import { inputClassName } from "@/components/registration/input-classes";
import { FigmaIcon } from "@/components/icons/figma-icon";
import {
  MembersDietaryRadio,
  MembersRegistrationPanel,
} from "@/components/registration/members-registration-panel";
import { VirtualMembersRegistrationPanel } from "@/components/registration/virtual-members-registration-panel";
import type { AppLocale } from "@/i18n/routing";
import { buildCountryOptions } from "@/lib/countries-data";
import {
  industryConferenceUiDays,
  refundPolicyContent,
} from "@/lib/registration-event-content";

const FELLOW_GUEST_TYPES = [
  { value: "distinguished_fellow", label: "IAIS Distinguished Fellow" },
  { value: "press", label: "Press" },
  { value: "consumer_group", label: "Consumer Group" },
  { value: "external_speaker", label: "External Speaker" },
] as const;

/** Section wrapper — same rhythm as `MembersPanel`: gap only, no horizontal dividers. */
function IndustryPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  );
}

function IndustryCheckboxCard({
  children,
  selected,
  onClick,
  disabled = false,
  tag,
  tagTone = "subtle",
  variant = "card",
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  tag?: string;
  tagTone?: "subtle" | "blue";
  /** Figma `1291:9461` — plain rows, radio + label (no bordered tiles). */
  variant?: "card" | "minimal";
}) {
  const minimal = variant === "minimal";
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={[
        minimal
          ? "flex min-h-0 w-full items-center gap-2 rounded-lg bg-transparent py-2 text-left text-[15px] leading-6 text-[#333] transition-colors"
          : "flex min-h-[52px] w-full flex-wrap items-center gap-2 rounded-lg px-4 py-3 text-left text-[16px] leading-6 text-[#404d61] transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-solid",
        minimal
          ? disabled
            ? "cursor-not-allowed opacity-50"
            : ""
          : disabled
            ? "cursor-not-allowed border border-border-subtle bg-white/70 opacity-50"
            : selected
              ? "border border-border-subtle bg-surface"
              : "border border-border-subtle bg-surface hover:border-border",
      ].join(" ")}
    >
      <FigmaIcon
        name={selected ? "radio-on" : "radio-outline"}
        size={24}
        className="size-6 shrink-0"
      />
      <span className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="min-w-0">{children}</span>
        {tag ? (
          <span
            className={[
              "shrink-0 rounded px-1.5 py-1.5 text-[13px] font-bold leading-none md:text-[16px]",
              tagTone === "blue"
                ? "bg-[#0ccaef] text-white"
                : "border border-[#c5d7ea] bg-[#e8eefc] text-[#001742]",
            ].join(" ")}
          >
            {tag}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function toggleArrayValue<T extends string>(values: T[] | undefined, value: T): T[] {
  const current = values ?? [];
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function StepRegistration() {
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
  const attendance = watch("attendance");
  const audienceType = watch("audienceType");
  const dietaryYesNo = watch("dietaryYesNo");
  const dietary = watch("dietary");
  const isFellow = audienceType === "fellow";
  const isSimpleAudience = audienceType === "industry" || isFellow;

  if (audienceType === "members") {
    return <MembersRegistrationPanel />;
  }

  if (audienceType === "virtual") {
    return <VirtualMembersRegistrationPanel />;
  }

  if (isSimpleAudience) {
    const participationFeeHkd = getFeesHkd(attendance, { audienceType });
    const registrationFeeLead =
      formatRegistrationFeeLeadLine(participationFeeHkd);
    const industryDietaryValue =
      dietaryYesNo === "no" ? "none" : (dietary ?? undefined);
    const annualConferenceDays = watch("annualConferenceDays") ?? [];
    const industryLunchDays = watch("industryLunchDays") ?? [];
    const socialEvents = watch("socialEvents") ?? [];
    const guestType = watch("guestType");
    const cancelEmail = refundPolicyContent.cancellationEmail;

    const pickIndustryDietary = (
      v: "none" | "gluten_free" | "vegetarian" | "vegan" | "other",
    ) => {
      if (v === "none") {
        setValue("dietaryYesNo", "no", { shouldValidate: true });
        setValue("dietary", undefined, { shouldValidate: true });
        setValue("dietaryOtherDetails", "", { shouldValidate: true });
        return;
      }
      setValue("dietaryYesNo", "yes", { shouldValidate: true });
      setValue("dietary", v, { shouldValidate: true });
      if (v !== "other") {
        setValue("dietaryOtherDetails", "", { shouldValidate: true });
      }
    };

    return (
      <div className="flex flex-col gap-9">
        <p className="text-[16px] leading-6 text-[#333]">
          {registrationFeeLead}
        </p>

        <IndustryPanel>
          <div className="grid gap-5 md:gap-6">
            {isFellow ? (
              <Field label="Guest Type:" required error={errors.guestType?.message}>
                <RadioCardGroup
                  name="guestType"
                  value={guestType}
                  layout="stack"
                  appearance="minimal"
                  onChange={(v: (typeof guestTypeValues)[number]) =>
                    setValue("guestType", v, { shouldValidate: true })
                  }
                  options={FELLOW_GUEST_TYPES.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />
              </Field>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 md:gap-4">
              <Field label="Full Name" required error={errors.firstName?.message}>
                <input
                  {...register("firstName")}
                  className={inputClassName}
                  placeholder="Please provide all your name/s and surname/s"
                  autoComplete="name"
                />
              </Field>
              <Field
                label={t("email")}
                required
                error={errors.email?.message}
              >
                <input
                  {...register("email")}
                  type="email"
                  className={inputClassName}
                  placeholder={t("email")}
                  autoComplete="email"
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-4">
              <Field
                label="Country"
                required
                error={errors.country?.message}
              >
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={countryOptions}
                      placeholder={t("selectCountryPlaceholder")}
                      searchPlaceholder={t("searchCountry")}
                      emptyText={t("noSearchResults")}
                      aria-label="Country"
                    />
                  )}
                />
              </Field>
              <Field
                label={isFellow ? "Organization" : "Organisation"}
                required
                error={errors.company?.message}
              >
                <input
                  {...register("company")}
                  className={inputClassName}
                  placeholder={isFellow ? "Organization" : "Organisation"}
                  autoComplete="organization"
                />
              </Field>
            </div>
          </div>
        </IndustryPanel>

        <IndustryPanel>
          <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
            Annual Conference
          </h2>
          <p className="text-[15px] leading-[30px] text-[#333]">
            Please select all days that you will attend the Annual Conference:
          </p>
          <div className="flex flex-col gap-3">
            {industryConferenceUiDays.map((day) => (
              <IndustryCheckboxCard
                key={day.value}
                variant="minimal"
                selected={annualConferenceDays.includes(day.value)}
                onClick={() => {
                  const nextAnnualDays = toggleArrayValue(
                    annualConferenceDays,
                    day.value,
                  );
                  setValue(
                    "annualConferenceDays",
                    nextAnnualDays,
                    { shouldValidate: true },
                  );
                  setValue(
                    "industryLunchDays",
                    industryLunchDays.filter((lunchDay) =>
                      nextAnnualDays.includes(lunchDay),
                    ),
                    { shouldValidate: true },
                  );
                }}
              >
                {day.annualConferenceLabel}
              </IndustryCheckboxCard>
            ))}
          </div>
        </IndustryPanel>

        <IndustryPanel className="rounded-2xl bg-[#e9f0f8] p-5">
          <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
            {t("lunchSelectionHeading")}
          </h2>
          <p className="text-[15px] leading-6 text-[#4b4b4b]">
            Please only select the lunches that you will actually attend as late
            cancellations or no-shows on the day may result in food waste and
            unnecessary charges for the host. Please update your registration or
            contact{" "}
            <a
              className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
              href={`mailto:${cancelEmail}`}
            >
              the organising team
            </a>{" "}
            if any changes to the registration are required.
          </p>
          <div className="flex flex-col gap-3">
            {industryConferenceUiDays.map((day) => (
              <IndustryCheckboxCard
                key={day.value}
                variant="minimal"
                selected={industryLunchDays.includes(day.value)}
                disabled={!annualConferenceDays.includes(day.value)}
                onClick={() =>
                  setValue(
                    "industryLunchDays",
                    toggleArrayValue(industryLunchDays, day.value),
                    { shouldValidate: true },
                  )
                }
              >
                {day.lunchLabel}
              </IndustryCheckboxCard>
            ))}
          </div>
        </IndustryPanel>

        <IndustryPanel>
          <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
            Social events
          </h2>
          <p className="text-[15px] leading-6 text-[#4b4b4b]">
            {t("socialEventsIntroFigma")}
          </p>
          <p className="text-[15px] leading-6 text-[#4b4b4b]">
            {t.rich("socialEventsReceptionExtraRich", {
              iais: (chunks) => (
                <a
                  className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
                  href="https://www.iais.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <IndustryCheckboxCard
            variant="minimal"
            selected={socialEvents.includes("conference_reception")}
            onClick={() =>
              setValue(
                "socialEvents",
                toggleArrayValue(socialEvents, "conference_reception"),
                { shouldValidate: true },
              )
            }
            tag={t("socialTagAnnualConferenceParticipants")}
            tagTone="blue"
          >
            {t("socialEventConferenceReception")}
          </IndustryCheckboxCard>
        </IndustryPanel>

        <IndustryPanel className="rounded-2xl bg-[#e9f0f8] p-5 md:p-6">
          <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
            Dietary requirements
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2 md:items-start">
            <div className="flex flex-col gap-3">
              <MembersDietaryRadio
                selected={industryDietaryValue === "none"}
                label="I have no special dietary requirements"
                onSelect={() => pickIndustryDietary("none")}
              />
              <MembersDietaryRadio
                selected={industryDietaryValue === "gluten_free"}
                label={t("dietaryGlutenFree")}
                onSelect={() => pickIndustryDietary("gluten_free")}
              />
              <MembersDietaryRadio
                selected={industryDietaryValue === "vegetarian"}
                label={t("dietaryVegetarian")}
                onSelect={() => pickIndustryDietary("vegetarian")}
              />
            </div>
            <div className="flex flex-col gap-3">
              <MembersDietaryRadio
                selected={industryDietaryValue === "vegan"}
                label={t("dietaryVegan")}
                onSelect={() => pickIndustryDietary("vegan")}
              />
              <MembersDietaryRadio
                selected={industryDietaryValue === "other"}
                label={t("dietaryOther")}
                onSelect={() => pickIndustryDietary("other")}
              />
              {industryDietaryValue === "other" ? (
                <div className="mt-1 flex w-full flex-col gap-1.5">
                  <label
                    htmlFor="industry-dietary-other-details"
                    className="text-[14px] font-normal leading-5 text-[#333]"
                  >
                    If other please specify:
                  </label>
                  <input
                    id="industry-dietary-other-details"
                    {...register("dietaryOtherDetails")}
                    className={inputClassName}
                    placeholder="e.g. allergies, religious requirements, etc."
                    autoComplete="off"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </IndustryPanel>

        <IndustryPanel>
          <div>
            <RadioToggleCard
              variant="minimal"
              selected={!!watch("invitationLetterRequested")}
              onChange={(next) =>
                setValue("invitationLetterRequested", next, {
                  shouldValidate: true,
                })
              }
            >
              {t("visaLetterLabel")}
            </RadioToggleCard>
            <p className="mt-2 ps-9 text-[15px] leading-6 text-[#4b4b4b]">
              {t.rich("visaLetterHelpRich", {
                link: (chunks) => (
                  <a
                    className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
                    href="https://www.ia.org.hk/en/aboutus/useful_links.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
        </IndustryPanel>

        <IndustryPanel>
          <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
            {t("travelInformationTitle")}
          </h2>
          <p className="mt-3 text-[15px] font-normal leading-normal text-[#333] md:leading-6">
            {t("travelInformationIntro")}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-10">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="industry-city-of-departure"
                className="text-[15px] font-semibold leading-6 text-[#333]"
              >
                {t("travelCityLabel")}
              </label>
              <input
                id="industry-city-of-departure"
                {...register("cityOfDeparture")}
                className={inputClassName}
                placeholder="Enter your departure city"
                autoComplete="address-level2"
              />
              <p className="text-[13px] leading-5 text-[#878b8e]">
                {t("travelCityExampleHint")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="industry-means-of-transport"
                className="text-[15px] font-semibold leading-6 text-[#333]"
              >
                {t("travelMeansLabel")}
              </label>
              <input
                id="industry-means-of-transport"
                {...register("meansOfTransportation")}
                className={inputClassName}
                placeholder="Enter means of transportation"
              />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4">
            <p
              id="industry-travel-carbon-question"
              className="text-[15px] font-normal leading-6 text-[#333]"
            >
              {t("travelCarbonQuestion")}
            </p>
            <div
              role="radiogroup"
              aria-labelledby="industry-travel-carbon-question"
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <MembersDietaryRadio
                variant="inline"
                selected={watch("carbonOffset") === "yes"}
                label={t("yes")}
                onSelect={() =>
                  setValue("carbonOffset", "yes", { shouldValidate: true })
                }
              />
              <MembersDietaryRadio
                variant="inline"
                selected={watch("carbonOffset") === "no"}
                label={t("no")}
                onSelect={() =>
                  setValue("carbonOffset", "no", { shouldValidate: true })
                }
              />
              <MembersDietaryRadio
                variant="inline"
                selected={watch("carbonOffset") === "not_available"}
                label={t("carbonOffsetNotAvailable")}
                onSelect={() =>
                  setValue("carbonOffset", "not_available", {
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </div>
        </IndustryPanel>

        <IndustryPanel>
          {!isFellow ? (
            <>
              <RadioToggleCard
                variant="minimal"
                selected={!!watch("refundPolicyAck")}
                onChange={(v) =>
                  setValue("refundPolicyAck", v, { shouldValidate: true })
                }
              >
                <span>
                  I acknowledge the registration fee cancellation and refund policy
                  <span className="text-error">*</span>
                </span>
              </RadioToggleCard>
              {errors.refundPolicyAck ? (
                <p className="mt-2 text-sm text-error">
                  {errors.refundPolicyAck.message}
                </p>
              ) : null}
              <p className="mt-2 text-[15px] leading-6 text-[#4b4b4b]">
                * Cancellations made later than {refundPolicyContent.deadlineDate}{" "}
                at {refundPolicyContent.deadlineTimeHkt} will not be eligible for a
                refund of the registration fee. Kindly send an email to{" "}
                <a
                  className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
                  href={`mailto:${cancelEmail}`}
                >
                  {cancelEmail}
                </a>{" "}
                to request the cancellation.
              </p>
            </>
          ) : null}
          <div className={isFellow ? "" : "mt-2"}>
            <RadioToggleCard
              variant="minimal"
              selected={!!watch("consent")}
              onChange={(v) =>
                setValue("consent", v, { shouldValidate: true })
              }
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
          </div>
          {errors.consent ? (
            <p className="mt-2 text-sm text-error">{errors.consent.message}</p>
          ) : null}
        </IndustryPanel>

        <section className="mt-6 flex flex-col gap-3 pb-2 text-[13px] leading-normal text-[#333] md:mt-8">
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
        </section>
      </div>
    );
  }

  return null;
}
