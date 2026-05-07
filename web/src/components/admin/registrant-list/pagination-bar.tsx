import { IconPaginationNext, IconPaginationPrev } from "@/components/icons/admin";
import { PAGE_SIZE_OPTIONS } from "@/lib/admin/registrant-list/constants";
import { visiblePageRange } from "@/lib/admin/registrant-list/utils";

/** List footer: total count, prev/next, page number pills, rows-per-page control. */
export function PaginationBar(props: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
  disabled?: boolean;
}) {
  const { page, pageSize, total, onPageChange, onPageSizeChange, disabled } = props;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = visiblePageRange(page, totalPages);
  const muted = "text-[#979797]";

  return (
    <div
      className="flex min-h-[55px] flex-wrap items-center justify-between gap-3 border-t border-admin-table-border bg-white px-2 py-2 sm:px-4"
      role="navigation"
      aria-label="Pagination"
    >
      <p className={`shrink-0 text-[12px] font-medium leading-5 ${muted}`}>
        Total {total} {total === 1 ? "item" : "items"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`inline-flex items-center gap-1 rounded-xl py-2 pl-2 pr-3 text-[11px] font-medium transition hover:bg-admin-table-header-bg disabled:opacity-50 ${muted}`}
        >
          <IconPaginationPrev className="shrink-0" aria-hidden />
          Previous
        </button>

        {pages.map((p) => {
          const active = p === page;
          return (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(p)}
              className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-medium transition disabled:opacity-50 ${
                active
                  ? "bg-zinc-900 text-white"
                  : "border border-[#cfcfcf] bg-white text-zinc-900 hover:bg-admin-table-header-bg"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`inline-flex items-center gap-1 rounded-xl py-2 pl-3 pr-2 text-[11px] font-medium transition hover:bg-admin-table-header-bg disabled:opacity-50 ${muted}`}
        >
          Next
          <IconPaginationNext className="shrink-0" aria-hidden />
        </button>
      </div>

      <div
        className="flex shrink-0 items-stretch overflow-hidden rounded-xl border border-[#e3e3e3]"
        role="group"
        aria-label="Rows per page"
      >
        {PAGE_SIZE_OPTIONS.map((n, i) => {
          const active = pageSize === n;
          const isFirst = i === 0;
          const isLast = i === PAGE_SIZE_OPTIONS.length - 1;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onPageSizeChange(n)}
              className={`min-w-[38px] px-3 py-2 text-[11px] font-normal transition disabled:opacity-50 ${
                active
                  ? "bg-zinc-900 text-white"
                  : "border-[#e3e3e3] bg-white text-zinc-900 hover:bg-admin-table-header-bg"
              } ${!isFirst ? "border-l border-[#e3e3e3]" : ""} ${
                isFirst ? "rounded-l-xl" : ""
              } ${isLast ? "rounded-r-xl" : ""}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
