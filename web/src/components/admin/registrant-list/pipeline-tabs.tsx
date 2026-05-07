import { Link } from "@/i18n/navigation";
import { REGISTRATION_PIPELINE_TABS } from "@/lib/admin/registrant-list/constants";
import type { PipelineFilter } from "@/lib/admin/registrant-list/types";
import {
  pipelineTabActive,
  pipelineTabDotClass,
  tabCountDisplay,
} from "@/lib/admin/registrant-list/utils";

type Props = {
  chipCounts: Record<PipelineFilter, number>;
  pipelineFilter: PipelineFilter;
  /** Declarative hrefs fix tab switching after full page reload (vs client-only router.replace). */
  getStageHref: (stage: PipelineFilter | null) => string;
};

export function PipelineTabs({ chipCounts, pipelineFilter, getStageHref }: Props) {
  return (
    <div
      className="flex h-[55px] min-h-[55px] items-stretch overflow-x-auto border-b border-admin-border"
      role="tablist"
      aria-label="Registration pipeline"
    >
      {REGISTRATION_PIPELINE_TABS.map((tabDef) => {
        const count = tabCountDisplay(tabDef, chipCounts);
        const active = pipelineTabActive(tabDef, pipelineFilter);
        const clickable = !tabDef.disabled && tabDef.filter !== null;
        const tabClass = `flex min-w-0 shrink-0 items-center gap-2 border-b-2 px-4 text-left text-[14px] font-medium transition ${
          tabDef.disabled
            ? "cursor-not-allowed border-transparent text-admin-navy/35"
            : active
              ? "border-admin-navy text-admin-navy"
              : "border-transparent text-admin-col-muted hover:bg-admin-table-header-bg hover:text-admin-navy"
        }`;

        if (!clickable || tabDef.filter === null) {
          return (
            <button
              key={tabDef.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled
              className={tabClass}
            >
              {tabDef.id !== "all" ? (
                <span
                  className={`size-1.5 shrink-0 rounded-[2px] ${pipelineTabDotClass(tabDef)}`}
                  aria-hidden
                />
              ) : null}
              <span className="whitespace-nowrap">{tabDef.label}</span>
              <span
                className={`whitespace-nowrap text-xs font-normal ${
                  tabDef.disabled ? "text-admin-navy/25" : "text-admin-col-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        }

        const href = getStageHref(tabDef.filter === "all" ? null : tabDef.filter);
        return (
          <Link
            key={tabDef.id}
            href={href}
            replace
            scroll={false}
            role="tab"
            aria-selected={active}
            className={tabClass}
          >
            {tabDef.id !== "all" ? (
              <span
                className={`size-1.5 shrink-0 rounded-[2px] ${pipelineTabDotClass(tabDef)}`}
                aria-hidden
              />
            ) : null}
            <span className="whitespace-nowrap">{tabDef.label}</span>
            <span className="whitespace-nowrap text-xs font-normal text-admin-col-muted">
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
