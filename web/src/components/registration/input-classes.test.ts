import { describe, expect, it } from "vitest";
import { inputClassName, selectClassName } from "@/components/registration/input-classes";

describe("input-classes", () => {
  it("exports non-empty shared class strings", () => {
    expect(inputClassName.length).toBeGreaterThan(10);
    expect(selectClassName.length).toBeGreaterThan(10);
    expect(selectClassName).toContain("pr-14");
    expect(inputClassName).toContain("px-4");
  });
});
