import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioToggleCard } from "@/components/registration/radio-toggle-card";

describe("RadioToggleCard", () => {
  it("toggles via onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioToggleCard selected={false} onChange={onChange}>
        Accept
      </RadioToggleCard>,
    );
    await user.click(screen.getByRole("button", { name: /Accept/i }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("reflects selected styling state", () => {
    render(
      <RadioToggleCard selected onChange={() => {}}>
        On
      </RadioToggleCard>,
    );
    expect(screen.getByRole("button", { name: /^On$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("minimal variant strips bordered padding shell", () => {
    render(
      <RadioToggleCard variant="minimal" selected={false} onChange={() => {}}>
        Minimal row
      </RadioToggleCard>,
    );
    const btn = screen.getByRole("button", { name: /Minimal row/i });
    expect(btn.className).not.toContain("border-border-subtle");
    expect(btn.className).toContain("border-0");
  });
});
