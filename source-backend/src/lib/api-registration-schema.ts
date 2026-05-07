import en from "../../../web/src/messages/en.json" with { type: "json" };
import { createRegistrationSchema } from "./registration-schema.ts";

const v = en.Validation as {
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

/** Server-side registration validation (English messages; API consistency). Mirror `web/src/lib/api-registration-schema.ts`. */
export const apiRegistrationSchema = createRegistrationSchema({
  required: v.required,
  invalidEmail: v.invalidEmail,
  invalidContactEmail: v.invalidContactEmail,
  selectLunch: v.selectLunch,
  selectDietaryYesNo: v.selectDietaryYesNo,
  selectDietaryPreference: v.selectDietaryPreference,
  dietaryOtherRequired: v.dietaryOtherRequired,
  alternateContactRequired: v.alternateContactRequired,
  consentRequired: v.consentRequired,
  refundPolicyAckRequired: v.refundPolicyAckRequired,
});
