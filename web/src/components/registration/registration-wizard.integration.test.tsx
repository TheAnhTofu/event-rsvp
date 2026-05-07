import * as React from "react";
import type { ReactNode } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationWizard } from "@/components/registration/registration-wizard";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useStripe: () => ({
      confirmCardPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: "succeeded" } }),
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
    }),
    useElements: () => ({ getElement: () => ({}) }),
    CardNumberElement: () => <div data-testid="card-element" />,
    CardExpiryElement: () => <div data-testid="card-expiry" />,
    CardCvcElement: () => <div data-testid="card-cvc" />,
    PaymentRequestButtonElement: () => <div data-testid="payment-request-btn" />,
}));

vi.mock("@stripe/stripe-js", () => ({
  loadStripe: () => Promise.resolve({}),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/register",
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ audience: "virtual" }),
}));

/** Virtual members flow — `StepRegistration` has no Attendance block. */
async function fillVirtualRegistration(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: /Jurisdiction/i }));
  const hkOption = await screen.findByRole("option", { name: /Hong Kong SAR/i });
  await user.click(hkOption);
  await user.type(
    screen.getByPlaceholderText(/Please provide all your name\/s and surname\/s/i),
    "Jane Doe",
  );
  await user.type(screen.getByPlaceholderText(/^Email Address$/i), "jane@example.com");
  await user.click(
    screen.getByRole("button", { name: /consent to the collection/i }),
  );
}

describe("RegistrationWizard integration", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);
        if (url.includes("/api/stripe/publishable-config")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                publishableKey: "pk_test_12345678901234567890123456789012",
                live: false,
              }),
          }) as unknown as Response;
        }
        if (url.includes("/api/registrations/acknowledge")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                draftId: "00000000-0000-4000-8000-000000000001",
              }),
          }) as unknown as Response;
        }
        if (url.includes("/api/registrations/commit-for-payment")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                ok: true,
                draftId: "00000000-0000-4000-8000-000000000001",
                reference: "ACK-00000000-0000-4000-8000-000000000001",
              }),
          }) as unknown as Response;
        }
        if (url.includes("/api/registrations/complete")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ok: true }),
          }) as unknown as Response;
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }) as unknown as Response;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("blocks Submit Registration when required fields are missing", async () => {
    const user = userEvent.setup();
    renderWithIntl(<RegistrationWizard />);
    await user.click(
      screen.getByRole("button", { name: /Submit Registration/i }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /complete all required fields/i,
    );
  });

  it("runs Registration → Review → thank-you for zero-fee virtual audience", async () => {
    const user = userEvent.setup();
    renderWithIntl(<RegistrationWizard />);

    await fillVirtualRegistration(user);

    await user.click(
      screen.getByRole("button", { name: /Submit Registration/i }),
    );
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /Registration:/i,
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirm and Pay/i }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
    const url = replace.mock.calls.find(
      (c) =>
        typeof c[0] === "string" && String(c[0]).includes("thank-you"),
    )?.[0] as string | undefined;
    expect(url).toBeDefined();
    expect(url!).toMatch(/thank-you/);
    expect(url!).toMatch(/ref=/);
    expect(url!).toMatch(/email=/);
  });

});
