/** Committee meeting multi-select (Figma: IAIS Members registration, node 2:824). */

import eventContent from "@/content/registration-event-content.json";

export const committeeMeetingValues = [
  "nov9_arc",
  "nov9_sf",
  "nov9_pdc",
  "nov10_mpc",
  "nov10_swg",
  "nov10_iac",
  "nov11_exco",
  "nov11_agm",
  "nov11_post_exco",
] as const;

export type CommitteeMeetingId = (typeof committeeMeetingValues)[number];

export type CommitteeMeetingRow = {
  id: CommitteeMeetingId;
  label: string;
  /** Restriction / audience tag (muted blue pill in UI). */
  tag?: string;
};

const jsonGroups = eventContent.committeeMeetingDayGroups;

const jsonIds = jsonGroups.flatMap((g) => g.meetings.map((m) => m.id));
for (const id of committeeMeetingValues) {
  if (!jsonIds.includes(id)) {
    throw new Error(
      `registration-event-content.json: missing committee meeting id "${id}"`,
    );
  }
}
for (const id of jsonIds) {
  if (!committeeMeetingValues.includes(id as CommitteeMeetingId)) {
    throw new Error(
      `registration-event-content.json: unknown committee meeting id "${id}"`,
    );
  }
}

export const COMMITTEE_MEETING_DAY_GROUPS: {
  day: string;
  meetings: CommitteeMeetingRow[];
}[] = jsonGroups.map((group) => ({
  day: group.day,
  meetings: group.meetings.map((m) => ({
    id: m.id as CommitteeMeetingId,
    label: m.label,
    ...(m.tag ? { tag: m.tag } : {}),
  })),
}));

export const committeeMeetingLabels = COMMITTEE_MEETING_DAY_GROUPS.flatMap(
  (g) => g.meetings,
).reduce(
  (acc, row) => {
    acc[row.id] = row.label;
    return acc;
  },
  {} as Record<CommitteeMeetingId, string>,
);
