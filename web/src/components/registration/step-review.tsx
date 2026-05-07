"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
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
import {
  DayGroup,
  InlineReviewLink,
  LabelAbove,
  RequiredMark,
} from "@/components/registration/registration-review-primitives";
import { MembersEmbeddedReview } from "@/components/registration/members-embedded-review";

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
                accentTitle ? "text-[#0356af]" : "text-[#4F4F4F]",
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
          className="mt-0.5 size-6 shrink-0 text-[#4F4F4F]"
        />
      ) : (
        <FigmaIcon
          name="radio-on-muted"
          size={24}
          className="mt-0.5 size-6 shrink-0 text-[#4F4F4F]"
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

function ReviewToggleCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-start gap-2 rounded-lg border border-[#686868] bg-[rgba(104,104,104,0.08)] px-4 py-3 text-left text-[16px] leading-6 text-[#404d61]">
      <FigmaIcon
        name="radio-on-muted"
        size={24}
        className="mt-0.5 size-6 shrink-0 text-[#4F4F4F]"
      />
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

/**
 * Figma `1296:40782` — tick row: white rounded strip, 24px icon, 15px medium `#333`
 * lead copy; optional note below at `gap-2` (8px), full-width `#4b4b4b` (not indented
 * under the label column). Asterisk `#eb5757` via {@link RequiredMark}.
 */
function ReviewConsentTickRow({
  children,
  detail,
}: {
  children: ReactNode;
  detail?: ReactNode;
}) {
  const tickRow = (
    <div className="flex w-full items-start gap-2 rounded-lg bg-white">
      <FigmaIcon
        name="fill-checkmark-circle"
        size={24}
        className="size-6 shrink-0"
      />
      <div className="min-w-0 flex-1 text-[15px] font-medium leading-6 text-[#333]">
        {children}
      </div>
    </div>
  );

  if (!detail) {
    return tickRow;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {tickRow}
      <div className="text-[15px] font-normal leading-normal text-[#4b4b4b]">
        {detail}
      </div>
    </div>
  );
}

/** Figma `1296:44731` — Lunch + Social review share this paragraph (including linked organising team). */
function ReviewLunchSocialIntroNote({
  cancelEmail,
}: {
  cancelEmail: string;
}) {
  return (
    <p>
      Please only select the lunches that you will actually attend as late
      cancellations or no-shows on the day may result in food waste and
      unnecessary charges for the host. Please update your registration or
      contact{" "}
      <InlineReviewLink href={`mailto:${cancelEmail}`}>
        the organising team
      </InlineReviewLink>{" "}
      if any changes to the registration are required.
    </p>
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

const FALLBACK_CONFERENCE_DAYS = [
  "11 November, Wednesday",
  "12 November, Thursday",
  "13 November, Friday",
] as const;
const FALLBACK_LUNCH_BOTH = [
  "12 November, Thursday",
  "13 November, Friday",
] as const;
const FALLBACK_LUNCH_NOV12 = ["12 November, Thursday"] as const;
const FALLBACK_LUNCH_NOV13 = ["13 November, Friday"] as const;
const FALLBACK_LUNCH_NONE = ["No lunch"] as const;

export function StepReview({ embedded = false }: { embedded?: boolean }) {
  const locale = useLocale() as AppLocale;
  const tRev = useTranslations("Review");
  const t = useTranslations("Registration");
  const tThank = useTranslations("ThankYou");
  const { watch } = useFormContext<RegistrationFormValues>();
  const d = watch();
  const cancelEmail = refundPolicyContent.cancellationEmail;

  useEffect(() => {
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
  const membersEmbedded = embedded && d.audienceType === "members";
  const reviewSelIcon = packIndustryFellow ? "check" : "radio";
  const fullName = isConferencePackAudience
    ? [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
      d.firstName?.trim() ||
      tRev("dash")
    : [d.title, d.firstName, d.lastName].filter(Boolean).join(" ");
  const annualConferenceSelections: readonly string[] = isConferencePackAudience
    ? (d.annualConferenceDays ?? []).map((day) => {
        const ui = industryConferenceUiDays.find((u) => u.value === day);
        if (packIndustryFellow && ui) {
          return ui.annualConferenceLabel;
        }
        return industryConferenceDayLabels[day];
      })
    : FALLBACK_CONFERENCE_DAYS;
  const lunchSelections: readonly string[] = isConferencePackAudience
    ? (d.industryLunchDays ?? []).map((day) => {
        const ui = industryConferenceUiDays.find((u) => u.value === day);
        return ui?.lunchLabel ?? industryConferenceDayLabels[day];
      })
    : d.lunchSession === "both"
      ? FALLBACK_LUNCH_BOTH
      : d.lunchSession === "nov12"
        ? FALLBACK_LUNCH_NOV12
        : d.lunchSession === "nov13"
          ? FALLBACK_LUNCH_NOV13
          : FALLBACK_LUNCH_NONE;
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

  /** Figma embedded review — Fellow `1296:44731`, Virtual/Members-style `1296:46668`: personal rows directly under gradient, no grey Registration Details shell. */
  const registrationDetailsInner = (
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
      {d.audienceType === "members" || isVirtualAudience ? (
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
        {d.audienceType === "industry" || d.audienceType === "fellow" ? (
          <LabelAbove label={tThank("countryLabel")} required>
            {formatStoredCountry((d.country ?? "").trim(), locale) ||
              tRev("dash")}
          </LabelAbove>
        ) : null}
        {d.audienceType === "members" || isVirtualAudience ? null : (
          <LabelAbove label={orgReviewLabel} required>
            {d.company || tRev("dash")}
          </LabelAbove>
        )}
        {isConferencePackAudience || isVirtualAudience ? null : (
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
  );

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

        {/*
          Event overview grey panel (`1296:47291` style) is for standalone review /
          previews. Wizard uses `embedded`: Figma review frames (e.g. Fellow
          `1296:44731`, Virtual/Members `1296:46668`) start with registration fields
          under the gradient header — no duplicate overview inside the white card.
        */}
        {!packIndustryFellow && !embedded ? (
          <ReviewSection title={t("eventOverviewTitle")} titleVariant="eventCaps">
            <ul className="flex flex-col gap-4 text-[15px] leading-6 text-[#4b4b4b]">
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="calendar-24"
                  size={24}
                  className="size-6 shrink-0 text-[#4F4F4F]"
                />
                <span>{t("eventDates")}</span>
              </li>
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="location-24"
                  size={24}
                  className="size-6 shrink-0 text-[#4F4F4F]"
                />
                <span>{t("venue")}</span>
              </li>
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="global-24"
                  size={24}
                  className="size-6 shrink-0 text-[#4F4F4F]"
                />
                <span>{t("languages")}</span>
              </li>
              <li className="flex items-start gap-3">
                <FigmaIcon
                  name="card-pos"
                  size={24}
                  className="size-6 shrink-0 text-[#4F4F4F]"
                />
                <span>{participationFeeLabel}</span>
              </li>
            </ul>
          </ReviewSection>
        ) : null}

        {membersEmbedded ? (
          <MembersEmbeddedReview />
        ) : packIndustryFellow ? (
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
        ) : embedded ? (
          registrationDetailsInner
        ) : (
          <ReviewSection
            title={tThank("registrationDetailsTitle")}
            icon="user-bold-24"
          >
            {registrationDetailsInner}
          </ReviewSection>
        )}

        {!membersEmbedded &&
        (d.audienceType === "members" || isVirtualAudience) ? (
          <ReviewSection
            title={tThank("committeeMeetingsTitle")}
            icon="note-text-bold-24"
            description={tThank("committeeMeetingsDescription")}
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

        {!membersEmbedded && !isVirtualAudience ? (
        <>
        <ReviewSection
          title={tThank("annualConferenceTitle")}
          icon="bookmark-2-bold-24"
          accentTitle={packIndustryFellow}
        >
          <div className="flex flex-col gap-1">
            <p className="text-[16px] leading-[30px] text-heading">
              {tThank("annualConferenceSelectPrompt")}
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
            description={<ReviewLunchSocialIntroNote cancelEmail={cancelEmail} />}
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
          description={<ReviewLunchSocialIntroNote cancelEmail={cancelEmail} />}
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

        {membersEmbedded ? (
          <div className="flex w-full flex-col gap-10 border-t border-[#f2f2f2] pt-9">
            {/*
              Figma `1296:40503` — divider → consent ticks only (no section heading).
              Visa sits above in {@link MembersEmbeddedReview} after Dietary, before Travel.
            */}
            <section className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                {d.refundPolicyAck ? (
                  <ReviewConsentTickRow
                    detail={
                      <>
                        * Cancellations made later than{" "}
                        {refundPolicyContent.deadlineDate} at{" "}
                        {refundPolicyContent.deadlineTimeHkt} will not be eligible for a
                        refund of the registration fee. Kindly send an email to{" "}
                        <InlineReviewLink href={`mailto:${cancelEmail}`}>
                          {cancelEmail}
                        </InlineReviewLink>{" "}
                        to request the cancellation.
                      </>
                    }
                  >
                    <>
                      I acknowledge the registration fee cancellation and refund policy
                      <RequiredMark className="text-[#eb5757]" />
                    </>
                  </ReviewConsentTickRow>
                ) : null}
                {d.consent ? (
                  <ReviewConsentTickRow>
                    <span className="leading-6">
                      I consent to the collection, processing, and storing of my
                      personal data as outlined in the{" "}
                      <InlineReviewLink href="https://www.iais.org/privacy-notice">
                        IAIS Privacy Notice
                      </InlineReviewLink>{" "}
                      and in compliance with Hong Kong Law No. XXX on Personal Data
                      Protection
                      <RequiredMark className="text-[#eb5757]" />
                    </span>
                  </ReviewConsentTickRow>
                ) : null}
              </div>
              {isConferencePackAudience || isVirtualAudience ? (
                <div className="flex flex-col gap-3 border-t border-[#f2f2f2] pt-8 text-[15px] leading-[22px] text-[#333]">
                  <p className="font-bold text-[#333]">
                    {t("formFooterPrivacyTitle")}
                    <RequiredMark className="text-[#eb5757]" />
                  </p>
                  <p className="font-normal leading-6 text-[#333]">
                    {t.rich("formFooterPrivacyBodyRich", {
                      notice: (chunks) => (
                        <InlineReviewLink href="https://www.iais.org/privacy-notice">
                          {chunks}
                        </InlineReviewLink>
                      ),
                    })}
                  </p>
                </div>
              ) : null}
            </section>
          </div>
        ) : (
          <>
        <ReviewSection title={t("ackTitle")}>
          {isVirtualAudience ? (
            d.consent ? (
              <ReviewSelectedCard selectionIcon={reviewSelIcon}>
                <span className="leading-6">
                  {t.rich("consentMarketingVirtualRich", {
                    enquiry: (chunks) => (
                      <InlineReviewLink href="mailto:enquiry@ia.org.hk">
                        {chunks}
                      </InlineReviewLink>
                    ),
                  })}
                </span>
              </ReviewSelectedCard>
            ) : null
          ) : d.audienceType === "members" ? (
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

        {!membersEmbedded &&
        (isConferencePackAudience || isVirtualAudience) ? (
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
        ) : null}
          </>
        )}
      </article>
    </div>
  );
}
