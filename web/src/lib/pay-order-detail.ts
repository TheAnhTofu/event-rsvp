import {
  inferDietaryYesNo,
  type RegistrationFormValues,
} from "@/lib/registration-schema";

/** Conference schedule lines for Order Detail (in person: from Registration copy). */
export function getEventScheduleLines(
  d: RegistrationFormValues,
  tPay: (key: string) => string,
  tReg: (key: string) => string,
): string[] {
  switch (d.attendance) {
    case "in_person": {
      const row = tReg("conferenceDatesRow");
      const parts = row.split(/\s*&\s*/).map((s) => s.trim()).filter(Boolean);
      return parts.length > 0 ? parts : [row];
    }
    case "online":
      return [tPay("datesBlockOnline")];
    case "not_attending":
      return [tPay("datesBlockNotAttending")];
  }
}

export type LunchOrderLines = {
  label: string;
  whenLines: string[];
};

/** Lunch row on Order Detail: only when in person and a lunch day is selected. */
export function getLunchOrderLines(
  d: RegistrationFormValues,
  tPay: (key: string) => string,
  tReg: (key: string) => string,
): LunchOrderLines | null {
  if (d.attendance !== "in_person") return null;
  if (!d.lunchSession || d.lunchSession === "none") return null;
  const yn = inferDietaryYesNo(d);
  const diet =
    yn === "no"
      ? tReg("dietaryNone")
      : d.dietary === "vegan"
        ? tReg("dietaryVegan")
        : d.dietary === "vegetarian"
          ? tReg("dietaryVegetarian")
          : d.dietary === "halal"
            ? tReg("dietaryHalal")
            : d.dietary === "gluten_free"
              ? tReg("dietaryGlutenFree")
              : d.dietary === "other"
              ? `${tReg("dietaryOther")}${
                  d.dietaryOtherDetails?.trim()
                    ? ` (${d.dietaryOtherDetails.trim()})`
                    : ""
                }`
              : tReg("dietaryNone");
  if (d.lunchSession === "nov12") {
    return {
      label: `${tPay("lunchPrefixNov12")}${diet}`,
      whenLines: [tPay("lunchScheduleNov12")],
    };
  }
  if (d.lunchSession === "nov13") {
    return {
      label: `${tPay("lunchPrefixNov13")}${diet}`,
      whenLines: [tPay("lunchScheduleNov13")],
    };
  }
  if (d.lunchSession === "both") {
    return {
      label: `${tPay("lunchPrefixBoth")}${diet}`,
      whenLines: [tPay("lunchScheduleNov12"), tPay("lunchScheduleNov13")],
    };
  }
  return null;
}
