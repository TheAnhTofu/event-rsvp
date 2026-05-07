"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bankSlipImageApiUrl } from "@/lib/admin/registrant-list/utils";

type Props = { reference: string };

/**
 * Bank transfer: Payment Reference points at the admin-proxied S3 slip URL;
 * hover shows a floating preview (portal so table overflow does not clip).
 */
export function BankSlipPaymentReference({ reference }: Props) {
  const url = bankSlipImageApiUrl({ reference });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const clearHide = useCallback(() => {
    if (hideTimer.current != null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => setOpen(false), 200);
  }, [clearHide]);

  const showAt = useCallback((el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const maxW = 320;
    let left = r.left;
    if (left + maxW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - 8 - maxW);
    }
    setPos({
      top: r.bottom + 8,
      left,
    });
    setOpen(true);
  }, []);

  useEffect(() => () => clearHide(), [clearHide]);

  const preview =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        className="pointer-events-auto fixed z-9999 w-[min(100vw-1rem,320px)] rounded-lg border border-admin-border bg-white p-1.5 shadow-xl"
        style={{ top: pos.top, left: pos.left }}
        onMouseEnter={clearHide}
        onMouseLeave={scheduleHide}
        role="presentation"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated same-origin proxy URL */}
        <img
          src={url}
          alt=""
          className="max-h-64 w-full object-contain"
        />
      </div>,
      document.body,
    );

  return (
    <>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[12px] font-medium text-admin-navy underline decoration-admin-border underline-offset-2"
        title="Open bank slip (S3 via admin)"
        onMouseEnter={(e) => {
          clearHide();
          showAt(e.currentTarget);
        }}
        onMouseLeave={scheduleHide}
        onFocus={(e) => {
          clearHide();
          showAt(e.currentTarget);
        }}
        onBlur={scheduleHide}
      >
        Bank slip
      </a>
      {preview}
    </>
  );
}
