import * as React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type Resolver } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepPay } from "@/components/registration/step-pay";
import {
  createRegistrationSchema,
  defaultRegistrationValues,
  type RegistrationFormValues,
} from "@/lib/registration-schema";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import en from "@/messages/en.json";

const val = en.Validation;

const { stripeMocks } = vi.hoisted(() => ({
  stripeMocks: {
    confirmCardPayment: vi.fn().mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    }),
    confirmAlipayPayment: vi.fn().mockResolvedValue({}),
    confirmWechatPayPayment: vi.fn().mockResolvedValue({}),
    retrievePaymentIntent: vi.fn().mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    }),
    handleNextAction: vi.fn().mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    }),
    paymentRequest: vi.fn().mockReturnValue({
      canMakePayment: () => Promise.resolve(null),
    }),
  },
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useStripe: () => ({
      confirmCardPayment: stripeMocks.confirmCardPayment,
      confirmAlipayPayment: stripeMocks.confirmAlipayPayment,
      confirmWechatPayPayment: stripeMocks.confirmWechatPayPayment,
      retrievePaymentIntent: stripeMocks.retrievePaymentIntent,
      handleNextAction: stripeMocks.handleNextAction,
      paymentRequest: stripeMocks.paymentRequest,
    }),
    useElements: () => ({
      getElement: () => ({}),
    }),
    CardNumberElement: () => <div data-testid="card-element" />,
    CardExpiryElement: () => <div data-testid="card-expiry" />,
    CardCvcElement: () => <div data-testid="card-cvc" />,
    PaymentRequestButtonElement: () => <div data-testid="payment-request-btn" />,
}));

function PayHarness({
  values,
  onComplete,
}: {
  values: Partial<RegistrationFormValues>;
  onComplete: (ref: string, email: string) => void;
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
      <StepPay
        onComplete={onComplete}
        paymentDraftId={null}
        onPaymentDraftId={() => {}}
      />
    </FormProvider>
  );
}

async function proceedPastPaymentRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: /Complete Payment/i }),
  );
}

describe("StepPay", () => {
  beforeEach(() => {
    stripeMocks.confirmCardPayment.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/api/stripe/create-payment-intent")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ clientSecret: "cs_test_123" }),
          } as unknown as Response);
        }

        if (url.includes("/api/paymentasia/config")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ enabled: true }),
          } as unknown as Response);
        }

        if (url.includes("/api/registrations/complete")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true }),
          } as unknown as Response);
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true }),
        } as unknown as Response);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("completes zero-fee flow without payment methods", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderWithIntl(
      <PayHarness
        onComplete={onComplete}
        values={{
          attendance: "not_attending",
          email: "zero@test.dev",
          title: "Mr",
          firstName: "Z",
          lastName: "Z",
          company: "Z",
          jobTitle: "Z",
          phoneNumber: "1",
          country: "Other",
          consent: true,
        }}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Complete registration/i }),
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete).toHaveBeenCalledWith(
      expect.stringMatching(/^RG-/),
      "zero@test.dev",
    );
  });

  it("shows payment method list for online flow", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderWithIntl(
      <PayHarness
        onComplete={onComplete}
        values={{
          attendance: "online",
          email: "online@test.dev",
          title: "Mr",
          firstName: "O",
          lastName: "L",
          company: "C",
          jobTitle: "J",
          phoneNumber: "2",
          country: "SG",
          consent: true,
        }}
      />,
    );
    await proceedPastPaymentRequired(user);
    const payNowButtons = screen.getAllByRole("button", { name: /^Pay now$/i });
    expect(payNowButtons.length).toBeGreaterThanOrEqual(1);

    await user.click(payNowButtons[0]);

    expect(
      await screen.findByRole("heading", { name: /Payment Method/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Card/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /Apple Pay/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /Google Pay/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /^Alipay$/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /WeChat Pay/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("shows Card, Alipay and WeChat under PaymentAsia wallet flow", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <PayHarness
        onComplete={() => {}}
        values={{
          attendance: "online",
          email: "wallet@test.dev",
          title: "Mr",
          firstName: "Q",
          lastName: "F",
          company: "C",
          jobTitle: "J",
          phoneNumber: "2",
          country: "SG",
          consent: true,
        }}
      />,
    );
    await proceedPastPaymentRequired(user);
    await user.click(
      screen.getByRole("button", { name: /Pay Online Now/i }),
    );
    const walletContinue = await waitFor(() => {
      const el = screen.getByText(/^Pay now$/i);
      const btn = el.closest("button");
      if (!btn || btn.disabled) throw new Error("wallet Pay now not ready");
      return btn;
    });
    await user.click(walletContinue);
    expect(
      await screen.findByRole("heading", { name: /Choose payment method/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Credit \/ Debit Card/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /^Alipay$/i }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("button", { name: /WeChat Pay/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows bank transfer details when selecting bank method", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <PayHarness
        onComplete={() => {}}
        values={{
          attendance: "online",
          email: "pay@test.dev",
          title: "Mr",
          firstName: "P",
          lastName: "Q",
          company: "C",
          jobTitle: "J",
          phoneNumber: "2",
          country: "SG",
          consent: true,
        }}
      />,
    );
    await proceedPastPaymentRequired(user);
    await user.click(
      screen.getByRole("button", { name: /Pay by Bank Transfer/i }),
    );
    await user.click(screen.getByRole("button", { name: /^Pay now$/i }));
    expect(
      await screen.findByText(/Details you'll need to make this transfer/i),
    ).toBeInTheDocument();
  });

  it("shows payment-required step with fee and dietary summary for in-person", () => {
    renderWithIntl(
      <PayHarness
        onComplete={() => {}}
        values={{
          attendance: "in_person",
          lunchSession: "nov12",
          dietary: "halal",
          email: "x@y.z",
          title: "Mr",
          firstName: "A",
          lastName: "B",
          company: "C",
          jobTitle: "D",
          phoneNumber: "3",
          country: "CN",
          consent: true,
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /Payment Required/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Halal").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("HKD 8500.00").length).toBeGreaterThanOrEqual(1);
  });
});
