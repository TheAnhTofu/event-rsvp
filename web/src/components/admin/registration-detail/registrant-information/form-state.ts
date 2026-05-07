import { inferDietaryYesNo } from "@/lib/registration-schema";
import type { RegistrationDetailResponse } from "@/types/crm";
import { bool, str } from "./utils";

export type RegistrantInfoFormState = {
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  country: string;
  attendance: string;
  sameContact: boolean;
  contactTitle: string;
  contactFirstName: string;
  contactLastName: string;
  contactCompany: string;
  contactJobTitle: string;
  contactEmail: string;
  contactPhoneCountry: string;
  contactPhoneNumber: string;
  dietaryYesNo: "yes" | "no";
  dietary: string;
  dietaryOtherDetails: string;
  cpdApply: "yes" | "no";
  consent: boolean;
};

export function formStateFromRow(row: RegistrationDetailResponse): RegistrantInfoFormState {
  const p = row.payload;
  const yesNoRaw = str(p, "dietaryYesNo");
  const dietaryRaw = str(p, "dietary");
  const inferred = inferDietaryYesNo({
    dietaryYesNo: yesNoRaw === "yes" || yesNoRaw === "no" ? yesNoRaw : undefined,
    dietary: dietaryRaw || undefined,
  });
  let dietaryYesNo: "yes" | "no" = "no";
  if (yesNoRaw === "yes" || yesNoRaw === "no") dietaryYesNo = yesNoRaw;
  else if (inferred === "yes") dietaryYesNo = "yes";
  else dietaryYesNo = "no";

  return {
    title: str(p, "title"),
    firstName: str(p, "firstName"),
    lastName: str(p, "lastName"),
    company: str(p, "company"),
    jobTitle: str(p, "jobTitle"),
    email: row.email || str(p, "email"),
    phoneCountry: str(p, "phoneCountry"),
    phoneNumber: str(p, "phoneNumber"),
    country: str(p, "country"),
    attendance: str(p, "attendance") || "in_person",
    sameContact: bool(p, "sameContact") !== false,
    contactTitle: str(p, "contactTitle"),
    contactFirstName: str(p, "contactFirstName"),
    contactLastName: str(p, "contactLastName"),
    contactCompany: str(p, "contactCompany"),
    contactJobTitle: str(p, "contactJobTitle"),
    contactEmail: str(p, "contactEmail"),
    contactPhoneCountry: str(p, "contactPhoneCountry"),
    contactPhoneNumber: str(p, "contactPhoneNumber"),
    dietaryYesNo,
    dietary: dietaryRaw,
    dietaryOtherDetails: str(p, "dietaryOtherDetails"),
    cpdApply: str(p, "cpdApply") === "yes" ? "yes" : "no",
    consent: bool(p, "consent"),
  };
}

export function buildRegistrantInfoPatchPayload(d: RegistrantInfoFormState): Record<string, unknown> {
  const dietaryYesNo = d.dietaryYesNo;
  const dietaryChoices = new Set(["vegan", "vegetarian", "halal", "gluten_free", "other"]);
  let dietary: string | undefined;
  if (dietaryYesNo === "yes" && dietaryChoices.has(d.dietary)) {
    dietary = d.dietary;
  }
  return {
    title: d.title,
    firstName: d.firstName,
    lastName: d.lastName,
    company: d.company,
    jobTitle: d.jobTitle,
    email: d.email,
    phoneCountry: d.phoneCountry,
    phoneNumber: d.phoneNumber,
    country: d.country,
    attendance: d.attendance,
    sameContact: d.sameContact,
    contactTitle: d.contactTitle,
    contactFirstName: d.contactFirstName,
    contactLastName: d.contactLastName,
    contactCompany: d.contactCompany,
    contactJobTitle: d.contactJobTitle,
    contactEmail: d.contactEmail,
    contactPhoneCountry: d.contactPhoneCountry,
    contactPhoneNumber: d.contactPhoneNumber,
    dietaryYesNo,
    dietary,
    dietaryOtherDetails: d.dietaryOtherDetails,
    cpdApply: d.cpdApply,
    consent: d.consent,
  };
}
