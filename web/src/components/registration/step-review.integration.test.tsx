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
      <StepReview embedded />
    </FormProvider>
  );
}

describe("StepReview", () => {
  it("lists virtual participants — jurisdiction, name, email only (no CPD block)", () => {
    renderWithIntl(
      <ReviewHarness
        values={{
          audienceType: "virtual",
          attendance: "online",
          jurisdiction: "HK",
          firstName: "Sam",
          lastName: "Lee",
          email: "sam@acme.test",
          consent: true,
          cpdApply: "yes",
        }}
      />,
    );
    expect(screen.getByText("Sam Lee")).toBeInTheDocument();
    expect(screen.getByText("Hong Kong SAR")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Continuing Professional Development/i }),
    ).not.toBeInTheDocument();
  });

  it("includes lunch and dietary rows for in-person members", () => {
    renderWithIntl(
      <ReviewHarness
        values={{
          audienceType: "members",
          attendance: "in_person",
          memberDelegateRole: "iais_member",
          jurisdiction: "HK",
          lunchSession: "nov13",
          dietaryYesNo: "yes",
          dietary: "vegetarian",
          refundPolicyAck: true,
          title: "Ms",
          firstName: "A",
          lastName: "B",
          company: "C",
          jobTitle: "D",
          email: "a@b.co",
          phoneCountry: "US",
          phoneNumber: "1",
          country: "HK",
          cpdApply: "no",
        }}
      />,
    );
    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
  });

  it("shows committee meetings section for virtual participants", () => {
    renderWithIntl(
      <ReviewHarness
        values={{
          audienceType: "virtual",
          attendance: "online",
          jurisdiction: "HK",
          firstName: "Sam",
          email: "sam@acme.test",
          consent: true,
          committeeMeetings: ["nov11_agm"],
          cpdApply: "yes",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Committee meetings/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /^Annual Conference$/i }),
    ).not.toBeInTheDocument();
  });
});
