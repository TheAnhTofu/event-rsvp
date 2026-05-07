import registrationEventContent from "@/content/registration-event-content.json";
import { industryEventDayValues } from "@/lib/registration-schema";

export type RefundPolicyContent = (typeof registrationEventContent)["refundPolicy"];

type IndustryDay = (typeof industryEventDayValues)[number];

export type IndustryConferenceDay = {
  value: IndustryDay;
  label: string;
};

/** Editable copy and schedule — see `web/src/content/registration-event-content.json`. */
export const eventContent = registrationEventContent;

export const refundPolicyContent: RefundPolicyContent = eventContent.refundPolicy;

export const industryConferenceDays: readonly IndustryConferenceDay[] =
  eventContent.industryConferenceDays as IndustryConferenceDay[];

export type IndustryConferenceUiDay = {
  value: IndustryDay;
  annualConferenceLabel: string;
  lunchLabel: string;
};

/** Industry + Fellow registration — Figma `1291:8583` / `1291:9437` (Annual Conference + Lunch). */
export const industryConferenceUiDays: readonly IndustryConferenceUiDay[] =
  eventContent.industryConferenceUiDays as IndustryConferenceUiDay[];

for (const row of industryConferenceUiDays) {
  if (!industryEventDayValues.includes(row.value)) {
    throw new Error(
      `registration-event-content.json: industryConferenceUiDays invalid value "${row.value}"`,
    );
  }
}

const labelEntries = industryConferenceDays.map((d) => [d.value, d.label] as const);
const labelKeys = new Set(labelEntries.map(([k]) => k));
for (const v of industryEventDayValues) {
  if (!labelKeys.has(v)) {
    throw new Error(
      `registration-event-content.json: industryConferenceDays missing "${v}"`,
    );
  }
}

/** Display labels for pack-audience conference / lunch day keys (aligned with JSON). */
export const industryConferenceDayLabels: Record<IndustryDay, string> =
  Object.fromEntries(labelEntries) as Record<IndustryDay, string>;

/**
 * Members audience — Figma `1291:17848` Annual Conference: only 12 Nov (full
 * day) and 13 Nov (AM), both with the *Registration Fee Applies* badge.
 */
export type MembersAnnualConferenceOption = {
  value: IndustryDay;
  label: string;
  tag: string;
};

export const membersAnnualConferenceOptions: readonly MembersAnnualConferenceOption[] =
  eventContent.membersAnnualConferenceOptions as MembersAnnualConferenceOption[];
