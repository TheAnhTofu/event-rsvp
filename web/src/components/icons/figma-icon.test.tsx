import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FigmaIcon, type FigmaIconName } from "@/components/icons/figma-icon";

const NAMES: FigmaIconName[] = [
  "calendar-24",
  "calendar-16",
  "location-24",
  "global-24",
  "ion-earth",
  "chevron-down",
  "card-pos",
  "bank",
  "radio-outline",
  "radio-on",
  "radio-on-muted",
];

describe("FigmaIcon", () => {
  it.each(NAMES)("renders %s with expected src", (name) => {
    render(<FigmaIcon name={name} data-testid="icon" />);
    const img = screen.getByTestId("icon");
    const src = img.getAttribute("src");
    expect(src).toBeTruthy();
    expect(src!.startsWith("/icons/") && src!.endsWith(".svg")).toBe(true);
    expect(img).toHaveAttribute("width", "24");
  });
});
