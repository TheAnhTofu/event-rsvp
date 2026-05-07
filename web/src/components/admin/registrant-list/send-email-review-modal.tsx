"use client";

import { useEffect, useId, useState } from "react";
import type { ChangeEvent } from "react";
import { RowActionIconSendEmail } from "@/components/admin/registrant-list/row-actions-menu-icons";
import {
  EMAIL_TEMPLATE_BADGE_STYLES,
  TEMPLATE_OPTIONS,
} from "@/lib/admin/registrant-list/constants";
import { downloadSendEmailModalCsv } from "@/lib/admin/registrant-list/export-registrations-csv";
import { parseRegistrantIdsFromRecipientImportText } from "@/lib/admin/registrant-list/parse-recipient-csv-import";
import type { Registration } from "@/lib/admin/registrant-list/types";
import { formatRegistrantNamePart } from "@/lib/admin/registrant-list/utils";

export type SendEmailReviewModalProps = {
  open: boolean;
  onClose: () => void;
  /** If set, footer &quot;Back&quot; returns to the previous step (e.g. template preview) instead of closing. */
  onBack?: () => void;
  templateKey: string;
  registrations: Registration[];
  initialReferences: string[];
  sending: boolean;
  onConfirm: (references: string[]) => void | Promise<void>;
};

function TemplateBadge({ templateKey }: { templateKey: string }) {
  const opt = TEMPLATE_OPTIONS.find((t) => t.key === templateKey);
  const badge =
    EMAIL_TEMPLATE_BADGE_STYLES[
      templateKey as keyof typeof EMAIL_TEMPLATE_BADGE_STYLES
    ];
  if (!opt || !badge) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-sm px-2 py-0.5 text-[12px] font-medium leading-snug ${badge.bg} ${badge.fg}`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${badge.dot}`}
        aria-hidden
      />
      <span className="min-w-0 truncate">{opt.label}</span>
    </span>
  );
}

export function SendEmailReviewModal({
  open,
  onClose,
  onBack,
  templateKey,
  registrations,
  initialReferences,
  sending,
  onConfirm,
}: SendEmailReviewModalProps) {
  const titleId = useId();
  const [pendingRefs, setPendingRefs] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => {
      setPendingRefs([...initialReferences]);
      setImportError(null);
    });
  }, [open, initialReferences]);

  if (!open) return null;

  const byRef = new Map(registrations.map((r) => [r.reference, r]));
  const rows = pendingRefs
    .map((ref) => byRef.get(ref))
    .filter((r): r is Registration => r != null);
  const removeRef = (reference: string) => {
    setPendingRefs((prev) => prev.filter((r) => r !== reference));
  };

  const handleCsvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { ids, error } = parseRegistrantIdsFromRecipientImportText(text);
      if (error) {
        setImportError(error);
        return;
      }
      setPendingRefs(ids);
    };
    reader.onerror = () => {
      setImportError("Could not read file.");
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div
      className="fixed inset-0 z-10001 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(900px,calc(100vh-32px))] w-full max-w-[900px] flex-col overflow-hidden rounded-[12px] border border-[#e0e0e0] bg-white shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e8e8e8] px-6 py-5">
          <div className="flex min-w-0 items-center gap-2">
            <RowActionIconSendEmail
              className="size-[22px] shrink-0"
              aria-hidden
            />
            <h2
              id={titleId}
              className="font-display text-[18px] font-semibold leading-tight tracking-tight text-[#1f2937]"
            >
              Send Email
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#333] transition hover:bg-zinc-100"
          >
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <p className="min-w-0 flex-1 font-display text-[14px] font-normal leading-relaxed text-[#374151]">
                Are you sure you want to send{" "}
                <TemplateBadge templateKey={templateKey} /> to the following
                registrants?
              </p>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-start">
                <label className="relative inline-flex min-h-[40px] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-[#e0e0e0] bg-white px-4 py-2 font-display text-[13px] font-medium text-[#111827] transition hover:bg-zinc-50">
                  <input
                    type="file"
                    accept=".csv,.tsv,text/csv,text/tab-separated-values"
                    className="absolute inset-0 z-10 block h-full w-full cursor-pointer opacity-0 file:h-full file:w-full file:cursor-pointer"
                    aria-label="Import recipient list from CSV"
                    onChange={handleCsvFileChange}
                  />
                  <span className="pointer-events-none inline-flex items-center gap-2">
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                      className="origin-center shrink-0 scale-y-[-1] text-[#292D32]"
                    >
                      <path
                        d="M10.96 5.93311C13.36 6.13977 14.34 7.37311 14.34 10.0731V10.1598C14.34 13.1398 13.1467 14.3331 10.1667 14.3331H5.82665C2.84665 14.3331 1.65332 13.1398 1.65332 10.1598V10.0731C1.65332 7.39311 2.61999 6.15977 4.97999 5.93977"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 10.0002V2.41357"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.2333 3.89984L7.99994 1.6665L5.7666 3.89984"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Import CSV
                  </span>
                </label>
                <button
                  type="button"
                  disabled={pendingRefs.length === 0}
                  onClick={() =>
                    downloadSendEmailModalCsv(
                      rows,
                      `send-email-${templateKey}-registrants`,
                    )
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e0e0e0] bg-white px-4 py-2 font-display text-[13px] font-medium text-[#111827] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0 text-[#292D32]"
                    aria-hidden
                  >
                    <path
                      d="M10.96 5.93311C13.36 6.13977 14.34 7.37311 14.34 10.0731V10.1598C14.34 13.1398 13.1467 14.3331 10.1667 14.3331H5.82665C2.84665 14.3331 1.65332 13.1398 1.65332 10.1598V10.0731C1.65332 7.39311 2.61999 6.15977 4.97999 5.93977"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 10.0002V2.41357"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.2333 3.89984L7.99994 1.6665L5.7666 3.89984"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>
            {importError ? (
              <p className="text-[13px] leading-snug text-red-600 sm:text-right">
                {importError}
              </p>
            ) : null}
          </div>

          <div className="mt-4 overflow-auto rounded-lg border border-[#e8e8e8]">
            <table className="w-full min-w-[560px] table-fixed border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e8e8] bg-[#f9fafb]">
                  <th className="w-10 px-1 py-2 text-left font-medium text-[#374151]">
                    <span className="sr-only">Remove</span>
                  </th>
                  <th className="min-w-[140px] px-2 py-2 text-left font-medium text-[#374151]">
                    Registrant ID
                  </th>
                  <th className="min-w-[110px] px-2 py-2 text-left font-medium text-[#374151]">
                    First Name
                  </th>
                  <th className="min-w-[110px] px-2 py-2 text-left font-medium text-[#374151]">
                    Last Name
                  </th>
                  <th className="min-w-[200px] px-2 py-2 text-left font-medium text-[#374151]">
                    Email Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingRefs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10">
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <p className="font-display text-[14px] text-[#6b7280]">
                          No recipients yet. Select rows in the table before
                          opening this step, or import a CSV of registrant IDs.
                        </p>
                        <label className="relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[12px] border border-[#e0e0e0] bg-white px-6 font-display text-[13px] font-medium text-[#111827] transition hover:bg-zinc-50">
                          <input
                            type="file"
                            accept=".csv,.tsv,text/csv,text/tab-separated-values"
                            className="absolute inset-0 z-10 block h-full min-h-[44px] w-full cursor-pointer opacity-0 file:h-full file:w-full file:cursor-pointer"
                            aria-label="Import CSV file with registrant IDs"
                            onChange={handleCsvFileChange}
                          />
                          <span className="pointer-events-none inline-flex items-center gap-2">
                            <svg
                              width={18}
                              height={18}
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden
                              className="origin-center shrink-0 scale-y-[-1] text-[#292D32]"
                            >
                              <path
                                d="M10.96 5.93311C13.36 6.13977 14.34 7.37311 14.34 10.0731V10.1598C14.34 13.1398 13.1467 14.3331 10.1667 14.3331H5.82665C2.84665 14.3331 1.65332 13.1398 1.65332 10.1598V10.0731C1.65332 7.39311 2.61999 6.15977 4.97999 5.93977"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 10.0002V2.41357"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10.2333 3.89984L7.99994 1.6665L5.7666 3.89984"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            Import CSV file
                          </span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pendingRefs.map((ref) => {
                    const reg = byRef.get(ref);
                    if (reg) {
                      return (
                        <tr
                          key={ref}
                          className="border-b border-[#f0f0f0] last:border-b-0"
                        >
                          <td className="px-1 py-2 align-middle">
                            <button
                              type="button"
                              aria-label={`Remove ${ref} from send list`}
                              onClick={() => removeRef(ref)}
                              className="flex size-8 items-center justify-center rounded-md text-[#dc2626] transition hover:bg-red-50"
                            >
                              <svg
                                width={16}
                                height={16}
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                              >
                                <path
                                  d="M6 6l12 12M18 6L6 18"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </td>
                          <td className="px-2 py-2 align-middle font-medium text-[#111827]">
                            {reg.reference}
                          </td>
                          <td className="px-2 py-2 align-middle text-[#374151]">
                            {formatRegistrantNamePart(reg.first_name)}
                          </td>
                          <td className="px-2 py-2 align-middle text-[#374151]">
                            {formatRegistrantNamePart(reg.last_name)}
                          </td>
                          <td className="px-2 py-2 align-middle text-[#374151]">
                            <span className="break-all">{reg.email}</span>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr
                        key={ref}
                        className="border-b border-[#f0f0f0] bg-amber-50/40 last:border-b-0"
                      >
                        <td className="px-1 py-2 align-middle">
                          <button
                            type="button"
                            aria-label={`Remove ${ref} from send list`}
                            onClick={() => removeRef(ref)}
                            className="flex size-8 items-center justify-center rounded-md text-[#dc2626] transition hover:bg-red-50"
                          >
                            <svg
                              width={16}
                              height={16}
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M6 6l12 12M18 6L6 18"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="px-2 py-2 align-middle font-medium text-[#111827]">
                          {ref}
                        </td>
                        <td
                          colSpan={3}
                          className="px-2 py-2 align-middle text-[13px] text-amber-900/90"
                        >
                          Not on this page — ID will still be used if valid.
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex shrink-0 flex-row flex-nowrap items-stretch gap-3 border-t border-[#e8e8e8] bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : onClose())}
            className="inline-flex h-11 min-w-[120px] max-w-[280px] shrink-0 items-center justify-center rounded-[12px] border border-[#e0e0e0] bg-white px-6 font-display text-[13px] font-medium text-[#111827] transition hover:bg-zinc-50"
          >
            Back
          </button>
          <button
            type="button"
            disabled={sending || pendingRefs.length === 0 || !templateKey}
            onClick={() => void onConfirm(pendingRefs)}
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#002353] px-5 font-display text-[13px] font-medium text-white transition hover:bg-[#001a40] disabled:opacity-50"
          >
            <RowActionIconSendEmail
              className="size-5 shrink-0 brightness-0 invert"
              aria-hidden
            />
            {sending ? "Sending…" : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
