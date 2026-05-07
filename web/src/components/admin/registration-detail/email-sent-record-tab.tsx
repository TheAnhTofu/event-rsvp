"use client";

import { Fragment, useCallback, useState } from "react";
import {
  IconChevronDownMini,
  IconSmsEnvelope,
} from "@/components/icons/admin";
import { fetchAdminEmailTemplatePreview } from "@/lib/fetch-admin-email-template-preview";
import type { EmailLogRow } from "@/types/email-log";

const EMAIL_TYPE_META: Record<
  string,
  { label: string; badgeClass: string }
> = {
  acknowledge: {
    label: "Acknowledge Email",
    badgeClass: "bg-[#eef2f7] text-[#344054]",
  },
  payment_confirmation: {
    label: "Payment Complete Email",
    badgeClass: "bg-[#e0f7fa] text-[#0e7490]",
  },
  email_confirmation_physical_attendance: {
    label: "Confirmation Email",
    badgeClass: "bg-[#eafbe8] text-[#00a66c]",
  },
  thank_you: {
    label: "Thank You Email",
    badgeClass: "bg-[#ebfff5] text-[#00ae91]",
  },
  reminder: {
    label: "Payment Reminder",
    badgeClass: "bg-[#f3f4f6] text-[#374151]",
  },
};

const DEFAULT_BADGE =
  "bg-[#eef2f7] text-[#344054]" as const;

function emailTypeDisplay(templateKey: string): { label: string; badgeClass: string } {
  const meta = EMAIL_TYPE_META[templateKey];
  if (meta) return meta;
  return {
    label: templateKey.replace(/_/g, " "),
    badgeClass: DEFAULT_BADGE,
  };
}

function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function systemLogText(log: EmailLogRow): string {
  const err = log.error_message?.trim();
  if (err) return err;
  const mid = log.provider_message_id?.trim();
  if (mid) return mid;
  return "—";
}

type Props = {
  emailLogs: EmailLogRow[];
  registrationReference: string;
};

export function EmailSentRecordTab({
  emailLogs,
  registrationReference,
}: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [htmlCache, setHtmlCache] = useState<Record<string, string>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});

  const toggleRow = useCallback(
    async (rowKey: string, templateKey: string) => {
      if (expandedKey === rowKey) {
        setExpandedKey(null);
        return;
      }
      setExpandedKey(rowKey);
      if (htmlCache[rowKey]) return;
      setLoadingKey(rowKey);
      setErrorByKey((prev) => {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });
      try {
        const html = await fetchAdminEmailTemplatePreview(
          registrationReference,
          templateKey,
        );
        setHtmlCache((prev) => ({ ...prev, [rowKey]: html }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not load template";
        setErrorByKey((prev) => ({ ...prev, [rowKey]: msg }));
      } finally {
        setLoadingKey(null);
      }
    },
    [expandedKey, htmlCache, registrationReference],
  );

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <section className="overflow-hidden rounded-xl border border-[#e0e0e0] bg-white px-7 shadow-[0_4px_2px_-2px_rgba(27,46,94,0.02)]">
        <div className="flex items-center gap-2 border-b border-[#e0e0e0] pb-3 pt-7">
          <IconSmsEnvelope className="h-6 w-7 shrink-0 text-admin-navy" aria-hidden />
          <h2 className="text-lg font-semibold leading-[22px] text-admin-navy">
            Email Sent Record
          </h2>
        </div>

        {emailLogs.length === 0 ? (
          <p className="py-10 text-center text-sm text-admin-col-muted">
            No email log entries yet.
          </p>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto pb-6">
            <table className="w-full min-w-[860px] table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e0e0] font-medium text-[13px] text-[#828282]">
                  <th className="w-10 pb-3 pt-5" aria-hidden>
                    <span className="sr-only">Row</span>
                  </th>
                  <th className="pb-3 pt-5 pr-4">Email Type</th>
                  <th className="w-[150px] pb-3 pt-5 px-2">Status</th>
                  <th className="w-[200px] pb-3 pt-5 px-2">Sent At</th>
                  <th className="w-[150px] pb-3 pt-5 px-2">Sent By</th>
                  <th className="w-[min(200px,18vw)] pb-3 pt-5 pl-2">System Log</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((log, i) => {
                  const rowKey = `${log.created_at}-${log.template_key}-${i}`;
                  const { label, badgeClass } = emailTypeDisplay(log.template_key);
                  const sent = log.status === "sent";
                  const logText = systemLogText(log);
                  const expanded = expandedKey === rowKey;
                  const previewHtml = htmlCache[rowKey];
                  const loadError = errorByKey[rowKey];
                  const loading = loadingKey === rowKey;
                  return (
                    <Fragment key={rowKey}>
                    <tr
                      className="border-b border-[#e0e0e0] last:border-b-0"
                    >
                      <td className="py-4 align-middle">
                        <div className="flex h-6 w-10 items-center justify-center">
                          <button
                            type="button"
                            className="flex size-9 items-center justify-center rounded-md text-[#828282] outline-none ring-admin-navy hover:bg-[#f5f5f5] focus-visible:ring-2"
                            aria-expanded={expanded}
                            aria-label={
                              expanded
                                ? "Hide email template"
                                : "Show email template"
                            }
                            onClick={() => void toggleRow(rowKey, log.template_key)}
                          >
                            <IconChevronDownMini
                              className={`size-5 shrink-0 transition-transform duration-200 ${
                                expanded ? "-rotate-180" : ""
                              }`}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </td>
                      <td className="wrap-break-word py-4 pr-4 align-middle">
                        <span
                          className={`inline-flex max-w-full rounded px-2.5 py-1.5 text-[12.73px] font-medium leading-none ${badgeClass}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-2 py-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[12.73px] font-medium leading-none ${
                            sent
                              ? "bg-[#eafbe8] text-[#00a66c]"
                              : "bg-[#ffdbdb] text-[#c80000]"
                          }`}
                        >
                          <span
                            className={`size-2 shrink-0 rounded-sm ${
                              sent ? "bg-[#00a66c]" : "bg-[#c80000]"
                            }`}
                            aria-hidden
                          />
                          {sent ? "Sent" : "Fail"}
                        </span>
                      </td>
                      <td className="px-2 py-4 align-middle font-medium text-[#333]">
                        <time
                          dateTime={log.created_at}
                          className="whitespace-nowrap tabular-nums"
                        >
                          {formatSentAt(log.created_at)}
                        </time>
                      </td>
                      <td className="px-2 py-4 align-middle font-medium text-[#333]">
                        —
                      </td>
                      <td className="max-w-0 py-4 pl-2 align-middle">
                        <span
                          className="block truncate font-medium text-[#333]"
                          title={logText === "—" ? undefined : logText}
                        >
                          {logText}
                        </span>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-[#e0e0e0] last:border-b-0">
                        <td colSpan={6} className="bg-[#fafafa] p-0">
                          <div className="border-t border-[#e0e0e0] px-4 py-4 sm:px-6">
                            {loading ? (
                              <p className="text-center text-sm text-[#828282]">
                                Loading template…
                              </p>
                            ) : null}
                            {loadError && !loading ? (
                              <p className="text-center text-sm text-error">
                                {loadError}
                              </p>
                            ) : null}
                            {previewHtml && !loading ? (
                              <iframe
                                title={`Email preview: ${label}`}
                                className="h-[min(70vh,880px)] w-full rounded-lg border border-[#e0e0e0] bg-[#f2f3f5]"
                                sandbox="allow-same-origin"
                                srcDoc={previewHtml}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
