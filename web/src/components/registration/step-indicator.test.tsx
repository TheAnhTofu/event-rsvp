import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StepIndicator } from "@/components/registration/step-indicator";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("StepIndicator", () => {
  it("sets progressbar value for each step", () => {
    const { rerender } = renderWithIntl(<StepIndicator current={0} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
    rerender(<StepIndicator current={1} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    rerender(<StepIndicator current={2} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "75",
    );
    rerender(<StepIndicator current={3} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("renders translated step labels", () => {
    renderWithIntl(<StepIndicator current={1} />);
    expect(screen.getByText("Review")).toBeInTheDocument();
  });
});
