import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroBanner } from "@/components/layout/hero-banner";

describe("HeroBanner", () => {
  it("renders banner landmark and image", () => {
    render(<HeroBanner />);
    const img = document.querySelector("img") as HTMLImageElement | null;
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toContain("homepage-hero-banner");
    expect(img?.alt).toMatch(/IAIS/);
    expect(
      screen.getByRole("img", {
        name: /event banner with Hong Kong skyline/i,
      }),
    ).toBeInTheDocument();
  });
});
