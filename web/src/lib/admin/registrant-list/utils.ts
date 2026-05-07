import type { ReadonlyURLSearchParams } from "next/navigation";
import { getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import {
  PAGE_SIZE_OPTIONS,
  PIPELINE_CHIPS,
  REGISTRANT_STATUS_BADGE_LABEL_RULES,
  REGISTRANT_STATUS_BADGE_STYLES,
  REGISTRATION_PIPELINE_TABS,
  REG_SORT_OPTIONS,
} from "./constants";
import type { PipelineFilter, Registration } from "./types";

export function parsePipelineStageParam(s: string | null): PipelineFilter {
  const allowed: PipelineFilter[] = [
    "all",
    "registered",
    "bank_slip_received",
    "paid",
    "payment_received",
    "registration_confirmed",
    "sending_confirmation_email",
    "confirmation_email_sent",
    "sending_thank_you_email",
    "thank_you_email_sent",
  ];
  if (s && allowed.includes(s as PipelineFilter)) return s as PipelineFilter;
  return "all";
}

/** Pass-through: API/DB use distinct `paid` vs `payment_received` (bank verified). */
export function pipelineStageForApi(f: PipelineFilter): string {
  return f;
}

/** Build URL for pipeline tab navigation (Link-based; avoids client router issues after hard reload). */
export function buildPipelineStageHref(
  pathname: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  stage: PipelineFilter | null,
): string {
  const p = new URLSearchParams(searchParams.toString());
  if (stage === null || stage === "all") {
    p.set("stage", "all");
  } else {
    p.set("stage", stage);
  }
  p.delete("page");
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function parseRegSortParam(s: string | null): string {
  const allowed = REG_SORT_OPTIONS.map((o) => o.value);
  if (s && allowed.includes(s)) return s;
  return "created_at";
}

export function parsePageSizeParam(s: string | null): number {
  const n = Number(s);
  if (PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])) {
    return n;
  }
  return 15;
}

export type PaymentMethodFilterParam =
  | "all"
  | "stripe"
  | "bank_transfer"
  | "paymentasia";

export function parsePaymentMethodParam(
  s: string | null,
): PaymentMethodFilterParam {
  if (s === "stripe" || s === "bank_transfer" || s === "paymentasia") return s;
  return "all";
}

export function paymentMethodForApi(f: PaymentMethodFilterParam): string {
  return f;
}

export function formatTrDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Date + time for on-site check-in/out columns (24h). */
export function formatTrDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

/** Participation mode labels (physical / online / not attending). See `registrationFormCategoryLabel` for the four homepage forms. */
export function registrationTypeLabel(attendance: string | null | undefined): string {
  switch (attendance) {
    case "in_person":
      return "Physical Participation";
    case "online":
      return "Online Forum";
    case "not_attending":
      return "Will not attend";
    default:
      return attendance?.replace(/_/g, " ").trim() || "—";
  }
}

/** Admin table cells for first/last name — empty → em dash. */
export function formatRegistrantNamePart(
  value: string | null | undefined,
): string {
  const v = value?.trim();
  return v ? v : "—";
}

/** Compact international format for list cells, e.g. +852 91234567. */
export function formatRegistrantTelephone(
  phoneCountry: string | null | undefined,
  phoneNumber: string | null | undefined,
): string {
  if (!phoneNumber?.trim()) return "—";
  const digits = phoneNumber.trim();
  const iso = phoneCountry?.trim();
  if (!iso) return digits;
  try {
    const dial = getCountryCallingCode(iso as CountryCode);
    return `+${dial} ${digits}`;
  } catch {
    return `${iso} ${digits}`;
  }
}

/** Up to five consecutive page indices centered near the current page (numbered pill UI). */
export function visiblePageRange(page: number, totalPages: number): number[] {
  if (totalPages <= 0) return [1];
  const windowSize = Math.min(5, totalPages);
  let start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function asBool(v: unknown): boolean {
  return v === true || v === "true" || v === "t";
}

export function normalizeRegistration(raw: Record<string, unknown>): Registration {
  return {
    reference: String(raw.reference ?? ""),
    email: String(raw.email ?? ""),
    first_name: raw.first_name != null ? String(raw.first_name) : null,
    last_name: raw.last_name != null ? String(raw.last_name) : null,
    attendance: raw.attendance != null ? String(raw.attendance) : null,
    audience_type:
      raw.audience_type != null && String(raw.audience_type).trim()
        ? String(raw.audience_type).trim()
        : null,
    phone_country: raw.phone_country != null ? String(raw.phone_country) : null,
    phone_number: raw.phone_number != null ? String(raw.phone_number) : null,
    country: raw.country != null ? String(raw.country) : null,
    company: raw.company != null ? String(raw.company) : null,
    job_title: raw.job_title != null ? String(raw.job_title) : null,
    fee_hkd: String(raw.fee_hkd ?? "0"),
    payment_method: String(raw.payment_method ?? ""),
    stripe_checkout_session_id:
      raw.stripe_checkout_session_id != null
        ? String(raw.stripe_checkout_session_id)
        : null,
    stripe_payment_intent_id:
      raw.stripe_payment_intent_id != null ? String(raw.stripe_payment_intent_id) : null,
    payment_at: raw.payment_at != null ? String(raw.payment_at) : null,
    payment_status: String(raw.payment_status ?? ""),
    approval_status: String(raw.approval_status ?? "pending"),
    created_at: String(raw.created_at ?? ""),
    has_bank_slip: asBool(raw.has_bank_slip),
    thank_you_email_sent: asBool(raw.thank_you_email_sent),
    pipeline_stage:
      raw.pipeline_stage != null ? String(raw.pipeline_stage) : undefined,
    check_in_at: raw.check_in_at != null ? String(raw.check_in_at) : null,
    check_out_at: raw.check_out_at != null ? String(raw.check_out_at) : null,
    acknowledge_email_sent_at:
      raw.acknowledge_email_sent_at != null
        ? String(raw.acknowledge_email_sent_at)
        : null,
    payment_confirmation_email_sent_at:
      raw.payment_confirmation_email_sent_at != null
        ? String(raw.payment_confirmation_email_sent_at)
        : null,
    email_confirmation_sent_at:
      raw.email_confirmation_sent_at != null
        ? String(raw.email_confirmation_sent_at)
        : null,
    thank_you_email_sent_at:
      raw.thank_you_email_sent_at != null
        ? String(raw.thank_you_email_sent_at)
        : null,
  };
}

export function formatPaymentMethodLabel(method: string): string {
  switch (method) {
    case "stripe":
      return "Stripe";
    case "bank_transfer":
      return "Bank transfer";
    case "paymentasia":
      return "Alipay / WeChat";
    case "qfpay":
      return "Alipay / WeChat (legacy)";
    case "demo":
      return "Demo";
    case "no_payment":
      return "No payment";
    case "pending":
      return "—";
    default:
      return method.replace(/_/g, " ");
  }
}

export function formatAmountHkd(feeHkd: string): string {
  const n = Number.parseFloat(feeHkd);
  if (Number.isNaN(n)) return "—";
  return `HK$${n.toLocaleString("en-HK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function paymentReferenceDisplay(reg: Registration): string {
  const pi = reg.stripe_payment_intent_id?.trim();
  const cs = reg.stripe_checkout_session_id?.trim();
  const v = pi || cs;
  if (!v) return "—";
  if (v.length <= 28) return v;
  return `${v.slice(0, 12)}…${v.slice(-10)}`;
}

/**
 * Admin-only URL that proxies a bank slip from S3 (requires session cookie).
 * Prefer `{ slipId }` when the row id is known; `{ reference }` returns the latest slip (legacy list preview).
 */
export function bankSlipImageApiUrl(
  params: { reference: string } | { slipId: string },
): string {
  if ("slipId" in params && params.slipId) {
    return `/api/admin/bank-slips/image?id=${encodeURIComponent(params.slipId)}`;
  }
  const reference = "reference" in params ? params.reference : "";
  return `/api/admin/bank-slips/image?reference=${encodeURIComponent(reference)}`;
}

/** PDFs from email pipeline on S3 (`documents/{reference}/…`). See `upload-pdf-to-s3.ts`. */
export const REGISTRATION_EMAIL_PDF = {
  /** `acknowledge` template attachment (`send-acknowledge-email.ts`). */
  invoice: "IAIS-registration-invoice.pdf",
  /** `payment_confirmation` template attachment (`send-payment-confirmation.ts`). */
  paymentReceipt: "IAIS-payment-receipt.pdf",
} as const;

export function registrationEmailPdfUrl(
  reference: string,
  fileName:
    | typeof REGISTRATION_EMAIL_PDF.invoice
    | typeof REGISTRATION_EMAIL_PDF.paymentReceipt,
): string {
  const p = new URLSearchParams();
  p.set("reference", reference);
  p.set("file", fileName);
  return `/api/admin/registration-documents?${p.toString()}`;
}

export function computePipelineStage(reg: Registration): Exclude<PipelineFilter, "all"> {
  if (reg.thank_you_email_sent) return "thank_you_email_sent";
  if (reg.approval_status === "approved") return "registration_confirmed";
  if (
    (reg.payment_status === "verified" || reg.payment_status === "completed") &&
    reg.payment_method === "bank_transfer"
  ) {
    return "payment_received";
  }
  if (reg.payment_status === "verified" || reg.payment_status === "completed") return "paid";
  if (reg.payment_method === "bank_transfer" && reg.has_bank_slip) {
    return "bank_slip_received";
  }
  return "registered";
}

/**
 * Stage shown in CRM and exports: prefer persisted `pipeline_stage` when set, else derived from payment fields.
 * Use this for both label text and badge colors so they never disagree (e.g. "Paid" with orange under-review colors).
 */
export function resolvedPipelineStage(
  reg: Registration,
): Exclude<PipelineFilter, "all"> {
  const raw = reg.pipeline_stage?.trim();
  if (raw && raw !== "all") {
    return raw as Exclude<PipelineFilter, "all">;
  }
  return computePipelineStage(reg);
}

export function stageLabel(reg: Registration): string {
  const s = resolvedPipelineStage(reg);
  const found = PIPELINE_CHIPS.find((c) => c.id === s);
  return found?.label ?? s;
}

/**
 * Pipeline status pill colors (background, text, dot) — same rules as the Registrant List table.
 * Use the same stage id as the row label (e.g. {@link resolvedPipelineStage}) when styling a registration row.
 */
export function pipelineStageBadgeStyles(
  computedStage: Exclude<PipelineFilter, "all">,
  displayLabel: string,
): { bg: string; fg: string; dot: string } {
  const byLabel = REGISTRANT_STATUS_BADGE_LABEL_RULES.find((x) => x.test(displayLabel));
  if (byLabel) return byLabel.badge;
  return (
    REGISTRANT_STATUS_BADGE_STYLES[computedStage] ??
    REGISTRANT_STATUS_BADGE_STYLES.registered
  );
}

export function stageBadgeParts(reg: Registration): { bg: string; fg: string; dot: string } {
  const s = resolvedPipelineStage(reg);
  return pipelineStageBadgeStyles(s, stageLabel(reg));
}

export function pipelineTabActive(
  tab: (typeof REGISTRATION_PIPELINE_TABS)[number],
  activeFilter: PipelineFilter,
): boolean {
  if (tab.filter === null) return false;
  return activeFilter === tab.filter;
}

export function tabCountDisplay(
  tab: (typeof REGISTRATION_PIPELINE_TABS)[number],
  counts: Record<PipelineFilter, number>,
): string {
  if (tab.id === "all") return String(counts.all ?? 0);
  if (tab.filter === null) return "0";
  return String(counts[tab.filter] ?? 0);
}

/**
 * Tailwind background class for the small square dot next to each pipeline tab label.
 * Colors align with the status palette used in the registrant table (per stage / placeholder).
 */
export function pipelineTabDotClass(tabDef: (typeof REGISTRATION_PIPELINE_TABS)[number]): string {
  if (tabDef.id === "all") return "";
  const dot = (() => {
    switch (tabDef.id) {
      case "registered":
        return "bg-[#344054]";
      case "paid":
        return "bg-[#0369a1]";
      case "pur":
        return "bg-[#b45309]";
      case "pr":
        return "bg-[#0e7490]";
      case "rc":
        return "bg-[#027a48]";
      case "sce":
        return "bg-[#4338ca]";
      case "ces":
        return "bg-[#00a66c]";
      case "sty":
        return "bg-[#50369e]";
      case "tyes":
        return "bg-[#00ae91]";
      default:
        return "bg-[#8d8d8d]";
    }
  })();
  return tabDef.disabled === true ? `${dot} opacity-45` : dot;
}
