"use client";

import { useState } from "react";
import { fetchWithRetry } from "@/lib/fetch-retry";

type Props = {
  reference: string;
  paymentMethod: string;
};

const EMAIL_TEMPLATES = [
  { key: "acknowledge", label: "Acknowledge email" },
  { key: "payment_confirmation", label: "Payment Confirmation" },
  {
    key: "email_confirmation_physical_attendance",
    label: "Email Confirmation",
  },
  { key: "thank_you", label: "Thank You Email" },
];

export function RegistrationActions({ reference, paymentMethod }: Props) {
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showReject, setShowReject] = useState(false);

  const [emailTemplate, setEmailTemplate] = useState("acknowledge");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);

  const verifyTransfer = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/admin/bank-transfers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, action: "verify", verifiedBy: "admin" }),
      });
      if (!res.ok) throw new Error("Failed");
      setVerifyResult("Bank transfer verified successfully.");
    } catch {
      setVerifyResult("Failed to verify.");
    } finally {
      setVerifying(false);
    }
  };

  const rejectTransfer = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/admin/bank-transfers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          action: "reject",
          verifiedBy: "admin",
          rejectionNote: rejectionNote || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setVerifyResult("Bank transfer rejected. Rejection email sent.");
      setShowReject(false);
      setRejectionNote("");
    } catch {
      setVerifyResult("Failed to reject.");
    } finally {
      setVerifying(false);
    }
  };

  const sendEmail = async () => {
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await fetchWithRetry(
        "/api/admin/emails/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            references: [reference],
            templateKey: emailTemplate,
          }),
        },
        { retries: 4, baseDelayMs: 500 },
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        queued?: boolean;
        sent?: number;
        failed?: number;
      };
      if (data.queued) {
        setEmailResult("Email queued for delivery.");
      } else {
        setEmailResult(`Sent: ${data.sent}, Failed: ${data.failed}`);
      }
    } catch {
      setEmailResult("Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bank transfer verification */}
      {paymentMethod === "bank_transfer" && (
        <div className="rounded-xl border border-card-border bg-surface p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-heading">
            Bank Transfer Verification
          </h3>
          {verifyResult && (
            <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {verifyResult}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={verifying}
              onClick={() => void verifyTransfer()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {verifying ? "Processing…" : "Verify Payment"}
            </button>
            <button
              type="button"
              disabled={verifying}
              onClick={() => setShowReject(!showReject)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
          {showReject && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                placeholder="Rejection note (optional)"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent-mid focus:ring-2 focus:ring-accent-mid/20"
              />
              <button
                type="button"
                disabled={verifying}
                onClick={() => void rejectTransfer()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Send email */}
      <div className="rounded-xl border border-card-border bg-surface p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-heading">Send Email</h3>
        {emailResult && (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {emailResult}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <select
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-accent-mid focus:ring-2 focus:ring-accent-mid/20"
          >
            {EMAIL_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={sendingEmail}
            onClick={() => void sendEmail()}
            className="rounded-lg bg-admin-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {sendingEmail ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
