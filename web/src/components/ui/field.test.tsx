import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "@/components/ui/field";

describe("Field", () => {
  it("renders label, optional hint and error", () => {
    render(
      <Field label="Email" required hint="We never spam" error="Invalid">
        <input aria-label="email-input" />
      </Field>,
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("We never spam")).toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
  });

  it("omits hint and error when absent", () => {
    render(
      <Field label="Name">
        <input aria-label="name" />
      </Field>,
    );
    expect(screen.queryByText(/spam/i)).not.toBeInTheDocument();
  });
});
