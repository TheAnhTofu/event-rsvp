"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import QRCode from "qrcode";

/** IAIS | Badge Design | A6 — 105mm × 148mm (design ref. 1240 × 1748 px @300dpi) */
export const IAIS_A6_BADGE_WIDTH_PX = 1240;
export const IAIS_A6_BADGE_HEIGHT_PX = 1748;

export type IaisA6BadgePrintProps = {
  lastName: string;
  firstName: string;
  company: string;
  /** Value encoded in QR (e.g. registration reference — supported by check-in scanner). */
  qrPayload: string;
  /** Left circle marker (Figma sample uses "3"). */
  dayMarker?: string;
  /**
   * Fired only after the QR data URL is decoded and painted; printing earlier can
   * snapshot a blank QR while the canvas is still rasterising.
   */
  onReady?: () => void;
};

/**
 * Printable A6 badge — Figma "Badge without background" (861:4107).
 * White card with black names/company, day-marker circle, QR, and green dot,
 * finished by a thick orange bar across the bottom of the content block.
 *
 * All inner sizing uses container-query units (`cqi`) anchored to the badge's
 * inline-size (locked to 105mm in print), so screen preview and print share the
 * same proportions without separate breakpoints.
 */
export function IaisA6BadgePrint({
  lastName,
  firstName,
  company,
  qrPayload,
  dayMarker = "3",
  onReady,
}: IaisA6BadgePrintProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(qrPayload || " ", {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  useLayoutEffect(() => {
    if (qrSrc === null) return;
    /** Two rAFs ensure the freshly decoded QR is committed before the print snapshot. */
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => onReady?.());
    });
    return () => cancelAnimationFrame(id);
  }, [qrSrc, onReady]);

  const safeLast = lastName.trim() || "—";
  const safeFirst = firstName.trim() || "—";
  const safeCompany = company.trim() || "—";

  return (
    <div className="badge-a6-root @container relative mx-auto aspect-105/148 w-full max-w-[105mm] overflow-hidden bg-white print:mx-0 print:max-w-none print:shadow-none">
      {/* White content card — Figma 859:4025 (32.27% from top, 39.19% tall) */}
      <div className="badge-a6-card absolute left-[3.79%] right-[3.79%] top-[32.27%] flex h-[39.19%] flex-col items-center justify-center overflow-hidden bg-white py-[5.65cqi]">
        <div className="flex w-[90.75%] flex-col items-center gap-[5.24cqi]">
          <div className="flex w-full flex-col items-center gap-[2.42cqi] px-[5.77%] text-center">
            <p className="badge-a6-name font-display block w-full text-[5.81cqi] font-bold leading-[1.15] tracking-[0.02em] text-black">
              <span className="block">{safeLast}</span>
              <span className="block">{safeFirst}</span>
            </p>
            <p className="badge-a6-company font-display block w-full text-[5.16cqi] font-semibold leading-[1.22] text-black">
              {safeCompany}
            </p>
          </div>

          <div className="flex w-full items-end justify-between">
            <div
              className="badge-a6-day flex size-[10.08cqi] shrink-0 items-center justify-center rounded-full border-solid border-black bg-white"
              style={{ borderWidth: "0.32cqi", marginBottom: "0.81cqi" }}
            >
              <span className="font-display text-[5.81cqi] font-semibold leading-none text-black">
                {dayMarker}
              </span>
            </div>

            <div className="size-[18.95cqi] shrink-0">
              {qrSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL from qrcode
                <img
                  src={qrSrc}
                  alt=""
                  width={235}
                  height={235}
                  className="badge-a6-qr block size-full"
                />
              ) : (
                <div className="size-full bg-white" aria-hidden />
              )}
            </div>

            <div
              className="badge-a6-green size-[6.85cqi] shrink-0 rounded-full bg-[#3a9f55]"
              style={{ marginBottom: "0.81cqi" }}
            />
          </div>
        </div>
      </div>

      {/* Orange bar — Figma's `border-b-50` on the white card (4.23mm tall in print) */}
      <div className="badge-a6-bar absolute left-[3.79%] right-[3.79%] top-[71.46%] h-[4.03cqi] bg-[#e6883c]" />
    </div>
  );
}
