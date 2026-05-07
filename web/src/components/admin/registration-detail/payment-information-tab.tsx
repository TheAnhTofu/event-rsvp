"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RegistrationStatusTimeline } from "@/components/admin/RegistrationStatusTimeline";
import { RegistrationDetailActionBar } from "@/components/admin/registration-detail/registration-detail-action-bar";
import { IconDotsVertical, IconPencilEdit } from "@/components/icons/admin";
import { Link } from "@/i18n/navigation";
import {
  bankSlipImageApiUrl,
  REGISTRATION_EMAIL_PDF,
  registrationEmailPdfUrl,
} from "@/lib/admin/registrant-list/utils";
import type {
  BankTransferSlipSummary,
  RegistrationPipelineSnapshot,
} from "@/types/admin-registration-detail";
import type { EmailLogRow } from "@/types/email-log";
import type { PipelineStepView } from "@/types/admin-pipeline";
import type { RegistrationDetailResponse } from "@/types/crm";

function formatPaymentMethodDisplay(method: RegistrationDetailResponse["paymentMethod"]): string {
  if (method === "pending") return "—";
  if (method === "stripe") return "Online Payment";
  return method
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPaymentReference(row: RegistrationDetailResponse): string {
  const pi = row.stripePaymentIntentId?.trim();
  const cs = row.stripeCheckoutSessionId?.trim();
  const v = pi || cs;
  if (!v) return "—";
  if (v.length <= 28) return v;
  return `${v.slice(0, 12)}…${v.slice(-10)}`;
}

function formatMoneyHkd(value: string | null | undefined): string {
  if (value == null || !String(value).trim()) return "—";
  const n = Number.parseFloat(String(value).replace(/,/g, ""));
  if (Number.isFinite(n)) return `HKD ${n.toFixed(2)}`;
  return `HKD ${value}`;
}

/** Latest slip verification time (admin bank verify does not set `webhook_verified_at`). */
function latestBankSlipVerifiedAt(slips: BankTransferSlipSummary[]): string | null {
  let best: string | null = null;
  let bestMs = 0;
  for (const s of slips) {
    const t = s.verified_at?.trim();
    if (!t) continue;
    const ms = Date.parse(t);
    if (Number.isFinite(ms) && ms >= bestMs) {
      bestMs = ms;
      best = t;
    }
  }
  return best;
}

/**
 * Display “payment recorded” time: online wallets / Stripe set webhook; bank uses slip `verified_at`;
 * aligns with list view `COALESCE(webhook_verified_at, approved_at)` where applicable.
 */
function resolvePaymentRecordedAtIso(
  row: RegistrationDetailResponse,
  bankSlips: BankTransferSlipSummary[],
): string | null {
  const webhook = row.webhookVerifiedAt?.trim();
  if (webhook) return row.webhookVerifiedAt;
  const bank = latestBankSlipVerifiedAt(bankSlips);
  if (bank) return bank;
  const approved = row.approvedAt?.trim();
  return approved ? row.approvedAt : null;
}

type Props = {
  reference: string;
  displayTitle: string;
  row: RegistrationDetailResponse;
  pipelineTimeline: PipelineStepView[];
  infoTabHref: string;
  pipelineSnapshot: RegistrationPipelineSnapshot | null;
  emailLogs: EmailLogRow[];
  bankTransferSlips: BankTransferSlipSummary[];
  onReloadRegistration: () => void | Promise<void>;
};

/** Figma 125:8053 — Internal Review placeholder layout. */
function ReviewOrInvoiceCard({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-admin-border bg-white p-6">
      <h2 className="text-[18px] font-semibold text-admin-navy">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[14px] font-medium leading-6 text-[#001742]">
            Verification Status
          </p>
          <p className="mt-1 text-[15px] text-black">—</p>
        </div>
        <div>
          <p className="text-[14px] font-medium leading-6 text-[#001742]">
            Verified By
          </p>
          <p className="mt-1 text-[15px] text-black">—</p>
        </div>
        <div>
          <p className="text-[14px] font-medium leading-6 text-[#001742]">
            Verified At
          </p>
          <p className="mt-1 text-[15px] text-black">—</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-[14px] font-medium leading-6 text-[#001742]">
          Verification Notes
        </p>
        <p className="mt-1 text-[15px] text-black">—</p>
      </div>
    </section>
  );
}

function formatLogDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** PDF file badge — document + red “PDF” strip (admin Documents row). */
function PdfFileIcon() {
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <path
          d="M9 5h12l7 7v20a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
          fill="#ECEFF1"
          stroke="#CFD8DC"
          strokeWidth="1"
        />
        <path d="M21 5v7h7" fill="#B0BEC5" opacity="0.9" />
        <rect x="7" y="17" width="26" height="11" rx="1.5" fill="#E53935" />
        <text
          x="20"
          y="25.5"
          textAnchor="middle"
          fill="white"
          className="font-sans text-[8px] font-bold"
          style={{ fontSize: "9px", letterSpacing: "0.02em" }}
        >
          PDF
        </text>
      </svg>
    </span>
  );
}

/**
 * PDFs generated when transactional emails send (`upload-pdf-to-s3`):
 * — Invoice: `acknowledge` → IAIS-registration-invoice.pdf
 * — Receipt: `payment_confirmation` → IAIS-payment-receipt.pdf
 *
 * Rows are shown only when the file exists in S3 (HEAD via `headRegistrationEmailDocument`).
 */
function EmailTemplateDocumentsCard({
  reference,
  emailLogs,
}: {
  reference: string;
  emailLogs: EmailLogRow[];
}) {
  const invoiceHref = registrationEmailPdfUrl(
    reference,
    REGISTRATION_EMAIL_PDF.invoice,
  );
  const paymentReceiptHref = registrationEmailPdfUrl(
    reference,
    REGISTRATION_EMAIL_PDF.paymentReceipt,
  );
  const invoiceEmailSent = latestSentAt(emailLogs, "acknowledge");
  const paymentConfirmationSent = latestSentAt(
    emailLogs,
    "payment_confirmation",
  );

  const [presence, setPresence] = useState<{
    invoice: boolean;
    receipt: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const head = async (file: string) => {
        const u = registrationEmailPdfUrl(
          reference,
          file as
            | typeof REGISTRATION_EMAIL_PDF.invoice
            | typeof REGISTRATION_EMAIL_PDF.paymentReceipt,
        );
        const res = await fetch(u, { method: "HEAD", credentials: "include" });
        return res.ok;
      };
      const [invoice, receipt] = await Promise.all([
        head(REGISTRATION_EMAIL_PDF.invoice),
        head(REGISTRATION_EMAIL_PDF.paymentReceipt),
      ]);
      if (!cancelled) setPresence({ invoice, receipt });
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (presence === null) return null;
  if (!presence.invoice && !presence.receipt) return null;

  return (
    <section className="rounded-xl border border-[#e0e0e0] bg-white p-6">
      <h2 className="text-[18px] font-semibold text-[#002353]">Documents</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[#6d6d6d]">
        PDF attachments from registration and payment confirmation emails (S3{" "}
        <span className="font-mono text-[11px]">documents/{reference}/</span>
        ).
      </p>
      <div className="mt-5 space-y-5">
        {presence.invoice ? (
          <div>
            <h3 className="text-[14px] font-medium text-[#001742]">Invoice</h3>
            <p className="mt-0.5 text-[11px] text-[#6d6d6d]">
              Template <span className="font-mono">acknowledge</span>
              {invoiceEmailSent ? ` · Email sent ${invoiceEmailSent}` : ""}
            </p>
            <div className="mt-2">
              <a
                href={invoiceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg border border-[#e8e8e8] bg-[#fafafa] p-3 transition hover:bg-[#f2f2f2]"
              >
                <PdfFileIcon />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium leading-5 text-[#001742]">
                    {REGISTRATION_EMAIL_PDF.invoice}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-[#6d6d6d]">
                    Open in new tab
                  </span>
                </span>
              </a>
            </div>
          </div>
        ) : null}
        {presence.receipt ? (
          <div>
            <h3 className="text-[14px] font-medium text-[#001742]">Receipt</h3>
            <p className="mt-0.5 text-[11px] text-[#6d6d6d]">
              Template{" "}
              <span className="font-mono">payment_confirmation</span>
              {paymentConfirmationSent
                ? ` · Email sent ${paymentConfirmationSent}`
                : ""}
            </p>
            <div className="mt-2">
              <a
                href={paymentReceiptHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg border border-[#e8e8e8] bg-[#fafafa] p-3 transition hover:bg-[#f2f2f2]"
              >
                <PdfFileIcon />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium leading-5 text-[#001742]">
                    {REGISTRATION_EMAIL_PDF.paymentReceipt}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-[#6d6d6d]">
                    Open in new tab
                  </span>
                </span>
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function latestSentAt(
  logs: EmailLogRow[],
  templateKey: string,
): string | null {
  const sent = logs.filter(
    (l) => l.template_key === templateKey && l.status === "sent",
  );
  if (sent.length === 0) return null;
  sent.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return formatLogDateTime(sent[0].created_at);
}

/** Document / correspondence — email send timestamps from `email_logs`. */
function DocumentCard({ emailLogs }: { emailLogs: EmailLogRow[] }) {
  return (
    <section className="rounded-xl border border-admin-border bg-white p-6">
      <h2 className="text-[18px] font-semibold text-admin-navy">Document</h2>
      <p className="mt-1 text-[13px] text-admin-col-muted">
        Latest successful send per template (transactional log).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[14px] font-medium leading-6 text-[#001742]">
            Registration confirmation email
          </p>
          <p className="mt-1 text-[15px] text-black">
            {latestSentAt(emailLogs, "email_confirmation_physical_attendance") ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[14px] font-medium leading-6 text-[#001742]">
            Payment confirmation email
          </p>
          <p className="mt-1 text-[15px] text-black">
            {latestSentAt(emailLogs, "payment_confirmation") ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[14px] font-medium leading-6 text-[#001742]">
            Payment reminder
          </p>
          <p className="mt-1 text-[15px] text-black">
            {latestSentAt(emailLogs, "reminder") ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-[14px] font-medium leading-6 text-[#001742]">
            Thank you email
          </p>
          <p className="mt-1 text-[15px] text-black">
            {latestSentAt(emailLogs, "thank_you") ?? "—"}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PaymentInformationTab({
  reference,
  displayTitle,
  row,
  pipelineTimeline,
  infoTabHref,
  pipelineSnapshot,
  emailLogs,
  bankTransferSlips,
  onReloadRegistration,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const paymentRecordedIso = resolvePaymentRecordedAtIso(row, bankTransferSlips);
  const paymentDate =
    paymentRecordedIso != null
      ? new Date(paymentRecordedIso).toLocaleString(undefined, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const amount =
    row.amountPaidHkd?.trim() != null && row.amountPaidHkd.trim() !== ""
      ? formatMoneyHkd(row.amountPaidHkd)
      : formatMoneyHkd(row.feeHkd);

  const showBankSlip = row.paymentMethod === "bank_transfer";

  const copyReference = useCallback(() => {
    void navigator.clipboard.writeText(row.reference);
    setMenuOpen(false);
  }, [row.reference]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
          Payment Information ({displayTitle})
        </h1>
        <div className="flex max-w-full flex-wrap items-start justify-end gap-2">
          <Link
            href={infoTabHref}
            title="Open Registrant Information (read-only profile and timeline)"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-admin-navy px-4 text-[12.7px] font-medium text-white hover:opacity-95"
            scroll={false}
          >
            <IconPencilEdit className="size-5 text-white" />
            Registrant Information
          </Link>
          <RegistrationDetailActionBar
            reference={reference}
            variant="payment"
            pipelineSnapshot={pipelineSnapshot}
            row={row}
            emailLogs={emailLogs}
            onActionsComplete={onReloadRegistration}
          />
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-xl border border-transparent text-admin-navy hover:bg-[#f2f2f2]"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <IconDotsVertical className="size-4" />
            </button>
            {menuOpen ? (
              <ul
                className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-admin-border bg-white py-1"
                role="menu"
              >
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2 text-left text-[13px] text-ink hover:bg-admin-table-header-bg"
                    onClick={copyReference}
                  >
                    Copy reference
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:min-w-[400px] lg:max-w-[440px] lg:w-[min(100%,440px)]">
          <RegistrationStatusTimeline steps={pipelineTimeline} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="rounded-xl border border-admin-border bg-white p-6">
            <h2 className="text-[18px] font-semibold text-admin-navy">
              Payment Information
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[14px] font-medium leading-6 text-[#001742]">
                  Payment Method
                </p>
                <p className="mt-1 text-[15px] text-black">
                  {formatPaymentMethodDisplay(row.paymentMethod)}
                </p>
              </div>
              <div>
                <p className="text-[14px] font-medium leading-6 text-[#001742]">
                  Amount Paid
                </p>
                <p className="mt-1 text-[15px] tabular-nums text-black">{amount}</p>
              </div>
              <div>
                <p className="text-[14px] font-medium leading-6 text-[#001742]">
                  Payment Date
                </p>
                <p className="mt-1 text-[15px] tabular-nums text-black">{paymentDate}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[14px] font-medium leading-6 text-[#001742]">
                Payment Reference
              </p>
              <p className="mt-1 font-mono text-[15px] text-black">
                {formatPaymentReference(row)}
              </p>
            </div>
            {showBankSlip ? (
              <div className="mt-4">
                <p className="text-[14px] font-medium leading-6 text-[#001742]">
                  Receipt
                </p>
                {bankTransferSlips[0] ? (
                  bankTransferSlips[0].file_name
                    .toLowerCase()
                    .endsWith(".pdf") ? (
                    <a
                      href={bankSlipImageApiUrl({
                        slipId: bankTransferSlips[0].id,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-[14px] font-medium text-admin-navy underline underline-offset-2 hover:opacity-90"
                    >
                      Open uploaded file ({bankTransferSlips[0].file_name})
                    </a>
                  ) : (
                    <div className="relative mt-2 h-[400px] w-full max-w-[274px] overflow-hidden rounded-lg border border-admin-border bg-[#fafafa]">
                      {/* eslint-disable-next-line @next/next/no-img-element -- admin-proxied slip URL */}
                      <img
                        src={bankSlipImageApiUrl({
                          slipId: bankTransferSlips[0].id,
                        })}
                        alt="Bank transfer receipt"
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  )
                ) : (
                  <p className="mt-1 text-[15px] text-black">—</p>
                )}
              </div>
            ) : null}
          </section>

          <EmailTemplateDocumentsCard
            reference={reference}
            emailLogs={emailLogs}
          />

          <ReviewOrInvoiceCard title="Internal Review" />
          <DocumentCard emailLogs={emailLogs} />
        </div>
      </div>
    </div>
  );
}
