import { PIPELINE_CHIPS } from "./constants";

/** GET params for column filters (mirrors source-backend admin-handlers + admin-emails-column-filters). */
export const COLUMN_FILTER_PARAM_KEYS = [
  "flt_ps",
  "flt_at",
  "flt_pm",
  "flt_ref",
  "flt_email",
  "flt_name",
  "flt_phone",
  "flt_co",
  "flt_country",
  "flt_job",
  "flt_pref",
  "flt_dc0",
  "flt_dc1",
  "flt_dp0",
  "flt_dp1",
] as const;

export type ColumnFilterKind = "enum" | "text" | "date";

export type ColumnFilterConfig =
  | { kind: "enum"; urlKey: string; options: { value: string; label: string }[] }
  | { kind: "text"; urlKey: string }
  | { kind: "date"; fromKey: string; toKey: string }
  | null;

const pipelineEnumOptions = PIPELINE_CHIPS.filter((c) => c.id !== "all").map((c) => ({
  value: c.id,
  label: c.label,
}));

const registrationFormFilterOptions = [
  {
    value: "members",
    label: "IAIS Members, IAIS Secretariat, AMF",
  },
  {
    value: "fellow",
    label:
      "IAIS Distinguished Fellow, Press, Consumer Group and External Speaker",
  },
  {
    value: "industry",
    label: "Industry representative",
  },
  {
    value: "virtual",
    label: "Virtual for IAIS Members only",
  },
];

const paymentMethodOptions = [
  { value: "stripe", label: "Stripe" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "paymentasia", label: "Alipay / WeChat" },
  { value: "demo", label: "Demo" },
  { value: "no_payment", label: "No payment" },
  { value: "pending", label: "Pending" },
];

/** Maps table sort column to filter UI + URL keys. */
export function columnFilterConfigForSortKey(sortKey: string): ColumnFilterConfig {
  switch (sortKey) {
    case "reference":
      return { kind: "text", urlKey: "flt_ref" };
    case "pipeline_stage":
      return { kind: "enum", urlKey: "flt_ps", options: pipelineEnumOptions };
    case "audience_type":
      return {
        kind: "enum",
        urlKey: "flt_at",
        options: registrationFormFilterOptions,
      };
    case "first_name":
    case "last_name":
      return { kind: "text", urlKey: "flt_name" };
    case "email":
      return { kind: "text", urlKey: "flt_email" };
    case "phone":
      return { kind: "text", urlKey: "flt_phone" };
    case "payment_method":
      return { kind: "enum", urlKey: "flt_pm", options: paymentMethodOptions };
    case "payment_date":
      return { kind: "date", fromKey: "flt_dp0", toKey: "flt_dp1" };
    case "payment_reference":
      return { kind: "text", urlKey: "flt_pref" };
    case "country":
      return { kind: "text", urlKey: "flt_country" };
    case "company":
      return { kind: "text", urlKey: "flt_co" };
    case "job_title":
      return { kind: "text", urlKey: "flt_job" };
    case "created_at":
      return { kind: "date", fromKey: "flt_dc0", toKey: "flt_dc1" };
    default:
      return null;
  }
}

export function isColumnFilterActive(
  sortKey: string,
  searchParams: URLSearchParams,
): boolean {
  const cfg = columnFilterConfigForSortKey(sortKey);
  if (!cfg) return false;
  if (cfg.kind === "text") {
    return Boolean(searchParams.get(cfg.urlKey)?.trim());
  }
  if (cfg.kind === "enum") {
    return Boolean(searchParams.get(cfg.urlKey)?.trim());
  }
  return Boolean(
    searchParams.get(cfg.fromKey)?.trim() || searchParams.get(cfg.toKey)?.trim(),
  );
}

/** Copy active column filter params from the current URL into an API request. */
export function copyColumnFiltersToParams(
  target: URLSearchParams,
  source: URLSearchParams,
): void {
  for (const k of COLUMN_FILTER_PARAM_KEYS) {
    const v = source.get(k);
    if (v?.trim()) target.set(k, v);
  }
}
