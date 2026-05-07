"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconArrowDownTray,
  IconArrowPath,
  IconChevronDownMini,
  IconDotsHorizontal,
  IconSearchField,
} from "@/components/icons/admin";
import { getThirdRowActionLabel } from "@/components/admin/registrant-list/row-actions-labels";
import {
  PIPELINE_BANK_VERIFY_FIRST_ACTION,
  PIPELINE_BULK_EMAIL_SHORTCUTS,
} from "@/lib/admin/registrant-list/pipeline-row-actions-config";
import {
  RowActionIconPaymentReceived,
  RowActionIconSendEmail,
  RowActionIconUpdateStatus,
} from "@/components/admin/registrant-list/row-actions-menu-icons";
import { PipelineStageBadgeByStageId } from "@/components/admin/pipeline-stage-badge";
import {
  EMAIL_TEMPLATE_BADGE_STYLES,
  PIPELINE_CHIPS,
  TEMPLATE_OPTIONS,
} from "@/lib/admin/registrant-list/constants";
import type { PipelineFilter } from "@/lib/admin/registrant-list/types";

type Props = {
  pipelineFilter: PipelineFilter;
  regSearchDraft: string;
  onSearchDraftChange: (v: string) => void;
  templateKey: string;
  onTemplateKeyChange: (v: string) => void;
  selectedCount: number;
  sending: boolean;
  onSendEmails: () => void | Promise<void>;
  onSendEmailShortcut?: (templateKey: string) => void | Promise<void>;
  onPaymentReceivedBulk: () => void;
  approvingBulk: boolean;
  /** Opens review modal — does not call API directly. */
  onBulkUpdateStatusRequest: (
    targetStage: Exclude<PipelineFilter, "all">,
  ) => void;
  confirmingBulk: boolean;
  onExportCsv: () => void;
  /** No rows on current page — disable export. */
  exportCsvDisabled?: boolean;
};

type Panel = "menu" | "email" | "status";

const BULK_STATUS_OPTIONS = PIPELINE_CHIPS.filter(
  (c): c is { id: Exclude<PipelineFilter, "all">; label: string } =>
    c.id !== "all",
);

type MenuSource = null | "row" | "more";

export function RegistrantListToolbar({
  pipelineFilter,
  regSearchDraft,
  onSearchDraftChange,
  onTemplateKeyChange,
  selectedCount,
  sending,
  onSendEmails,
  onSendEmailShortcut,
  onPaymentReceivedBulk,
  approvingBulk,
  onBulkUpdateStatusRequest,
  confirmingBulk,
  onExportCsv,
  exportCsvDisabled = false,
}: Props) {
  const menuId = useId();
  const overflowMenuId = useId();
  const rowActionsHintId = useId();
  const overflowMenuHintId = useId();
  const sendEmailPanelTitleId = useId();
  const updateStatusPanelTitleId = useId();
  const emailTypeLabelId = useId();
  const emailTypeListboxId = useId();
  const statusLabelId = useId();
  const statusListboxId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const emailTypeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const rowActionsTriggerRef = useRef<HTMLButtonElement>(null);
  const overflowTriggerRef = useRef<HTMLButtonElement>(null);
  const rowActionsMenuPortalRef = useRef<HTMLDivElement>(null);
  const [menuLayout, setMenuLayout] = useState<{
    top: number;
    /** Menu-only (Row Actions): anchor from left. */
    left?: number;
    /** Overflow ⋯ menu + Send Email split: anchor from right so panel opens leftward. */
    right?: number;
  } | null>(null);
  const [menuSource, setMenuSource] = useState<MenuSource>(null);
  const [panel, setPanel] = useState<Panel>("menu");
  /** True only when the email side panel was opened via the generic "Send Email" row — not a pipeline shortcut. */
  const [emailOpenedViaGenericRow, setEmailOpenedViaGenericRow] =
    useState(false);
  const [statusOpenedViaRow, setStatusOpenedViaRow] = useState(false);
  const [bulkStatusStage, setBulkStatusStage] = useState<
    Exclude<PipelineFilter, "all"> | null
  >(null);
  /** Set when the Send Email side panel is open; null until user picks a template (mirrors bulk status). */
  const [bulkEmailTemplate, setBulkEmailTemplate] = useState<string | null>(
    null,
  );
  const [emailTypeListOpen, setEmailTypeListOpen] = useState(false);
  const [statusListOpen, setStatusListOpen] = useState(false);
  const open = menuSource !== null;

  const emailTypeListShown = open && panel === "email" && emailTypeListOpen;
  const statusListShown = open && panel === "status" && statusListOpen;

  const busy = approvingBulk || confirmingBulk || sending;
  const rowHint =
    selectedCount === 0
      ? "Select one or more rows to use bulk actions."
      : `${selectedCount} row(s) selected.`;
  const overflowHint =
    "Additional actions. Export the registrants on this page as a UTF-8 CSV for Excel.";

  const updateMenuLayout = useCallback(() => {
    const el =
      menuSource === "more"
        ? overflowTriggerRef.current
        : rowActionsTriggerRef.current;
    if (!el || !open) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    const top = rect.bottom + 4;
    let left = rect.left;

    if (panel === "email" || panel === "status") {
      /** Email / Update Status card + menu row: right edge of group aligns with trigger (card sits left of menu). */
      setMenuLayout({
        top,
        right: window.innerWidth - rect.right,
      });
    } else if (menuSource === "more") {
      /** ⋯ menu: align right edges so the panel grows left and stays on-screen. */
      setMenuLayout({
        top,
        right: Math.max(margin, window.innerWidth - rect.right),
      });
    } else {
      if (left < margin) left = margin;
      setMenuLayout({ top, left });
    }
  }, [open, menuSource, panel]);

  const closeMenu = useCallback(() => {
    setMenuSource(null);
    setPanel("menu");
    setEmailOpenedViaGenericRow(false);
    setStatusOpenedViaRow(false);
    setBulkStatusStage(null);
    setBulkEmailTemplate(null);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuLayout();
  }, [open, updateMenuLayout, panel]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updateMenuLayout();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updateMenuLayout]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (rowActionsMenuPortalRef.current?.contains(t)) return;
      closeMenu();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, closeMenu]);

  useEffect(() => {
    if (!emailTypeListShown) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (emailTypeDropdownRef.current?.contains(t)) return;
      setEmailTypeListOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [emailTypeListShown]);

  useEffect(() => {
    if (!statusListShown) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (statusDropdownRef.current?.contains(t)) return;
      setStatusListOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [statusListShown]);

  const bankVerifyFirst = PIPELINE_BANK_VERIFY_FIRST_ACTION[pipelineFilter];
  const bulkEmailShortcuts = PIPELINE_BULK_EMAIL_SHORTCUTS[pipelineFilter];
  const thirdActionLabel = getThirdRowActionLabel(pipelineFilter);

  const menuItemClass =
    "flex min-h-[30px] w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-[13px] font-normal leading-snug text-[#3f3f46] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-45";

  const renderEmailFormCard = () => {
    const selectedEmailStyles =
      bulkEmailTemplate &&
      EMAIL_TEMPLATE_BADGE_STYLES[
        bulkEmailTemplate as keyof typeof EMAIL_TEMPLATE_BADGE_STYLES
      ]
        ? EMAIL_TEMPLATE_BADGE_STYLES[
            bulkEmailTemplate as keyof typeof EMAIL_TEMPLATE_BADGE_STYLES
          ]
        : null;
    const selectedEmailLabel = bulkEmailTemplate
      ? (TEMPLATE_OPTIONS.find((t) => t.key === bulkEmailTemplate)?.label ?? "")
      : "";

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={sendEmailPanelTitleId}
        className="box-border w-[min(328px,calc(100vw-24px))] shrink-0 rounded-[12px] border border-[#e0e0e0] bg-white shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)] antialiased"
      >
        <div className="flex w-full min-w-0 flex-col gap-2.5 p-2.5">
          <div className="flex items-center gap-2">
            <RowActionIconSendEmail
              className="size-[18px] shrink-0"
              aria-hidden
            />
            <h2
              id={sendEmailPanelTitleId}
              className="font-display text-[15px] font-medium leading-[1.35] tracking-tight text-[#1f2937]"
            >
              Send Email
            </h2>
          </div>
          <p className="font-display text-[13px] font-normal leading-5 tracking-wide text-[#4b5563]">
            Choose an email type, then continue. You can select rows in the table
            and/or add recipients when confirming the send (e.g. from CSV).
          </p>
          <div className="flex w-full flex-col gap-0.5">
            <div
              id={emailTypeLabelId}
              className="font-display text-[13px] font-normal leading-5 tracking-wide text-[#374151]"
            >
              Email Type
              <span className="text-[#eb5757]">*</span>
            </div>
            <div className="relative" ref={emailTypeDropdownRef}>
              <button
                type="button"
                id={`${emailTypeListboxId}-trigger`}
                disabled={sending}
                aria-expanded={emailTypeListShown}
                aria-haspopup="listbox"
                aria-controls={emailTypeListboxId}
                aria-label="Email type"
                onClick={() => setEmailTypeListOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#efefef] bg-white px-2.5 py-1.5 text-left font-display transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002353] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkEmailTemplate && selectedEmailStyles ? (
                  <span
                    className={`inline-flex min-w-0 max-w-full items-center gap-1.5 truncate rounded-sm px-2 py-0.5 text-[12px] font-medium leading-5 tracking-wide ${selectedEmailStyles.bg} ${selectedEmailStyles.fg}`}
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${selectedEmailStyles.dot}`}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">
                      {selectedEmailLabel}
                    </span>
                  </span>
                ) : (
                  <span className="block min-w-0 flex-1 truncate text-[12px] font-normal leading-5 tracking-wide text-[#9ca3af]">
                    Please select the email type
                  </span>
                )}
                <IconChevronDownMini
                  className={`size-4 shrink-0 text-black transition ${emailTypeListShown ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {emailTypeListShown ? (
                <ul
                  id={emailTypeListboxId}
                  role="listbox"
                  aria-labelledby={emailTypeLabelId}
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(280px,50vh)] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white py-1.5 pl-1.5 pr-1 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08),0px_-2px_4px_0px_rgba(0,0,0,0.06)] [scrollbar-color:#000000_#f5f5f5] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-track]:rounded-[10px] [&::-webkit-scrollbar-track]:bg-[#f5f5f5]"
                >
                  {TEMPLATE_OPTIONS.map((t) => {
                    const badge =
                      EMAIL_TEMPLATE_BADGE_STYLES[
                        t.key as keyof typeof EMAIL_TEMPLATE_BADGE_STYLES
                      ];
                    const isSelected = bulkEmailTemplate === t.key;
                    return (
                      <li key={t.key} role="presentation" className="px-0.5">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left transition hover:bg-zinc-50 ${
                            isSelected ? "bg-zinc-100" : ""
                          }`}
                          onClick={() => {
                            onTemplateKeyChange(t.key);
                            setBulkEmailTemplate(t.key);
                            setEmailTypeListOpen(false);
                          }}
                        >
                          <span
                            className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-sm px-2 py-0.5 text-[12px] font-medium leading-snug tracking-wide ${badge.bg} ${badge.fg}`}
                          >
                            <span
                              className={`size-1.5 shrink-0 rounded-full ${badge.dot}`}
                              aria-hidden
                            />
                            <span className="min-w-0 truncate">{t.label}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            disabled={bulkEmailTemplate === null || sending}
            onClick={() =>
              void (async () => {
                if (bulkEmailTemplate === null) return;
                onTemplateKeyChange(bulkEmailTemplate);
                await Promise.resolve(onSendEmails());
                closeMenu();
              })()
            }
            className="flex h-10 w-full items-center justify-center rounded-[12px] bg-[#002353] px-4 font-display text-[13px] font-medium text-white transition hover:bg-[#001a40] disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    );
  };

  const renderUpdateStatusCard = () => {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={updateStatusPanelTitleId}
        className="box-border w-[min(328px,calc(100vw-24px))] shrink-0 rounded-[12px] border border-[#e0e0e0] bg-white shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)] antialiased"
      >
        <div className="flex w-full min-w-0 flex-col gap-2.5 p-2.5">
          <div className="flex items-center gap-2">
            <IconArrowPath
              className="size-[18px] shrink-0 text-[#1f2937]"
              aria-hidden
            />
            <h2
              id={updateStatusPanelTitleId}
              className="font-display text-[15px] font-medium leading-[1.35] tracking-tight text-[#1f2937]"
            >
              Update Status
            </h2>
          </div>
          <p className="font-display text-[13px] font-normal leading-5 tracking-wide text-[#4b5563]">
            Select one or more rows to update status.
          </p>
          <div className="flex w-full flex-col gap-0.5">
            <div
              id={statusLabelId}
              className="font-display text-[13px] font-normal leading-5 tracking-wide text-[#374151]"
            >
              Status
              <span className="text-[#eb5757]">*</span>
            </div>
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                id={`${statusListboxId}-trigger`}
                disabled={selectedCount === 0}
                aria-expanded={statusListShown}
                aria-haspopup="listbox"
                aria-controls={statusListboxId}
                aria-label="Registrant status"
                onClick={() => setStatusListOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-[#efefef] bg-white px-2.5 py-1.5 text-left font-display transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002353] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkStatusStage ? (
                  <span className="inline-flex min-w-0 max-w-full justify-start">
                    <PipelineStageBadgeByStageId
                      stage={bulkStatusStage}
                      size="compact"
                      className="max-w-full"
                    />
                  </span>
                ) : (
                  <span className="block min-w-0 flex-1 truncate text-[12px] font-normal leading-5 tracking-wide text-[#9ca3af]">
                    Please select the status
                  </span>
                )}
                <IconChevronDownMini
                  className={`size-4 shrink-0 text-black transition ${statusListShown ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {statusListShown ? (
                <ul
                  id={statusListboxId}
                  role="listbox"
                  aria-labelledby={statusLabelId}
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(280px,50vh)] overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white py-1.5 pl-1.5 pr-1 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.08),0px_-2px_4px_0px_rgba(0,0,0,0.06)] [scrollbar-color:#000000_#f5f5f5] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-[10px] [&::-webkit-scrollbar-thumb]:bg-black [&::-webkit-scrollbar-track]:rounded-[10px] [&::-webkit-scrollbar-track]:bg-[#f5f5f5]"
                >
                  {BULK_STATUS_OPTIONS.map((o) => {
                    const isSelected = bulkStatusStage === o.id;
                    return (
                      <li key={o.id} role="presentation" className="px-0.5">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left transition hover:bg-zinc-50 ${
                            isSelected ? "bg-zinc-100" : ""
                          }`}
                          onClick={() => {
                            setBulkStatusStage(o.id);
                            setStatusListOpen(false);
                          }}
                        >
                          <PipelineStageBadgeByStageId stage={o.id} size="compact" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            disabled={
              selectedCount === 0 || bulkStatusStage === null || confirmingBulk
            }
            onClick={() => {
              if (bulkStatusStage === null) return;
              onBulkUpdateStatusRequest(bulkStatusStage);
              closeMenu();
            }}
            className="flex h-10 w-full items-center justify-center rounded-[12px] bg-[#002353] px-4 font-display text-[13px] font-medium text-white transition hover:bg-[#001a40] disabled:opacity-50"
          >
            {confirmingBulk ? "Updating…" : "Update Status"}
          </button>
        </div>
      </div>
    );
  };

  const renderOverflowMenuItems = () => (
    <button
      type="button"
      role="menuitem"
      disabled={exportCsvDisabled || busy}
      onClick={() => {
        closeMenu();
        onExportCsv();
      }}
      className={menuItemClass}
    >
      <IconArrowDownTray className="size-4 shrink-0" />
      <span className="min-w-0 leading-snug">Export CSV</span>
    </button>
  );

  const renderActionMenuItems = (
    emailPanelOpen: boolean,
    statusPanelOpen: boolean,
  ) => (
    <>
      {bankVerifyFirst ? (
        <button
          type="button"
          role="menuitem"
          disabled={selectedCount === 0 || busy}
          onClick={() => {
            closeMenu();
            void onPaymentReceivedBulk();
          }}
          className={menuItemClass}
        >
          <RowActionIconPaymentReceived aria-hidden />
          <span className="min-w-0 wrap-break-word leading-snug">
            {bankVerifyFirst.label}
          </span>
        </button>
      ) : null}
      {bulkEmailShortcuts.map((shortcut) => (
        <button
          key={`${shortcut.templateKey}:${shortcut.label}`}
          type="button"
          role="menuitem"
          disabled={busy}
          onClick={() => {
            closeMenu();
            void onSendEmailShortcut?.(shortcut.templateKey);
          }}
          className={menuItemClass}
        >
          <RowActionIconSendEmail aria-hidden />
          <span className="min-w-0 wrap-break-word leading-snug">
            {shortcut.label}
          </span>
        </button>
      ))}
      <button
        type="button"
        role="menuitem"
        disabled={busy}
        onClick={() => {
          setEmailOpenedViaGenericRow(true);
          setBulkEmailTemplate(null);
          setPanel("email");
        }}
        className={`${menuItemClass} ${
          emailPanelOpen && emailOpenedViaGenericRow
            ? "bg-[#e3f2fd] hover:bg-[#d6ebfc]"
            : ""
        }`}
      >
        <RowActionIconSendEmail aria-hidden />
        <span className="min-w-0 shrink leading-snug">Send Email</span>
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={selectedCount === 0 || busy}
        onClick={() => {
          setStatusOpenedViaRow(true);
          setPanel("status");
        }}
        className={`${menuItemClass} ${
          statusPanelOpen && statusOpenedViaRow
            ? "bg-[#e3f2fd] hover:bg-[#d6ebfc]"
            : ""
        }`}
      >
        <RowActionIconUpdateStatus aria-hidden />
        <span className="min-w-0 wrap-break-word leading-snug">
          {thirdActionLabel}
        </span>
      </button>
    </>
  );

  return (
    <section className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-[#e0e0e0] bg-admin-table-header-bg px-4 py-4">
      <label className="block min-w-0 flex-1 lg:max-w-[min(100%,400px)]">
        <span className="sr-only">Search</span>
        <div className="relative mt-0">
          <IconSearchField className="pointer-events-none absolute left-3 top-1/2 size-[20px] -translate-y-1/2 text-[#828282]" />
          <input
            type="search"
            value={regSearchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="Search........."
            title="Search name, email, phone, company, reference"
            enterKeyHint="search"
            className="block h-10 w-full rounded-xl border border-[#e0e0e0] bg-white py-2 pl-10 pr-3 font-display text-[13.617px] font-normal text-ink placeholder:text-[#828282] outline-none transition focus:border-[#1687c8] focus:ring-2 focus:ring-[#1687c8]/25"
          />
        </div>
      </label>
      <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
        <div className="flex items-center gap-2" ref={wrapRef}>
          <div className="relative">
            <button
              ref={rowActionsTriggerRef}
              type="button"
              id={menuId}
              aria-haspopup="true"
              aria-expanded={menuSource === "row"}
              disabled={busy}
              onClick={() => {
                setMenuSource((s) => (s === "row" ? null : "row"));
                setPanel("menu");
                setEmailOpenedViaGenericRow(false);
                setStatusOpenedViaRow(false);
              }}
              className="inline-flex h-10 min-w-0 items-center gap-[9px] rounded-xl bg-[#1687c8] pl-4 pr-3 font-display text-[12.727px] font-medium text-white transition hover:bg-[#1476b8] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1687c8]"
            >
              <span className="truncate">Row Actions</span>
              <IconChevronDownMini
                className={`size-5 shrink-0 text-white transition ${menuSource === "row" ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {open &&
            menuLayout &&
            typeof document !== "undefined"
              ? createPortal(
                  (panel === "email" || panel === "status") &&
                  menuSource === "row" ? (
                    <div
                      ref={rowActionsMenuPortalRef}
                      role="presentation"
                      style={{
                        position: "fixed",
                        top: menuLayout.top,
                        right: menuLayout.right,
                        zIndex: 10000,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 0,
                        maxWidth: "calc(100vw - 16px)",
                      }}
                    >
                      {panel === "email"
                        ? renderEmailFormCard()
                        : renderUpdateStatusCard()}
                      <div
                        className="flex w-max min-w-0 shrink-0 flex-col gap-0.5 rounded-xl border border-[#f2f2f2] bg-white px-1.5 py-2 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.1)]"
                        role="menu"
                        aria-labelledby={menuId}
                        aria-describedby={rowActionsHintId}
                      >
                        <p id={rowActionsHintId} className="sr-only">
                          {rowHint}
                        </p>
                        {renderActionMenuItems(
                          panel === "email",
                          panel === "status",
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={rowActionsMenuPortalRef}
                      role="menu"
                      aria-labelledby={
                        menuSource === "more" ? overflowMenuId : menuId
                      }
                      aria-describedby={
                        menuSource === "more"
                          ? overflowMenuHintId
                          : rowActionsHintId
                      }
                      style={{
                        position: "fixed",
                        top: menuLayout.top,
                        ...(menuSource === "more"
                          ? {
                              right: menuLayout.right ?? 8,
                              left: "auto",
                            }
                          : {
                              left: menuLayout.left ?? 8,
                              right: "auto",
                            }),
                        zIndex: 10000,
                      }}
                      className="box-border w-max min-w-0 max-w-[min(440px,calc(100vw-16px))] rounded-xl border border-[#f2f2f2] bg-white py-2 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.1)]"
                    >
                      {menuSource === "more" ? (
                        <p id={overflowMenuHintId} className="sr-only">
                          {overflowHint}
                        </p>
                      ) : (
                        <p id={rowActionsHintId} className="sr-only">
                          {rowHint}
                        </p>
                      )}
                      <div className="flex w-max min-w-0 max-w-[min(440px,calc(100vw-16px))] flex-col gap-0.5 px-1.5">
                        {menuSource === "more"
                          ? renderOverflowMenuItems()
                          : renderActionMenuItems(false, false)}
                      </div>
                    </div>
                  ),
                  document.body,
                )
              : null}
          </div>
          <button
            ref={overflowTriggerRef}
            type="button"
            id={overflowMenuId}
            aria-haspopup="true"
            aria-expanded={menuSource === "more"}
            title="More actions"
            aria-label="More actions"
            disabled={busy}
            onClick={() => {
              setMenuSource((s) => (s === "more" ? null : "more"));
              setPanel("menu");
            }}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e8e8e8] bg-white text-[#14181f] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconDotsHorizontal className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
