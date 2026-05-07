import { describe, expect, it } from "vitest";
import {
  createRegistrationSchema,
  defaultRegistrationValues,
  getFeesHkd,
  normalizeFormText,
  REGISTRATION_FEE_IN_PERSON_HKD,
  REGISTRATION_FEE_INDUSTRY_HKD,
  REGISTRATION_FEE_MEMBERS_HKD,
  REGISTRATION_FEE_ONLINE_HKD,
} from "@/lib/registration-schema";

const messages = {
  required: "Required",
  invalidEmail: "Bad email",
  invalidContactEmail: "Bad contact email",
  selectLunch: "Pick lunch",
  selectDietaryYesNo: "Pick yes/no",
  selectDietaryPreference: "Pick preference",
  dietaryOtherRequired: "Specify other dietary",
  alternateContactRequired: "Alt required",
  consentRequired: "Need consent",
  refundPolicyAckRequired: "Need refund ack",
};

const schema = createRegistrationSchema(messages);

/** Minimal valid payload for `audienceType === "virtual"` (committee meetings flow). */
function validBase(overrides: Record<string, unknown> = {}) {
  return {
    ...defaultRegistrationValues,
    audienceType: "virtual" as const,
    attendance: "online" as const,
    title: "Mr",
    firstName: "A",
    lastName: "B",
    company: "Co",
    jobTitle: "Dev",
    email: "a@b.co",
    phoneNumber: "123",
    country: "HK",
    jurisdiction: "HK",
    sameContact: true,
    cpdApply: "no" as const,
    consent: true,
    ...overrides,
  };
}

describe("normalizeFormText", () => {
  it("preserves Traditional Chinese name characters (e.g. 森林林先生)", () => {
    const s = "森林林先生";
    expect(normalizeFormText(s)).toBe(s);
  });
});

describe("createRegistrationSchema", () => {
  it("accepts minimal valid online registration", () => {
    const r = schema.safeParse(validBase());
    expect(r.success).toBe(true);
  });

  it("accepts Traditional Chinese personal and company fields", () => {
    const r = schema.safeParse(
      validBase({
        firstName: "森林林",
        lastName: "先生",
        company: "測試公司",
        jobTitle: "工程師",
      }),
    );
    expect(r.success).toBe(true);
  });

  it("rejects empty personal fields", () => {
    const r = schema.safeParse(validBase({ firstName: "" }));
    expect(r.success).toBe(false);
  });

  it("rejects invalid delegate email", () => {
    const r = schema.safeParse(validBase({ email: "not-an-email" }));
    expect(r.success).toBe(false);
  });

  it("rejects empty delegate email", () => {
    const r = schema.safeParse(validBase({ email: "" }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("email"))).toBe(true);
    }
  });

  it("rejects simple-audience lunch days that are not selected conference days", () => {
    const r = schema.safeParse(
      validBase({
        audienceType: "industry",
        attendance: "in_person",
        firstName: "A",
        email: "a@b.co",
        country: "HK",
        company: "Co",
        consent: true,
        refundPolicyAck: true,
        annualConferenceDays: ["nov12"],
        industryLunchDays: ["nov12", "nov13"],
      }),
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "industryLunchDays")).toBe(
        true,
      );
    }
  });

  it("accepts simple-audience lunch days that match selected conference days", () => {
    const r = schema.safeParse(
      validBase({
        audienceType: "industry",
        attendance: "in_person",
        firstName: "A",
        email: "a@b.co",
        country: "HK",
        company: "Co",
        consent: true,
        refundPolicyAck: true,
        annualConferenceDays: ["nov12", "nov13"],
        industryLunchDays: ["nov13"],
      }),
    );
    expect(r.success).toBe(true);
  });

  it("requires consent true", () => {
    const r = schema.safeParse(validBase({ consent: false }));
    expect(r.success).toBe(false);
  });

  it("accepts fellow simple-audience without refund acknowledgement (Figma 1291:9461)", () => {
    const r = schema.safeParse({
      ...defaultRegistrationValues,
      audienceType: "fellow" as const,
      attendance: "in_person" as const,
      guestType: "press" as const,
      firstName: "A",
      email: "a@b.co",
      country: "HK",
      company: "Co",
      consent: true,
      refundPolicyAck: false,
      annualConferenceDays: ["nov12"],
      industryLunchDays: ["nov12"],
    });
    expect(r.success).toBe(true);
  });

});

describe("getFeesHkd", () => {
  it("returns selected homepage audience fee when audience type is provided", () => {
    expect(getFeesHkd("in_person", { audienceType: "members" })).toBe(
      REGISTRATION_FEE_MEMBERS_HKD,
    );
    expect(getFeesHkd("in_person", { audienceType: "industry" })).toBe(
      REGISTRATION_FEE_INDUSTRY_HKD,
    );
    expect(getFeesHkd("in_person", { audienceType: "fellow" })).toBe(0);
    expect(getFeesHkd("online", { audienceType: "virtual" })).toBe(0);
    expect(getFeesHkd("not_attending", { audienceType: "members" })).toBe(0);
  });

  it("returns per-tier HKD fees (in_person vs online constants)", () => {
    expect(getFeesHkd("in_person")).toBe(REGISTRATION_FEE_IN_PERSON_HKD);
    expect(getFeesHkd("online")).toBe(REGISTRATION_FEE_ONLINE_HKD);
    expect(getFeesHkd("not_attending")).toBe(0);
  });

  it("matches live flag (same amounts as base)", () => {
    expect(getFeesHkd("in_person", { liveMode: true })).toBe(
      REGISTRATION_FEE_IN_PERSON_HKD,
    );
    expect(getFeesHkd("online", { liveMode: true })).toBe(
      REGISTRATION_FEE_ONLINE_HKD,
    );
    expect(getFeesHkd("not_attending", { liveMode: true })).toBe(0);
  });
});
