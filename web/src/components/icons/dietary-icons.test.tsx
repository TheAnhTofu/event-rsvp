import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DietaryHalalIcon,
  DietaryVegetarianIcon,
} from "@/components/icons/dietary-icons";

describe("dietary icons", () => {
  it("renders vegetarian and halal assets", () => {
    render(
      <div>
        <DietaryVegetarianIcon data-testid="veg" />
        <DietaryHalalIcon data-testid="halal" className="extra" />
      </div>,
    );
    expect(screen.getByTestId("veg")).toHaveAttribute(
      "src",
      "/icons/dietary-vegetarian.svg",
    );
    expect(screen.getByTestId("halal")).toHaveClass("extra");
  });
});
