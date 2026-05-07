"use client";

import { useState } from "react";
import { QrScannerModal } from "./qr-scanner-modal";
import { RegistrantVerifyModal } from "./registrant-verify-modal";
import { CheckInSuccessModal } from "./check-in-success-modal";
import { IconCheckin } from "@/components/icons/admin";

export type CheckInMode = "check_in" | "check_out";

export type RegistrantInfo = {
  reference: string;
  email: string;
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  phone: string;
  country: string;
  attendance: string;
  audienceType: string;
  paymentStatus: string;
  /** True if this reference has a check_in log (on-site check-in already recorded). */
  alreadyCheckedIn: boolean;
  /** True if this reference has a check_out log. */
  alreadyCheckedOut: boolean;
};

type FlowStep = "landing" | "scanning" | "verify" | "success";

export function CheckInPageContent() {
  const [step, setStep] = useState<FlowStep>("landing");
  const [mode, setMode] = useState<CheckInMode>("check_in");
  const [registrant, setRegistrant] = useState<RegistrantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openScanner(m: CheckInMode) {
    setMode(m);
    setError(null);
    setStep("scanning");
  }

  async function handleScanResult(reference: string) {
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/check-in/lookup?ref=${encodeURIComponent(reference)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string }).error ?? "Registration not found",
        );
        return;
      }
      const raw = (await res.json()) as Partial<RegistrantInfo> & {
        reference: string;
      };
      setRegistrant({
        ...raw,
        reference: raw.reference ?? "",
        email: raw.email ?? "",
        title: raw.title ?? "",
        firstName: raw.firstName ?? "",
        lastName: raw.lastName ?? "",
        company: raw.company ?? "",
        jobTitle: raw.jobTitle ?? "",
        phone: raw.phone ?? "",
        country: raw.country ?? "",
        attendance: raw.attendance ?? "",
        audienceType: raw.audienceType ?? "",
        paymentStatus: raw.paymentStatus ?? "",
        alreadyCheckedIn: Boolean(raw.alreadyCheckedIn),
        alreadyCheckedOut: Boolean(raw.alreadyCheckedOut),
      });
      setStep("verify");
    } catch {
      setError("Failed to look up registration");
    }
  }

  async function handleConfirm() {
    if (!registrant) return;
    if (mode === "check_in" && registrant.alreadyCheckedIn) return;
    if (mode === "check_out" && registrant.alreadyCheckedOut) return;
    try {
      const res = await fetch("/api/admin/check-in/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: registrant.reference, type: mode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string }).error ?? "Failed to record",
        );
        return;
      }
      setStep("success");
    } catch {
      setError("Network error");
    }
  }

  function resetFlow() {
    setStep("landing");
    setRegistrant(null);
    setError(null);
  }

  const modeLabel = mode === "check_in" ? "Check-In" : "Check-Out";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f4fcff]">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-admin-border bg-white px-8 py-5">
        <IconCheckin className="size-5 text-admin-navy" />
        <h1 className="text-[18px] font-semibold text-admin-navy">
          On-Site Check-In
        </h1>
      </div>

      {/* Landing cards */}
      {step === "landing" && (
        <div className="flex flex-1 gap-6 p-8">
          <button
            type="button"
            onClick={() => openScanner("check_in")}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl bg-[#2196F3] text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <CardBadgeIcon />
            <span className="text-[24px] font-bold">CPD Check-In</span>
          </button>

          <button
            type="button"
            onClick={() => openScanner("check_out")}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl bg-[#F57C00] text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            <CardBadgeIcon />
            <span className="text-[24px] font-bold">CPD Check-Out</span>
          </button>
        </div>
      )}

      {/* QR Scanner */}
      {step === "scanning" && (
        <QrScannerModal
          mode={mode}
          modeLabel={modeLabel}
          error={error}
          onScanResult={handleScanResult}
          onClose={resetFlow}
          onClearError={() => setError(null)}
        />
      )}

      {/* Verification */}
      {step === "verify" && registrant && (
        <RegistrantVerifyModal
          mode={mode}
          modeLabel={modeLabel}
          registrant={registrant}
          error={error}
          onConfirm={handleConfirm}
          onBack={() => setStep("scanning")}
          onClose={resetFlow}
        />
      )}

      {/* Success */}
      {step === "success" && (
        <CheckInSuccessModal modeLabel={modeLabel} onClose={resetFlow} />
      )}
    </div>
  );
}

function CardBadgeIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
    >
      <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="30" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="16" width="8" height="2" rx="1" fill="currentColor" />
      <rect x="14" y="21" width="6" height="2" rx="1" fill="currentColor" />
      <rect x="14" y="26" width="10" height="2" rx="1" fill="currentColor" />
      <rect x="14" y="31" width="20" height="2" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
