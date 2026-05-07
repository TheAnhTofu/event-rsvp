/** Mirror `web/src/lib/registration-schema.ts` — keep in sync. */
import { z } from "zod";
import { committeeMeetingValues } from "./committee-meetings.js";
import { loadRootEnv } from "../load-root-env.js";

export { committeeMeetingValues };
import {
  getEffectiveStripeLiveMode,
  refreshRuntimeSettingsCache,
} from "./app-runtime-settings-cache.js";

/** Same repo-root `.env.local` as Next.js — fee env must load before reading `process.env`. */
loadRootEnv();

/** NFC + zero-width strip + full-width space — keep in sync with `web/src/lib/registration-schema.ts`. */
export function normalizeFormText(input: string): string {
  return input
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u3000/g, " ")
    .trim();
}
export const attendanceValues = ["in_person", "online", "not_attending"] as const;
export const audienceTypeValues = ["members", "industry", "fellow", "virtual"] as const;

/** Figma Personal Details — delegate category (members flow). */
export const memberDelegateRoleValues = [
  "iais_member",
  "iais_secretariat",
  "amf",
] as const;

export const lunchValues = ["nov12", "nov13", "both", "none"] as const;
export const industryEventDayValues = [
  "nov9",
  "nov10",
  "nov11",
  "nov12",
  "nov13",
] as const;
export const industrySocialEventValues = [
  "members_dinner",
  "conference_reception",
] as const;
export const guestTypeValues = [
  "distinguished_fellow",
  "press",
  "consumer_group",
  "external_speaker",
] as const;
export const dietaryYesNoValues = ["yes", "no"] as const;
export const dietaryChoiceValues = [
  "vegan",
  "vegetarian",
  "halal",
  "gluten_free",
  "other",
] as const;

/** Lunch day(s) selected — dietary required; "none" or unset skips dietary. Mirror web. */
export function lunchSessionRequiresDietary(
  lunchSession: (typeof lunchValues)[number] | undefined,
): boolean {
  return (
    lunchSession === "nov12" ||
    lunchSession === "nov13" ||
    lunchSession === "both"
  );
}

export function inferDietaryYesNo(d: {
  dietaryYesNo?: (typeof dietaryYesNoValues)[number];
  dietary?: string;
}): "yes" | "no" | undefined {
  if (d.dietaryYesNo === "yes" || d.dietaryYesNo === "no") return d.dietaryYesNo;
  if (d.dietary === "none") return "no";
  if (
    d.dietary === "vegan" ||
    d.dietary === "vegetarian" ||
    d.dietary === "halal" ||
    d.dietary === "gluten_free" ||
    d.dietary === "other"
  ) {
    return "yes";
  }
  return undefined;
}

export function migrateRegistrationDietaryPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = { ...(raw as Record<string, unknown>) };
  if (o.audienceType == null) {
    o.audienceType = "members";
  }
  if (o.dietaryYesNo == null) {
    if (o.dietary === "none") {
      o.dietaryYesNo = "no";
      o.dietary = undefined;
    } else if (
      o.dietary === "vegan" ||
      o.dietary === "vegetarian" ||
      o.dietary === "halal" ||
      o.dietary === "gluten_free" ||
      o.dietary === "other"
    ) {
      o.dietaryYesNo = "yes";
    }
  }
  if (o.audienceType === "members") {
    if (o.refundPolicyAck == null) o.refundPolicyAck = false;
    if (o.invitationLetterRequested == null) o.invitationLetterRequested = false;
    if (!Array.isArray(o.committeeMeetings)) o.committeeMeetings = [];
    const j =
      typeof o.jurisdiction === "string" ? String(o.jurisdiction).trim() : "";
    const c =
      typeof o.country === "string" ? String(o.country).trim() : "";
    if (!j && c) o.jurisdiction = o.country;
    if (!c && j) o.country = o.jurisdiction;
  }
  if (o.audienceType === "virtual") {
    if (o.invitationLetterRequested == null) o.invitationLetterRequested = false;
    if (!Array.isArray(o.committeeMeetings)) o.committeeMeetings = [];
    const j =
      typeof o.jurisdiction === "string" ? String(o.jurisdiction).trim() : "";
    const c =
      typeof o.country === "string" ? String(o.country).trim() : "";
    if (!j && c) o.jurisdiction = o.country;
    if (!c && j) o.country = o.jurisdiction;
  }
  if (o.audienceType === "industry" || o.audienceType === "fellow") {
    if (o.invitationLetterRequested == null) o.invitationLetterRequested = false;
    if (o.refundPolicyAck == null) o.refundPolicyAck = false;
    if (Array.isArray(o.socialEvents)) {
      o.socialEvents = o.socialEvents.filter((e) => e !== "members_dinner");
    }
  }
  return o;
}

export type RegistrationFormValues = {
  audienceType: (typeof audienceTypeValues)[number];
  attendance: (typeof attendanceValues)[number];
  memberDelegateRole?: (typeof memberDelegateRoleValues)[number];
  jurisdiction?: string;
  committeeMeetings?: (typeof committeeMeetingValues)[number][];
  lunchSession?: (typeof lunchValues)[number];
  annualConferenceDays?: (typeof industryEventDayValues)[number][];
  industryLunchDays?: (typeof industryEventDayValues)[number][];
  socialEvents?: (typeof industrySocialEventValues)[number][];
  guestType?: (typeof guestTypeValues)[number];
  dietaryYesNo?: (typeof dietaryYesNoValues)[number];
  dietary?: (typeof dietaryChoiceValues)[number];
  dietaryOtherDetails: string;
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  country: string;
  sameContact: boolean;
  contactTitle?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactCompany?: string;
  contactJobTitle?: string;
  contactEmail?: string;
  contactPhoneCountry?: string;
  contactPhoneNumber?: string;
  contactCountry?: string;
  cityOfDeparture?: string;
  meansOfTransportation?: string;
  carbonOffset?: "yes" | "no" | "not_available";
  cpdApply: "yes" | "no";
  refundPolicyAck?: boolean;
  invitationLetterRequested?: boolean;
  consent: boolean;
};

export type ValidationMessages = {
  required: string;
  invalidEmail: string;
  invalidContactEmail: string;
  selectLunch: string;
  selectDietaryYesNo: string;
  selectDietaryPreference: string;
  dietaryOtherRequired: string;
  alternateContactRequired: string;
  consentRequired: string;
  refundPolicyAckRequired: string;
};

export function createRegistrationSchema(m: ValidationMessages) {
  const reqText = (msg: string) =>
    z.string().transform(normalizeFormText).pipe(z.string().min(1, msg));
  const optText = z.preprocess(
    (v) => (typeof v === "string" ? normalizeFormText(v) : v),
    z.string().optional(),
  );
  const base = z
    .object({
      attendance: z.enum(attendanceValues),
      audienceType: z.enum(audienceTypeValues),
      memberDelegateRole: z.enum(memberDelegateRoleValues).optional(),
      jurisdiction: optText,
      committeeMeetings: z.array(z.enum(committeeMeetingValues)).optional(),
      lunchSession: z.enum(lunchValues).optional(),
      annualConferenceDays: z.array(z.enum(industryEventDayValues)).optional(),
      industryLunchDays: z.array(z.enum(industryEventDayValues)).optional(),
      socialEvents: z.array(z.enum(industrySocialEventValues)).optional(),
      guestType: z.enum(guestTypeValues).optional(),
      dietaryYesNo: z.enum(dietaryYesNoValues).optional(),
      dietary: z.enum(dietaryChoiceValues).optional(),
      dietaryOtherDetails: z
        .string()
        .optional()
        .transform((s) => normalizeFormText(s ?? "")),
      title: optText,
      firstName: z.string().transform(normalizeFormText),
      lastName: optText,
      company: z.string().transform(normalizeFormText),
      jobTitle: optText,
      email: z
        .string()
        .transform(normalizeFormText)
        .pipe(
          z
            .string()
            .min(1, m.required)
            .refine(
              (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
              m.invalidEmail,
            ),
        ),
      phoneCountry: optText,
      phoneNumber: optText,
      country: z.string().transform(normalizeFormText),
      sameContact: z.boolean(),
      contactTitle: optText,
      contactFirstName: optText,
      contactLastName: optText,
      contactCompany: optText,
      contactJobTitle: optText,
      contactEmail: optText,
      contactPhoneCountry: optText,
      contactPhoneNumber: optText,
      contactCountry: optText,
      cityOfDeparture: optText,
      meansOfTransportation: optText,
      carbonOffset: z.enum(["yes", "no", "not_available"]).optional(),
      cpdApply: z.enum(["yes", "no"]),
      refundPolicyAck: z.boolean().optional(),
      invitationLetterRequested: z.boolean().optional(),
      consent: z.boolean().refine((v) => v === true, {
        message: m.consentRequired,
      }),
    })
    .superRefine((data, ctx) => {
      if (data.audienceType === "members") {
        if (!data.memberDelegateRole) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: ["memberDelegateRole"],
          });
        }
        const jur = data.jurisdiction?.trim() ?? "";
        if (!jur) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: ["jurisdiction"],
          });
        }
        if (!data.firstName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: ["firstName"],
          });
        }
        if (!data.refundPolicyAck) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.refundPolicyAckRequired,
            path: ["refundPolicyAck"],
          });
        }
        // Figma `1291:17848` Dietary requirements has no `*` — optional for
        // Members. Only validate downstream rules when the user picks a value.
        if (data.dietaryYesNo === "yes") {
          if (!data.dietary) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: m.selectDietaryPreference,
              path: ["dietary"],
            });
          }
          if (
            data.dietary === "other" &&
            (!data.dietaryOtherDetails ||
              normalizeFormText(data.dietaryOtherDetails) === "")
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: m.dietaryOtherRequired,
              path: ["dietaryOtherDetails"],
            });
          }
        }
        // Figma `1218:6859` — Members lunch days are INDEPENDENT of annual
        // conference attendance; no cross-field validation.
        return;
      }
      if (data.audienceType === "virtual") {
        const jur = data.jurisdiction?.trim() ?? "";
        if (!jur) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: ["jurisdiction"],
          });
        }
        if (!data.firstName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: ["firstName"],
          });
        }
        return;
      }
      if (data.audienceType === "industry" || data.audienceType === "fellow") {
        const industryRequired = [
          ["firstName", data.firstName],
          ["email", data.email],
          ["country", data.country],
          ["company", data.company],
        ] as const;
        for (const [path, val] of industryRequired) {
          if (!val || String(val).trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: m.required,
              path: [path],
            });
          }
        }
        if (data.audienceType === "fellow" && !data.guestType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: ["guestType"],
          });
        }
        /* Figma `1291:9461` (Fellow): refund acknowledgement block omitted — industry only. */
        if (data.audienceType === "industry" && !data.refundPolicyAck) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.refundPolicyAckRequired,
            path: ["refundPolicyAck"],
          });
        }
        const annualDays = new Set(data.annualConferenceDays ?? []);
        const hasInvalidLunchDay = (data.industryLunchDays ?? []).some(
          (day) => !annualDays.has(day),
        );
        if (hasInvalidLunchDay) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: ["industryLunchDays"],
          });
        }
        return;
      }
      const delegateRequired = [
        ["title", data.title],
        ["firstName", data.firstName],
        ["lastName", data.lastName],
        ["company", data.company],
        ["jobTitle", data.jobTitle],
        ["phoneCountry", data.phoneCountry],
        ["phoneNumber", data.phoneNumber],
        ["country", data.country],
      ] as const;
      for (const [path, val] of delegateRequired) {
        if (!val || String(val).trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.required,
            path: [path],
          });
        }
      }
      if (data.attendance === "in_person") {
        if (!data.lunchSession) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.selectLunch,
            path: ["lunchSession"],
          });
        }
        if (lunchSessionRequiresDietary(data.lunchSession)) {
          if (!data.dietaryYesNo) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: m.selectDietaryYesNo,
              path: ["dietaryYesNo"],
            });
          }
          if (data.dietaryYesNo === "yes") {
            if (!data.dietary) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: m.selectDietaryPreference,
                path: ["dietary"],
              });
            }
            if (
              data.dietary === "other" &&
              (!data.dietaryOtherDetails ||
                normalizeFormText(data.dietaryOtherDetails) === "")
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: m.dietaryOtherRequired,
                path: ["dietaryOtherDetails"],
              });
            }
          }
        }
      }
      if (!data.sameContact) {
        const need = [
          ["contactTitle", data.contactTitle],
          ["contactFirstName", data.contactFirstName],
          ["contactLastName", data.contactLastName],
        ] as const;
        for (const [path, val] of need) {
          if (!val || String(val).trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: m.alternateContactRequired,
              path: [path],
            });
          }
        }
        if (
          data.contactEmail &&
          data.contactEmail.trim() !== "" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: m.invalidContactEmail,
            path: ["contactEmail"],
          });
        }
      }
    });

  return z.preprocess(migrateRegistrationDietaryPayload, base);
}

export const defaultRegistrationValues: RegistrationFormValues = {
  audienceType: "members",
  attendance: "in_person",
  memberDelegateRole: undefined,
  jurisdiction: "",
  committeeMeetings: [],
  lunchSession: undefined,
  annualConferenceDays: [],
  industryLunchDays: [],
  socialEvents: [],
  guestType: undefined,
  dietaryYesNo: undefined,
  dietary: undefined,
  dietaryOtherDetails: "",
  title: "",
  firstName: "",
  lastName: "",
  company: "",
  jobTitle: "",
  email: "",
  phoneCountry: "HK",
  phoneNumber: "",
  country: "HK",
  sameContact: true,
  contactTitle: "",
  contactFirstName: "",
  contactLastName: "",
  contactCompany: "",
  contactJobTitle: "",
  contactEmail: "",
  contactPhoneCountry: "HK",
  contactPhoneNumber: "",
  contactCountry: "",
  cityOfDeparture: "",
  meansOfTransportation: "",
  carbonOffset: undefined,
  cpdApply: "no",
  refundPolicyAck: false,
  invitationLetterRequested: false,
  consent: false,
};

function readFeeHkdFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Base fees (HKD) per homepage audience.
 * Simple in_person / online base tiers are fixed in code; mirror `web/src/lib/registration-schema.ts`.
 */
export const REGISTRATION_FEE_IN_PERSON_HKD = 15;
export const REGISTRATION_FEE_ONLINE_HKD = 10;

export const REGISTRATION_FEE_MEMBERS_HKD = readFeeHkdFromEnv(
  "NEXT_PUBLIC_REGISTRATION_FEE_MEMBERS_HKD",
  8500,
);
export const REGISTRATION_FEE_INDUSTRY_HKD = readFeeHkdFromEnv(
  "NEXT_PUBLIC_REGISTRATION_FEE_INDUSTRY_HKD",
  6000,
);
export const REGISTRATION_FEE_FELLOW_HKD = readFeeHkdFromEnv(
  "NEXT_PUBLIC_REGISTRATION_FEE_FELLOW_HKD",
  0,
);
export const REGISTRATION_FEE_VIRTUAL_HKD = readFeeHkdFromEnv(
  "NEXT_PUBLIC_REGISTRATION_FEE_VIRTUAL_HKD",
  0,
);

export function getFeesHkd(
  attendance: (typeof attendanceValues)[number],
  options?: {
    liveMode?: boolean;
    audienceType?: (typeof audienceTypeValues)[number];
  },
): number {
  if (attendance === "not_attending") return 0;

  switch (options?.audienceType) {
    case "members":
      return REGISTRATION_FEE_MEMBERS_HKD;
    case "industry":
      return REGISTRATION_FEE_INDUSTRY_HKD;
    case "fellow":
      return REGISTRATION_FEE_FELLOW_HKD;
    case "virtual":
      return REGISTRATION_FEE_VIRTUAL_HKD;
  }

  switch (attendance) {
    case "in_person":
      return REGISTRATION_FEE_IN_PERSON_HKD;
    case "online":
      return REGISTRATION_FEE_ONLINE_HKD;
  }
}

/** Uses DB runtime config + env so fees match PaymentIntent / draft rows. */
export async function resolveFeesHkdForApi(
  attendance: (typeof attendanceValues)[number],
  audienceType?: (typeof audienceTypeValues)[number],
): Promise<number> {
  await refreshRuntimeSettingsCache();
  return getFeesHkd(attendance, {
    liveMode: getEffectiveStripeLiveMode(),
    audienceType,
  });
}
