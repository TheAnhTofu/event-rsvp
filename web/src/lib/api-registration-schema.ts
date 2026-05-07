import en from "@/messages/en.json";
import { createRegistrationSchema } from "@/lib/registration-schema";

const v = en.Validation;

/** Server-side registration validation (English messages; API consistency). */
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
