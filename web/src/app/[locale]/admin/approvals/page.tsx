"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { IconPlusCircle } from "@/components/icons/admin";
import { formatRegistrantNamePart } from "@/lib/admin/registrant-list/utils";

type ApprovalBatch = {
  id: string;
  created_at: string;
  created_by: string;
  submitted_at: string | null;
  status: string;
  notes: string | null;
  registration_count?: number;
};

type PendingRegistration = {
  reference: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  audience_type: string | null;
  payment_status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-50 text-zinc-700 ring-zinc-300",
  submitted: "bg-amber-50 text-amber-800 ring-amber-300",
  approved: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  partially_approved: "bg-sky-50 text-sky-800 ring-sky-300",
};

export default function ApprovalsPage() {
  const [batches, setBatches] = useState<ApprovalBatch[]>([]);
  const [pending, setPending] = useState<PendingRegistration[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approvals");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setBatches(data.batches ?? []);
      setPending(data.pending ?? []);
    } catch {
      setError("Could not load approval data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const toggleSelect = (ref: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === pending.length) setSelected(new Set());
    else setSelected(new Set(pending.map((p) => p.reference)));
  };

  const createBatch = async () => {
    if (selected.size === 0) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createdBy: "admin",
          notes: `Batch created with ${selected.size} registrations`,
          references: Array.from(selected),
        }),
      });
      if (!res.ok) throw new Error("Failed to create batch");
      setSelected(new Set());
      await loadData();
    } catch {
      setError("Could not create batch.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-admin-border px-8 py-6">
        <h1 className="text-xl font-bold text-admin-navy">IA Approvals</h1>
        <p className="mt-1 text-sm text-admin-col-muted">
          Batch approval workflow — review paid registrations and submit to IA for approval (Friday 12:00 pm cut-off).
        </p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Pending registrations */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-admin-navy">
              Pending Registrations ({pending.length})
            </h2>
            <button
              type="button"
              disabled={selected.size === 0 || creating}
              onClick={() => void createBatch()}
              className="flex items-center gap-2 rounded-lg bg-admin-navy px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <IconPlusCircle className="size-4" />
              {creating ? "Creating…" : `Create batch (${selected.size})`}
            </button>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-admin-col-muted">Loading…</p>
          ) : pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-admin-col-muted">
              No registrations pending approval. Registrations appear here after payment is completed or verified.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-admin-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-admin-table-header-bg text-left text-xs uppercase text-admin-col-muted">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.size === pending.length && pending.length > 0}
                        onChange={selectAll}
                        className="size-4 rounded border-admin-border"
                      />
                    </th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">First Name</th>
                    <th className="px-4 py-3">Last Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((reg) => (
                    <tr
                      key={reg.reference}
                      className="border-t border-admin-table-border hover:bg-admin-sidebar-bg/50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(reg.reference)}
                          onChange={() => toggleSelect(reg.reference)}
                          className="size-4 rounded border-admin-border"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{reg.reference}</td>
                      <td className="px-4 py-3">
                        {formatRegistrantNamePart(reg.first_name)}
                      </td>
                      <td className="px-4 py-3">
                        {formatRegistrantNamePart(reg.last_name)}
                      </td>
                      <td className="px-4 py-3 text-admin-col-muted">{reg.email}</td>
                      <td className="px-4 py-3 text-xs capitalize">
                        {reg.audience_type?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                          {reg.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-admin-col-muted">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Existing batches */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-admin-navy">
            Approval Batches ({batches.length})
          </h2>
          {batches.length === 0 ? (
            <p className="py-8 text-center text-sm text-admin-col-muted">No batches yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-admin-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-admin-table-header-bg text-left text-xs uppercase text-admin-col-muted">
                    <th className="px-4 py-3">Batch ID</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Created By</th>
                    <th className="px-4 py-3">Registrations</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="border-t border-admin-table-border hover:bg-admin-sidebar-bg/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{batch.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-xs text-admin-col-muted">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{batch.created_by}</td>
                      <td className="px-4 py-3">{batch.registration_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLORS[batch.status] ?? STATUS_COLORS.draft}`}
                        >
                          {batch.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/approvals/${batch.id}`}
                          className="text-xs font-medium text-admin-navy underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
