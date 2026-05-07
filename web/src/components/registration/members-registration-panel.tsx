"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import {
  formatRegistrationFeeLeadLine,
  getFeesHkd,
  memberDelegateRoleValues,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { COMMITTEE_MEETING_DAY_GROUPS } from "@/lib/committee-meetings";
import type { CommitteeMeetingId } from "@/lib/committee-meetings";
import {
  industryConferenceUiDays,
  membersAnnualConferenceOptions,
  refundPolicyContent,
} from "@/lib/registration-event-content";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { RadioCardGroup } from "@/components/registration/radio-card-group";
import { RadioToggleCard } from "@/components/registration/radio-toggle-card";
import { inputClassName } from "@/components/registration/input-classes";
import { FigmaIcon } from "@/components/icons/figma-icon";
import type { AppLocale } from "@/i18n/routing";
import { buildCountryOptions } from "@/lib/countries-data";

const MEMBER_DELEGATE_ROLES: {
  value: (typeof memberDelegateRoleValues)[number];
  label: string;
}[] = [
  { value: "iais_member", label: "IAIS Member" },
  { value: "iais_secretariat", label: "IAIS Secretariat" },
  {
    value: "amf",
    label: "Hong Kong Insurance Authority",
  },
];

function MembersPanel({
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

/**
 * Minimal radio row — Figma `1218:6859` / `1291:17848`. No bordered card, no
 * full-width input look; just radio + label + optional inline badge.
 */
export function MembersCheckboxCard({
  children,
  selected,
  onClick,
  disabled = false,
  tag,
  tagVariant = "soft",
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  tag?: string;
  /** Figma — yellow `#febf05` (dark text) vs teal `#0ccaef` (white text). */
  tagVariant?: "soft" | "yellow" | "cyan";
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex w-full items-start gap-2 rounded-md py-1 text-left text-[14px] leading-normal text-[#333] transition-opacity sm:py-0.5 sm:text-[15px] sm:leading-6",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-solid",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <FigmaIcon
        name={selected ? "radio-on" : "radio-outline"}
        size={24}
        className="size-6 shrink-0 translate-y-0.5 sm:translate-y-0"
      />
      <div className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="min-w-0 font-normal">{children}</span>
        {tag ? (
          <span
            className={[
              "max-w-full shrink-0 self-start rounded px-1.5 py-1.5 text-left leading-snug",
              tagVariant === "yellow"
                ? "bg-[#febf05] text-[11px] font-bold text-[#333] sm:text-[13px] md:text-[14px]"
                : tagVariant === "cyan"
                  ? "bg-[#0ccaef] text-[11px] font-bold text-white sm:text-[13px] md:text-[14px]"
                  : "border border-[#c5d7ea] bg-[#e8eefc] text-[12px] font-semibold text-[#001742] sm:text-[13px]",
            ].join(" ")}
          >
            {tag}
          </span>
        ) : null}
      </div>
    </button>
  );
}

/** Figma dietary block — plain radios on pale panel (no per-row white cards). */
export function MembersDietaryRadio({
  selected,
  label,
  onSelect,
  variant = "block",
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
  /** `inline`: horizontal travel/carbon row; `block`: full-width dietary column. */
  variant?: "block" | "inline";
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={[
        "flex items-center gap-2 rounded-md py-0.5 text-left text-[15px] leading-6 text-[#333] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-solid",
        variant === "block" ? "w-full" : "w-auto shrink-0",
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
      <span
        className={
          variant === "block"
            ? "min-w-0 flex-1 font-normal"
            : "min-w-0 font-normal whitespace-nowrap"
        }
      >
        {label}
      </span>
    </button>
  );
}

function toggleMeeting(
  values: CommitteeMeetingId[] | undefined,
  id: CommitteeMeetingId,
): CommitteeMeetingId[] {
  const current = values ?? [];
  return current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];
}

function toggleArrayValue<T extends string>(values: T[] | undefined, value: T): T[] {
  const current = values ?? [];
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

/** IAIS Members / Secretariat / AMF — Figma node 2:824. */
export function MembersRegistrationPanel() {
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
  const audienceType = watch("audienceType");
  const attendance = watch("attendance");
  const committeeMeetings = watch("committeeMeetings") ?? [];
  const annualConferenceDays = watch("annualConferenceDays") ?? [];
  const industryLunchDays = watch("industryLunchDays") ?? [];
  const socialEvents = watch("socialEvents") ?? [];
  const dietaryYesNo = watch("dietaryYesNo");
  const dietary = watch("dietary");
  const industryDietaryValue =
    dietaryYesNo === "no" ? "none" : (dietary ?? undefined);

  const pickMembersDietary = (
    v: "none" | "vegan" | "vegetarian" | "gluten_free" | "other",
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

  const participationFeeHkd = getFeesHkd(attendance, { audienceType });
  const registrationFeeLead =
    formatRegistrationFeeLeadLine(participationFeeHkd);

  const cancelEmail = refundPolicyContent.cancellationEmail;

  return (
    <div className="flex flex-col gap-9">
      <p className="w-full text-[16px] leading-6 text-[#333]">
        {registrationFeeLead}
      </p>

      <div className="flex flex-col gap-4">
          <Field
            label="Please choose one of the following:"
            required
            error={errors.memberDelegateRole?.message}
          >
            <RadioCardGroup
              appearance="minimal"
              name="memberDelegateRole"
              value={watch("memberDelegateRole")}
              onChange={(v: (typeof memberDelegateRoleValues)[number]) =>
                setValue("memberDelegateRole", v, { shouldValidate: true })
              }
              options={MEMBER_DELEGATE_ROLES.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
          </Field>
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
          <Field
            label="Full Name"
            required
            error={errors.firstName?.message ?? errors.lastName?.message}
          >
            <div className="grid gap-4 md:grid-cols-2 md:gap-4">
              <input
                {...register("firstName")}
                className={inputClassName}
                placeholder="Please provide all your name/s and surname/s"
                autoComplete="given-name"
              />
              <input
                {...register("lastName")}
                className={inputClassName}
                placeholder="Surname"
                autoComplete="family-name"
              />
            </div>
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
              placeholder="Email Address"
              autoComplete="email"
            />
          </Field>
        </div>

      <section className="flex flex-col gap-3 rounded-xl bg-[#e9f0f8] p-4 sm:gap-4 sm:rounded-2xl sm:p-5">
        <h2 className="text-xl font-bold leading-tight text-[#0356af] sm:text-[22px] sm:leading-none">
          Committee meetings
        </h2>
        <p className="text-[14px] leading-normal text-[#4b4b4b] sm:text-[15px]">
          All IAIS Committee meetings are open to all IAIS members, unless indicated
          as restricted. Please select all meetings that you will attend:
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

      <MembersPanel>
        <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
          Annual Conference
        </h2>
        <p className="text-[15px] leading-[30px] text-[#333]">
          Please select all days that you will attend the Annual Conference:
        </p>
        <div className="mt-3 flex flex-col gap-3 md:gap-4">
          {membersAnnualConferenceOptions.map((day) => (
            <MembersCheckboxCard
              key={day.value}
              selected={annualConferenceDays.includes(day.value)}
              onClick={() =>
                setValue(
                  "annualConferenceDays",
                  toggleArrayValue(annualConferenceDays, day.value),
                  { shouldValidate: true },
                )
              }
              tag={day.tag}
              tagVariant="yellow"
            >
              {day.label}
            </MembersCheckboxCard>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-[#e9f0f8] p-5">
          <h3 className="text-[22px] font-bold leading-none text-[#0356af]">
            Lunch selection
          </h3>
          <p className="mt-2 text-[15px] leading-normal text-[#4b4b4b]">
            Please only select the lunches that you will actually attend as late
            cancellations or &ldquo;no shows&rdquo; on the day may result in food
            waste and unnecessary charges for the host. Please update your
            registration or contact{" "}
            <a
              className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
              href={`mailto:${cancelEmail}`}
            >
              the organising team
            </a>{" "}
            if any changes to the registration are required.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {industryConferenceUiDays.map((day) => (
              <MembersCheckboxCard
                key={day.value}
                selected={industryLunchDays.includes(day.value)}
                onClick={() =>
                  setValue(
                    "industryLunchDays",
                    toggleArrayValue(industryLunchDays, day.value),
                    { shouldValidate: true },
                  )
                }
              >
                {day.lunchLabel}
              </MembersCheckboxCard>
            ))}
          </div>
        </div>
      </MembersPanel>

      <MembersPanel>
        <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
          Social events
        </h2>
        <p className="text-[15px] leading-normal text-[#4b4b4b]">
          Please only select the lunches that you will actually attend as late
          cancellations or &ldquo;no shows&rdquo; on the day may result in food
          waste and unnecessary charges for the host. Please update your
          registration or contact{" "}
          <a
            className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
            href={`mailto:${cancelEmail}`}
          >
            the organising team
          </a>{" "}
          if any changes to the registration are required.
        </p>
        <div className="mt-3 flex flex-col gap-4">
          <MembersCheckboxCard
            selected={socialEvents.includes("members_dinner")}
            onClick={() =>
              setValue(
                "socialEvents",
                toggleArrayValue(socialEvents, "members_dinner"),
                { shouldValidate: true },
              )
            }
            tag={t("socialTagMembersOnly")}
            tagVariant="yellow"
          >
            {t("socialEventMembersDinner")}
          </MembersCheckboxCard>
          <MembersCheckboxCard
            selected={socialEvents.includes("conference_reception")}
            onClick={() =>
              setValue(
                "socialEvents",
                toggleArrayValue(socialEvents, "conference_reception"),
                { shouldValidate: true },
              )
            }
            tag={t("socialTagAnnualConferenceParticipants")}
            tagVariant="cyan"
          >
            {t("socialEventConferenceReception")}
          </MembersCheckboxCard>
        </div>
      </MembersPanel>

      <MembersPanel className="rounded-2xl bg-[#ebf1f9] p-5 md:p-6">
        <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
          Dietary requirements
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2 md:items-start">
          <div className="flex flex-col gap-3">
            <MembersDietaryRadio
              selected={industryDietaryValue === "none"}
              label="I have no special dietary requirements"
              onSelect={() => pickMembersDietary("none")}
            />
            <MembersDietaryRadio
              selected={industryDietaryValue === "gluten_free"}
              label={t("dietaryGlutenFree")}
              onSelect={() => pickMembersDietary("gluten_free")}
            />
            <MembersDietaryRadio
              selected={industryDietaryValue === "vegetarian"}
              label={t("dietaryVegetarian")}
              onSelect={() => pickMembersDietary("vegetarian")}
            />
          </div>
          <div className="flex flex-col gap-3">
            <MembersDietaryRadio
              selected={industryDietaryValue === "vegan"}
              label={t("dietaryVegan")}
              onSelect={() => pickMembersDietary("vegan")}
            />
            <MembersDietaryRadio
              selected={industryDietaryValue === "other"}
              label={t("dietaryOther")}
              onSelect={() => pickMembersDietary("other")}
            />
            {industryDietaryValue === "other" ? (
              <div className="mt-1 flex w-full flex-col gap-1.5">
                <label
                  htmlFor="members-dietary-other-details"
                  className="text-[14px] font-normal leading-5 text-[#333]"
                >
                  If other please specify:
                </label>
                <input
                  id="members-dietary-other-details"
                  {...register("dietaryOtherDetails")}
                  className={inputClassName}
                  placeholder="e.g. allergies, religious requirements, etc."
                  autoComplete="off"
                />
              </div>
            ) : null}
          </div>
        </div>
        {errors.dietaryYesNo ? (
          <p className="mt-3 text-sm text-error">{errors.dietaryYesNo.message}</p>
        ) : null}
        {errors.dietary ? (
          <p className="mt-3 text-sm text-error">{errors.dietary.message}</p>
        ) : null}
        {errors.dietaryOtherDetails ? (
          <p className="mt-3 text-sm text-error">
            {errors.dietaryOtherDetails.message}
          </p>
        ) : null}
      </MembersPanel>

      <MembersPanel>
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
      </MembersPanel>

      <MembersPanel>
        <h2 className="text-[22px] font-bold leading-none text-[#0356af]">
          {t("travelInformationTitle")}
        </h2>
        <p className="mt-3 text-[15px] font-normal leading-normal text-[#333] md:leading-6">
          {t("travelInformationIntro")}
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-10">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="members-city-of-departure"
              className="text-[15px] font-semibold leading-6 text-[#333]"
            >
              {t("travelCityLabel")}
            </label>
            <input
              id="members-city-of-departure"
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
              htmlFor="members-means-of-transport"
              className="text-[15px] font-semibold leading-6 text-[#333]"
            >
              {t("travelMeansLabel")}
            </label>
            <input
              id="members-means-of-transport"
              {...register("meansOfTransportation")}
              className={inputClassName}
              placeholder="Enter means of transportation"
            />
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4">
          <p
            id="members-travel-carbon-question"
            className="text-[15px] font-normal leading-6 text-[#333]"
          >
            {t("travelCarbonQuestion")}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="members-travel-carbon-question"
            className="flex flex-row flex-wrap items-center gap-x-8 gap-y-4 sm:justify-between"
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
      </MembersPanel>

      <MembersPanel>
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
          <p className="mt-2 text-sm text-error">{errors.refundPolicyAck.message}</p>
        ) : null}
        <p className="mt-2 text-[15px] leading-6 text-[#4b4b4b]">
          * Cancellations made later than {refundPolicyContent.deadlineDate} at{" "}
          {refundPolicyContent.deadlineTimeHkt} will not be eligible for a refund
          of the registration fee. Kindly send an email to{" "}
          <a
            className="font-medium text-[#2f80ed] underline [text-decoration-skip-ink:none]"
            href={`mailto:${cancelEmail}`}
          >
            {cancelEmail}
          </a>{" "}
          to request the cancellation.
        </p>
        <div className="mt-2">
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
            <p className="mt-2 text-sm text-error">{errors.consent.message}</p>
          ) : null}
        </div>
      </MembersPanel>

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
