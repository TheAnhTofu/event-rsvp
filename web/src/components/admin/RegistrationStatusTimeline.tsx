"use client";

import type { PipelineStepId, PipelineStepView } from "@/types/admin-pipeline";

/** Figma node 125:7758+ — pill colors per pipeline step. */
const PILL: Record<
  PipelineStepId,
  { wrap: string; dot: string; text: string }
> = {
  registered: {
    wrap: "bg-[#eef2f7]",
    dot: "bg-[#344054]",
    text: "text-[#344054]",
  },
  paid: {
    wrap: "bg-[#e0f2fe]",
    dot: "bg-[#0369a1]",
    text: "text-[#0369a1]",
  },
  payment_under_review: {
    wrap: "bg-[#fff4e5]",
    dot: "bg-[#b45309]",
    text: "text-[#b45309]",
  },
  payment_received: {
    wrap: "bg-[#e0f7fa]",
    dot: "bg-[#0e7490]",
    text: "text-[#0e7490]",
  },
  registration_confirmed: {
    wrap: "bg-[#ecfdf3]",
    dot: "bg-[#027a48]",
    text: "text-[#027a48]",
  },
  sending_confirmation_email: {
    wrap: "bg-[#eef2ff]",
    dot: "bg-[#4338ca]",
    text: "text-[#4338ca]",
  },
  confirmation_email_sent: {
    wrap: "bg-[#eafbe8]",
    dot: "bg-[#00a66c]",
    text: "text-[#00a66c]",
  },
  sending_thank_you_email: {
    wrap: "bg-[#efeeff]",
    dot: "bg-[#50369e]",
    text: "text-[#50369e]",
  },
  thank_you_email_sent: {
    wrap: "bg-[#ebfff5]",
    dot: "bg-[#00ae91]",
    text: "text-[#00ae91]",
  },
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

/** Figma 125:7154 — timeline rail uses 12px dots and a 2px blue (#1687c8) connector. */
const TIMELINE_RAIL_COLOR = "bg-[#1687c8]";

type Props = {
  /**
   * Full pipeline timeline (built from `statusAudit + emailLogs` server-side).
   * The component itself filters down to events that actually happened
   * (i.e. have `at` set) — matches Figma 125:7154 which only shows real history.
   */
  steps: PipelineStepView[];
};

/**
 * Registrant Status — Figma 125:7154 (log-style timeline).
 *
 * Renders only steps that have already occurred (those with a real `at`
 * timestamp from the status history); pending future steps are omitted.
 *
 * Layout per row: [continuous rail with dot] | [status pill]  ……  [DD/MM/YYYY HH:MM]
 */
export function RegistrationStatusTimeline({ steps }: Props) {
  /** Only history rows: a step counts as "happened" when it carries a timestamp. */
  const history = steps.filter((s) => Boolean(s.at));

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-4 rounded-xl border border-admin-border bg-white p-6"
      data-figma-node="125:7154"
    >
      <h2 className="text-[16px] font-bold leading-[normal] text-[#002353]">
        Registrant Status
      </h2>

      {history.length === 0 ? (
        <p className="text-[13px] leading-5 text-admin-col-muted">
          No status events yet.
        </p>
      ) : (
        <ol className="relative flex w-full flex-col">
          {history.map((step, index) => {
            const styles = PILL[step.id] ?? PILL.registered;
            const isLast = index === history.length - 1;

            return (
              <li
                key={`${step.id}-${index}`}
                className={`relative flex items-center gap-3 ${
                  isLast ? "" : "pb-6"
                }`}
              >
                {/**
                 * Continuous rail: full-height blue line behind the dot.
                 * The line spans the entire item (so consecutive items chain
                 * without gaps). Hidden on the last row.
                 */}
                {!isLast ? (
                  <span
                    aria-hidden
                    className={`absolute left-[5px] top-3 bottom-0 w-[2px] ${TIMELINE_RAIL_COLOR}`}
                  />
                ) : null}

                {/* Dot — sits on top of the rail */}
                <span
                  aria-hidden
                  className={`relative z-10 block size-3 shrink-0 rounded-full ${TIMELINE_RAIL_COLOR}`}
                />

                {/* Row body: status pill + timestamp */}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div
                    className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[11.9px] leading-[normal] ${styles.wrap}`}
                  >
                    <span
                      aria-hidden
                      className={`size-1.5 shrink-0 rounded-[2px] ${styles.dot}`}
                    />
                    <span
                      className={`min-w-0 truncate font-normal ${styles.text}`}
                      title={step.label}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-right text-[12px] leading-[normal] text-[#333333] tabular-nums">
                    {step.at ? formatTimelineStamp(step.at) : "—"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
