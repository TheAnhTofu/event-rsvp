"use client";

import { RegistrationTypeBadge } from "@/components/admin/registrant-list/registration-type-badge";
import type { CheckInMode, RegistrantInfo } from "./check-in-page-content";

type Props = {
  mode: CheckInMode;
  modeLabel: string;
  registrant: RegistrantInfo;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
};

export function RegistrantVerifyModal({
  mode,
  modeLabel,
  registrant,
  error,
  onConfirm,
  onBack,
  onClose,
}: Props) {
  const primaryClass =
    mode === "check_in" ? "bg-[#2196F3]" : "bg-[#F57C00]";
  const alreadyDone =
    mode === "check_in"
      ? registrant.alreadyCheckedIn
      : registrant.alreadyCheckedOut;
  const primaryLabel =
    mode === "check_in"
      ? alreadyDone
        ? "Checked In"
        : "Check-in"
      : alreadyDone
        ? "Checked Out"
        : "Check-out";
  const primaryButtonClass = alreadyDone
    ? "cursor-not-allowed bg-gray-200 text-gray-500 hover:opacity-100"
    : `text-white transition-opacity hover:opacity-90 ${primaryClass}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
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

        {/* Header */}
        <div className="flex flex-col items-center gap-1 px-8 pt-8">
          <div className="flex items-center gap-2">
            <CardBadgeSmall />
            <span className="text-[18px] font-bold text-gray-900">
              CPD {modeLabel}
            </span>
          </div>
          <p className="text-[14px] text-gray-500">
            Verify Registrant information.
          </p>
        </div>

        {/* Info card */}
        <div className="mx-8 mt-6 rounded-xl border border-gray-200 p-6">
          <h3 className="mb-4 text-[16px] font-semibold text-admin-navy">
            Registrant Information
          </h3>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Title" value={registrant.title || "—"} />
            <div>
              <span className="text-[12px] font-medium text-admin-navy">
                Registration Type
              </span>
              <div className="mt-1">
                <RegistrationTypeBadge audienceType={registrant.audienceType} />
              </div>
            </div>

            <Field label="First Name" value={registrant.firstName || "—"} />
            <Field label="Last Name" value={registrant.lastName || "—"} />

            <Field
              label="Company / Organization"
              value={registrant.company || "—"}
            />
            <Field label="Job Title" value={registrant.jobTitle || "—"} />

            <div className="col-span-2">
              <span className="text-[12px] font-medium text-admin-navy">
                Email Address*{" "}
                <span className="font-normal text-gray-400">
                  (You will receive a confirmation email and a forum reminder
                  here.)
                </span>
              </span>
              <p className="mt-1 text-[14px] text-gray-800">
                {registrant.email || "—"}
              </p>
            </div>

            <Field label="Telephone" value={registrant.phone || "—"} />
            <Field label="Country/Region" value={registrant.country || "—"} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-8 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 px-8 pb-8 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex h-[48px] flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={alreadyDone}
            className={`flex h-[48px] flex-2 items-center justify-center gap-2 rounded-xl text-[15px] font-medium ${primaryButtonClass}`}
          >
            {!alreadyDone && (
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="9"
                  cy="9"
                  r="7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M6 9l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[12px] font-medium text-admin-navy">{label}</span>
      <p className="mt-1 text-[14px] text-gray-800">{value}</p>
    </div>
  );
}

function CardBadgeSmall() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <circle cx="15" cy="10" r="1.5" stroke="#1e293b" strokeWidth="1.2" />
      <rect x="7" y="8.5" width="4" height="1.2" rx="0.5" fill="#1e293b" />
      <rect x="7" y="11" width="3" height="1.2" rx="0.5" fill="#1e293b" />
      <rect x="7" y="13.5" width="5" height="1.2" rx="0.5" fill="#1e293b" />
    </svg>
  );
}
