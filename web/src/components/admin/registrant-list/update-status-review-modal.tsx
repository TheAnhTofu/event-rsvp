"use client";

import { useEffect, useId, useState } from "react";
import { IconArrowPath } from "@/components/icons/admin";
import {
  PipelineStageBadgeByStageId,
  RegistrantStatusBadge,
} from "@/components/admin/pipeline-stage-badge";
import { RegistrationTypeBadge } from "@/components/admin/registrant-list/registration-type-badge";
import type { PipelineFilter, Registration } from "@/lib/admin/registrant-list/types";
import { formatRegistrantNamePart } from "@/lib/admin/registrant-list/utils";

export type UpdateStatusReviewModalProps = {
  open: boolean;
  onClose: () => void;
  targetStage: Exclude<PipelineFilter, "all">;
  registrations: Registration[];
  initialReferences: string[];
  confirming: boolean;
  /** When true, primary button runs the bulk confirm action. */
  canApply: boolean;
  cannotApplyMessage?: string;
  onConfirm: (references: string[]) => void | Promise<void>;
};

/** Tick in circle — matches Figma vuesax/bold/tick-circle on primary CTA. */
function IconTickCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M8 12l2.5 2.5L16 10"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UpdateStatusReviewModal({
  open,
  onClose,
  targetStage,
  registrations,
  initialReferences,
  confirming,
  canApply,
  cannotApplyMessage,
  onConfirm,
}: UpdateStatusReviewModalProps) {
  const titleId = useId();
  const [pendingRefs, setPendingRefs] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => {
      setPendingRefs([...initialReferences]);
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
            <IconArrowPath
              className="size-[22px] shrink-0 text-[#1f2937]"
              aria-hidden
            />
            <h2
              id={titleId}
              className="font-display text-[18px] font-semibold leading-tight tracking-tight text-[#1f2937]"
            >
              Update Status
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#333] transition hover:bg-zinc-100"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
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
            Are you sure you want to change the following registrants status to{" "}
            <PipelineStageBadgeByStageId stage={targetStage} size="compact" /> ?
          </p>
          {!canApply && cannotApplyMessage ? (
            <p className="mt-3 font-display text-[13px] leading-relaxed text-amber-800">
              {cannotApplyMessage}
            </p>
          ) : null}

          <div className="mt-4 overflow-auto rounded-lg border border-[#e8e8e8]">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e8e8] bg-[#f9fafb]">
                  <th className="w-10 px-1 py-2 text-left font-medium text-[#374151]">
                    <span className="sr-only">Remove</span>
                  </th>
                  <th className="min-w-[140px] px-2 py-2 text-left font-medium text-[#374151]">
                    Registrant ID
                  </th>
                  <th className="min-w-[160px] px-2 py-2 text-left font-medium text-[#374151]">
                    Registrant Status
                  </th>
                  <th className="min-w-[140px] px-2 py-2 text-left font-medium text-[#374151]">
                    Registration Type
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
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-[#6b7280]"
                    >
                      No registrants to import. Close and select rows again.
                    </td>
                  </tr>
                ) : (
                  rows.map((reg) => (
                    <tr
                      key={reg.reference}
                      className="border-b border-[#f0f0f0] last:border-b-0"
                    >
                      <td className="px-1 py-2 align-middle">
                        <button
                          type="button"
                          aria-label={`Remove ${reg.reference} from update list`}
                          onClick={() => removeRef(reg.reference)}
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
                      <td className="px-2 py-2 align-middle">
                        <RegistrantStatusBadge reg={reg} />
                      </td>
                      <td className="px-2 py-2 align-middle text-[#374151]">
                        <RegistrationTypeBadge audienceType={reg.audience_type} />
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
                  ))
                )}
              </tbody>
            </table>
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
            disabled={
              confirming ||
              rows.length === 0 ||
              !canApply
            }
            onClick={() => void onConfirm(pendingRefs)}
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#002353] px-5 font-display text-[13px] font-medium text-white transition hover:bg-[#001a40] disabled:opacity-50"
          >
            <IconTickCircle className="size-5 shrink-0 text-white" />
            {confirming ? "Updating…" : `Update Status`}
          </button>
        </div>
      </div>
    </div>
  );
}
