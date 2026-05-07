import type { ReactNode } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
import { RegistrationStep0Card } from "@/components/registration/registration-step0-card";
import { StepRegistration } from "@/components/registration/step-registration";
import {
  createRegistrationSchema,
  defaultRegistrationValues,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import en from "@/messages/en.json";

const val = en.Validation;

function RegHarness({
  defaultValues,
}: {
  defaultValues?: Partial<RegistrationFormValues>;
} = {}) {
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
    defaultValues: { ...defaultRegistrationValues, ...defaultValues },
    resolver: zodResolver(schema as never) as Resolver<RegistrationFormValues>,
    mode: "onBlur",
  });
  return (
    <FormProvider {...methods}>
      <RegistrationStep0Card>
        <StepRegistration />
      </RegistrationStep0Card>
    </FormProvider>
  );
}

describe("StepRegistration", () => {
  it("renders virtual members panel (committee meetings)", () => {
    renderWithIntl(
      <RegHarness
        defaultValues={{
          audienceType: "virtual",
          attendance: "online",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /^Committee meetings$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Contact person/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the industry representative form variant", () => {
    renderWithIntl(
      <RegHarness
        defaultValues={{
          audienceType: "industry",
          country: "",
          company: "",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: /Registration: Industry representative/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Please provide all your name/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Organisation/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Contact person/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: /Continuing Professional Development/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the fellow and press form variant", () => {
    renderWithIntl(
      <RegHarness
        defaultValues={{
          audienceType: "fellow",
          country: "",
          company: "",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: /Registration: IAIS Distinguished Fellow, Press, Consumer Group and External Speaker/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /IAIS Distinguished Fellow/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Press/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Consumer Group/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /External Speaker/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Organization/i)).toBeInTheDocument();
  });

  it("only enables lunch days after the matching conference day is selected", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <RegHarness
        defaultValues={{
          audienceType: "industry",
          country: "",
          company: "",
        }}
      />,
    );

    const annualSection = screen
      .getByRole("heading", { name: /^Annual Conference$/i })
      .closest("section")!;
    const lunchSection = screen
      .getByRole("heading", { name: /^Lunch selection$/i })
      .closest("section")!;
    const annualNov12 = within(annualSection).getByRole("button", {
      name: /^12 November$/i,
    });
    const lunchNov12 = within(lunchSection).getByRole("button", {
      name: /12 November, Thursday/i,
    });

    expect(lunchNov12).toBeDisabled();
    await user.click(annualNov12);
    expect(lunchNov12).not.toBeDisabled();
    await user.click(lunchNov12);
    expect(lunchNov12).toHaveAttribute("aria-pressed", "true");
    await user.click(annualNov12);
    expect(lunchNov12).toBeDisabled();
    expect(lunchNov12).toHaveAttribute("aria-pressed", "false");
  });
});
