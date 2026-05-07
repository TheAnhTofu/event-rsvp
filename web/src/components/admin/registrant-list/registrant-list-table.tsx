"use client";

import { Link } from "@/i18n/navigation";
import type { Registration } from "@/lib/admin/registrant-list/types";
import {
  formatAmountHkd,
  formatPaymentMethodLabel,
  formatRegistrantTelephone,
  formatTrDate,
  formatTrDateTime,
  paymentReferenceDisplay,
} from "@/lib/admin/registrant-list/utils";
import { SortableHeader } from "./sortable-header";
import { BankSlipPaymentReference } from "./bank-slip-payment-reference";
import { RegistrantStatusBadge } from "./registrant-status-badge";
import { RegistrationTypeBadge } from "./registration-type-badge";

function PlainHeader({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "center" | "right";
}) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      className={`h-12 border-b border-r border-admin-table-border bg-admin-table-header-bg px-2 py-0 align-middle text-[12px] font-medium text-admin-navy ${alignClass}`}
    >
      <div className="flex min-h-12 w-full items-center px-0.5">
        <span className="truncate">{label}</span>
      </div>
    </th>
  );
}

type Props = {
  registrations: Registration[];
  selected: Set<string>;
  toggleSelect: (reference: string) => void;
  selectAll: () => void;
  /** Server sort (URL-driven); aligns with Figma sortable headers. */
  sortKey: string;
  sortOrder: "asc" | "desc";
  onSort: (columnKey: string) => void;
  searchParamsString: string;
  onColumnFilterApply: (updates: Record<string, string | null | undefined>) => void;
};

/** Column min-widths aligned with Figma node 656:9745 (horizontal scroll). */
const COL = {
  checkbox: "w-10",
  registrantId: "min-w-[180px]",
  status: "min-w-[210px]",
  registrationType: "min-w-[180px]",
  /** Combined First + Last name (column name = "Name"). */
  name: "min-w-[200px]",
  email: "min-w-[240px]",
  telephone: "min-w-[160px]",
  paymentMethod: "min-w-[200px]",
  amountPaid: "min-w-[140px]",
  paymentDate: "min-w-[140px]",
  receipt: "min-w-[180px]",
  paymentReference: "min-w-[400px]",
  country: "min-w-[200px]",
  company: "min-w-[280px]",
  jobTitle: "min-w-[200px]",
  checkInAt: "min-w-[160px]",
  checkOutAt: "min-w-[160px]",
  /** Per-template "last sent" date+time columns. */
  ackSentAt: "min-w-[170px]",
  paymentSentAt: "min-w-[170px]",
  confirmationSentAt: "min-w-[170px]",
  thankYouSentAt: "min-w-[170px]",
  createdAt: "min-w-[140px]",
} as const;

export function RegistrantListTable({
  registrations,
  selected,
  toggleSelect,
  selectAll,
  sortKey,
  sortOrder,
  onSort,
  searchParamsString,
  onColumnFilterApply,
}: Props) {
  return (
    <div className="w-full overflow-x-auto border-t border-admin-table-border">
      <table className="w-full min-w-[4220px] table-fixed border-collapse border border-admin-table-border text-sm">
        <colgroup>
          <col className={COL.checkbox} />
          <col className={COL.registrantId} />
          <col className={COL.status} />
          <col className={COL.registrationType} />
          <col className={COL.name} />
          <col className={COL.email} />
          <col className={COL.telephone} />
          <col className={COL.paymentMethod} />
          <col className={COL.amountPaid} />
          <col className={COL.paymentDate} />
          <col className={COL.receipt} />
          <col className={COL.paymentReference} />
          <col className={COL.country} />
          <col className={COL.company} />
          <col className={COL.jobTitle} />
          <col className={COL.checkInAt} />
          <col className={COL.checkOutAt} />
          <col className={COL.ackSentAt} />
          <col className={COL.paymentSentAt} />
          <col className={COL.confirmationSentAt} />
          <col className={COL.thankYouSentAt} />
          <col className={COL.createdAt} />
        </colgroup>
        <thead>
          <tr className="text-[12px] text-admin-navy">
            <th className="h-12 border-b border-r border-admin-table-border bg-admin-table-header-bg px-2 text-center align-middle">
              <input
                type="checkbox"
                checked={
                  selected.size === registrations.length && registrations.length > 0
                }
                onChange={selectAll}
                className="size-4 rounded border-admin-border"
                aria-label="Select all on page"
              />
            </th>
            <SortableHeader
              label="Registrant ID"
              sortKey="reference"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Registrant Status"
              sortKey="pipeline_stage"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Registration Type"
              sortKey="audience_type"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Name"
              sortKey="last_name"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Email Address"
              sortKey="email"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Telephone"
              sortKey="phone"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Payment Method"
              sortKey="payment_method"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Amount Paid"
              sortKey="fee_hkd"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Payment Date"
              sortKey="payment_date"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <PlainHeader label="Receipt" />
            <SortableHeader
              label="Payment Reference"
              sortKey="payment_reference"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Country/Region"
              sortKey="country"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Company / Organization"
              sortKey="company"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <SortableHeader
              label="Job Title"
              sortKey="job_title"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
            <PlainHeader label="Check-in time" />
            <PlainHeader label="Check-out time" />
            <PlainHeader label="Acknowledge Email Sent" />
            <PlainHeader label="Payment Complete Email Sent" />
            <PlainHeader label="Confirmation Email Sent" />
            <PlainHeader label="Thank You Email Sent" />
            <SortableHeader
              label="Created At"
              sortKey="created_at"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
              searchParamsString={searchParamsString}
              onColumnFilterApply={onColumnFilterApply}
            />
          </tr>
        </thead>
        <tbody>
          {registrations.length === 0 ? (
            <tr>
              <td
                colSpan={22}
                className="border-b border-admin-table-border bg-white px-5 py-10 text-center text-sm text-admin-col-muted"
              >
                No registrations match.
              </td>
            </tr>
          ) : null}
          {registrations.map((reg) => (
            <tr key={reg.reference} className="hover:bg-admin-sidebar-bg/50">
              <td className="h-10 border-b border-r border-admin-table-border px-2 text-center align-middle">
                <input
                  type="checkbox"
                  checked={selected.has(reg.reference)}
                  onChange={() => toggleSelect(reg.reference)}
                  className="size-4 rounded border-admin-border"
                  aria-label={`Select ${reg.reference}`}
                />
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle font-mono text-[12px]">
                <Link
                  href={`/admin/registrations/${encodeURIComponent(reg.reference)}?tab=payment`}
                  className="block min-w-0 truncate text-admin-navy underline decoration-admin-border underline-offset-2 hover:opacity-80"
                  title={reg.reference}
                >
                  {reg.reference}
                </Link>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle">
                <RegistrantStatusBadge reg={reg} />
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] text-text">
                <RegistrationTypeBadge
                  audienceType={reg.audience_type}
                  className="w-fit max-w-full"
                />
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[14px] leading-5 text-text">
                {(() => {
                  const fullName = [reg.first_name?.trim(), reg.last_name?.trim()]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <span className="block truncate" title={fullName || undefined}>
                      {fullName || "—"}
                    </span>
                  );
                })()}
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] leading-5 text-text">
                <span className="block truncate" title={reg.email || undefined}>
                  {reg.email}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                <span
                  className="block truncate"
                  title={formatRegistrantTelephone(reg.phone_country, reg.phone_number)}
                >
                  {formatRegistrantTelephone(reg.phone_country, reg.phone_number)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] text-text">
                <span className="block truncate">
                  {formatPaymentMethodLabel(reg.payment_method)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                {formatAmountHkd(reg.fee_hkd)}
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                {reg.payment_at ? formatTrDate(reg.payment_at) : "—"}
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] text-text">
                {reg.has_bank_slip ? (
                  <span title="Bank transfer slip on file">Bank slip</span>
                ) : (
                  <span className="text-admin-col-muted">—</span>
                )}
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle font-mono text-[12px] text-text">
                {reg.payment_method === "bank_transfer" && reg.has_bank_slip ? (
                  <BankSlipPaymentReference reference={reg.reference} />
                ) : (
                  <span
                    className="block truncate"
                    title={
                      reg.stripe_payment_intent_id?.trim() ||
                      reg.stripe_checkout_session_id?.trim() ||
                      undefined
                    }
                  >
                    {paymentReferenceDisplay(reg)}
                  </span>
                )}
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] text-text">
                <span className="block truncate" title={reg.country ?? undefined}>
                  {reg.country?.trim() || "—"}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] text-text">
                <span className="block truncate" title={reg.company ?? undefined}>
                  {reg.company?.trim() || "—"}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] text-text">
                <span className="block truncate" title={reg.job_title ?? undefined}>
                  {reg.job_title?.trim() || "—"}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                <span className="block truncate" title={reg.check_in_at ?? undefined}>
                  {formatTrDateTime(reg.check_in_at)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                <span className="block truncate" title={reg.check_out_at ?? undefined}>
                  {formatTrDateTime(reg.check_out_at)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                <span
                  className="block truncate"
                  title={reg.acknowledge_email_sent_at ?? undefined}
                >
                  {formatTrDateTime(reg.acknowledge_email_sent_at)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                <span
                  className="block truncate"
                  title={reg.payment_confirmation_email_sent_at ?? undefined}
                >
                  {formatTrDateTime(reg.payment_confirmation_email_sent_at)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                <span
                  className="block truncate"
                  title={reg.email_confirmation_sent_at ?? undefined}
                >
                  {formatTrDateTime(reg.email_confirmation_sent_at)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                <span
                  className="block truncate"
                  title={reg.thank_you_email_sent_at ?? undefined}
                >
                  {formatTrDateTime(reg.thank_you_email_sent_at)}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[13px] tabular-nums text-text">
                {formatTrDate(reg.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
