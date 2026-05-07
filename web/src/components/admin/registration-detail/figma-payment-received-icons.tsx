import type { ImgHTMLAttributes } from "react";

/**
 * Icons exported from Figma (node 125:7927 — Payment Received). SVGs live in /public/figma-assets/.
 */
export function FigmaCardTickBold({
  className,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/figma-assets/card-tick-bold.svg"
      alt=""
      width={20}
      height={20}
      className={className}
      {...rest}
    />
  );
}

export function FigmaArrowRightLinear({
  className,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/figma-assets/arrow-right-linear.svg"
      alt=""
      width={20}
      height={20}
      className={className}
      {...rest}
    />
  );
}
