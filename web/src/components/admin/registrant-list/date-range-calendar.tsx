"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const RANGE_BG = "#d1e0ff";
const TEXT_MUTED = "#6f7c8e";
const TEXT_DAY = "#14181f";
const NAV_BORDER = "#dce0e5";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseYmd(s: string): Date | null {
  const t = s?.trim();
  if (!t) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(y, mo - 1, day);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== mo - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

export function formatDateRangeSummary(from: string, to: string): string {
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (!a && !b) return "";
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (a && !b) return a.toLocaleDateString("en-US", opts);
  if (a && b) {
    return `${a.toLocaleDateString("en-US", opts)} – ${b.toLocaleDateString("en-US", opts)}`;
  }
  return "";
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

type MonthCells = {
  year: number;
  month: number;
  cells: (number | null)[];
};

function buildMonthCells(monthStart: Date): MonthCells {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return { year, month, cells };
}

type Props = {
  from: string;
  to: string;
  onRangeChange: (from: string, to: string) => void;
};

export function DateRangeCalendar({ from, to, onRangeChange }: Props) {
  const start = parseYmd(from);
  const end = parseYmd(to);

  const [cursor, setCursor] = useState(() => {
    const base = start ?? end ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const leftMonth = cursor;
  const rightMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  const leftGrid = useMemo(() => buildMonthCells(leftMonth), [leftMonth]);
  const rightGrid = useMemo(() => buildMonthCells(rightMonth), [rightMonth]);

  const rangeLo =
    start && end
      ? startOfDay(start) <= startOfDay(end)
        ? start
        : end
      : start ?? null;
  const rangeHi =
    start && end
      ? startOfDay(start) <= startOfDay(end)
        ? end
        : start
      : end ?? null;

  const handleDayClick = (year: number, month: number, day: number) => {
    const clicked = new Date(year, month, day);
    const fs = parseYmd(from);
    const fe = parseYmd(to);

    if (!fs || (fs && fe)) {
      onRangeChange(toYmd(clicked), "");
      return;
    }
    const lo =
      startOfDay(clicked).getTime() < startOfDay(fs).getTime()
        ? clicked
        : fs;
    const hi =
      startOfDay(clicked).getTime() < startOfDay(fs).getTime()
        ? fs
        : clicked;
    onRangeChange(toYmd(lo), toYmd(hi));
  };

  const stepMonth = (delta: number) => {
    setCursor(
      (c) => new Date(c.getFullYear(), c.getMonth() + delta, 1),
    );
  };

  /** One shared 2-month window: only left column has “previous”, only right has “next” (avoids duplicate controls that moved both months and felt like a bug). */
  const renderMonth = (grid: MonthCells, pane: "left" | "right") => (
    <div
      key={pane}
      className="flex min-w-0 flex-1 flex-col gap-1.5 px-3 first:pl-0 last:pr-0"
    >
      <div className="flex h-6 items-center justify-center gap-0.5">
        {pane === "left" ? (
          <button
            type="button"
            aria-label="Previous months"
            className="flex size-6 shrink-0 items-center justify-center rounded-[10px] border bg-white shadow-[inset_0_9px_9px_0_rgba(255,255,255,0.12),inset_0_-1.5px_1.5px_0_rgba(48,48,48,0.1)]"
            style={{ borderColor: NAV_BORDER }}
            onClick={(e) => {
              e.stopPropagation();
              stepMonth(-1);
            }}
          >
            <ChevronLeft className="size-[15px] text-[#14181f]" />
          </button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}
        <p className="min-w-0 flex-1 text-center text-[11px] font-medium leading-snug text-[#14181f]">
          {monthLabel(new Date(grid.year, grid.month, 1))}
        </p>
        {pane === "right" ? (
          <button
            type="button"
            aria-label="Next months"
            className="flex size-6 shrink-0 items-center justify-center rounded-[10px] border bg-white shadow-[inset_0_9px_9px_0_rgba(255,255,255,0.12),inset_0_-1.5px_1.5px_0_rgba(48,48,48,0.1)]"
            style={{ borderColor: NAV_BORDER }}
            onClick={(e) => {
              e.stopPropagation();
              stepMonth(1);
            }}
          >
            <ChevronRight className="size-[15px] text-[#14181f]" />
          </button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden />
        )}
      </div>
      <div
        className="grid w-full grid-cols-7 text-center text-[12px] font-medium leading-none"
        style={{ color: TEXT_MUTED }}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} className="flex h-7 items-center justify-center">
            {w}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-[3px]">
        {Array.from({ length: grid.cells.length / 7 }, (_, row) => (
          <div
            key={row}
            className="grid w-full grid-cols-7 items-center justify-items-center"
          >
            {grid.cells.slice(row * 7, row * 7 + 7).map((dayNum, col) => {
              if (dayNum == null) {
                return (
                  <div
                    key={`e-${row}-${col}`}
                    className="size-[27px] shrink-0"
                  />
                );
              }
              const dayDate = new Date(grid.year, grid.month, dayNum);
              const isStart =
                rangeLo != null && sameDay(dayDate, rangeLo);
              const isEnd = rangeHi != null && sameDay(dayDate, rangeHi);
              const inBetween =
                rangeLo != null &&
                rangeHi != null &&
                startOfDay(dayDate) > startOfDay(rangeLo) &&
                startOfDay(dayDate) < startOfDay(rangeHi);

              return (
                <button
                  key={dayNum}
                  type="button"
                  className={`relative flex size-[27px] items-center justify-center rounded-[11px] text-[11px] font-medium leading-none ${
                    isStart || isEnd
                      ? "z-1 bg-black text-white"
                      : inBetween
                        ? "text-[#14181f]"
                        : "text-[#14181f] hover:bg-zinc-100"
                  }`}
                  style={
                    inBetween
                      ? { backgroundColor: RANGE_BG, color: TEXT_DAY }
                      : isStart || isEnd
                        ? { backgroundColor: "#000000", color: "#ffffff" }
                        : { color: TEXT_DAY }
                  }
                  onClick={() =>
                    handleDayClick(grid.year, grid.month, dayNum)
                  }
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="flex max-w-[min(100vw-16px,440px)] flex-row divide-x divide-[#e2e8f0] rounded-xl bg-white p-2 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.1)]"
      data-name="date-range-calendar"
    >
      {renderMonth(leftGrid, "left")}
      {renderMonth(rightGrid, "right")}
    </div>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
