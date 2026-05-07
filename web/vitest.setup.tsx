import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import type { ImgHTMLAttributes } from "react";
import { afterEach, vi } from "vitest";

Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

afterEach(() => {
  cleanup();
});

vi.mock("next/image", () => ({
  default: function MockNextImage(
    props: ImgHTMLAttributes<HTMLImageElement> & {
      src: string;
      priority?: boolean;
      sizes?: string;
    },
  ) {
    const { alt = "", priority: _p, sizes: _s, ...rest } = props;
    return <img alt={alt} {...rest} />;
  },
}));
