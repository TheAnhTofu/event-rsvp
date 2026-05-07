"use client";

import { useEffect, useState } from "react";
import { formatRegistrantNamePart } from "@/lib/admin/registrant-list/utils";

type Transfer = {
  reference: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  audience_type: string;
  fee_hkd: string;
  payment_status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending_verification: "bg-amber-50 text-amber-800 ring-amber-300",
  verified: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  completed: "bg-sky-50 text-sky-800 ring-sky-300",
  rejected: "bg-red-50 text-red-800 ring-red-300",
};

export default function BankTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionRef, setActionRef] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bank-transfers");
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers ?? []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const verifyTransfer = async (reference: string) => {
    setActionRef(reference);
    setResult(null);
    try {
      const res = await fetch("/api/admin/bank-transfers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, action: "verify", verifiedBy: "admin" }),
      });
      if (!res.ok) throw new Error("Failed");
      setResult(`${reference} verified successfully.`);
      await loadData();
    } catch {
      setResult(`Failed to verify ${reference}.`);
    } finally {
      setActionRef(null);
    }
  };

  const rejectTransfer = async (reference: string) => {
    setActionRef(reference);
    setResult(null);
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
      setResult(`${reference} rejected.`);
      setShowRejectFor(null);
      setRejectionNote("");
      await loadData();
    } catch {
      setResult(`Failed to reject ${reference}.`);
    } finally {
      setActionRef(null);
    }
  };

  const pending = transfers.filter((t) => t.payment_status === "pending_verification");
  const decided = transfers.filter((t) => t.payment_status !== "pending_verification");

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-admin-border px-8 py-6">
        <h1 className="text-xl font-bold text-admin-navy">Bank Transfers</h1>
        <p className="mt-1 text-sm text-admin-col-muted">
          Review and manually approve or reject bank transfer payments.
        </p>
      </div>

      <div className="p-8">
        {result && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {result}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-admin-col-muted">Loading…</p>
        ) : (
          <>
            {/* Pending verification */}
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-admin-navy">
                Pending Verification ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="py-8 text-center text-sm text-admin-col-muted">
                  No bank transfers pending verification.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-admin-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-admin-table-header-bg text-left text-xs uppercase text-admin-col-muted">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">First Name</th>
                        <th className="px-4 py-3">Last Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Company</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((t) => (
                        <tr
                          key={t.reference}
                          className="border-t border-admin-table-border hover:bg-admin-sidebar-bg/50"
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            {t.reference}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(t.first_name)}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(t.last_name)}
                          </td>
                          <td className="px-4 py-3 text-admin-col-muted">
                            {t.email}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {t.company ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs capitalize">
                            {t.audience_type.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3">HKD {t.fee_hkd}</td>
                          <td className="px-4 py-3 text-xs text-admin-col-muted">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={actionRef === t.reference}
                                onClick={() => void verifyTransfer(t.reference)}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={actionRef === t.reference}
                                onClick={() =>
                                  setShowRejectFor(
                                    showRejectFor === t.reference
                                      ? null
                                      : t.reference,
                                  )
                                }
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                            {showRejectFor === t.reference && (
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Rejection note…"
                                  value={rejectionNote}
                                  onChange={(e) =>
                                    setRejectionNote(e.target.value)
                                  }
                                  className="min-w-0 flex-1 rounded-md border border-admin-border px-2 py-1 text-xs outline-none focus:border-admin-navy"
                                />
                                <button
                                  type="button"
                                  disabled={actionRef === t.reference}
                                  onClick={() =>
                                    void rejectTransfer(t.reference)
                                  }
                                  className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Already decided */}
            {decided.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-bold text-admin-navy">
                  History ({decided.length})
                </h2>
                <div className="overflow-hidden rounded-lg border border-admin-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-admin-table-header-bg text-left text-xs uppercase text-admin-col-muted">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">First Name</th>
                        <th className="px-4 py-3">Last Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decided.map((t) => (
                        <tr
                          key={t.reference}
                          className="border-t border-admin-table-border"
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            {t.reference}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(t.first_name)}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(t.last_name)}
                          </td>
                          <td className="px-4 py-3 text-admin-col-muted">
                            {t.email}
                          </td>
                          <td className="px-4 py-3">HKD {t.fee_hkd}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[t.payment_status] ?? ""}`}
                            >
                              {t.payment_status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-admin-col-muted">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
