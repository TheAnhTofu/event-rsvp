import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RadioCardGroup } from "@/components/registration/radio-card-group";

function DotIcon() {
  return <span data-testid="opt-icon">icon</span>;
}

describe("RadioCardGroup", () => {
  it("calls onChange and shows selected state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioCardGroup
        name="attendance"
        value={undefined}
        onChange={onChange}
        options={[
          { value: "a", label: "Alpha", hint: "hint a" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /Alpha/i }));
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("renders stack layout and error message", () => {
    render(
      <RadioCardGroup
        name="x"
        value="b"
        onChange={() => {}}
        layout="stack"
        error="Pick one"
        options={[{ value: "b", label: "Beta", icon: <DotIcon /> }]}
      />,
    );
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    expect(screen.getByTestId("opt-icon")).toBeInTheDocument();
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("aria-invalid", "true");
  });
});
