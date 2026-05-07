"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  IaisA6BadgePrint,
  IAIS_A6_BADGE_HEIGHT_PX,
  IAIS_A6_BADGE_WIDTH_PX,
} from "@/components/admin/badge/iaais-a6-badge-print";
import { fetchAdminRegistrationAdminDetail } from "@/lib/fetch-admin-registration-detail";

function pickPayloadString(payload: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = payload[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export default function AdminPrintBadgeByReferencePage() {
  const params = useParams();
  const reference = useMemo(() => {
    const raw = params.reference;
    if (typeof raw !== "string" || !raw) return "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params.reference]);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");

  const load = useCallback(async () => {
    if (!reference) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchAdminRegistrationAdminDetail(reference);
      const p = data.row.payload ?? {};
      setFirstName(pickPayloadString(p, "firstName", "first_name"));
      setLastName(pickPayloadString(p, "lastName", "last_name"));
      setCompany(pickPayloadString(p, "company", "organization"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load registrant");
      setFirstName("");
      setLastName("");
      setCompany("");
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#eceff4] font-display print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <header className="border-b border-admin-border bg-white px-5 py-4">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-admin-col-muted">
                IAIS | Badge Design | A6 ({IAIS_A6_BADGE_WIDTH_PX}px ×{" "}
                {IAIS_A6_BADGE_HEIGHT_PX}px · 105mm × 148mm)
              </p>
              <p className="mt-0.5 font-mono text-sm text-admin-navy">{reference || "—"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/print-badge"
                className="rounded-xl border border-admin-border bg-white px-4 py-2 text-sm font-medium text-admin-navy transition hover:bg-admin-table-header-bg"
              >
                Back to list
              </Link>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-xl bg-admin-navy px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Print
              </button>
            </div>
          </div>
        </header>
      </div>

      <div className="mx-auto flex min-h-0 justify-center px-4 py-8 print:p-0">
        {loading ? (
          <p className="text-sm text-admin-col-muted print:hidden">Loading badge…</p>
        ) : err ? (
          <p className="text-sm text-red-600 print:hidden">{err}</p>
        ) : (
          <div
            id="badge-print-root"
            className="rounded-lg shadow-lg print:rounded-none print:shadow-none"
          >
            <IaisA6BadgePrint
              lastName={lastName}
              firstName={firstName}
              company={company}
              qrPayload={reference}
            />
          </div>
        )}
      </div>

    </div>
  );
}
