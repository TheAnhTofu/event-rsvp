import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CookiesModalProvider } from "@/components/cookies/cookies-modal-context";
import { RegistrationPageShell } from "@/components/layout/registration-page-shell";
import { renderWithIntl } from "@/test-utils/render-with-intl";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/register",
  Link: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  redirect: vi.fn(),
}));

describe("RegistrationPageShell", () => {
  it("renders the hero banner and injected content (Figma 1149:41673 has no event title/subtitle row)", () => {
    renderWithIntl(
      <CookiesModalProvider>
        <RegistrationPageShell step={1} subtitle="Review phase">
          <p>Inner</p>
        </RegistrationPageShell>
      </CookiesModalProvider>,
    );
    expect(screen.getByText("Inner")).toBeInTheDocument();
    // Hero image stays as the only header chrome; the centered title +
    // "Review phase" subtitle row was removed per Figma 1149:41673.
    expect(
      screen.getByRole("img", {
        name: /IAIS and Insurance Authority event banner/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /IAIS Annual Conference 2026/i }),
    ).toBeNull();
    expect(screen.queryByText("Review phase")).toBeNull();
  });
});
