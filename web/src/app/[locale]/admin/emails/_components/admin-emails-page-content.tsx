"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconPlusNavy, IconUserEditBold } from "@/components/icons/admin";
import { PaginationBar } from "@/components/admin/registrant-list/pagination-bar";
import { PipelineTabs } from "@/components/admin/registrant-list/pipeline-tabs";
import { RegistrantListTable } from "@/components/admin/registrant-list/registrant-list-table";
import { RegistrantListToolbar } from "@/components/admin/registrant-list/registrant-list-toolbar";
import { SendEmailReviewModal } from "@/components/admin/registrant-list/send-email-review-modal";
import { SendEmailTemplatePreviewModal } from "@/components/admin/registrant-list/send-email-template-preview-modal";
import { UpdateStatusReviewModal } from "@/components/admin/registrant-list/update-status-review-modal";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { PipelineFilter, Registration } from "@/lib/admin/registrant-list/types";
import {
  buildPipelineStageHref,
  normalizeRegistration,
  type PaymentMethodFilterParam,
  parsePaymentMethodParam,
  parsePipelineStageParam,
  parseRegSortParam,
  parsePageSizeParam,
  paymentMethodForApi,
  pipelineStageForApi,
} from "@/lib/admin/registrant-list/utils";
import {
  COLUMN_FILTER_PARAM_KEYS,
  copyColumnFiltersToParams,
} from "@/lib/admin/registrant-list/column-filters";
import { TEMPLATE_OPTIONS } from "@/lib/admin/registrant-list/constants";
import { PIPELINE_DEFAULT_BULK_TEMPLATE_KEY } from "@/lib/admin/registrant-list/pipeline-row-actions-config";
import { downloadRegistrationsCsv } from "@/lib/admin/registrant-list/export-registrations-csv";
import { fetchWithRetry } from "@/lib/fetch-retry";

type SuccessModalState =
  | null
  | {
      variant: "email";
      templateLabel: string;
    }
  | { variant: "bulk"; message: string }
  /** Figma 818:24426 — after Update Status bulk confirm succeeds. */
  | { variant: "status_updated" };

export function AdminEmailsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const regPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const pipelineFilter = parsePipelineStageParam(searchParams.get("stage"));
  const regPageSize = parsePageSizeParam(searchParams.get("pageSize"));
  const paymentMethodFilter = parsePaymentMethodParam(searchParams.get("pm"));

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regSearchDraft, setRegSearchDraft] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [loadingReg, setLoadingReg] = useState(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateKey, setTemplateKey] = useState("acknowledge");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [approvingBulk, setApprovingBulk] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [successModal, setSuccessModal] = useState<SuccessModalState>(null);
  const [updateStatusReview, setUpdateStatusReview] = useState<null | {
    stage: Exclude<PipelineFilter, "all">;
    refs: string[];
  }>(null);
  const [sendEmailReview, setSendEmailReview] = useState<null | {
    refs: string[];
    step: "preview" | "confirm";
  }>(null);

  const spKey = searchParams.toString();

  useEffect(() => {
    if (!successModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSuccessModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [successModal]);

  useEffect(() => {
    if (!updateStatusReview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUpdateStatusReview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [updateStatusReview]);

  useEffect(() => {
    if (!sendEmailReview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSendEmailReview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sendEmailReview]);

  const patchUrl = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      p.delete("view");
      if (p.get("page") === "1") p.delete("page");
      const sortV = p.get("sort");
      const orderAfter = p.get("order");
      /** Default list: created_at desc — omit from URL unless ascending. */
      if (!sortV || (sortV === "created_at" && orderAfter !== "asc")) {
        p.delete("sort");
      }
      const orderV = p.get("order");
      if (!orderV || orderV === "desc") p.delete("order");
      const ps = p.get("pageSize");
      if (!ps || ps === "15") p.delete("pageSize");
      const qv = p.get("q")?.trim();
      if (!qv) p.delete("q");
      const pmv = p.get("pm");
      if (!pmv || pmv === "all") p.delete("pm");
      for (const k of COLUMN_FILTER_PARAM_KEYS) {
        if (!p.get(k)?.trim()) p.delete(k);
      }
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** Sync search box from URL when pipeline tab or locale path changes — omitting `searchParams` from deps avoids resetting the input on every debounced `q` URL update while typing. */
  const stageKey = searchParams.get("stage") ?? "all";
  useEffect(() => {
    setRegSearchDraft(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams intentionally omitted (see comment above)
  }, [stageKey, pathname]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = regSearchDraft.trim();
      const cur = searchParams.get("q")?.trim() ?? "";
      if (next === cur) return;
      patchUrl({ q: next || null, page: null });
    }, 400);
    return () => clearTimeout(t);
  }, [regSearchDraft, patchUrl, searchParams]);

  useEffect(() => {
    setSelected(new Set());
  }, [spKey]);

  /** Default bulk template — see `PIPELINE_DEFAULT_BULK_TEMPLATE_KEY` (undefined = keep current selection). */
  useEffect(() => {
    const next = PIPELINE_DEFAULT_BULK_TEMPLATE_KEY[pipelineFilter];
    if (next !== undefined) {
      setTemplateKey(next);
    }
  }, [pipelineFilter]);

  const loadRegistrations = useCallback(async () => {
    setLoadingReg(true);
    try {
      const page = Math.max(1, Number(searchParams.get("page")) || 1);
      const q = searchParams.get("q")?.trim() ?? "";
      const sort = parseRegSortParam(searchParams.get("sort"));
      const order = searchParams.get("order") === "asc" ? "asc" : "desc";
      const stage = parsePipelineStageParam(searchParams.get("stage"));
      const pm = parsePaymentMethodParam(searchParams.get("pm"));

      const p = new URLSearchParams();
      p.set("view", "registrations");
      p.set("page", String(page));
      p.set("pageSize", String(regPageSize));
      if (q) p.set("q", q);
      p.set("sort", sort);
      p.set("order", order);
      p.set("stage", pipelineStageForApi(stage));
      p.set("pm", paymentMethodForApi(pm));
      copyColumnFiltersToParams(p, new URLSearchParams(searchParams.toString()));
      const res = await fetch(`/api/admin/emails?${p.toString()}`);
      const data = (await res.json()) as {
        registrations?: unknown[];
        total?: number;
        stageCounts?: Record<string, number>;
        error?: string;
      };
      if (!res.ok) {
        setRegistrations([]);
        setRegTotal(0);
        return;
      }
      const rawRegs = data.registrations ?? [];
      setRegistrations(
        Array.isArray(rawRegs)
          ? rawRegs.map((r) => normalizeRegistration(r as Record<string, unknown>))
          : [],
      );
      setRegTotal(data.total ?? 0);
      setStageCounts(data.stageCounts ?? {});
    } catch {
      setRegistrations([]);
      setRegTotal(0);
    } finally {
      setLoadingReg(false);
    }
  }, [regPageSize, searchParams]);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const chipCounts = useMemo(() => {
    const counts: Record<PipelineFilter, number> = {
      all: stageCounts.all ?? 0,
      registered: stageCounts.registered ?? 0,
      bank_slip_received: stageCounts.bank_slip_received ?? 0,
      paid: stageCounts.paid ?? 0,
      payment_received: stageCounts.payment_received ?? 0,
      registration_confirmed: stageCounts.registration_confirmed ?? 0,
      sending_confirmation_email: stageCounts.sending_confirmation_email ?? 0,
      confirmation_email_sent: stageCounts.confirmation_email_sent ?? 0,
      sending_thank_you_email: stageCounts.sending_thank_you_email ?? 0,
      thank_you_email_sent: stageCounts.thank_you_email_sent ?? 0,
    };
    return counts;
  }, [stageCounts]);

  const getStageHref = useCallback(
    (stage: PipelineFilter | null) =>
      buildPipelineStageHref(pathname, searchParams, stage),
    [pathname, searchParams],
  );

  const toggleSelect = (ref: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === registrations.length) setSelected(new Set());
    else setSelected(new Set(registrations.map((r) => r.reference)));
  };

  const sendEmailsForRefs = useCallback(
    async (key: string, refs: string[]) => {
      if (refs.length === 0) return;
      setSending(true);
      setResult(null);
      try {
        const res = await fetchWithRetry(
          "/api/admin/emails/send",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              references: refs,
              templateKey: key,
            }),
          },
          { retries: 4, baseDelayMs: 500 },
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          queued?: boolean;
          count?: number;
          chunks?: number;
          sent?: number;
          failed?: number;
        };
        const templateLabel =
          TEMPLATE_OPTIONS.find((t) => t.key === key)?.label ?? key;
        if (data.queued) {
          setSuccessModal({
            variant: "email",
            templateLabel,
          });
        } else {
          const sent = data.sent ?? 0;
          const failed = data.failed ?? 0;
          if (failed > 0) {
            setResult(`Sent: ${sent}, Failed: ${failed}`);
          } else if (sent > 0) {
            setSuccessModal({
              variant: "email",
              templateLabel,
            });
          } else {
            setResult("No emails were sent.");
          }
        }
        setSelected(new Set());
        await loadRegistrations();
      } catch {
        setResult("Failed to send emails. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [loadRegistrations],
  );

  const openSendEmailReview = () => {
    setSendEmailReview({ refs: Array.from(selected), step: "preview" });
  };

  const openSendEmailShortcutReview = (key: string) => {
    setTemplateKey(key);
    setSendEmailReview({ refs: Array.from(selected), step: "preview" });
  };

  const confirmSendEmailFromModal = async (refs: string[]) => {
    try {
      await sendEmailsForRefs(templateKey, refs);
    } finally {
      setSendEmailReview(null);
    }
  };

  const eligiblePaymentReceivedRefs = useMemo(() => {
    return Array.from(selected).filter((ref) => {
      const reg = registrations.find((r) => r.reference === ref);
      return (
        reg != null &&
        reg.payment_method === "bank_transfer" &&
        reg.payment_status === "pending_verification"
      );
    });
  }, [selected, registrations]);

  const markConfirmRegistrationBulk = async (refsOverride?: readonly string[]) => {
    const sourceRefs = refsOverride ?? Array.from(selected);
    if (sourceRefs.length === 0) return;

    const eligibleFromSource = sourceRefs.filter((ref) => {
      const reg = registrations.find((r) => r.reference === ref);
      if (!reg) return false;
      if (reg.approval_status === "approved" || reg.approval_status === "rejected") {
        return false;
      }
      return reg.payment_status === "completed" || reg.payment_status === "verified";
    });

    if (eligibleFromSource.length === 0) {
      setResult(
        "No selected registrants are eligible for this action (need completed or verified payment, and approval not already decided).",
      );
      return;
    }
    setConfirmingBulk(true);
    setResult(null);
    try {
      const results = await Promise.allSettled(
        eligibleFromSource.map(async (reference) => {
          const res = await fetch("/api/admin/registrations/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          });
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            throw new Error(
              typeof body.error === "string" ? body.error : `HTTP ${res.status}`,
            );
          }
        }),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      const skipped = sourceRefs.length - eligibleFromSource.length;
      let msg = `Confirm registration: ${ok} updated`;
      if (fail > 0) msg += `, ${fail} failed`;
      if (skipped > 0) {
        msg += ` (${skipped} selected row(s) not eligible, skipped).`;
      }
      if (ok > 0 && fail === 0) {
        setSuccessModal({ variant: "status_updated" });
      } else {
        setResult(msg);
      }
      setSelected(new Set());
      await loadRegistrations();
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Bulk confirm failed.");
    } finally {
      setConfirmingBulk(false);
    }
  };

  const openUpdateStatusReview = (targetStage: Exclude<PipelineFilter, "all">) => {
    setUpdateStatusReview({
      stage: targetStage,
      refs: Array.from(selected),
    });
  };

  const bulkForceUpdateStage = async (
    refs: string[],
    stage: Exclude<PipelineFilter, "all">,
  ) => {
    if (refs.length === 0) return;
    setConfirmingBulk(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/registrations/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ references: refs, stage }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(typeof body.error === "string" ? body.error : `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        updated?: number;
        notFound?: number;
        failed?: number;
      };
      const updated = data.updated ?? 0;
      const notFound = data.notFound ?? 0;
      const failed = data.failed ?? 0;
      if (updated > 0 && failed === 0 && notFound === 0) {
        setSuccessModal({ variant: "status_updated" });
      } else {
        let msg = `Status updated: ${updated}`;
        if (notFound > 0) msg += `, ${notFound} not found`;
        if (failed > 0) msg += `, ${failed} failed`;
        setResult(msg);
      }
      setSelected(new Set());
      await loadRegistrations();
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Bulk update failed.");
    } finally {
      setConfirmingBulk(false);
    }
  };

  const confirmUpdateStatusFromModal = async (refs: string[]) => {
    if (!updateStatusReview) return;
    const { stage } = updateStatusReview;
    try {
      if (stage === "registration_confirmed") {
        await markConfirmRegistrationBulk(refs);
      } else {
        await bulkForceUpdateStage(refs, stage);
      }
    } finally {
      setUpdateStatusReview(null);
    }
  };

  const markPaymentReceivedBulk = async () => {
    if (selected.size === 0) return;
    if (eligiblePaymentReceivedRefs.length === 0) {
      setResult(
        "No selected registrants are eligible for Payment Received (bank transfer with payment pending verification only).",
      );
      return;
    }
    setApprovingBulk(true);
    setResult(null);
    try {
      const results = await Promise.allSettled(
        eligiblePaymentReceivedRefs.map(async (reference) => {
          const res = await fetch("/api/admin/bank-transfers/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference,
              action: "verify",
              verifiedBy: "admin",
            }),
          });
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(
              typeof err.error === "string" ? err.error : `HTTP ${res.status}`,
            );
          }
        }),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      const skipped = selected.size - eligiblePaymentReceivedRefs.length;
      let msg = `Payment received: ${ok} updated`;
      if (fail > 0) msg += `, ${fail} failed`;
      if (skipped > 0) {
        msg += ` (${skipped} selected row(s) not eligible, skipped).`;
      }
      if (ok > 0 && fail === 0) {
        setSuccessModal({ variant: "bulk", message: msg });
      } else {
        setResult(msg);
      }
      setSelected(new Set());
      await loadRegistrations();
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Bulk update failed.");
    } finally {
      setApprovingBulk(false);
    }
  };

  const handleExportCsv = useCallback(() => {
    downloadRegistrationsCsv(
      registrations,
      `registrants-p${regPage}-${new Date().toISOString().slice(0, 10)}`,
    );
  }, [registrations, regPage]);

  const setRegPageUrl = (p: number) => {
    patchUrl({ page: p <= 1 ? null : String(p) });
  };

  const setRegPageSizeUrl = useCallback(
    (n: number) => {
      patchUrl({
        pageSize: n === 15 ? null : String(n),
        page: null,
      });
    },
    [patchUrl],
  );

  const setPaymentMethodUrl = useCallback(
    (v: PaymentMethodFilterParam) => {
      patchUrl({ pm: v === "all" ? null : v, page: null });
    },
    [patchUrl],
  );

  const regSortKey = parseRegSortParam(searchParams.get("sort"));
  const regSortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

  const applyColumnFilter = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      patchUrl(updates);
    },
    [patchUrl],
  );

  const handleRegSort = useCallback(
    (columnKey: string) => {
      const cur = parseRegSortParam(searchParams.get("sort"));
      const curOrder = searchParams.get("order") === "asc" ? "asc" : "desc";
      const same = cur === columnKey;
      const nextOrder = same ? (curOrder === "desc" ? "asc" : "desc") : "desc";
      const updates: Record<string, string | null | undefined> = { page: null };
      if (columnKey === "created_at" && nextOrder === "desc") {
        updates.sort = null;
        updates.order = null;
      } else {
        updates.sort = columnKey;
        updates.order = nextOrder === "desc" ? null : "asc";
      }
      patchUrl(updates);
    },
    [patchUrl, searchParams],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-page-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-admin-border bg-white px-5 py-[15px]">
        <div className="flex items-center gap-1.5">
          <IconUserEditBold className="size-5 shrink-0 text-admin-navy" />
          <h1 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
            Registrant List
          </h1>
        </div>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-[12px] bg-admin-navy px-4 text-[13px] font-medium text-white opacity-50"
        >
          <IconPlusNavy className="size-5 shrink-0" />
          Create New Registrant
        </button>
      </header>

      {successModal ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onClick={() => setSuccessModal(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-success-modal-title"
            className="relative w-full max-w-[560px] rounded-[12px] border border-[#e0e0e0] bg-white p-10 shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSuccessModal(null)}
              className="absolute right-[30px] top-[29px] flex size-6 items-center justify-center rounded-md text-[#333] transition hover:bg-zinc-100"
            >
              <svg
                width={24}
                height={24}
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
            <div className="flex flex-col items-center gap-10 text-center">
              <div
                className="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-[#34A853] text-[#34A853]"
                aria-hidden
              >
                <svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 12.5l2.5 2.5L16 10"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {successModal.variant === "email" ? (
                <h2
                  id="admin-success-modal-title"
                  className="w-full font-display text-[24px] font-semibold leading-[30px] text-[#333]"
                >
                  A &ldquo;{successModal.templateLabel}&rdquo; email has been sent.
                </h2>
              ) : successModal.variant === "status_updated" ? (
                <h2
                  id="admin-success-modal-title"
                  className="w-full min-w-0 font-display text-[24px] font-semibold leading-[22px] text-[#333]"
                >
                  Status has been updated
                </h2>
              ) : (
                <>
                  <h2
                    id="admin-success-modal-title"
                    className="w-full font-display text-[24px] font-semibold leading-[22px] text-[#333]"
                  >
                    Success
                  </h2>
                  <p className="w-full text-sm leading-relaxed text-[#4f4f4f]">
                    {successModal.message}
                  </p>
                </>
              )}
              <div className="flex w-[140px] justify-center">
                <button
                  type="button"
                  onClick={() => setSuccessModal(null)}
                  className="flex h-[60px] w-full items-center justify-center rounded-[12px] border border-[#e0e0e0] bg-white px-[13.636px] py-[9.091px] font-display text-[12.727px] font-normal text-black transition hover:bg-zinc-50"
                >
                  Back to Page
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {updateStatusReview ? (
        <UpdateStatusReviewModal
          open
          onClose={() => setUpdateStatusReview(null)}
          targetStage={updateStatusReview.stage}
          registrations={registrations}
          initialReferences={updateStatusReview.refs}
          confirming={confirmingBulk}
          canApply
          cannotApplyMessage=""
          onConfirm={confirmUpdateStatusFromModal}
        />
      ) : null}

      {sendEmailReview?.step === "preview" ? (
        <SendEmailTemplatePreviewModal
          open
          onClose={() => setSendEmailReview(null)}
          onContinue={() =>
            setSendEmailReview((s) =>
              s ? { ...s, step: "confirm" } : null,
            )
          }
          templateKey={templateKey}
          previewReference={
            sendEmailReview.refs[0] ?? registrations[0]?.reference ?? ""
          }
          previewUsesSampleRow={
            sendEmailReview.refs.length === 0 &&
            Boolean(registrations[0]?.reference)
          }
        />
      ) : null}

      {sendEmailReview?.step === "confirm" ? (
        <SendEmailReviewModal
          open
          onClose={() => setSendEmailReview(null)}
          onBack={() =>
            setSendEmailReview((s) =>
              s ? { ...s, step: "preview" } : null,
            )
          }
          templateKey={templateKey}
          registrations={registrations}
          initialReferences={sendEmailReview.refs}
          sending={sending}
          onConfirm={confirmSendEmailFromModal}
        />
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto bg-white p-5 pb-16">
        {result && (
          <div className="mb-4 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {result}
          </div>
        )}

        <div className="w-full min-w-0 overflow-hidden rounded-lg border border-admin-border bg-white shadow-[0_4px_2px_-2px_rgba(27,46,94,0.02)]">
          <PipelineTabs
            chipCounts={chipCounts}
            pipelineFilter={pipelineFilter}
            getStageHref={getStageHref}
          />

          <RegistrantListToolbar
            pipelineFilter={pipelineFilter}
            regSearchDraft={regSearchDraft}
            onSearchDraftChange={setRegSearchDraft}
            templateKey={templateKey}
            onTemplateKeyChange={setTemplateKey}
            selectedCount={selected.size}
            sending={sending}
            onSendEmails={openSendEmailReview}
            onSendEmailShortcut={openSendEmailShortcutReview}
            onPaymentReceivedBulk={() => void markPaymentReceivedBulk()}
            approvingBulk={approvingBulk}
            onBulkUpdateStatusRequest={openUpdateStatusReview}
            confirmingBulk={confirmingBulk}
            onExportCsv={handleExportCsv}
            exportCsvDisabled={registrations.length === 0}
          />

          <section className="p-0">
            {loadingReg ? (
              <p className="px-5 py-8 text-center text-sm text-admin-col-muted">Loading…</p>
            ) : (
              <RegistrantListTable
                registrations={registrations}
                selected={selected}
                toggleSelect={toggleSelect}
                selectAll={selectAll}
                sortKey={regSortKey}
                sortOrder={regSortOrder}
                onSort={handleRegSort}
                searchParamsString={spKey}
                onColumnFilterApply={applyColumnFilter}
              />
            )}

            {!loadingReg && (
              <PaginationBar
                page={regPage}
                pageSize={regPageSize}
                total={regTotal}
                disabled={loadingReg}
                onPageChange={setRegPageUrl}
                onPageSizeChange={setRegPageSizeUrl}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
