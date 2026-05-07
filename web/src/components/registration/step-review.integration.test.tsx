import { screen } from "@testing-library/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { StepReview } from "@/components/registration/step-review";
import {
  createRegistrationSchema,
  defaultRegistrationValues,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import en from "@/messages/en.json";

const val = en.Validation;

function ReviewHarness({
  values,
}: {
  values: Partial<RegistrationFormValues>;
}) {
  const schema = createRegistrationSchema({
    required: val.required,
    invalidEmail: val.invalidEmail,
    invalidContactEmail: val.invalidContactEmail,
    selectLunch: val.selectLunch,
    selectDietaryYesNo: val.selectDietaryYesNo,
    selectDietaryPreference: val.selectDietaryPreference,
    dietaryOtherRequired: val.dietaryOtherRequired,
    alternateContactRequired: val.alternateContactRequired,
    consentRequired: val.consentRequired,
    refundPolicyAckRequired: val.refundPolicyAckRequired,
  });
  const methods = useForm<RegistrationFormValues>({
    defaultValues: { ...defaultRegistrationValues, ...values },
    resolver: zodResolver(schema as never) as Resolver<RegistrationFormValues>,
  });
  return (
    <FormProvider {...methods}>
      <StepReview />
    </FormProvider>
  );
}

describe("StepReview", () => {
  it("lists online delegate summary", () => {
    renderWithIntl(
      <ReviewHarness
        values={{
          audienceType: "virtual",
          attendance: "online",
          title: "Mr",
          firstName: "Sam",
          lastName: "Lee",
          company: "ACME",
          jobTitle: "QA",
          email: "sam@acme.test",
          phoneCountry: "HK",
          phoneNumber: "90000000",
          country: "HK",
          cpdApply: "yes",
        }}
      />,
    );
    expect(screen.getByText("Mr Sam Lee")).toBeInTheDocument();
  });

  it("includes lunch and dietary rows for in person", () => {
    renderWithIntl(
      <ReviewHarness
        values={{
          audienceType: "virtual",
          attendance: "in_person",
          lunchSession: "nov13",
          dietary: "vegetarian",
          title: "Ms",
          firstName: "A",
          lastName: "B",
          company: "C",
          jobTitle: "D",
          email: "a@b.co",
          phoneCountry: "US",
          phoneNumber: "1",
          country: "US",
          cpdApply: "no",
        }}
      />,
    );
    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
  });

  it("shows alternate contact when sameContact is false", () => {
    renderWithIntl(
      <ReviewHarness
        values={{
          audienceType: "virtual",
          attendance: "not_attending",
          sameContact: false,
          contactTitle: "Dr",
          contactFirstName: "Pat",
          contactLastName: "Kim",
          contactEmail: "pat@co.test",
          title: "Mr",
          firstName: "A",
          lastName: "B",
          company: "Co",
          jobTitle: "Eng",
          email: "a@b.co",
          phoneCountry: "HK",
          phoneNumber: "1",
          country: "HK",
          cpdApply: "no",
        }}
      />,
    );
    expect(screen.getByText("Dr Pat Kim")).toBeInTheDocument();
    expect(screen.getByText("pat@co.test")).toBeInTheDocument();
  });
});
