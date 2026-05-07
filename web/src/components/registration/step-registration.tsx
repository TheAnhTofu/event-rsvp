"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import {
  formatHkdWholeAmount,
  formatRegistrationFeeLeadLine,
  getFeesHkd,
  lunchSessionRequiresDietary,
  type guestTypeValues,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RadioCardGroup } from "@/components/registration/radio-card-group";
import { LunchSessionCardGroup } from "@/components/registration/lunch-session-card-group";
import { RadioToggleCard } from "@/components/registration/radio-toggle-card";
import {
  inputClassName,
  selectClassName,
} from "@/components/registration/input-classes";
import { FigmaIcon } from "@/components/icons/figma-icon";
import {
  MembersDietaryRadio,
  MembersRegistrationPanel,
} from "@/components/registration/members-registration-panel";
import { VirtualMembersRegistrationPanel } from "@/components/registration/virtual-members-registration-panel";
import type { AppLocale } from "@/i18n/routing";
import { buildCountryOptions } from "@/lib/countries-data";
import { buildPhoneDialOptions } from "@/lib/phone-dial-options";
import {
  industryConferenceUiDays,
  refundPolicyContent,
} from "@/lib/registration-event-content";

const TITLES = ["Mr", "Ms", "Dr", "Prof", "Mx"];
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
  const dialOptions = useMemo(
    () => buildPhoneDialOptions(locale),
    [locale],
  );

  const attendance = watch("attendance");
  const audienceType = watch("audienceType");
  const lunchSession = watch("lunchSession");
  const dietaryYesNo = watch("dietaryYesNo");
  const dietary = watch("dietary");
  const showDietaryFields = lunchSessionRequiresDietary(lunchSession);
  const showDietaryPreferenceChoices = dietaryYesNo === "yes";
  const sameContact = watch("sameContact");

  const phoneErr =
    errors.phoneCountry?.message ?? errors.phoneNumber?.message;
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

  return (
    <div className="flex flex-col gap-6 md:gap-10">
      <section className="border-b border-heading pb-5 md:pb-6">
        <h2 className="mb-3 text-[20px] font-semibold leading-none text-heading md:mb-4 md:text-[22px]">
          {t("eventOverviewTitle")}
        </h2>
        <ul className="flex flex-col gap-3 text-[15px] leading-[26px] text-heading md:gap-4 md:text-[18px] md:leading-[30px]">
          <li className="flex gap-3">
            <FigmaIcon
              name="calendar-24"
              size={24}
              className="mt-1 size-6 text-heading"
              aria-hidden
            />
            <span>{t("eventDates")}</span>
          </li>
          <li className="flex gap-3">
            <FigmaIcon
              name="location-24"
              size={24}
              className="mt-1 size-6 text-heading"
              aria-hidden
            />
            <span>{t("venue")}</span>
          </li>
          <li className="flex gap-3">
            <FigmaIcon
              name="global-24"
              size={24}
              className="mt-1 size-6 text-heading"
              aria-hidden
            />
            <span>{t("languages")}</span>
          </li>
        </ul>
      </section>

      <section className="border-b border-heading pb-5 md:pb-6">
        <h2 className="text-heading mb-3 text-[20px] font-semibold leading-none md:mb-4 md:text-[22px]">
          {t("attendanceSectionTitle")}
        </h2>
        <div className="mb-3 w-fit max-w-full border-b border-heading pb-2 md:mb-4">
          <p className="text-heading text-[16px] font-normal leading-[26px] md:text-[18px] md:leading-[30px]">
            {t("conferenceTitle")}
          </p>
        </div>
        <ul className="mb-5 flex flex-col gap-1 text-[15px] leading-[26px] text-heading md:mb-6 md:text-[18px] md:leading-[30px]">
          <li className="flex gap-3">
            <FigmaIcon
              name="calendar-24"
              size={24}
              className="mt-1 size-6 shrink-0"
              aria-hidden
            />
            <span>{t("conferenceDatesRow")}</span>
          </li>
          <li className="flex gap-3">
            <FigmaIcon
              name="location-24"
              size={24}
              className="mt-1 size-6 shrink-0"
              aria-hidden
            />
            <span>{t("conferenceVenueRow")}</span>
          </li>
        </ul>
        <Field
          label={t("attendanceQuestion")}
          required
          error={errors.attendance?.message}
        >
          <RadioCardGroup
            name="attendance"
            value={attendance}
            onChange={(v) => setValue("attendance", v, { shouldValidate: true })}
            options={[
              {
                value: "in_person",
                label: t("attendInPerson"),
              },
              {
                value: "online",
                label: t("attendOnline"),
              },
              { value: "not_attending", label: t("notAttendingFull") },
            ]}
          />
        </Field>
      </section>

      {attendance === "in_person" ? (
        <section className="border-b border-heading pb-5 md:pb-6">
          <h2 className="text-heading mb-3 text-[20px] font-semibold leading-none md:mb-4 md:text-[22px]">
            {t("lunch")}
          </h2>
          <p className="text-heading mb-5 flex items-start gap-2 text-[16px] leading-[26px] md:mb-6 md:text-[18px] md:leading-[30px]">
            <FigmaIcon
              name="location-24"
              size={24}
              className="mt-1 size-6 shrink-0"
              aria-hidden
            />
            {t("grandBallroom")}
          </p>
          <Field
            label={t("lunchSelect")}
            required
            error={errors.lunchSession?.message}
          >
            <LunchSessionCardGroup
              name="lunchSession"
              value={watch("lunchSession")}
              onChange={(v) => {
                setValue("lunchSession", v, { shouldValidate: true });
                if (!lunchSessionRequiresDietary(v)) {
                  setValue("dietaryYesNo", undefined, { shouldValidate: true });
                  setValue("dietary", undefined, { shouldValidate: true });
                  setValue("dietaryOtherDetails", "", { shouldValidate: true });
                }
              }}
              labelNov12={t("lunchNov12")}
              labelNov13={t("lunchNov13")}
              labelNone={t("lunchNone")}
            />
          </Field>
          {showDietaryFields ? (
            <div className="mt-6 flex flex-col gap-6 md:mt-8 md:gap-8">
              <Field
                label={t("dietaryQuestion")}
                required
                error={errors.dietaryYesNo?.message}
              >
                <RadioCardGroup
                  name="dietaryYesNo"
                  value={watch("dietaryYesNo")}
                  onChange={(v) => {
                    setValue("dietaryYesNo", v, { shouldValidate: true });
                    if (v === "no") {
                      setValue("dietary", undefined, { shouldValidate: true });
                      setValue("dietaryOtherDetails", "", {
                        shouldValidate: true,
                      });
                    }
                  }}
                  layout="row"
                  options={[
                    { value: "yes", label: t("yes") },
                    { value: "no", label: t("no") },
                  ]}
                />
              </Field>
              {showDietaryPreferenceChoices ? (
                <div className="flex flex-col gap-4 md:gap-5">
                  <Field
                    label={t("dietarySelectPreference")}
                    required
                    error={errors.dietary?.message}
                  >
                    <RadioCardGroup
                      name="dietary"
                      value={watch("dietary")}
                      onChange={(v) => {
                        setValue("dietary", v, { shouldValidate: true });
                        if (v !== "other") {
                          setValue("dietaryOtherDetails", "", {
                            shouldValidate: true,
                          });
                        }
                      }}
                      layout="row"
                      options={[
                        {
                          value: "vegetarian",
                          label: t("dietaryVegetarian"),
                        },
                        {
                          value: "halal",
                          label: t("dietaryHalal"),
                        },
                        { value: "other", label: t("dietaryOther") },
                      ]}
                    />
                  </Field>
                  {dietary === "other" ? (
                    <Field
                      label={t("dietaryOther")}
                      required
                      error={errors.dietaryOtherDetails?.message}
                    >
                      <textarea
                        {...register("dietaryOtherDetails")}
                        rows={4}
                        className={`${inputClassName} min-h-[100px] resize-y`}
                        placeholder={t("dietaryOtherPlaceholder")}
                        autoComplete="off"
                      />
                    </Field>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="border-b border-heading pb-5 md:pb-6">
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="md:col-span-2">
            <Field label={t("title")} required error={errors.title?.message}>
              <select {...register("title")} className={selectClassName}>
                <option value="">{t("select")}</option>
                {TITLES.map((titleOption) => (
                  <option key={titleOption} value={titleOption}>
                    {titleOption}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field
            label={t("firstName")}
            required
            error={errors.firstName?.message}
          >
            <input
              {...register("firstName")}
              className={inputClassName}
              autoComplete="given-name"
            />
          </Field>
          <Field
            label={t("lastName")}
            required
            error={errors.lastName?.message}
          >
            <input
              {...register("lastName")}
              className={inputClassName}
              autoComplete="family-name"
            />
          </Field>
          <Field
            label={t("company")}
            required
            error={errors.company?.message}
          >
            <input {...register("company")} className={inputClassName} />
          </Field>
          <Field
            label={t("jobTitle")}
            required
            error={errors.jobTitle?.message}
          >
            <input {...register("jobTitle")} className={inputClassName} />
          </Field>
          <div className="md:col-span-2">
            <Field
              label={t("email")}
              required
              error={errors.email?.message}
            >
              <input
                {...register("email")}
                type="email"
                className={inputClassName}
                autoComplete="email"
                placeholder={t("email")}
              />
            </Field>
          </div>
          <Field
            label={t("telephone")}
            required
            error={phoneErr}
          >
            <div className="flex flex-col gap-2 md:flex-row md:gap-2">
              <Controller
                name="phoneCountry"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={field.onChange}
                    options={dialOptions}
                    placeholder={t("select")}
                    searchPlaceholder={t("searchDialCode")}
                    emptyText={t("noSearchResults")}
                    aria-label={t("countryCode")}
                    className="w-full md:w-[min(100%,260px)] md:shrink-0"
                  />
                )}
              />
              <input
                {...register("phoneNumber")}
                className={`${inputClassName} min-w-0 flex-1`}
                autoComplete="tel"
              />
            </div>
          </Field>
          <Field
            label={t("countryRegion")}
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
                  placeholder={t("select")}
                  searchPlaceholder={t("searchCountry")}
                  emptyText={t("noSearchResults")}
                  aria-label={t("countryRegion")}
                />
              )}
            />
          </Field>
        </div>
      </section>

      <section className="border-b border-heading pb-5 md:pb-6">
        <h2 className="text-heading mb-5 text-[20px] font-semibold leading-none md:mb-6 md:text-[22px]">
          {t("contactPerson")}
        </h2>
        <label className="flex cursor-pointer items-center gap-3 text-base text-text">
          <input
            type="checkbox"
            className="size-4 rounded border-border text-accent focus:ring-accent"
            checked={watch("sameContact")}
            onChange={(e) =>
              setValue("sameContact", e.target.checked, {
                shouldValidate: true,
              })
            }
          />
          {t("sameAsDelegate")}
        </label>
        {!sameContact ? (
          <div className="mt-5 grid gap-5 md:mt-6 md:grid-cols-2 md:gap-6">
            <div className="md:col-span-2">
              <Field
                label={t("title")}
                required
                error={errors.contactTitle?.message}
              >
                <select
                  {...register("contactTitle")}
                  className={selectClassName}
                >
                  <option value="">{t("select")}</option>
                  {TITLES.map((titleOption) => (
                    <option key={titleOption} value={titleOption}>
                      {titleOption}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field
              label={t("firstName")}
              required
              error={errors.contactFirstName?.message}
            >
              <input
                {...register("contactFirstName")}
                className={inputClassName}
              />
            </Field>
            <Field
              label={t("lastName")}
              required
              error={errors.contactLastName?.message}
            >
              <input
                {...register("contactLastName")}
                className={inputClassName}
              />
            </Field>
          </div>
        ) : null}
      </section>

      <section className="border-b border-heading pb-5 md:pb-6">
        <h2 className="text-heading mb-5 text-[20px] font-semibold leading-none md:mb-6 md:text-[22px]">
          {t("cpdTitle")}
        </h2>
        <div className="mb-5 flex flex-col gap-2 text-[14px] leading-[22px] text-[#001d53] md:mb-6 md:text-[15px] [&>p]:m-0">
          <p>{t("cpdIntro")}</p>
          <p>
            {t("cpdEarnPrefix")}{" "}
            <span className="font-medium text-[#001d53]">
              {t("cpdHoursBold")}
            </span>
            {t("cpdEarnMid")}{" "}
            <span className="font-medium text-[#001d53]">
              {t("cpdWarningBold")}
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-heading text-[16px] font-normal leading-[30px]">
            <span>{t("cpdQuestionMain")}</span>
            <span className="text-error">*</span>{" "}
            <span className="text-[11px] leading-[30px] text-heading">
              {t("cpdQuestionNote")}
            </span>
          </div>
          <RadioCardGroup
            name="cpdApply"
            value={watch("cpdApply")}
            onChange={(v) => setValue("cpdApply", v)}
            layout="row"
            options={[
              { value: "yes", label: t("yes") },
              { value: "no", label: t("no") },
            ]}
          />
          <p className="text-[13px] leading-[22px] text-[#566072]">
            {t("cpdNote1")}
          </p>
        </div>
      </section>

      <section className="border-b border-heading pb-5 md:pb-6">
        <h2 className="text-heading mb-5 text-[20px] font-semibold leading-none md:mb-6 md:text-[22px]">
          {t("ackTitle")}
        </h2>
        <ol className="mb-5 list-decimal space-y-3 pl-5 text-[14px] leading-[22px] text-[#001d53] marker:text-[#001d53] md:mb-6 md:space-y-4 md:pl-6 md:text-[15px]">
          <li className="ps-1">{t("ack1")}</li>
          <li className="ps-1">{t("ack2")}</li>
        </ol>
        <RadioToggleCard
          selected={watch("consent")}
          onChange={(v) => setValue("consent", v, { shouldValidate: true })}
        >
          <span>
            {t("consentLabel")}
            <span className="text-error">*</span>
          </span>
        </RadioToggleCard>
        {errors.consent ? (
          <p className="mt-2 text-sm text-error">{errors.consent.message}</p>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 text-[15px] leading-[22px] text-[#001d53]">
        <p className="font-display text-[15px] font-medium text-heading">
          {t("mandatoryTitle")}
          <span className="text-error">*</span>
        </p>
        <p className="font-normal">
          {t.rich("privacyPara1Rich", {
            policy: (chunks) => (
              <a
                className="text-[#195fe3] underline decoration-solid [text-decoration-skip-ink:none]"
                href="https://www.ia.org.hk/en/privacy/privacy_statement.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <p className="font-normal">
          {t.rich("privacyPara2Rich", {
            email: (chunks) => (
              <a
                className="text-[#195fe3] underline decoration-solid [text-decoration-skip-ink:none]"
                href="mailto:iais@ia.org.hk"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
