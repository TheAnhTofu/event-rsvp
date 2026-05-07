"use client";

import { Link } from "@/i18n/navigation";
import {
  IconDotsVertical,
  IconPrinter,
  IconSortArrowDown,
  IconSortArrowUp,
} from "@/components/icons/admin";
import { RegistrantStatusBadge } from "@/components/admin/registrant-list/registrant-status-badge";
import type { Registration } from "@/lib/admin/registrant-list/types";
import {
  formatRegistrantTelephone,
} from "@/lib/admin/registrant-list/utils";

function SortTh({
  label,
  sortKey,
  activeSort,
  order,
  align,
  onSort,
}: {
  label: string;
  sortKey: string;
  activeSort: string;
  order: "asc" | "desc";
  align: "left" | "center" | "right";
  onSort: (k: string) => void;
}) {
  const active = activeSort === sortKey;
  const labelClass = active
    ? "font-semibold text-admin-navy"
    : "font-medium text-[#979797]";
  const sortMuted = "text-admin-col-muted/50";
  const sortActive = "text-admin-navy";
  const labelBlockAlign =
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start";

  return (
    <th
      className={`h-12 border-b border-r border-admin-table-border bg-admin-table-header-bg px-2 py-0 ${
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex min-h-12 w-full min-w-0 items-center gap-1 text-[12px] transition hover:opacity-90 ${labelBlockAlign}`}
      >
        <span className={`truncate ${labelClass}`}>{label}</span>
        <span className="inline-flex shrink-0 items-center gap-0" aria-hidden>
          <IconSortArrowUp
            emphasized={active && order === "asc"}
            className={active && order === "asc" ? sortActive : sortMuted}
          />
          <IconSortArrowDown
            emphasized={active && order === "desc"}
            className={`${active && order === "desc" ? sortActive : sortMuted} -ml-0.5`}
          />
        </span>
      </button>
    </th>
  );
}

function PlainTh({
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
  sortKey: string;
  sortOrder: "asc" | "desc";
  onSort: (columnKey: string) => void;
  onPrintBadge: (reg: Registration) => void;
};

export function PrintBadgeTable({
  registrations,
  selected,
  toggleSelect,
  selectAll,
  sortKey,
  sortOrder,
  onSort,
  onPrintBadge,
}: Props) {
  return (
    <div className="w-full overflow-x-auto border-t border-admin-table-border">
      <table className="w-full min-w-[1100px] table-fixed border-collapse border border-admin-table-border text-sm">
        <thead>
          <tr className="text-[12px] text-admin-navy">
            <th className="h-12 w-10 border-b border-r border-admin-table-border bg-admin-table-header-bg px-2 text-center align-middle">
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
            <SortTh
              label="Registrant ID"
              sortKey="reference"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
            />
            <SortTh
              label="Registrant Status"
              sortKey="pipeline_stage"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
            />
            <SortTh
              label="First name"
              sortKey="first_name"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
            />
            <SortTh
              label="Last name"
              sortKey="last_name"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
            />
            <SortTh
              label="Email Address"
              sortKey="email"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
            />
            <SortTh
              label="Telephone"
              sortKey="phone"
              activeSort={sortKey}
              order={sortOrder}
              align="left"
              onSort={onSort}
            />
            <PlainTh label="Action" align="center" />
            <th className="h-12 w-12 border-b border-admin-table-border bg-admin-table-header-bg px-1 text-center align-middle">
              <span className="sr-only">Row menu</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {registrations.length === 0 ? (
            <tr>
              <td
                colSpan={9}
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
                  href={`/admin/registrations/${encodeURIComponent(reg.reference)}`}
                  className="block min-w-0 truncate text-admin-navy underline decoration-admin-border underline-offset-2 hover:opacity-80"
                  title={reg.reference}
                >
                  {reg.reference}
                </Link>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle">
                <button
                  type="button"
                  onClick={() => onPrintBadge(reg)}
                  className="inline-flex max-w-full cursor-pointer border-0 bg-transparent p-0 text-left"
                  title="Print badge"
                >
                  <RegistrantStatusBadge reg={reg} />
                </button>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[14px] leading-5 text-text">
                <span
                  className="block truncate"
                  title={reg.first_name?.trim() || undefined}
                >
                  {reg.first_name?.trim() || "—"}
                </span>
              </td>
              <td className="min-w-0 border-b border-r border-admin-table-border px-2 text-left align-middle text-[14px] leading-5 text-text">
                <span
                  className="block truncate"
                  title={reg.last_name?.trim() || undefined}
                >
                  {reg.last_name?.trim() || "—"}
                </span>
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
              <td className="border-b border-r border-admin-table-border px-2 text-center align-middle">
                <button
                  type="button"
                  onClick={() => onPrintBadge(reg)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0e7490] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#0c6478]"
                >
                  <IconPrinter className="size-3.5 shrink-0 text-white" />
                  Print Badge
                </button>
              </td>
              <td className="border-b border-admin-table-border px-1 text-center align-middle">
                <Link
                  href={`/admin/registrations/${encodeURIComponent(reg.reference)}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-admin-col-muted hover:bg-white hover:text-admin-navy"
                  title="Open registrant"
                >
                  <IconDotsVertical className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
