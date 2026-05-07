"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { formatRegistrantNamePart } from "@/lib/admin/registrant-list/utils";

type Registration = {
  reference: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  audience_type: string | null;
  payment_status: string;
  approval_status: string;
  fee_hkd: string;
  created_at: string;
};

type Batch = {
  id: string;
  created_at: string;
  created_by: string;
  submitted_at: string | null;
  status: string;
  notes: string | null;
};

const APPROVAL_COLORS: Record<string, string> = {
  pending: "bg-zinc-50 text-zinc-700 ring-zinc-300",
  submitted_to_ia: "bg-amber-50 text-amber-800 ring-amber-300",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  rejected: "bg-red-50 text-red-800 ring-red-300",
};

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = use(params);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/approvals`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const b = (data.batches as Batch[]).find((x: Batch) => x.id === batchId);
        setBatch(b ?? null);
      } catch {
        // ignore
      }

      try {
        // Fetch registrations for this batch directly
        const res = await fetch(`/api/admin/approvals/${batchId}/registrations`);
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data.registrations ?? []);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, [batchId]);

  const toggleApprove = (ref: string) => {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else { next.add(ref); rejected.delete(ref); setRejected(new Set(rejected)); }
      return next;
    });
  };

  const toggleReject = (ref: string) => {
    setRejected((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else { next.add(ref); approved.delete(ref); setApproved(new Set(approved)); }
      return next;
    });
  };

  const submitApproval = async () => {
    if (approved.size === 0 && rejected.size === 0) return;
    setApproving(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/approvals/${batchId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedBy: "admin",
          approvedReferences: Array.from(approved),
          rejectedReferences: Array.from(rejected),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(`Approved: ${data.approved}, Rejected: ${data.rejected}`);
      setApproved(new Set());
      setRejected(new Set());
      // Reload page data
      window.location.reload();
    } catch {
      setResult("Failed to submit approval.");
    } finally {
      setApproving(false);
    }
  };

  const submittedRegs = registrations.filter(
    (r) => r.approval_status === "submitted_to_ia",
  );
  const decidedRegs = registrations.filter(
    (r) => r.approval_status === "approved" || r.approval_status === "rejected",
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-admin-border px-8 py-6">
        <Link
          href="/admin/approvals"
          className="text-sm text-admin-navy underline"
        >
          ← Back to Approvals
        </Link>
        <h1 className="mt-2 text-xl font-bold text-admin-navy">
          Batch {batchId.slice(0, 8)}
        </h1>
        {batch && (
          <p className="mt-1 text-sm text-admin-col-muted">
            Created by {batch.created_by} on{" "}
            {new Date(batch.created_at).toLocaleDateString()} — Status:{" "}
            <span className="font-medium capitalize">{batch.status.replace(/_/g, " ")}</span>
          </p>
        )}
      </div>

      <div className="p-8">
        {loading ? (
          <p className="py-8 text-center text-sm text-admin-col-muted">Loading…</p>
        ) : registrations.length === 0 ? (
          <p className="py-8 text-center text-sm text-admin-col-muted">
            No registrations in this batch.
          </p>
        ) : (
          <>
            {result && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {result}
              </div>
            )}

            {/* Pending IA decision */}
            {submittedRegs.length > 0 && (
              <section className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-admin-navy">
                    Awaiting IA Decision ({submittedRegs.length})
                  </h2>
                  <button
                    type="button"
                    disabled={
                      (approved.size === 0 && rejected.size === 0) || approving
                    }
                    onClick={() => void submitApproval()}
                    className="rounded-lg bg-admin-navy px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {approving
                      ? "Submitting…"
                      : `Submit decisions (${approved.size + rejected.size})`}
                  </button>
                </div>
                <div className="overflow-hidden rounded-lg border border-admin-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-admin-table-header-bg text-left text-xs uppercase text-admin-col-muted">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">First Name</th>
                        <th className="px-4 py-3">Last Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Fee</th>
                        <th className="px-4 py-3 text-center">Approve</th>
                        <th className="px-4 py-3 text-center">Reject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submittedRegs.map((reg) => (
                        <tr
                          key={reg.reference}
                          className="border-t border-admin-table-border hover:bg-admin-sidebar-bg/50"
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            {reg.reference}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(reg.first_name)}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(reg.last_name)}
                          </td>
                          <td className="px-4 py-3 text-admin-col-muted">
                            {reg.email}
                          </td>
                          <td className="px-4 py-3">HKD {reg.fee_hkd}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={approved.has(reg.reference)}
                              onChange={() => toggleApprove(reg.reference)}
                              className="size-4 rounded border-emerald-400 text-emerald-600"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={rejected.has(reg.reference)}
                              onChange={() => toggleReject(reg.reference)}
                              className="size-4 rounded border-red-400 text-red-600"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Already decided */}
            {decidedRegs.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-bold text-admin-navy">
                  Decided ({decidedRegs.length})
                </h2>
                <div className="overflow-hidden rounded-lg border border-admin-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-admin-table-header-bg text-left text-xs uppercase text-admin-col-muted">
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">First Name</th>
                        <th className="px-4 py-3">Last Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decidedRegs.map((reg) => (
                        <tr
                          key={reg.reference}
                          className="border-t border-admin-table-border"
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            {reg.reference}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(reg.first_name)}
                          </td>
                          <td className="px-4 py-3">
                            {formatRegistrantNamePart(reg.last_name)}
                          </td>
                          <td className="px-4 py-3 text-admin-col-muted">
                            {reg.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${APPROVAL_COLORS[reg.approval_status] ?? ""}`}
                            >
                              {reg.approval_status.replace(/_/g, " ")}
                            </span>
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
