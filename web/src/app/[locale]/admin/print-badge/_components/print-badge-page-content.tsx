"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconPrinter, IconSearchField } from "@/components/icons/admin";
import { PaginationBar } from "@/components/admin/registrant-list/pagination-bar";
import { PrintBadgeTable } from "./print-badge-table";
import { usePathname, useRouter } from "@/i18n/navigation";
import { PipelineStageBadgeByStageId } from "@/components/admin/pipeline-stage-badge";
import { IaisA6BadgePrint } from "@/components/admin/badge/iaais-a6-badge-print";
import { PIPELINE_CHIPS } from "@/lib/admin/registrant-list/constants";
import type { PipelineFilter, Registration } from "@/lib/admin/registrant-list/types";
import {
  normalizeRegistration,
  parsePageSizeParam,
  parseRegSortParam,
} from "@/lib/admin/registrant-list/utils";
import { copyColumnFiltersToParams } from "@/lib/admin/registrant-list/column-filters";

const PRINT_STAGE_OPTIONS = PIPELINE_CHIPS.filter(
  (c): c is { id: Exclude<PipelineFilter, "all">; label: string } => c.id !== "all",
);
const ALL_STAGE_IDS = PRINT_STAGE_OPTIONS.map((c) => c.id);

function effectiveStagesFromUrl(fltPs: string | null): Set<string> | "all" {
  const raw = fltPs?.trim();
  if (!raw) return "all";
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Exclude<PipelineFilter, "all"> =>
      ALL_STAGE_IDS.includes(s as Exclude<PipelineFilter, "all">),
    );
  if (parts.length === 0) return "all";
  if (parts.length === ALL_STAGE_IDS.length) return "all";
  return new Set(parts);
}

export function PrintBadgePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = parsePageSizeParam(searchParams.get("pageSize"));

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [searchDraft, setSearchDraft] = useState(() => searchParams.get("q") ?? "");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printReg, setPrintReg] = useState<Registration | null>(null);
  const printOnceRef = useRef(false);

  const spKey = searchParams.toString();

  const requestPrintDialog = useCallback(() => {
    if (printOnceRef.current) return;
    printOnceRef.current = true;
    window.print();
  }, []);

  useEffect(() => {
    printOnceRef.current = false;
  }, [printReg?.reference]);

  useEffect(() => {
    const onAfterPrint = () => setPrintReg(null);
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  useEffect(() => {
    if (printReg) {
      document.documentElement.setAttribute("data-print-badge", "1");
    } else {
      document.documentElement.removeAttribute("data-print-badge");
    }
    return () => {
      document.documentElement.removeAttribute("data-print-badge");
    };
  }, [printReg]);

  const handlePrintBadge = useCallback((reg: Registration) => {
    setPrintReg(reg);
  }, []);

  const patchUrl = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      if (p.get("page") === "1") p.delete("page");
      const sortV = p.get("sort");
      const orderAfter = p.get("order");
      if (!sortV || (sortV === "created_at" && orderAfter !== "asc")) {
        p.delete("sort");
      }
      const orderV = p.get("order");
      if (!orderV || orderV === "desc") p.delete("order");
      const ps = p.get("pageSize");
      if (!ps || ps === "15") p.delete("pageSize");
      const qv = p.get("q")?.trim();
      if (!qv) p.delete("q");
      if (!p.get("flt_ps")?.trim()) p.delete("flt_ps");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setSearchDraft(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit searchParams to avoid resetting the input on every debounced `q` URL update while typing
  }, [pathname]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchDraft.trim();
      const cur = searchParams.get("q")?.trim() ?? "";
      if (next === cur) return;
      patchUrl({ q: next || null, page: null });
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft, patchUrl, searchParams]);

  useEffect(() => {
    setSelected(new Set());
  }, [spKey]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const p = Math.max(1, Number(searchParams.get("page")) || 1);
      const q = searchParams.get("q")?.trim() ?? "";
      const sort = parseRegSortParam(searchParams.get("sort"));
      const order = searchParams.get("order") === "asc" ? "asc" : "desc";

      const req = new URLSearchParams();
      req.set("view", "registrations");
      req.set("page", String(p));
      req.set("pageSize", String(pageSize));
      if (q) req.set("q", q);
      req.set("sort", sort);
      req.set("order", order);
      req.set("stage", "all");
      req.set("pm", "all");
      copyColumnFiltersToParams(req, new URLSearchParams(searchParams.toString()));

      const res = await fetch(`/api/admin/emails?${req.toString()}`);
      const data = (await res.json()) as {
        registrations?: unknown[];
        total?: number;
        error?: string;
      };
      if (!res.ok) {
        setRegistrations([]);
        setTotal(0);
        return;
      }
      const rawRegs = data.registrations ?? [];
      setRegistrations(
        Array.isArray(rawRegs)
          ? rawRegs.map((r) => normalizeRegistration(r as Record<string, unknown>))
          : [],
      );
      setTotal(data.total ?? 0);
    } catch {
      setRegistrations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize, searchParams]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const fltPs = searchParams.get("flt_ps");
  const effectiveStages = useMemo(() => effectiveStagesFromUrl(fltPs), [fltPs]);

  const stageChecked = useCallback(
    (id: Exclude<PipelineFilter, "all">) => {
      if (effectiveStages === "all") return true;
      return effectiveStages.has(id);
    },
    [effectiveStages],
  );

  const toggleStage = useCallback(
    (id: Exclude<PipelineFilter, "all">) => {
      const allIds = ALL_STAGE_IDS;
      let next: Set<string>;
      if (effectiveStages === "all") {
        next = new Set(allIds);
      } else {
        next = new Set(effectiveStages);
      }
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) return;
      if (next.size === allIds.length) {
        patchUrl({ flt_ps: null, page: null });
      } else {
        patchUrl({
          flt_ps: [...next].sort().join(","),
          page: null,
        });
      }
    },
    [effectiveStages, patchUrl],
  );

  const setPageUrl = (p: number) => {
    patchUrl({ page: p <= 1 ? null : String(p) });
  };

  const setPageSizeUrl = useCallback(
    (n: number) => {
      patchUrl({
        pageSize: n === 15 ? null : String(n),
        page: null,
      });
    },
    [patchUrl],
  );

  const sortKey = parseRegSortParam(searchParams.get("sort"));
  const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

  const handleSort = useCallback(
    (columnKey: string) => {
      const cur = parseRegSortParam(searchParams.get("sort"));
      const curOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
      const same = cur === columnKey;
      const nextOrder = same ? (curOrder === "desc" ? "asc" : "desc") : "desc";
      const updates: Record<string, string | null | undefined> = { page: null };
      if (columnKey === "created_at" && nextOrder === "desc") {
        updates.sort = null;
        updates.order = null;
      } else {
        updates.sort = columnKey;
        updates.order = nextOrder === "desc" ? null : "asc";
      }
      patchUrl(updates);
    },
    [patchUrl, searchParams],
  );

  const toggleSelect = (reference: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(reference)) n.delete(reference);
      else n.add(reference);
      return n;
    });
  };

  const selectAll = () => {
    if (selected.size === registrations.length) setSelected(new Set());
    else setSelected(new Set(registrations.map((r) => r.reference)));
  };

  return (
    <>
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-page-bg ${printReg ? "print:hidden" : ""}`}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-admin-border bg-white px-5 py-[15px]">
        <div className="flex items-center gap-1.5">
          <IconPrinter className="size-5 shrink-0 text-admin-navy" />
          <h1 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
            Print Badge
          </h1>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-white p-5 pb-16">
        <div className="w-full min-w-0 overflow-hidden rounded-lg border border-admin-border bg-white shadow-[0_4px_2px_-2px_rgba(27,46,94,0.02)]">
          <div className="border-b border-admin-border bg-white px-4 py-4 sm:px-5">
            <label className="relative block w-full max-w-[560px]">
              <IconSearchField className="pointer-events-none absolute left-3 top-1/2 size-[20px] -translate-y-1/2 text-[#828282]" />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                placeholder="Search........"
                title="Search name, email, phone, company, reference"
                enterKeyHint="search"
                className="block h-10 w-full rounded-xl border border-[#e0e0e0] bg-white py-2 pl-10 pr-3 font-display text-[13.617px] font-normal text-ink placeholder:text-[#828282] outline-none transition focus:border-[#1687c8] focus:ring-2 focus:ring-[#1687c8]/25"
              />
            </label>
          </div>

          <div className="border-b border-admin-border bg-[#fafafa] px-4 py-3 sm:px-5">
            <p className="mb-2 text-[12px] font-semibold text-admin-navy">Status Filters</p>
            <div className="flex flex-wrap gap-2">
              {PRINT_STAGE_OPTIONS.map(({ id }) => (
                <label
                  key={id}
                  className="inline-flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={stageChecked(id)}
                    onChange={() => toggleStage(id)}
                    className="size-3.5 shrink-0 rounded border-admin-border"
                  />
                  <PipelineStageBadgeByStageId stage={id} size="table" />
                </label>
              ))}
            </div>
          </div>

          <section className="p-0">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-admin-col-muted">Loading…</p>
            ) : (
              <PrintBadgeTable
                registrations={registrations}
                selected={selected}
                toggleSelect={toggleSelect}
                selectAll={selectAll}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={handleSort}
                onPrintBadge={handlePrintBadge}
              />
            )}

            {!loading && (
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={total}
                disabled={loading}
                onPageChange={setPageUrl}
                onPageSizeChange={setPageSizeUrl}
              />
            )}
          </section>
        </div>
      </div>
    </div>

    {printReg ? (
      <div className="badge-print-surface hidden print:block" aria-hidden>
        <IaisA6BadgePrint
          key={printReg.reference}
          lastName={printReg.last_name ?? ""}
          firstName={printReg.first_name ?? ""}
          company={printReg.company ?? ""}
          qrPayload={printReg.reference}
          onReady={requestPrintDialog}
        />
      </div>
    ) : null}
    </>
  );
}
