import type { RegistrationFormValues } from "../../registration-schema.ts";
import type { EmailLocale } from "./email-locale";

const IN_PERSON: Record<EmailLocale, string> = {
  en: "In person",
  "zh-Hant": "現場出席",
  "zh-Hans": "现场出席",
};

const ONLINE: Record<EmailLocale, string> = {
  en: "Online",
  "zh-Hant": "網上",
  "zh-Hans": "网上",
};

const NOT_ATTENDING: Record<EmailLocale, string> = {
  en: "Will not attend",
  "zh-Hant": "不出席",
  "zh-Hans": "不出席",
};

export function attendanceLabelForEmail(
  attendance: RegistrationFormValues["attendance"],
  locale: EmailLocale,
): string {
  switch (attendance) {
    case "in_person":
      return IN_PERSON[locale];
    case "online":
      return ONLINE[locale];
    case "not_attending":
      return NOT_ATTENDING[locale];
    default: {
      const _e: never = attendance;
      return String(_e);
    }
  }
}
