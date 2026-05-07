"use client";

import type { ReactNode } from "react";
import { useLayoutEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import {
  formatHkdWholeAmount,
  formatRegistrationFeeLeadLine,
  getFeesHkd,
  inferDietaryYesNo,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { COMMITTEE_MEETING_DAY_GROUPS } from "@/lib/committee-meetings";
import {
  industryConferenceDayLabels,
  industryConferenceUiDays,
  refundPolicyContent,
} from "@/lib/registration-event-content";
import { FigmaIcon } from "@/components/icons/figma-icon";
import type { AppLocale } from "@/i18n/routing";
import { formatStoredCountry } from "@/lib/countries-data";
import { formatPhoneCountryForDisplay } from "@/lib/phone-dial-options";

function RequiredMark() {
  return <span className="text-error">*</span>;
}

function ReviewSection({
  title,
  icon,
  children,
  description,
  inset = false,
  accentTitle = false,
  titleVariant = "section",
}: {
  title: string;
  /** Optional Figma vuesax-bold icon shown left of the title. */
  icon?: import("@/components/icons/figma-icon").FigmaIconName;
  children: ReactNode;
  description?: ReactNode;
  /**
   * Figma 1149:41673 nests sub-sections (e.g. Lunch under Conference days)
   * inside a white surface within the surrounding gray section. `inset`
   * controls that nested presentation; top-level sections use the default.
   */
  inset?: boolean;
  /** Figma `1296:42913` — section headings in brand blue (`#0356af`). */
  accentTitle?: boolean;
  /**
   * Figma `1296:47291` — “IAIS ANNUAL CONFERENCE 2026” event overview panel:
   * `rounded-[16px]`, flat padding `20px`, uppercase title `15px` Bold `#333`.
   */
  titleVariant?: "section" | "eventCaps";
}) {
  // Figma `1149:41673` styling — gray rounded card per section, with the
  // bold icon + Arial Bold 22 heading, all `text-[#333]`.
  const titleClass =
    titleVariant === "eventCaps"
      ? "text-[15px] font-bold uppercase leading-normal tracking-wide text-[#333]"
      : accentTitle
        ? "text-[20px] font-bold leading-normal text-[#0356af] md:text-[22px]"
        : "text-[20px] font-bold leading-normal text-[#333] md:text-[22px]";
  const shellClass = inset
    ? "rounded-[16px] border border-[#e8e8e8] bg-white p-4 md:p-5"
    : titleVariant === "eventCaps"
      ? "rounded-[16px] bg-[#f8f9fa] p-5"
      : "rounded-[20px] bg-[#f8f9fa] p-4 md:p-5";
  return (
    <section className={["flex w-full flex-col gap-4", shellClass].join(" ")}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          {icon ? (
            <FigmaIcon
              name={icon}
              size={24}
              className={[
                "size-6 shrink-0",
                accentTitle ? "text-[#0356af]" : "text-[#333]",
              ].join(" ")}
            />
          ) : null}
          <h2 className={titleClass}>{title}</h2>
        </div>
        {description ? (
          <div className="text-[14px] leading-normal text-[#4b4b4b]">
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ReviewSelectedCard({
  children,
  tag,
  tagTone = "subtle",
  icon,
  selectionIcon = "radio",
}: {
  children: ReactNode;
  tag?: ReactNode;
  tagTone?: "subtle" | "blue";
  icon?: ReactNode;
  /** Figma `1296:42913` Industry review — filled checkmark circles. */
  selectionIcon?: "radio" | "check";
}) {
  // Figma `1149:41673` colour pair for selection tags: yellow `#febf05`
  // for "restricted / members-only / fee-required" callouts and cyan
  // `#0ccaef` (text white) for "Annual Conference participants" (`1296:42913`).
  return (
    <div
      className="flex min-h-[48px] w-full items-start gap-2 rounded-lg border border-[#686868] bg-[rgba(104,104,104,0.08)] px-4 py-3"
      role="status"
      aria-live="polite"
    >
      {selectionIcon === "check" ? (
        <FigmaIcon
          name="fill-checkmark-circle"
          size={24}
          className="mt-0.5 size-6 shrink-0"
        />
      ) : (
        <FigmaIcon
          name="radio-on-muted"
          size={24}
          className="mt-0.5 size-6 shrink-0"
        />
      )}
      {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
      <span className="inline-flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="min-w-0 text-[14px] leading-[22px] text-[#333]">
          {children}
        </span>
        {tag ? (
          <span
            className={[
              "shrink-0 rounded-[4px] px-1.5 py-1 text-[13px] font-bold leading-none",
              tagTone === "blue"
                ? "bg-[#0ccaef] text-white"
                : "bg-[#febf05] text-[#333]",
            ].join(" ")}
          >
            {tag}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function DayGroup({
  day,
  children,
}: {
  day: string;
  children: ReactNode;
}) {
  /** Figma `1296:47291` — day header `#fafcff`, title Arial Bold 15px `#0356af`; soft shadow on stack. */
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#f2f2f2] shadow-[0px_4px_5px_rgba(0,0,0,0.15)]">
      <div className="bg-[#fafcff] px-4 py-4">
        <h3 className="text-[15px] font-bold leading-normal text-[#0356af]">{day}</h3>
      </div>
      <div className="flex flex-col gap-3 border-t border-[#f2f2f2] bg-white px-4 py-4">
        {children}
      </div>
    </div>
  );
}

function LabelAbove({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[15px] leading-[30px] text-heading">
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

function ReviewToggleCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-start gap-2 rounded-lg border border-[#686868] bg-[rgba(104,104,104,0.08)] px-4 py-3 text-left text-[16px] leading-6 text-[#404d61]">
      <FigmaIcon
        name="radio-on-muted"
        size={24}
        className="mt-0.5 size-6 shrink-0"
      />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function InlineReviewLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="font-medium text-[#3c64f4] underline decoration-solid [text-decoration-skip-ink:none]"
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function formatPhone(
  country: string | undefined,
  number: string | undefined,
  locale: AppLocale,
  fallback: string,
) {
  const countryLabel = formatPhoneCountryForDisplay(country, locale);
  const parts = [countryLabel, number].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : fallback;
}

const guestTypeLabels = {
  distinguished_fellow: "IAIS Distinguished Fellow",
  press: "Press",
  consumer_group: "Consumer Group",
  external_speaker: "External Speaker",
} as const;

const memberDelegateRoleLabels = {
  iais_member: "IAIS Member",
  iais_secretariat: "IAIS Secretariat",
  amf: "Hong Kong Insurance Authority",
} as const;

export function StepReview({ embedded = false }: { embedded?: boolean }) {
  const locale = useLocale() as AppLocale;
  const tRev = useTranslations("Review");
  const t = useTranslations("Registration");
  const tThank = useTranslations("ThankYou");
  const { watch } = useFormContext<RegistrationFormValues>();
  const d = watch();
  const cancelEmail = refundPolicyContent.cancellationEmail;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  function labelAttendanceOption() {
    if (d.attendance === "in_person") return t("attendInPerson");
    if (d.attendance === "online") return t("attendOnline");
    return t("notAttendingFull");
  }

  function labelAudienceOption() {
    return t(`audience.${d.audienceType}`);
  }

  function participantCategory() {
    if (d.audienceType === "members") {
      const r = d.memberDelegateRole;
      if (r && r in memberDelegateRoleLabels) {
        return memberDelegateRoleLabels[r as keyof typeof memberDelegateRoleLabels];
      }
      return tRev("dash");
    }
    if (d.audienceType === "industry") return "Industry representative";
    if (d.audienceType === "fellow") {
      return d.guestType ? guestTypeLabels[d.guestType] : tRev("dash");
    }
    return "Virtual Participation";
  }

  function labelDietaryYesNo(): string {
    const yn = inferDietaryYesNo(d);
    if (yn === "yes") return t("yes");
    if (yn === "no") return t("no");
    return tRev("dash");
  }

  function dietaryChoiceLabelAndIcon(): { label: string; icon: ReactNode } {
    if (d.dietary === "vegan") {
      return { label: t("dietaryVegan"), icon: null };
    }
    if (d.dietary === "vegetarian") {
      return { label: t("dietaryVegetarian"), icon: null };
    }
    if (d.dietary === "halal") {
      return { label: t("dietaryHalal"), icon: null };
    }
    if (d.dietary === "gluten_free") {
      return { label: t("dietaryGlutenFree"), icon: null };
    }
    if (d.dietary === "other") {
      const detail = d.dietaryOtherDetails?.trim();
      return {
        label: detail ? `${t("dietaryOther")}: ${detail}` : t("dietaryOther"),
        icon: null,
      };
    }
    return { label: tRev("dash"), icon: null };
  }

  const dietaryChoice = dietaryChoiceLabelAndIcon();
  const showDietaryChoiceReview = inferDietaryYesNo(d) === "yes";
  const jurisdictionDisplay =
    formatStoredCountry(
      (d.jurisdiction?.trim() || d.country || "").trim(),
      locale,
    ) || tRev("dash");
  const isConferencePackAudience =
    d.audienceType === "industry" ||
    d.audienceType === "fellow" ||
    d.audienceType === "members";
  const isVirtualAudience = d.audienceType === "virtual";
  const packIndustryFellow =
    d.audienceType === "industry" || d.audienceType === "fellow";
  const reviewSelIcon = packIndustryFellow ? "check" : "radio";
  const fullName = isConferencePackAudience
    ? [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
      d.firstName?.trim() ||
      tRev("dash")
    : [d.title, d.firstName, d.lastName].filter(Boolean).join(" ");
  const contactFullName = [d.contactTitle, d.contactFirstName, d.contactLastName]
    .filter(Boolean)
    .join(" ");
  const annualConferenceSelections = isConferencePackAudience
    ? (d.annualConferenceDays ?? []).map((day) => {
        const ui = industryConferenceUiDays.find((u) => u.value === day);
        if (packIndustryFellow && ui) {
          return ui.annualConferenceLabel;
        }
        return industryConferenceDayLabels[day];
      })
    : [
        "11 November, Wednesday",
        "12 November, Thursday",
        "13 November, Friday",
      ];
  const lunchSelections = isConferencePackAudience
    ? (d.industryLunchDays ?? []).map((day) => {
        const ui = industryConferenceUiDays.find((u) => u.value === day);
        return ui?.lunchLabel ?? industryConferenceDayLabels[day];
      })
    : d.lunchSession === "both"
      ? ["12 November, Thursday", "13 November, Friday"]
      : d.lunchSession === "nov12"
        ? ["12 November, Thursday"]
        : d.lunchSession === "nov13"
          ? ["13 November, Friday"]
          : ["No lunch"];
  const socialEventSelections = isConferencePackAudience
    ? [
        (d.socialEvents ?? []).includes("members_dinner") &&
        d.audienceType === "members"
          ? {
              label: t("socialEventMembersDinner"),
              tag: t("socialTagInvitationOnly"),
              tagTone: "subtle" as const,
            }
          : null,
        (d.socialEvents ?? []).includes("conference_reception")
          ? {
              label: t("socialEventConferenceReception"),
              tag: t("socialTagAnnualConferenceParticipants"),
              tagTone: "blue" as const,
            }
          : null,
      ].filter(
        (
          e,
        ): e is {
          label: string;
          tag: string;
          tagTone: "subtle" | "blue";
        } => e != null,
      )
    : [
        {
          label: t("socialEventMembersDinner"),
          tag: t("socialTagInvitationOnly"),
          tagTone: "subtle" as const,
        },
        {
          label: t("socialEventConferenceReception"),
          tag: t("socialTagAnnualConferenceParticipants"),
          tagTone: "blue" as const,
        },
      ];

  const committeeReviewGroups = COMMITTEE_MEETING_DAY_GROUPS.map((group) => ({
    day: group.day,
    meetings: group.meetings.filter((m) =>
      (d.committeeMeetings ?? []).includes(m.id),
    ),
  })).filter((g) => g.meetings.length > 0);

  const carbonOffsetReview =
    d.carbonOffset === "yes"
      ? t("yes")
      : d.carbonOffset === "no"
        ? t("no")
        : d.carbonOffset === "not_available"
          ? "No information available"
          : tRev("dash");

  const participationFeeHkd = getFeesHkd(d.attendance, {
    audienceType: d.audienceType,
  });
  const participationFeeLabel =
    participationFeeHkd === 0
      ? t("participationFeeRowNone", { status: t("noFee") })
      : t("participationFeeRow", {
          fee: formatHkdWholeAmount(participationFeeHkd),
        });

  const emailReviewLabel = packIndustryFellow ? tThank("emailLabel") : t("email");
  const orgReviewLabel =
    d.audienceType === "fellow"
      ? tThank("organizationLabel")
      : d.audienceType === "industry"
        ? tThank("organisationLabel")
        : t("company");
  const registrationDetailsGridClass = packIndustryFellow
    ? "grid gap-5"
    : "grid gap-5 md:grid-cols-2";

  /** Embedded under `RegistrationStep0Card` — shell provides card chrome; keep flat inner stack (Figma `1296:44731`). */
  const articleSurfaceClass = embedded
    ? "flex w-full flex-col gap-8 md:gap-8"
    : "flex flex-col gap-8 rounded-[16px] bg-white p-5 shadow-[0_4px_2px_rgba(0,0,0,0.25)] md:gap-8 md:p-10";

  return (
    <div className={embedded ? "flex w-full flex-col" : "flex flex-col gap-7"}>
      {!embedded ? (
        <header className="flex flex-col gap-3">
          <h1 className="text-[28px] font-bold leading-tight text-brand-deep md:text-[30px] md:leading-[40px]">
            Confirm Your Details
          </h1>
          <p className="text-[16px] leading-7 text-[#878b8e] md:text-[18px] md:leading-[30px]">
            Please review your details carefully. Once submitted, changes cannot be
            made.
          </p>
        </header>
      ) : null}

      {/* Figma 1149:41673 wraps the whole review summary in a single white
          card with a soft drop shadow; the inner sections all sit on a
          gray `#f8f9fa` panel. */}
      <article className={articleSurfaceClass}>
        {!packIndustryFellow && !embedded ? (
          <h2 className="font-display text-center text-[22px] font-bold leading-[40px] text-[#333] md:text-[24px]">
            {t("registrationTitle", { audience: labelAudienceOption() })}
          </h2>
        ) : null}
        {packIndustryFellow && !embedded ? (
          <p className="text-[16px] leading-6 text-[#333333]">
            {formatRegistrationFeeLeadLine(participationFeeHkd)}
          </p>
        ) : null}

        {!packIndustryFellow ? (
          <ReviewSection title={t("eventOverviewTitle")} titleVariant="eventCaps">
            <ul className="flex flex-col gap-4 text-[15px] leading-6 text-[#4b4b4b]">
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="calendar-24"
                  size={24}
                  className="size-6 shrink-0 text-[#333]"
                />
                <span>{t("eventDates")}</span>
              </li>
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="location-24"
                  size={24}
                  className="size-6 shrink-0 text-[#333]"
                />
                <span>{t("venue")}</span>
              </li>
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="global-24"
                  size={24}
                  className="size-6 shrink-0 text-[#333]"
                />
                <span>{t("languages")}</span>
              </li>
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="card-pos"
                  size={24}
                  className="size-6 shrink-0 text-[#333]"
                />
                <span>{participationFeeLabel}</span>
              </li>
            </ul>
          </ReviewSection>
        ) : null}

        {packIndustryFellow ? (
          <div className="flex w-full flex-col gap-4">
            {d.audienceType === "fellow" ? (
              <LabelAbove label="Guest Type:">
                <ReviewSelectedCard selectionIcon={reviewSelIcon}>
                  {participantCategory()}
                </ReviewSelectedCard>
              </LabelAbove>
            ) : null}
            <div className={registrationDetailsGridClass}>
              <LabelAbove label="Full Name" required>
                {fullName || tRev("dash")}
              </LabelAbove>
              <LabelAbove label={emailReviewLabel} required>
                {d.email || tRev("dash")}
              </LabelAbove>
              <LabelAbove label={tThank("countryLabel")} required>
                {formatStoredCountry((d.country ?? "").trim(), locale) ||
                  tRev("dash")}
              </LabelAbove>
              <LabelAbove label={orgReviewLabel} required>
                {d.company || tRev("dash")}
              </LabelAbove>
            </div>
          </div>
        ) : (
          <ReviewSection
            title={tThank("registrationDetailsTitle")}
            icon="user-bold-24"
          >
            <div className="flex flex-col gap-4">
              {isConferencePackAudience ? (
                <LabelAbove
                  label={
                    d.audienceType === "fellow"
                      ? "Guest Type:"
                      : "Please choose one of the following:"
                  }
                >
                  <ReviewSelectedCard selectionIcon={reviewSelIcon}>{participantCategory()}</ReviewSelectedCard>
                </LabelAbove>
              ) : null}
              {d.audienceType === "members" ||
              d.audienceType === "virtual" ? (
                <LabelAbove label="Jurisdiction" required>
                  {jurisdictionDisplay}
                </LabelAbove>
              ) : null}
              <div className={registrationDetailsGridClass}>
                <LabelAbove label="Full Name" required>
                  {fullName || tRev("dash")}
                </LabelAbove>
                <LabelAbove label={emailReviewLabel} required>
                  {d.email || tRev("dash")}
                </LabelAbove>
                {d.audienceType === "industry" ||
                d.audienceType === "fellow" ? (
                  <LabelAbove label={tThank("countryLabel")} required>
                    {formatStoredCountry((d.country ?? "").trim(), locale) ||
                      tRev("dash")}
                  </LabelAbove>
                ) : null}
                {d.audienceType === "members" ? null : (
                  <LabelAbove label={orgReviewLabel} required>
                    {d.company || tRev("dash")}
                  </LabelAbove>
                )}
                {isConferencePackAudience ? null : (
                  <>
                    <LabelAbove label={t("jobTitle")} required>
                      {d.jobTitle || tRev("dash")}
                    </LabelAbove>
                    <LabelAbove label={t("telephone")} required>
                      {formatPhone(
                        d.phoneCountry,
                        d.phoneNumber,
                        locale,
                        tRev("dash"),
                      )}
                    </LabelAbove>
                    <LabelAbove label={t("attendanceSectionTitle")}>
                      {labelAttendanceOption()}
                    </LabelAbove>
                  </>
                )}
              </div>
            </div>
          </ReviewSection>
        )}

        {d.audienceType === "members" || d.audienceType === "virtual" ? (
          <ReviewSection
            title={tThank("committeeMeetingsTitle")}
            icon="note-text-bold-24"
            description="All IAIS Committee meetings are open to all IAIS members, unless indicated as restricted. Please select all meetings that you will attend:"
          >
            <div className="flex flex-col gap-4">
              {committeeReviewGroups.length > 0 ? (
                committeeReviewGroups.map((group) => (
                  <DayGroup key={group.day} day={group.day}>
                    {group.meetings.map((m) => (
                      <ReviewSelectedCard selectionIcon={reviewSelIcon} key={m.id} tag={m.tag}>
                        {m.label}
                      </ReviewSelectedCard>
                    ))}
                  </DayGroup>
                ))
              ) : (
                <ReviewSelectedCard selectionIcon={reviewSelIcon}>{tRev("dash")}</ReviewSelectedCard>
              )}
            </div>
          </ReviewSection>
        ) : null}

        {!isVirtualAudience ? (
        <>
        <ReviewSection
          title={tThank("annualConferenceTitle")}
          icon="bookmark-2-bold-24"
          accentTitle={packIndustryFellow}
        >
          <div className="flex flex-col gap-1">
            <p className="text-[16px] leading-[30px] text-heading">
              Please select all days that you will attend the Annual Conference:
            </p>
            {annualConferenceSelections.length > 0 ? (
              annualConferenceSelections.map((day) => (
                <ReviewSelectedCard selectionIcon={reviewSelIcon} key={day}>{day}</ReviewSelectedCard>
              ))
            ) : (
              <ReviewSelectedCard selectionIcon={reviewSelIcon}>{tRev("dash")}</ReviewSelectedCard>
            )}
          </div>
          <ReviewSection
            title={tThank("lunchSelectionTitle")}
            icon="fork-spoon-rounded-24"
            inset
            accentTitle={packIndustryFellow}
            description={
              <p>
                Please only select the lunches that you will actually attend as
                late cancellations or no-shows on the day may result in food
                waste and unnecessary charges for the host. Please update your
                registration or contact{" "}
                <InlineReviewLink href={`mailto:${cancelEmail}`}>
                  the organising team
                </InlineReviewLink>{" "}
                if any changes to the registration are required.
              </p>
            }
          >
            <div className="flex flex-col gap-4">
              {lunchSelections.map((selection) => (
                <ReviewSelectedCard selectionIcon={reviewSelIcon} key={selection}>{selection}</ReviewSelectedCard>
              ))}
            </div>
          </ReviewSection>
        </ReviewSection>

        <ReviewSection
          title={tThank("socialEventsTitle")}
          icon="bookmark-2-bold-24"
          accentTitle={packIndustryFellow}
          description={<p>{t("socialEventsIntroFigma")}</p>}
        >
          {socialEventSelections.length > 0 ? (
            socialEventSelections.map((event) => (
              <ReviewSelectedCard
                selectionIcon={reviewSelIcon}
                key={event.label}
                tag={event.tag}
                tagTone={event.tagTone}
              >
                {event.label}
              </ReviewSelectedCard>
            ))
          ) : (
            <ReviewSelectedCard selectionIcon={reviewSelIcon}>{tRev("dash")}</ReviewSelectedCard>
          )}
        </ReviewSection>

        <ReviewSection
          title={tThank("dietaryRequirementsTitle")}
          icon="leaf-dietary-24"
          accentTitle={packIndustryFellow}
        >
          <ReviewSelectedCard selectionIcon={reviewSelIcon} icon={dietaryChoice.icon}>
            {showDietaryChoiceReview ? dietaryChoice.label : labelDietaryYesNo()}
          </ReviewSelectedCard>
          {d.dietary === "other" ? (
            <LabelAbove label={tThank("dietarySpecifyLabel")}>
              {d.dietaryOtherDetails?.trim() || tRev("dash")}
            </LabelAbove>
          ) : null}
        </ReviewSection>

        {packIndustryFellow && d.invitationLetterRequested ? (
          <div className="flex flex-col gap-2">
            <ReviewSelectedCard selectionIcon={reviewSelIcon}>
              {t("visaLetterLabel")}
            </ReviewSelectedCard>
            <p className="text-[15px] leading-6 text-[#4b4b4b]">
              For all information regarding the visa letter{" "}
              <InlineReviewLink href="https://www.ia.org.hk/en/aboutus/useful_links.html">
                please visit this link
              </InlineReviewLink>
              . All relevant details required for the issuance of the visa letter will be
              formally requested in the confirmation email that you will receive.
            </p>
          </div>
        ) : null}

        <ReviewSection
          title={tThank("travelInformationTitle")}
          icon="airplane-bold-24"
          accentTitle={packIndustryFellow}
          description="Travel information will be used in an anonymised way to assist in measuring the IAIS' carbon footprint in furtherance of the IAIS environmental policy."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <LabelAbove label="City of departure:">
              {d.cityOfDeparture?.trim() || tRev("dash")}
            </LabelAbove>
            <LabelAbove label="Means of transportation:">
              {d.meansOfTransportation?.trim() || tRev("dash")}
            </LabelAbove>
          </div>
          <LabelAbove label="Did you or your organisation participate in a carbon offsetting programme for your travel to the event?">
            <ReviewSelectedCard selectionIcon={reviewSelIcon}>{carbonOffsetReview}</ReviewSelectedCard>
          </LabelAbove>
        </ReviewSection>
        </>
        ) : null}

        {!isConferencePackAudience && !isVirtualAudience ? (
          <ReviewSection title={t("contactPerson")}>
            {d.sameContact ? (
              <p className="text-[16px] leading-6 text-text">{t("sameAsDelegate")}</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <LabelAbove label="Full Name" required>
                  {contactFullName || tRev("dash")}
                </LabelAbove>
                <LabelAbove label={t("email")}>
                  {d.contactEmail || tRev("dash")}
                </LabelAbove>
                <LabelAbove label={t("telephone")}>
                  {formatPhone(
                    d.contactPhoneCountry,
                    d.contactPhoneNumber,
                    locale,
                    tRev("dash"),
                  )}
                </LabelAbove>
                <LabelAbove label={t("countryRegion")}>
                  {formatStoredCountry(d.contactCountry, locale) || tRev("dash")}
                </LabelAbove>
              </div>
            )}
          </ReviewSection>
        ) : null}

        {!isConferencePackAudience && !isVirtualAudience ? (
        <ReviewSection title={t("cpdTitle")}>
          <div className="flex flex-col gap-2 text-[15px] leading-[22px] text-[#001d53]">
            <p>{t("cpdIntro")}</p>
            <p>
              {t("cpdEarnPrefix")}{" "}
              <span className="font-medium">{t("cpdHoursBold")}</span>
              {t("cpdEarnMid")}{" "}
              <span className="font-medium">{t("cpdWarningBold")}</span>
            </p>
          </div>
          <LabelAbove
            label={t("cpdQuestionMain")}
            required
            hint={t("cpdQuestionNote")}
          >
            <ReviewSelectedCard selectionIcon={reviewSelIcon}>
              {d.cpdApply === "yes" ? t("yes") : t("no")}
            </ReviewSelectedCard>
          </LabelAbove>
          <p className="text-[13px] leading-[22px] text-[#566072]">{t("cpdNote1")}</p>
        </ReviewSection>
        ) : null}

        <ReviewSection title="Acknowledgement and Consent">
          {d.audienceType === "members" ? (
            <>
              {d.refundPolicyAck ? (
                <>
                  <ReviewSelectedCard selectionIcon={reviewSelIcon}>
                    I acknowledge the registration fee cancellation and refund policy
                    <RequiredMark />
                  </ReviewSelectedCard>
                  <p className="text-[15px] leading-6 text-[#4b4b4b]">
                    * Cancellations made later than {refundPolicyContent.deadlineDate}{" "}
                    at {refundPolicyContent.deadlineTimeHkt} will not be eligible for a
                    refund of the registration fee. Kindly send an email to{" "}
                    <InlineReviewLink href={`mailto:${cancelEmail}`}>
                      {cancelEmail}
                    </InlineReviewLink>{" "}
                    to request the cancellation.
                  </p>
                </>
              ) : null}
              {d.invitationLetterRequested ? (
                <>
                  <ReviewSelectedCard selectionIcon={reviewSelIcon}>{t("visaLetterLabel")}</ReviewSelectedCard>
                  <p className="text-[15px] leading-6 text-[#4b4b4b]">
                    For all information regarding the visa letter{" "}
                    <InlineReviewLink href="https://www.ia.org.hk/en/aboutus/useful_links.html">
                      please visit this link
                    </InlineReviewLink>
                    . All relevant details required for the issuance of the visa
                    letter will be formally requested in the confirmation email that
                    you will receive.
                  </p>
                </>
              ) : null}
              {d.consent ? (
                <ReviewSelectedCard selectionIcon={reviewSelIcon}>
                  <span className="leading-6">
                    I consent to the collection, processing, and storing of my
                    personal data as outlined in the{" "}
                    <InlineReviewLink href="https://www.iais.org/privacy-notice">
                      IAIS Privacy Notice
                    </InlineReviewLink>{" "}
                    and in compliance with Hong Kong Law No. XXX on Personal Data
                    Protection
                    <RequiredMark />
                  </span>
                </ReviewSelectedCard>
              ) : null}
            </>
          ) : packIndustryFellow ? (
            <>
              {d.refundPolicyAck ? (
                <>
                  <ReviewSelectedCard selectionIcon={reviewSelIcon}>
                    I acknowledge the registration fee cancellation and refund policy
                    <RequiredMark />
                  </ReviewSelectedCard>
                  <p className="text-[15px] leading-6 text-[#4b4b4b]">
                    * Cancellations made later than {refundPolicyContent.deadlineDate}{" "}
                    at {refundPolicyContent.deadlineTimeHkt} will not be eligible for a
                    refund of the registration fee. Kindly send an email to{" "}
                    <InlineReviewLink href={`mailto:${cancelEmail}`}>
                      {cancelEmail}
                    </InlineReviewLink>{" "}
                    to request the cancellation.
                  </p>
                </>
              ) : null}
              {d.consent ? (
                <ReviewSelectedCard selectionIcon={reviewSelIcon}>
                  <span className="leading-6">
                    I consent to the collection, processing, and storing of my
                    personal data as outlined in the{" "}
                    <InlineReviewLink href="https://www.iais.org/privacy-notice">
                      IAIS Privacy Notice
                    </InlineReviewLink>{" "}
                    and in compliance with Hong Kong Law No. XXX on Personal Data
                    Protection
                    <RequiredMark />
                  </span>
                </ReviewSelectedCard>
              ) : null}
            </>
          ) : (
            <>
              {d.consent ? (
                <ReviewSelectedCard selectionIcon={reviewSelIcon}>
                  {t("consentLabel")}
                  <RequiredMark />
                </ReviewSelectedCard>
              ) : null}
            </>
          )}
        </ReviewSection>

        {isConferencePackAudience ? (
          <div className="flex flex-col gap-3 text-[15px] leading-[22px] text-[#001d53]">
            <p className="font-bold text-heading">
              {t("formFooterPrivacyTitle")}
              <RequiredMark />
            </p>
            <p className="font-normal">
              {t.rich("formFooterPrivacyBodyRich", {
                notice: (chunks) => (
                  <InlineReviewLink href="https://www.iais.org/privacy-notice">
                    {chunks}
                  </InlineReviewLink>
                ),
              })}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 text-[15px] leading-[22px] text-[#001d53]">
            <p className="font-bold text-heading">
              Privacy policy
              <RequiredMark />
            </p>
            <p>
              Your name and organisation details will be included in the
              participants list; and photos and recordings will take place of the
              Annual Conference. In order to submit your registration for the IAIS
              Annual Conference you need to consent to us collecting and using your
              personal information as laid out in the{" "}
              <InlineReviewLink href="https://www.iais.org/privacy-notice">
                IAIS Privacy Notice
              </InlineReviewLink>
              .
            </p>
            <p className="font-bold text-heading">
              Refund Policy
              <RequiredMark />
            </p>
            <p>
              All registration and payment matters are subject to our Refund
              Policy. Please refer to our{" "}
              <InlineReviewLink href="https://www.iais.org/refund-policy">
                Refund Policy
              </InlineReviewLink>
              .
            </p>
          </div>
        )}
      </article>
    </div>
  );
}
