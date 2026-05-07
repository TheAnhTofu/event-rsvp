import type { EmailLocale } from "./email-locale";

/** Shared event logistics lines (forum card) for email templates. */
export type ForumEventDetailsCopy = {
  dateTime: string;
  venue: string;
  language: string;
};

const DETAILS: Record<EmailLocale, ForumEventDetailsCopy> = {
  en: {
    dateTime: "12-13 November 2026, 9:00 am - 5:00 pm (HK Time)",
    venue: "Venue: Kerry Hotel Hong Kong",
    language:
      "English, supplemented by Putonghua simultaneous interpretation",
  },
  "zh-Hant": {
    dateTime: "2026年11月12至13日 上午9時至下午5時（香港時間）",
    venue: "地點：香港嘉里酒店",
    language: "英語主講，普通話即時傳譯",
  },
  "zh-Hans": {
    dateTime: "2026年11月12至13日 上午9时至下午5时（香港时间）",
    venue: "地点：香港嘉里酒店",
    language: "英语主讲，普通话同声传译",
  },
};

export function getForumEventDetails(locale: EmailLocale): ForumEventDetailsCopy {
  return DETAILS[locale];
}
