"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  inferDietaryYesNo,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { COMMITTEE_MEETING_DAY_GROUPS } from "@/lib/committee-meetings";
import { industryConferenceDayLabels } from "@/lib/registration-event-content";
import { formatStoredCountry } from "@/lib/countries-data";
import { DEFAULT_TIME_ZONE, type AppLocale } from "@/i18n/routing";
import {
  ImportantInfoItem,
  ImportantInfoSection,
  ReturnToHomepageButton,
  SummaryBulletItem,
  SummaryDayBlock,
  SummaryDetailRow,
  SummaryEntryRow,
  SummarySection,
  SummaryTag,
  SummaryWhiteCard,
} from "./summary-primitives";

function formatRegisteredAtDisplay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: DEFAULT_TIME_ZONE,
  }).format(d);
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

/**
 * Post-submit summary on `/register/thank-you` — Figma `1423:48828`
 * (834p Thank you for your registration); Virtual Participation field order /
 * sections — Figma `1499:24041`.
 *
 * Gray inner sections, bullet lists, yellow/cyan tags, light-cyan
 * "Important Information", and "Return to Homepage".
 * Wrap in {@link SummaryWhiteCard} unless `omitOuterShell` (combined with the
 * green banner in the parent).
 */
export function ThankYouSummaryCards({
  payload: d,
  registrantReference,
  registeredAt = null,
  omitOuterShell = false,
}: {
  payload: RegistrationFormValues;
  /** ACK-* (or other) reference shown in Registration Details when known. */
  registrantReference?: string | null;
  /** ISO timestamp from `GET /api/registrations/thank-you-summary`. */
  registeredAt?: string | null;
  /** Parent supplies the outer white card and green success banner above this block. */
  omitOuterShell?: boolean;
}) {
  const locale = useLocale() as AppLocale;
  const tThank = useTranslations("ThankYou");
  const tReg = useTranslations("Registration");
  const tRev = useTranslations("Review");

  const dash = tRev("dash");

  const isConferencePackAudience =
    d.audienceType === "industry" ||
    d.audienceType === "fellow" ||
    d.audienceType === "members";

  function participantCategory(): string {
    if (d.audienceType === "members") {
      const r = d.memberDelegateRole;
      if (r && r in memberDelegateRoleLabels) {
        return memberDelegateRoleLabels[r as keyof typeof memberDelegateRoleLabels];
      }
      return dash;
    }
    if (d.audienceType === "industry") return "Industry Representative";
    if (d.audienceType === "fellow") {
      const g = d.guestType;
      if (g && g in guestTypeLabels) {
        return guestTypeLabels[g as keyof typeof guestTypeLabels];
      }
      return dash;
    }
    return "Virtual Participation";
  }

  function attendanceLabel(): string {
    if (d.attendance === "in_person") return tReg("attendInPerson");
    if (d.attendance === "online") return tReg("attendOnline");
    return tReg("notAttendingFull");
  }

  const jurisdictionDisplay =
    formatStoredCountry(
      (d.jurisdiction?.trim() || d.country || "").trim(),
      locale,
    ) || dash;

  const countryOnlyDisplay =
    formatStoredCountry((d.country ?? "").trim(), locale) || dash;

  const organizationLabelThank =
    d.audienceType === "fellow"
      ? tThank("organizationLabel")
      : tThank("organisationLabel");

  const fullName = isConferencePackAudience
    ? [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
      d.firstName ||
      dash
    : [d.title, d.firstName, d.lastName].filter(Boolean).join(" ") || dash;

  const annualConferenceSelections = isConferencePackAudience
    ? (d.annualConferenceDays ?? []).map((day) => industryConferenceDayLabels[day])
    : [
        "11 November, Wednesday",
        "12 November, Thursday",
        "13 November, Friday",
      ];

  const lunchSelections = isConferencePackAudience
    ? (d.industryLunchDays ?? []).map((day) => industryConferenceDayLabels[day])
    : d.lunchSession === "both"
      ? ["12 November, Thursday", "13 November, Friday"]
      : d.lunchSession === "nov12"
        ? ["12 November, Thursday"]
        : d.lunchSession === "nov13"
          ? ["13 November, Friday"]
          : [tThank("noLunch")];

  const socialEventSelections = isConferencePackAudience
    ? [
        (d.socialEvents ?? []).includes("members_dinner")
          ? {
              label: "Dinner for IAIS Members only - 11 November, Wednesday",
              tag: tThank("socialTagMembersOnly"),
              tone: "yellow" as const,
            }
          : null,
        (d.socialEvents ?? []).includes("conference_reception")
          ? {
              label:
                "Reception for Annual Conference participants - 11 November, Wednesday",
              tag: tThank("socialTagConferenceParticipants"),
              tone: "cyan" as const,
            }
          : null,
      ].filter(
        (event): event is { label: string; tag: string; tone: "yellow" | "cyan" } =>
          event != null,
      )
    : [
        {
          label: "Dinner for IAIS Members only - 11 November, Wednesday",
          tag: tThank("socialTagMembersOnly"),
          tone: "yellow" as const,
        },
        {
          label:
            "Reception for Annual Conference participants - 11 November, Wednesday",
          tag: tThank("socialTagConferenceParticipants"),
          tone: "cyan" as const,
        },
      ];

  const committeeReviewGroups = COMMITTEE_MEETING_DAY_GROUPS.map((group) => ({
    day: group.day,
    meetings: group.meetings.filter((m) =>
      (d.committeeMeetings ?? []).includes(m.id),
    ),
  })).filter((g) => g.meetings.length > 0);

  function dietaryLabel(): string {
    const yn = inferDietaryYesNo(d);
    if (yn !== "yes") {
      // "No special dietary requirements" → just show "—" per Figma's bullet
      // (Figma `1149:41673` lists the dietary value only when chosen).
      return dash;
    }
    if (d.dietary === "vegan") return tReg("dietaryVegan");
    if (d.dietary === "vegetarian") return tReg("dietaryVegetarian");
    if (d.dietary === "halal") return tReg("dietaryHalal");
    if (d.dietary === "gluten_free") return tReg("dietaryGlutenFree");
    if (d.dietary === "other") {
      const detail = d.dietaryOtherDetails?.trim();
      return detail ? `${tReg("dietaryOther")}: ${detail}` : tReg("dietaryOther");
    }
    return dash;
  }

  const email = d.email?.trim() || dash;
  const registrationFeeApplies = tThank("registrationFeeAppliesTag");
  const lunchPrefix = tThank("lunchPrefix");

  const registeredAtDisplay =
    registeredAt?.trim() ? formatRegisteredAtDisplay(registeredAt.trim()) : "";

  const summaryInner = (
    <>
      <SummarySection
        icon="user-bold-24"
        title={tThank("registrationDetailsTitle")}
      >
        {d.audienceType === "industry" || d.audienceType === "fellow" ? (
          <div className="flex flex-col gap-1">
            <SummaryDetailRow
              label={tThank("fullNameLabel")}
              value={fullName}
            />
            <SummaryDetailRow label={tThank("emailLabel") + ":"} value={email} />
            <SummaryDetailRow
              label={`${tThank("countryLabel")}:`}
              value={countryOnlyDisplay}
            />
            <SummaryDetailRow
              label={`${organizationLabelThank}:`}
              value={d.company?.trim() || dash}
            />
            <SummaryDetailRow
              label={tThank("specificRoleLabel")}
              value={participantCategory()}
            />
            <SummaryDetailRow
              label={tThank("attendanceLabel")}
              value={attendanceLabel()}
            />
            {registeredAtDisplay ? (
              <SummaryDetailRow
                label={tThank("registrationDateLabel")}
                value={registeredAtDisplay}
              />
            ) : null}
            {registrantReference?.trim() ? (
              <SummaryDetailRow
                label={tThank("referenceLabel") + ":"}
                value={registrantReference.trim()}
              />
            ) : null}
          </div>
        ) : d.audienceType === "virtual" ? (
          /** Figma `1499:24041` — Virtual Participation: no “Specific Role”; field order matches frame. */
          <div className="flex flex-col gap-1">
            <SummaryDetailRow
              label={tThank("jurisdictionLabel")}
              value={jurisdictionDisplay}
            />
            <SummaryDetailRow
              label={tThank("fullNameLabel")}
              value={fullName}
            />
            <SummaryDetailRow label={`${tThank("emailLabel")}:`} value={email} />
            <SummaryDetailRow
              label={tThank("attendanceLabel")}
              value={attendanceLabel()}
            />
            {registeredAtDisplay ? (
              <SummaryDetailRow
                label={tThank("registrationDateLabel")}
                value={registeredAtDisplay}
              />
            ) : null}
            {registrantReference?.trim() ? (
              <SummaryDetailRow
                label={`${tThank("referenceLabel")}:`}
                value={registrantReference.trim()}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <SummaryDetailRow
              label={tThank("specificRoleLabel")}
              value={participantCategory()}
            />
            <SummaryDetailRow
              label={tThank("jurisdictionLabel")}
              value={jurisdictionDisplay}
            />
            <SummaryDetailRow
              label={tThank("fullNameLabel")}
              value={fullName}
            />
            <SummaryDetailRow label={tThank("emailLabel") + ":"} value={email} />
            <SummaryDetailRow
              label={tThank("attendanceLabel")}
              value={attendanceLabel()}
            />
            {registeredAtDisplay ? (
              <SummaryDetailRow
                label={tThank("registrationDateLabel")}
                value={registeredAtDisplay}
              />
            ) : null}
            {registrantReference?.trim() ? (
              <SummaryDetailRow
                label={tThank("referenceLabel") + ":"}
                value={registrantReference.trim()}
              />
            ) : null}
          </div>
        )}
      </SummarySection>

      {committeeReviewGroups.length > 0 ? (
        <SummarySection
          icon="note-text-bold-24"
          title={tThank("committeeMeetingsTitle")}
        >
          {committeeReviewGroups.map((group) => (
            <SummaryDayBlock key={group.day} day={group.day}>
              {group.meetings.map((m) => (
                <SummaryEntryRow
                  key={m.id}
                  tags={
                    m.tag ? <SummaryTag tone="yellow">{m.tag}</SummaryTag> : null
                  }
                >
                  {m.label}
                </SummaryEntryRow>
              ))}
            </SummaryDayBlock>
          ))}
        </SummarySection>
      ) : null}

      {isConferencePackAudience ? (
        <>
          <SummarySection
            icon="bookmark-2-bold-24"
            title={tThank("annualConferenceTitle")}
          >
            {annualConferenceSelections.length > 0 ? (
              annualConferenceSelections.map((day) => (
                <SummaryBulletItem
                  key={day}
                  tags={<SummaryTag tone="yellow">{registrationFeeApplies}</SummaryTag>}
                >
                  {day}
                </SummaryBulletItem>
              ))
            ) : (
              <SummaryBulletItem>{dash}</SummaryBulletItem>
            )}
          </SummarySection>

          <SummarySection
            icon="fork-spoon-rounded-24"
            title={tThank("lunchSelectionTitle")}
          >
            {lunchSelections.length > 0 ? (
              lunchSelections.map((s) => (
                <SummaryBulletItem key={s}>{`${lunchPrefix}${s}`}</SummaryBulletItem>
              ))
            ) : (
              <SummaryBulletItem>{dash}</SummaryBulletItem>
            )}
          </SummarySection>

          <SummarySection
            icon="bookmark-2-bold-24"
            title={tThank("socialEventsTitle")}
          >
            {socialEventSelections.length > 0 ? (
              socialEventSelections.map((event) => (
                <SummaryBulletItem
                  key={event.label}
                  tags={<SummaryTag tone={event.tone}>{event.tag}</SummaryTag>}
                >
                  {event.label}
                </SummaryBulletItem>
              ))
            ) : (
              <SummaryBulletItem>{dash}</SummaryBulletItem>
            )}
          </SummarySection>

          <SummarySection
            icon="leaf-dietary-24"
            title={tThank("dietaryRequirementsTitle")}
          >
            <SummaryBulletItem>{dietaryLabel()}</SummaryBulletItem>
          </SummarySection>
        </>
      ) : null}

      <ImportantInfoSection title={tThank("importantInformationTitle")}>
        <ImportantInfoItem>
          {tThank("importantInfoConfirmationLead")}
          <a
            href={`mailto:${email}`}
            className="text-[#3e65f5] underline decoration-solid [text-decoration-skip-ink:none]"
          >
            {email}
          </a>
        </ImportantInfoItem>
        <ImportantInfoItem>{tThank("importantInfoSaveEmail")}</ImportantInfoItem>
        <ImportantInfoItem>
          {tThank("importantInfoQuestionsLead")}
          <a
            href="mailto:IAIS2026@amf.gov.al"
            className="text-[#3e65f5] underline decoration-solid [text-decoration-skip-ink:none]"
          >
            IAIS2026@amf.gov.al
          </a>
        </ImportantInfoItem>
      </ImportantInfoSection>

      <ReturnToHomepageButton label={tThank("returnToHomepage")} />
    </>
  );

  if (omitOuterShell) {
    return (
      <div
        className="flex w-full flex-col gap-7"
        data-figma-node="1499:24052"
      >
        {summaryInner}
      </div>
    );
  }

  return <SummaryWhiteCard>{summaryInner}</SummaryWhiteCard>;
}
