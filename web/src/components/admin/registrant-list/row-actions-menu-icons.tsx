import type { ImgHTMLAttributes } from "react";

/**
 * Icons from Figma — IAIS Registration Form Web, node 825:44896
 * (`vuesax/bold/card-tick`, `vuesax/linear/sms`, `vuesax/linear/repeat`).
 * Source files: `/public/icons/row-actions/*.svg`
 */

const BASE = "/icons/row-actions";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

function mergeClass(a: string, b?: string): string {
  return [a, b].filter(Boolean).join(" ");
}

export function RowActionIconPaymentReceived({ className, ...rest }: Props) {
  return (
    <img
      {...rest}
      src={`${BASE}/card-tick.svg`}
      alt=""
      width={16}
      height={16}
      draggable={false}
      className={mergeClass("size-4 shrink-0", className)}
    />
  );
}

export function RowActionIconSendEmail({ className, ...rest }: Props) {
  return (
    <img
      {...rest}
      src={`${BASE}/sms.svg`}
      alt=""
      width={16}
      height={16}
      draggable={false}
      className={mergeClass("size-4 shrink-0", className)}
    />
  );
}

export function RowActionIconUpdateStatus({ className, ...rest }: Props) {
  return (
    <img
      {...rest}
      src={`${BASE}/repeat.svg`}
      alt=""
      width={16}
      height={16}
      draggable={false}
      className={mergeClass("size-4 shrink-0", className)}
    />
  );
}
