"use client";

import {
  IconSortArrowDown,
  IconSortArrowUp,
} from "@/components/icons/admin";
import { ColumnFilterTrigger } from "./column-filter-trigger";
import {
  columnFilterConfigForSortKey,
} from "@/lib/admin/registrant-list/column-filters";

export function SortableHeader(props: {
  label: string;
  sortKey: string;
  activeSort: string;
  order: "asc" | "desc";
  align: "left" | "center" | "right";
  onSort: (k: string) => void;
  /** When false, header matches Figma visually but does not change sort (e.g. Receipt). */
  sortable?: boolean;
  searchParamsString: string;
  onColumnFilterApply: (updates: Record<string, string | null | undefined>) => void;
}) {
  const {
    label,
    sortKey,
    activeSort,
    order,
    align,
    onSort,
    sortable = true,
    searchParamsString,
    onColumnFilterApply,
  } = props;
  const active = sortable && activeSort === sortKey;
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

  const labelBlock = (
    <div
      className={`flex min-w-0 flex-1 items-center gap-1 ${labelBlockAlign}`}
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
    </div>
  );

  const filterCfg = columnFilterConfigForSortKey(sortKey);

  const rowClass = `flex min-h-12 w-full max-w-full items-center gap-1 text-[12px] ${
    align === "center"
      ? "justify-center"
      : align === "right"
        ? "justify-end"
        : "justify-start"
  }`;

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
      <div className={rowClass}>
        {sortable ? (
          <button
            type="button"
            onClick={() => onSort(sortKey)}
            className="flex min-h-12 min-w-0 flex-1 items-center gap-1 text-left transition hover:opacity-90"
          >
            {labelBlock}
          </button>
        ) : (
          <div className="flex min-h-12 min-w-0 flex-1 items-center gap-1">{labelBlock}</div>
        )}
        {filterCfg ? (
          <ColumnFilterTrigger
            sortKey={sortKey}
            columnLabel={label}
            config={filterCfg}
            searchParamsString={searchParamsString}
            onApply={onColumnFilterApply}
          />
        ) : null}
      </div>
    </th>
  );
}
