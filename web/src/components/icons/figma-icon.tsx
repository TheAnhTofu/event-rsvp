import type { ImgHTMLAttributes } from "react";
import { FIGMA_ICON_SRC, type FigmaIconName } from "./figma-icon-urls";

export type { FigmaIconName };

type FigmaIconProps = {
  name: FigmaIconName;
  className?: string;
  size?: number;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

/** Figma-export SVGs — `src` points at `/public/icons/*.svg` (stable across deploys). */
export function FigmaIcon({
  name,
  className,
  size = 24,
  ...props
}: FigmaIconProps) {
  return (
    <img
      src={FIGMA_ICON_SRC[name]}
      alt=""
      width={size}
      height={size}
      decoding="async"
      fetchPriority="low"
      loading="lazy"
      className={["shrink-0 object-contain", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
