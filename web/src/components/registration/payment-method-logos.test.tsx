import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentMethodLogos } from "@/components/registration/payment-method-logos";

describe("PaymentMethodLogos", () => {
  it("exposes grouped card marks for assistive tech", () => {
    render(<PaymentMethodLogos />);
    expect(
      screen.getByRole("img", {
        name: /Visa, Mastercard, Amex/i,
      }),
    ).toBeInTheDocument();
  });
});
