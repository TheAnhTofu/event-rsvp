"use client";

import type { CheckInLogEntry } from "@/types/admin-registration-detail";

type Props = {
  /** All scans for this registration, oldest first. */
  entries: CheckInLogEntry[];
};

function formatTimelineStamp(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const d = new Date(t);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function actorLabel(checkedBy: string | null): string {
  /**
   * Figma 1439:23932 prints "by Admin" rather than the actual user; show
   * the captured admin email when available, otherwise fall back to "Admin".
   */
  if (checkedBy?.trim()) return `by ${checkedBy.trim()}`;
  return "by Admin";
}

/**
 * Check-in Information — Figma 1439:23932 redesign.
 *
 * Compact log-style timeline: small dot + thin vertical connector on the left,
 * "Check-in/out by ADMIN" + "DD/MM/YYYY HH:MM" on the right.
 */
export function CheckInInformationTimeline({ entries }: Props) {
  return (
    <section
      className="flex flex-col gap-6 rounded-xl border border-admin-border bg-white p-6"
      data-figma-node="1439:23932"
    >
      <h2 className="text-[18px] font-semibold leading-[22px] text-admin-navy">
        Check-in Information
      </h2>

      {entries.length === 0 ? (
        <p className="text-[14px] leading-5 text-admin-col-muted">
          No check-in or check-out events yet.
        </p>
      ) : (
        <div className="flex w-full items-start gap-4">
          {/* Timeline rail */}
          <div className="flex shrink-0 flex-col items-center gap-[5px] self-stretch">
            <div className="flex h-[11px] w-3 flex-col items-center">
              <div className="w-px flex-1 bg-[#343a40]" />
            </div>
            {entries.map((e, i) => (
              <div
                key={`${e.id}-rail`}
                className="flex flex-col items-center gap-[5px]"
              >
                <span
                  aria-hidden
                  className="block size-3 shrink-0 rounded-full bg-[#343a40]"
                />
                {i < entries.length - 1 ? (
                  <div className="flex h-[45px] w-3 flex-col items-center">
                    <div className="w-px flex-1 bg-[#343a40]" />
                  </div>
                ) : null}
              </div>
            ))}
            <div className="flex h-[35px] w-3 flex-col items-center">
              <div className="w-px flex-1 bg-[#343a40]" />
            </div>
          </div>

          {/* Timeline items */}
          <ul className="flex min-w-0 flex-1 flex-col gap-[30px]">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex w-full items-start justify-between gap-[10px]"
              >
                <p className="min-w-0 flex-1 text-[14px] leading-5 text-[#020817]">
                  {e.type === "check_in" ? "Check-in" : "Check-out"}
                  <br />
                  {actorLabel(e.checked_by)}
                </p>
                <p className="shrink-0 whitespace-nowrap text-[14px] leading-5 text-[#343a40] tabular-nums">
                  {formatTimelineStamp(e.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
