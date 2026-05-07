"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { parseQrPayload } from "@/lib/admin/check-in/parse-qr-payload";
import type { CheckInMode } from "./check-in-page-content";

type Props = {
  mode: CheckInMode;
  modeLabel: string;
  error: string | null;
  onScanResult: (reference: string) => void;
  onClose: () => void;
  onClearError: () => void;
};

export function QrScannerModal({
  mode,
  modeLabel,
  error,
  onScanResult,
  onClose,
  onClearError,
}: Props) {
  const accentLine = mode === "check_in" ? "bg-[#2196F3]" : "bg-[#F57C00]";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const processingRef = useRef(false);

  const handleScan = useCallback(
    (decoded: string) => {
      if (processingRef.current) return;
      const ref = parseQrPayload(decoded);
      if (!ref) return;
      processingRef.current = true;
      onScanResult(ref);
    },
    [onScanResult],
  );

  useEffect(() => {
    const containerId = "qr-scanner-region";
    let mounted = true;

    async function start() {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1,
            disableFlip: false,
          },
          (decodedText) => {
            if (mounted) handleScan(decodedText);
          },
          () => {},
        );

        runningRef.current = true;
        if (mounted) setCameraReady(true);
      } catch (err) {
        console.error("QR scanner init error:", err);
      }
    }

    void start();

    return () => {
      mounted = false;
      const s = scannerRef.current;
      if (s && runningRef.current) {
        runningRef.current = false;
        void s
          .stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [handleScan]);

  useEffect(() => {
    processingRef.current = false;
  }, [error]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Title */}
        <div className="mb-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <CardBadgeSmall />
            <span className="text-[18px] font-bold text-gray-900">
              CPD {modeLabel}
            </span>
          </div>
          <p className="text-[14px] text-gray-500">
            Please scan the registrant&apos;s QR code.
          </p>
        </div>

        {/* Scanner area */}
        <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-xl bg-gray-200">
          <div id="qr-scanner-region" ref={containerRef} className="size-full" />

          {/* Corner brackets overlay */}
          {cameraReady && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative size-[260px]">
                {/* TL */}
                <span className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-white" />
                {/* TR */}
                <span className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-white" />
                {/* BL */}
                <span className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-white" />
                {/* BR */}
                <span className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-white" />

                {/* Scanning line */}
                <span
                  className={`absolute left-2 right-2 h-[3px] animate-scan-line rounded-full ${accentLine}`}
                />
              </div>
            </div>
          )}

          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-gray-500">Starting camera…</span>
            </div>
          )}
        </div>

        {/* Error toast */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="currentColor" />
            </svg>
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={onClearError}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CardBadgeSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="15" cy="10" r="1.5" stroke="#1e293b" strokeWidth="1.2" />
      <rect x="7" y="8.5" width="4" height="1.2" rx="0.5" fill="#1e293b" />
      <rect x="7" y="11" width="3" height="1.2" rx="0.5" fill="#1e293b" />
      <rect x="7" y="13.5" width="5" height="1.2" rx="0.5" fill="#1e293b" />
    </svg>
  );
}
