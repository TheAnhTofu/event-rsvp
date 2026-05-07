"use client";

import { useEffect, useId, useState } from "react";
import { RowActionIconSendEmail } from "@/components/admin/registrant-list/row-actions-menu-icons";
import {
  EMAIL_TEMPLATE_BADGE_STYLES,
  TEMPLATE_OPTIONS,
} from "@/lib/admin/registrant-list/constants";
import { fetchAdminEmailTemplatePreview } from "@/lib/fetch-admin-email-template-preview";

export type SendEmailTemplatePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  /** Opens the recipient confirmation step (Send Email modal). */
  onContinue: () => void;
  templateKey: string;
  /**
   * Registration reference used to render merge fields. When no rows are selected,
   * parent may pass the first row on the current page so the template still loads.
   */
  previewReference: string;
  /** True when {@link previewReference} is the first list row because nothing was selected. */
  previewUsesSampleRow?: boolean;
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

export function SendEmailTemplatePreviewModal({
  open,
  onClose,
  onContinue,
  templateKey,
  previewReference,
  previewUsesSampleRow = false,
}: SendEmailTemplatePreviewModalProps) {
  const titleId = useId();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      if (!open || !previewReference.trim() || !templateKey.trim()) {
        setHtml(null);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setHtml(null);
      void fetchAdminEmailTemplatePreview(previewReference, templateKey)
        .then((h) => {
          if (!cancelled) {
            setHtml(h);
            setLoading(false);
          }
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Could not load preview");
            setLoading(false);
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [open, previewReference, templateKey]);

  if (!open) return null;

  const noPreviewRegistrant = !previewReference.trim();

  /** Allow Continue when preview loaded, or when there is no registrant to fetch (e.g. empty list + CSV on next step). */
  const canContinue =
    !loading &&
    !error &&
    (Boolean(html) || noPreviewRegistrant);

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
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-2">
              <RowActionIconSendEmail
                className="size-[22px] shrink-0"
                aria-hidden
              />
              <h2
                id={titleId}
                className="font-display text-[18px] font-semibold leading-tight tracking-tight text-[#1f2937]"
              >
                Email preview
              </h2>
            </div>
            <p className="pl-[30px] text-[13px] leading-snug text-[#6b7280]">
              Template: <TemplateBadge templateKey={templateKey} />
            </p>
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
          <p className="font-display text-[14px] font-normal leading-relaxed text-[#374151]">
            {noPreviewRegistrant ? (
              <>
                No registrant on this page for a live preview. Recipients and
                final send are confirmed on the next step (e.g. import CSV).
              </>
            ) : previewUsesSampleRow ? (
              <>
                Preview uses sample merge fields from the first registrant on
                this page (
                <span className="font-mono text-[13px] text-[#111827]">
                  {previewReference}
                </span>
                ) — no rows were selected. Recipients and final send are
                confirmed on the next step.
              </>
            ) : (
              <>
                Preview uses data from the first selected registrant (
                <span className="font-mono text-[13px] text-[#111827]">
                  {previewReference}
                </span>
                ). Recipients and final send are confirmed on the next step.
              </>
            )}
          </p>

          <div className="mt-4 min-h-[200px]">
            {loading ? (
              <p className="py-12 text-center text-sm text-[#6b7280]">
                Loading template…
              </p>
            ) : null}
            {error && !loading ? (
              <p className="py-8 text-center text-sm text-red-600">{error}</p>
            ) : null}
            {html && !loading ? (
              <iframe
                title={`Email preview: ${templateKey}`}
                className="h-[min(55vh,720px)] w-full rounded-lg border border-[#e8e8e8] bg-[#f2f3f5]"
                // Allow HTTPS images (e.g. S3 email-assets) inside srcDoc; scripts stay blocked without allow-scripts.
                sandbox="allow-same-origin"
                srcDoc={html}
              />
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-row flex-nowrap items-stretch gap-3 border-t border-[#e8e8e8] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 min-w-[120px] max-w-[280px] shrink-0 items-center justify-center rounded-[12px] border border-[#e0e0e0] bg-white px-6 font-display text-[13px] font-medium text-[#111827] transition hover:bg-zinc-50"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#002353] px-5 font-display text-[13px] font-medium text-white transition hover:bg-[#001a40] disabled:opacity-50"
          >
            <RowActionIconSendEmail
              className="size-5 shrink-0 brightness-0 invert"
              aria-hidden
            />
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
