/** Committee meeting multi-select (Figma: IAIS Members registration, node 2:824). */

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

export const committeeMeetingLabels: Record<CommitteeMeetingId, string> = {
  nov9_arc: "AM: Audit and Risk Committee (ARC)",
  nov9_sf: "AM: Supervisory Forum (SF)",
  nov9_pdc: "PM: Policy Development Committee (PDC)",
  nov10_mpc: "AM: Macroprudential Committee (MPC)",
  nov10_swg: "AM: Signatories Working Group (SWG)",
  nov10_iac: "PM: Implementation and Assessment Committee (IAC)",
  nov11_exco: "AM: Executive Committee (ExCo)",
  nov11_agm: "PM: Annual General Meeting (AGM)",
  nov11_post_exco: "PM: Post-AGM ExCo",
};

export type CommitteeMeetingRow = {
  id: CommitteeMeetingId;
  label: string;
  /** Restriction / audience tag (muted blue pill in UI). */
  tag?: string;
};

export const COMMITTEE_MEETING_DAY_GROUPS: {
  day: string;
  meetings: CommitteeMeetingRow[];
}[] = [
  {
    day: "Monday, 9 November",
    meetings: [
      {
        id: "nov9_arc",
        label: committeeMeetingLabels.nov9_arc,
        tag: "Restricted to ARC members",
      },
      { id: "nov9_sf", label: committeeMeetingLabels.nov9_sf },
      { id: "nov9_pdc", label: committeeMeetingLabels.nov9_pdc },
    ],
  },
  {
    day: "Tuesday, 10 November",
    meetings: [
      { id: "nov10_mpc", label: committeeMeetingLabels.nov10_mpc },
      { id: "nov10_swg", label: committeeMeetingLabels.nov10_swg },
      { id: "nov10_iac", label: committeeMeetingLabels.nov10_iac },
    ],
  },
  {
    day: "Wednesday, 11 November",
    meetings: [
      { id: "nov11_exco", label: committeeMeetingLabels.nov11_exco },
      { id: "nov11_agm", label: committeeMeetingLabels.nov11_agm },
      {
        id: "nov11_post_exco",
        label: committeeMeetingLabels.nov11_post_exco,
        tag: "Restricted to ExCo members",
      },
    ],
  },
];
