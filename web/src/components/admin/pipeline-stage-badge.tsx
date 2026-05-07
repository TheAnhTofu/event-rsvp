"use client";

import type { ReactNode } from "react";
import { PIPELINE_CHIPS } from "@/lib/admin/registrant-list/constants";
import type { PipelineFilter, Registration } from "@/lib/admin/registrant-list/types";
import {
  pipelineStageBadgeStyles,
  stageBadgeParts,
  stageLabel,
} from "@/lib/admin/registrant-list/utils";

export type PipelineStageBadgeStyle = {
  bg: string;
  fg: string;
  dot: string;
};

const SIZE_CLASS = {
  /** Registrant List table — Figma list cell chip. */
  table: {
    wrap: "gap-[5px] rounded-[4px] px-2 py-[5px] text-[11px] font-medium",
    dot: "size-[6.5px] shrink-0 rounded-[2px]",
  },
  /** Dropdowns, modals, dense toolbars. */
  compact: {
    wrap: "gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium leading-snug tracking-wide",
    dot: "size-1.5 shrink-0 rounded-full",
  },
} as const;

export type PipelineStageBadgeSize = keyof typeof SIZE_CLASS;

/**
 * Shared pipeline status pill: colored background, label text, and square/dot swatch.
 * Use {@link RegistrantStatusBadge} for a table row; {@link PipelineStageBadgeByStageId} when you only have a stage key.
 */
export function PipelineStageBadge(props: {
  styles: PipelineStageBadgeStyle;
  children: ReactNode;
  size?: PipelineStageBadgeSize;
  className?: string;
}) {
  const { styles, children, size = "table", className = "" } = props;
  const s = SIZE_CLASS[size];
  return (
    <span
      className={`inline-flex max-w-full items-center truncate ${s.wrap} ${styles.bg} ${styles.fg} ${className}`.trim()}
    >
      <span className={`${s.dot} ${styles.dot}`} aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/** One registrant row — resolves stage from payload + DB fields (same as Registrant List). */
export function RegistrantStatusBadge({ reg }: { reg: Registration }) {
  const styles = stageBadgeParts(reg);
  return (
    <PipelineStageBadge styles={styles} size="table">
      {stageLabel(reg)}
    </PipelineStageBadge>
  );
}

/** Fixed pipeline stage (e.g. filters, bulk status dropdown) — label from {@link PIPELINE_CHIPS}. */
export function PipelineStageBadgeByStageId(props: {
  stage: Exclude<PipelineFilter, "all">;
  size?: PipelineStageBadgeSize;
  className?: string;
}) {
  const { stage, size = "table", className } = props;
  const label = PIPELINE_CHIPS.find((c) => c.id === stage)?.label ?? stage;
  const styles = pipelineStageBadgeStyles(stage, label);
  return (
    <PipelineStageBadge styles={styles} size={size} className={className}>
      {label}
    </PipelineStageBadge>
  );
}
