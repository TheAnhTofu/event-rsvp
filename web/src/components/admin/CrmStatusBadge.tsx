import type { CrmPaymentStatus } from "@/types/crm";

const STYLES: Record<CrmPaymentStatus, string> = {
  paid_verified: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  pending_stripe: "bg-amber-50 text-amber-900 ring-amber-200",
  pending_bank_transfer: "bg-amber-50 text-amber-900 ring-amber-200",
  demo_completed: "bg-slate-100 text-slate-800 ring-slate-200",
  no_charge: "bg-slate-100 text-slate-700 ring-slate-200",
};

const LABELS: Record<CrmPaymentStatus, string> = {
  paid_verified: "Paid (verified)",
  pending_stripe: "Pending Stripe",
  pending_bank_transfer: "Pending bank transfer",
  demo_completed: "Demo",
  no_charge: "No charge",
};

export function CrmStatusBadge({ status }: { status: CrmPaymentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
