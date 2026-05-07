"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  IconChevronDownMini,
  IconRegistrantActionsFilter,
  IconRegistrantActionsFilterActive,
} from "@/components/icons/admin";
import {
  DateRangeCalendar,
  formatDateRangeSummary,
} from "@/components/admin/registrant-list/date-range-calendar";
import {
  type ColumnFilterConfig,
  isColumnFilterActive,
} from "@/lib/admin/registrant-list/column-filters";

type NonNullConfig = Exclude<ColumnFilterConfig, null>;

type Props = {
  sortKey: string;
  /** Column title shown in enum filter header (Figma Status / multi-select). */
  columnLabel: string;
  config: NonNullConfig;
  /** Current page query string (e.g. `stage=all&flt_ref=foo`). */
  searchParamsString: string;
  onApply: (updates: Record<string, string | null | undefined>) => void;
};

/** Figma calendar — opens date range picker only via this control. */
function DateRangeFieldCalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5.33337 1.33398V3.33398"
        stroke="currentColor"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6666 1.33398V3.33398"
        stroke="currentColor"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.33337 6.06055H13.6667"
        stroke="currentColor"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 8.67399V5.66732C2 3.66732 3 2.33398 5.33333 2.33398H10.6667C13 2.33398 14 3.66732 14 5.66732V11.334C14 13.334 13 14.6673 10.6667 14.6673H5.33333C3 14.6673 2 13.334 2 11.334"
        stroke="currentColor"
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4631 9.13411H10.4691"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4631 11.1341H10.4691"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.99703 9.13411H8.00302"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.99703 11.1341H8.00302"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5295 9.13411H5.53549"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5295 11.1341H5.53549"
        stroke="currentColor"
        strokeWidth={1.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ApplyFiltersCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 3L4.5 8.5L2 6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** White tick inside enum option circle (explicit stroke — avoids currentColor not applying on nested SVG). */
function EnumOptionTickIcon() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 12 12"
      fill="none"
      className="pointer-events-none block"
      aria-hidden
    >
      <path
        d="M10 3L4.5 8.5L2 6"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ColumnFilterTrigger({
  sortKey,
  columnLabel,
  config,
  searchParamsString,
  onApply,
}: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [panelBox, setPanelBox] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [calendarBox, setCalendarBox] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const active = isColumnFilterActive(
    sortKey,
    new URLSearchParams(searchParamsString),
  );

  const [enumSel, setEnumSel] = useState<string[]>([]);
  /** Enum filter: checkbox list only after opening the dropdown row. */
  const [enumMenuOpen, setEnumMenuOpen] = useState(false);
  const [textVal, setTextVal] = useState("");
  const [fromVal, setFromVal] = useState("");
  const [toVal, setToVal] = useState("");
  /** Date kind only: calendar popover opens only from the calendar icon, not with the filter panel. */
  const [calendarOpen, setCalendarOpen] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    queueMicrotask(() => {
      const cur = new URLSearchParams(searchParamsString);
      if (config.kind === "enum") {
        setEnumSel(
          cur
            .get(config.urlKey)
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) ?? [],
        );
      } else if (config.kind === "text") {
        setTextVal(cur.get(config.urlKey) ?? "");
      } else {
        setFromVal(cur.get(config.fromKey) ?? "");
        setToVal(cur.get(config.toKey) ?? "");
      }
      wasOpenRef.current = true;
    });
  }, [open, searchParamsString, config]);

  const enumMenuDisplayed = open && enumMenuOpen;
  const calendarDisplayed = open && calendarOpen;

  const updatePanelPosition = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const margin = 8;
    const enumW = 280;
    const defaultW = 300;
    const w =
      config.kind === "enum" || config.kind === "date"
        ? Math.min(enumW, typeof window !== "undefined" ? window.innerWidth - margin * 2 : enumW)
        : Math.min(defaultW, typeof window !== "undefined" ? window.innerWidth - margin * 2 : defaultW);
    let left = rect.left;
    if (typeof window !== "undefined") {
      left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
    }
    const top = rect.bottom + 4;
    setPanelBox({ top, left, width: w });

    if (
      typeof window !== "undefined" &&
      config.kind === "date" &&
      calendarDisplayed
    ) {
      const calW = Math.min(440, window.innerWidth - margin * 2);
      let calLeft = left + w + 8;
      if (calLeft + calW > window.innerWidth - margin) {
        calLeft = Math.max(margin, left - calW - 8);
      }
      setCalendarBox({ top, left: calLeft });
    } else {
      setCalendarBox(null);
    }
  }, [config.kind, calendarDisplayed]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      if (calendarRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const apply = () => {
    if (config.kind === "enum") {
      onApply({
        [config.urlKey]: enumSel.length ? enumSel.join(",") : null,
        page: null,
      });
    } else if (config.kind === "text") {
      onApply({
        [config.urlKey]: textVal.trim() || null,
        page: null,
      });
    } else {
      onApply({
        [config.fromKey]: fromVal.trim() || null,
        [config.toKey]: toVal.trim() || null,
        page: null,
      });
    }
    setOpen(false);
  };

  const clearFilterDraft = () => {
    if (config.kind === "enum") {
      setEnumSel([]);
    } else if (config.kind === "text") {
      setTextVal("");
    } else {
      setFromVal("");
      setToVal("");
    }
  };

  const enumSelectedLabels = (() => {
    if (config.kind !== "enum") return [];
    return enumSel
      .map((v) => config.options.find((o) => o.value === v)?.label ?? v)
      .filter(Boolean);
  })();

  const enumFooter = (
    <div className="flex items-center justify-between gap-3 border-t border-[#e2e8f0] px-3 pb-3 pt-3.5">
      <button
        type="button"
        onClick={clearFilterDraft}
        className="border-b border-black bg-transparent p-0 text-[12px] font-medium leading-snug text-black hover:opacity-80"
      >
        Clear Filter
      </button>
      <button
        type="button"
        onClick={apply}
        className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[12px] font-medium text-[#fafafa] hover:opacity-95"
      >
        <ApplyFiltersCheckIcon className="size-3.5 text-white" />
        Apply Filters
      </button>
    </div>
  );

  const enumListMarkup =
    config.kind === "enum" && enumMenuDisplayed ? (
      <ul
        className="max-h-[min(208px,40vh)] space-y-0 overflow-y-auto border-t border-[#e2e8f0] px-2 pb-1 pt-2 text-[13px] leading-5 text-[#3f3f46] [scrollbar-color:#000000_#f5f5f5] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-track]:rounded-[10px] [&::-webkit-scrollbar-track]:bg-[#f5f5f5]"
      >
        {config.options.map((opt) => {
          const checked = enumSel.includes(opt.value);
          return (
            <li key={opt.value}>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checked}
                  className="sr-only"
                  onChange={() => {
                    setEnumSel((prev) =>
                      checked
                        ? prev.filter((v) => v !== opt.value)
                        : [...prev, opt.value],
                    );
                  }}
                />
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded-sm border ${
                    checked
                      ? "border-black bg-black"
                      : "border-zinc-400 bg-white"
                  }`}
                  aria-hidden
                >
                  {checked ? <EnumOptionTickIcon /> : null}
                </span>
                <span className="text-[13px] leading-snug">{opt.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        id={panelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`rounded-sm p-0.5 transition-colors ${
          active ? "bg-sky-100 text-black" : "text-[#979797] hover:text-black"
        }`}
        title="Filter column"
      >
        {active ? (
          <IconRegistrantActionsFilterActive className="size-[14px]" aria-hidden />
        ) : (
          <IconRegistrantActionsFilter className="size-[14px]" aria-hidden />
        )}
      </button>
      {open && panelBox && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-labelledby={`${panelId}-title`}
              style={{
                position: "fixed",
                top: panelBox.top,
                left: panelBox.left,
                width: panelBox.width,
                zIndex: 10000,
              }}
              className={
                config.kind === "enum" || config.kind === "date"
                  ? "flex flex-col gap-3 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white px-1 py-2.5 text-left shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08),0px_-2px_4px_0px_rgba(0,0,0,0.06)]"
                  : "rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-left shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08)]"
              }
              onClick={(e) => e.stopPropagation()}
            >
              {config.kind === "enum" ? (
                <>
                  <div
                    id={`${panelId}-title`}
                    className="flex items-center gap-1 border-b border-[#e2e8f0] px-2.5 pb-2 pt-0.5"
                  >
                    <IconRegistrantActionsFilter className="size-4 shrink-0 text-black" />
                    <span className="text-[12px] font-semibold leading-5 text-black">
                      {columnLabel}
                    </span>
                  </div>
                  <div className="px-2.5 pb-1 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnumMenuOpen((v) => !v);
                      }}
                      aria-expanded={enumMenuDisplayed}
                      aria-controls={`${panelId}-enum-list`}
                      id={`${panelId}-enum-trigger`}
                      className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-[#efefef] bg-white px-2 py-1 text-left transition hover:bg-zinc-50"
                    >
                      <span
                        className={`block min-w-0 flex-1 truncate text-left text-[11px] leading-5 ${
                          enumSelectedLabels.length > 0
                            ? "text-black"
                            : "text-[#979797]"
                        }`}
                      >
                        {enumSelectedLabels.length > 0
                          ? `${enumSelectedLabels.slice(0, 2).join(", ")}${enumSelectedLabels.length > 2 ? "…" : ""}`
                          : "Select…"}
                      </span>
                      {enumSelectedLabels.length > 2 ? (
                        <span className="flex h-5 min-w-[28px] shrink-0 items-center justify-center rounded-full bg-black px-1.5 text-[12px] font-bold leading-none text-[#fafafa]">
                          +{enumSelectedLabels.length - 2}
                        </span>
                      ) : null}
                      <IconChevronDownMini
                        className={`size-4 shrink-0 text-black transition ${enumMenuDisplayed ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                  <div
                    id={`${panelId}-enum-list`}
                    role="region"
                    aria-label="Status options"
                    hidden={!enumMenuDisplayed}
                  >
                    {enumListMarkup}
                  </div>
                  {enumFooter}
                </>
              ) : config.kind === "date" ? (
                <>
                  <div
                    id={`${panelId}-title`}
                    className="flex items-center gap-1 border-b border-[#e2e8f0] px-2.5 pb-2 pt-0.5"
                  >
                    <IconRegistrantActionsFilter className="size-4 shrink-0 text-black" />
                    <span className="text-[12px] font-semibold leading-5 text-black">
                      {columnLabel}
                    </span>
                  </div>
                  <div className="px-2.5">
                    <div
                      className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#efefef] bg-white px-3"
                      role="group"
                      aria-label="Date range summary"
                    >
                      <span
                        className={`min-w-0 flex-1 truncate text-left text-[12px] leading-normal ${
                          formatDateRangeSummary(fromVal, toVal)
                            ? "text-black"
                            : "text-[#979797]"
                        }`}
                      >
                        {formatDateRangeSummary(fromVal, toVal) || "Date Range"}
                      </span>
                      <button
                        type="button"
                        title="Open calendar"
                        aria-expanded={calendarDisplayed}
                        aria-label="Open date range calendar"
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#979797] transition hover:bg-zinc-100 hover:text-[#14181f]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCalendarOpen((v) => !v);
                        }}
                      >
                        <DateRangeFieldCalendarIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                  {enumFooter}
                </>
              ) : (
                <>
                  <p
                    id={`${panelId}-title`}
                    className="mb-3 text-[14px] font-semibold leading-snug text-black"
                  >
                    Filter
                  </p>
                  <div className="relative">
                    <input
                      type="search"
                      value={textVal}
                      onChange={(e) => setTextVal(e.target.value)}
                      placeholder="Search…"
                      className={`mb-0 w-full rounded-md border border-black px-3 py-2.5 text-[14px] text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:ring-2 focus:ring-black/15 ${
                        textVal ? "pr-10" : ""
                      }`}
                      autoFocus
                    />
                    {textVal ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTextVal("");
                        }}
                        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-sm text-black hover:bg-zinc-100"
                        aria-label="Clear search"
                      >
                        <span className="text-[18px] leading-none" aria-hidden>
                          ×
                        </span>
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e2e8f0] pt-4">
                    <button
                      type="button"
                      onClick={clearFilterDraft}
                      className="border-b border-black bg-transparent p-0 text-[12px] font-medium leading-snug text-black hover:opacity-80"
                    >
                      Clear Filter
                    </button>
                    <button
                      type="button"
                      onClick={apply}
                      className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white hover:opacity-95"
                    >
                      Apply
                    </button>
                  </div>
                </>
              )}
            </div>,
            document.body,
          )
        : null}
      {open &&
      calendarDisplayed &&
      calendarBox &&
      config.kind === "date" &&
      typeof document !== "undefined"
        ? createPortal(
            <div
              ref={calendarRef}
              style={{
                position: "fixed",
                top: calendarBox.top,
                left: calendarBox.left,
                zIndex: 10001,
              }}
              className="max-w-[calc(100vw-16px)]"
            >
              <DateRangeCalendar
                from={fromVal}
                to={toVal}
                onRangeChange={(f, t) => {
                  setFromVal(f);
                  setToVal(t);
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
