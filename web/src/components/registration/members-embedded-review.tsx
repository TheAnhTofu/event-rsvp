"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import {
  formatRegistrationFeeLeadLine,
  getFeesHkd,
  inferDietaryYesNo,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { COMMITTEE_MEETING_DAY_GROUPS } from "@/lib/committee-meetings";
import {
  membersAnnualConferenceOptions,
  refundPolicyContent,
} from "@/lib/registration-event-content";
import { FigmaIcon } from "@/components/icons/figma-icon";
import type { AppLocale } from "@/i18n/routing";
import { formatStoredCountry } from "@/lib/countries-data";
import {
  DayGroup,
  InlineReviewLink,
  LabelAbove,
} from "@/components/registration/registration-review-primitives";

const memberDelegateRoleLabels = {
  iais_member: "IAIS Member",
  iais_secretariat: "IAIS Secretariat",
  amf: "Hong Kong Insurance Authority",
} as const;

/** Figma `1296:40503` — white-row tick + optional yellow / cyan pill tags. */
function MemberReviewTickRow({
  children,
  tag,
  tagTone = "yellow",
}: {
  children: ReactNode;
  tag?: string;
  tagTone?: "yellow" | "blue";
}) {
  return (
    <div className="flex w-full items-start gap-2 rounded-lg bg-white">
      <FigmaIcon
        name="fill-checkmark-circle"
        size={24}
        className="mt-0.5 size-6 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="text-[15px] leading-6 text-[#333]">{children}</span>
        {tag ? (
          <span
            className={[
              "shrink-0 rounded-[4px] px-1.5 py-1.5 text-[13px] font-bold leading-none",
              tagTone === "blue"
                ? "bg-[#0ccaef] text-white"
                : "bg-[#febf05] text-[#333]",
            ].join(" ")}
          >
            {tag}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MembersMutedPanel({ children }: { children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-4 rounded-[16px] bg-[#f8f9fa] p-5">
      {children}
    </section>
  );
}

function MembersBlueHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[22px] font-bold leading-normal text-[#0356af]">
      {children}
    </h2>
  );
}

/**
 * Wizard-only IAIS Members review — layout from Figma `1296:40503`
 * (1440p IAIS Members, IAIS Secretariat, AMF).
 */
export function MembersEmbeddedReview() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Registration");
  const tRev = useTranslations("Review");
  const tThank = useTranslations("ThankYou");
  const { watch } = useFormContext<RegistrationFormValues>();
  const d = watch();
  const cancelEmail = refundPolicyContent.cancellationEmail;

  function participantCategory() {
    const r = d.memberDelegateRole;
    if (r && r in memberDelegateRoleLabels) {
      return memberDelegateRoleLabels[r as keyof typeof memberDelegateRoleLabels];
    }
    return tRev("dash");
  }

  function labelDietaryYesNo(): string {
    const yn = inferDietaryYesNo(d);
    if (yn === "yes") return t("yes");
    if (yn === "no") return t("no");
    return tRev("dash");
  }

  function dietaryChoiceLabel(): string {
    if (d.dietary === "vegan") return t("dietaryVegan");
    if (d.dietary === "vegetarian") return t("dietaryVegetarian");
    if (d.dietary === "halal") return t("dietaryHalal");
    if (d.dietary === "gluten_free") return t("dietaryGlutenFree");
    if (d.dietary === "other") {
      const detail = d.dietaryOtherDetails?.trim();
      return detail ? `${t("dietaryOther")}: ${detail}` : t("dietaryOther");
    }
    return tRev("dash");
  }

  const showDietaryChoiceReview = inferDietaryYesNo(d) === "yes";
  const jurisdictionDisplay =
    formatStoredCountry(
      (d.jurisdiction?.trim() || d.country || "").trim(),
      locale,
    ) || tRev("dash");

  const fullName =
    [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
    d.firstName?.trim() ||
    tRev("dash");

  const committeeReviewGroups = COMMITTEE_MEETING_DAY_GROUPS.map((group) => ({
    day: group.day,
    meetings: group.meetings.filter((m) =>
      (d.committeeMeetings ?? []).includes(m.id),
    ),
  })).filter((g) => g.meetings.length > 0);

  const participationFeeHkd = getFeesHkd(d.attendance, {
    audienceType: d.audienceType,
  });

  const annualConferenceRows = (d.annualConferenceDays ?? [])
    .map((day) => membersAnnualConferenceOptions.find((o) => o.value === day))
    .filter((row): row is NonNullable<typeof row> => row != null);

  const lunchSelections =
    d.lunchSession === "both"
      ? ["12 November, Thursday", "13 November, Friday"]
      : d.lunchSession === "nov12"
        ? ["12 November, Thursday"]
        : d.lunchSession === "nov13"
          ? ["13 November, Friday"]
          : ["No lunch"];

  const socialEventSelections = [
    (d.socialEvents ?? []).includes("members_dinner")
      ? {
          label: t("socialEventMembersDinner"),
          tag: t("socialTagMembersOnly"),
          tagTone: "yellow" as const,
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
    (e): e is NonNullable<typeof e> => e != null,
  );

  const carbonOffsetReview =
    d.carbonOffset === "yes"
      ? t("yes")
      : d.carbonOffset === "no"
        ? t("no")
        : d.carbonOffset === "not_available"
          ? t("carbonOffsetNotAvailable")
          : tRev("dash");

  return (
    <div className="flex w-full flex-col gap-9">
      <p className="text-[16px] leading-6 text-[#333]">
        {formatRegistrationFeeLeadLine(participationFeeHkd)}
      </p>

      <div className="flex w-full flex-col gap-4">
        <LabelAbove label={t("delegateRolePrompt")} labelTone="inkBold">
          <MemberReviewTickRow>{participantCategory()}</MemberReviewTickRow>
        </LabelAbove>

        <LabelAbove label="Jurisdiction" required labelTone="inkBold">
          {jurisdictionDisplay}
        </LabelAbove>

        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <LabelAbove label="Full Name" required labelTone="inkBold">
            {fullName}
          </LabelAbove>
          <LabelAbove label={tThank("emailLabel")} required labelTone="inkBold">
            {d.email || tRev("dash")}
          </LabelAbove>
        </div>
      </div>

      <MembersMutedPanel>
        <div className="flex flex-col gap-2">
          <MembersBlueHeading>{tThank("committeeMeetingsTitle")}</MembersBlueHeading>
          <p className="text-[15px] leading-normal text-[#4b4b4b]">
            {tThank("committeeMeetingsDescription")}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {committeeReviewGroups.length > 0 ? (
            committeeReviewGroups.map((group) => (
              <DayGroup key={group.day} day={group.day}>
                {group.meetings.map((m) => (
                  <MemberReviewTickRow key={m.id} tag={m.tag}>
                    {m.label}
                  </MemberReviewTickRow>
                ))}
              </DayGroup>
            ))
          ) : (
            <MemberReviewTickRow>{tRev("dash")}</MemberReviewTickRow>
          )}
        </div>
      </MembersMutedPanel>

      <div className="flex flex-col gap-4">
        <MembersBlueHeading>{tThank("annualConferenceTitle")}</MembersBlueHeading>
        <p className="text-[15px] leading-[30px] text-[#333]">
          {tThank("annualConferenceSelectPrompt")}
        </p>
        <div className="flex flex-col gap-3">
          {annualConferenceRows.length > 0 ? (
            annualConferenceRows.map((row) => (
              <MemberReviewTickRow key={row.value} tag={row.tag}>
                {row.label}
              </MemberReviewTickRow>
            ))
          ) : (
            <MemberReviewTickRow>{tRev("dash")}</MemberReviewTickRow>
          )}
        </div>

        <MembersMutedPanel>
          <div className="flex flex-col gap-2">
            <MembersBlueHeading>{tThank("lunchSelectionTitle")}</MembersBlueHeading>
            <p className="text-[15px] leading-normal text-[#4b4b4b]">
              {t("lunchReviewIntroPlain")}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {lunchSelections.map((selection) => (
              <MemberReviewTickRow key={selection}>{selection}</MemberReviewTickRow>
            ))}
          </div>
        </MembersMutedPanel>
      </div>

      <div className="flex flex-col gap-4">
        <MembersBlueHeading>{tThank("socialEventsTitle")}</MembersBlueHeading>
        <div className="text-[15px] leading-normal text-[#4b4b4b]">
          <ReviewLunchSocialIntroNoteEmbedded cancelEmail={cancelEmail} />
        </div>
        <div className="flex flex-col gap-4">
          {socialEventSelections.length > 0 ? (
            socialEventSelections.map((event) => (
              <MemberReviewTickRow
                key={event.label}
                tag={event.tag}
                tagTone={event.tagTone}
              >
                {event.label}
              </MemberReviewTickRow>
            ))
          ) : (
            <MemberReviewTickRow>{tRev("dash")}</MemberReviewTickRow>
          )}
        </div>
      </div>

      <MembersMutedPanel>
        <MembersBlueHeading>{tThank("dietaryRequirementsTitle")}</MembersBlueHeading>
        <MemberReviewTickRow>
          {showDietaryChoiceReview ? dietaryChoiceLabel() : labelDietaryYesNo()}
        </MemberReviewTickRow>
        {d.dietary === "other" ? (
          <LabelAbove label={tThank("dietarySpecifyLabel")} labelTone="inkBold">
            {d.dietaryOtherDetails?.trim() || tRev("dash")}
          </LabelAbove>
        ) : null}
      </MembersMutedPanel>

      {d.invitationLetterRequested ? (
        <div className="flex flex-col gap-2">
          <MemberReviewTickRow>{t("visaLetterLabel")}</MemberReviewTickRow>
          <p className="text-[15px] leading-normal text-[#4b4b4b]">
            {t.rich("visaLetterHelpRich", {
              link: (chunks) => (
                <InlineReviewLink href="https://www.ia.org.hk/en/aboutus/useful_links.html">
                  {chunks}
                </InlineReviewLink>
              ),
            })}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <MembersBlueHeading>{t("travelInformationTitle")}</MembersBlueHeading>
          <p className="text-[15px] leading-normal text-[#4b4b4b]">
            {t("travelInformationIntro")}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LabelAbove label={t("travelCityLabel")} labelTone="inkBold">
            {d.cityOfDeparture?.trim() || tRev("dash")}
          </LabelAbove>
          <LabelAbove label={t("travelMeansLabel")} labelTone="inkBold">
            {d.meansOfTransportation?.trim() || tRev("dash")}
          </LabelAbove>
        </div>
        <LabelAbove label={t("travelCarbonQuestion")} labelTone="inkBold">
          <MemberReviewTickRow>{carbonOffsetReview}</MemberReviewTickRow>
        </LabelAbove>
      </div>
    </div>
  );
}

/** Figma `1296:40503` Social block — linked organising team (distinct from Lunch plain intro). */
function ReviewLunchSocialIntroNoteEmbedded({
  cancelEmail,
}: {
  cancelEmail: string;
}) {
  return (
    <p>
      Please only select the lunches that you will actually attend as late
      cancellations or &quot;no shows&quot; on the day may result in food waste
      and unnecessary charges for the host. Please update your registration or
      contact{" "}
      <InlineReviewLink href={`mailto:${cancelEmail}`}>
        the organising team
      </InlineReviewLink>{" "}
      if any changes to the registration are required.
    </p>
  );
}
