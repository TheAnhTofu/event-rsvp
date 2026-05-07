import type postgres from "postgres";

/** Parsed from GET query; all fields optional. */
export type RegistrationColumnFilters = {
  pipelineStages: string[];
  /** Participant category: members | industry | fellow | virtual (`flt_at`). */
  audienceTypes: string[];
  paymentMethods: string[];
  txtReference: string | null;
  txtEmail: string | null;
  txtName: string | null;
  txtPhone: string | null;
  txtCompany: string | null;
  txtCountry: string | null;
  txtJob: string | null;
  txtPaymentRef: string | null;
  createdFrom: string | null;
  createdTo: string | null;
  paymentFrom: string | null;
  paymentTo: string | null;
};

export const PIPELINE_STAGE_FILTER_IDS = [
  "registered",
  "bank_slip_received",
  "paid",
  "payment_received",
  "registration_confirmed",
  "sending_confirmation_email",
  "confirmation_email_sent",
  "sending_thank_you_email",
  "thank_you_email_sent",
] as const;

export const AUDIENCE_FORM_FILTER_IDS = [
  "members",
  "industry",
  "fellow",
  "virtual",
] as const;

export const PAYMENT_METHOD_FILTER_IDS = [
  "stripe",
  "bank_transfer",
  "paymentasia",
  "demo",
  "no_payment",
  "pending",
] as const;

function likePattern(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  return `%${t.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
}

/** Extra AND … clauses on alias `e` (enriched row). */
export function registrationColumnFilterSql(
  sql: postgres.Sql,
  f: RegistrationColumnFilters,
): postgres.PendingQuery {
  const parts: postgres.PendingQuery[] = [];

  if (f.pipelineStages.length > 0) {
    parts.push(sql`AND e.pipeline_stage = ANY(${f.pipelineStages})`);
  }
  if (f.audienceTypes.length > 0) {
    parts.push(sql`AND e.audience_type = ANY(${f.audienceTypes})`);
  }
  if (f.paymentMethods.length > 0) {
    parts.push(sql`AND e.payment_method = ANY(${f.paymentMethods})`);
  }

  const pr = likePattern(f.txtReference);
  if (pr) parts.push(sql`AND e.reference ILIKE ${pr} ESCAPE '\\'`);

  const pe = likePattern(f.txtEmail);
  if (pe) parts.push(sql`AND e.email ILIKE ${pe} ESCAPE '\\'`);

  const pn = likePattern(f.txtName);
  if (pn) {
    parts.push(
      sql`AND (COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) ILIKE ${pn} ESCAPE '\\'`,
    );
  }

  const pp = likePattern(f.txtPhone);
  if (pp) parts.push(sql`AND e.phone_number ILIKE ${pp} ESCAPE '\\'`);

  const pc = likePattern(f.txtCompany);
  if (pc) parts.push(sql`AND COALESCE(e.company, '') ILIKE ${pc} ESCAPE '\\'`);

  const pcr = likePattern(f.txtCountry);
  if (pcr) parts.push(sql`AND COALESCE(e.country, '') ILIKE ${pcr} ESCAPE '\\'`);

  const pj = likePattern(f.txtJob);
  if (pj) parts.push(sql`AND COALESCE(e.job_title, '') ILIKE ${pj} ESCAPE '\\'`);

  const ppr = likePattern(f.txtPaymentRef);
  if (ppr) {
    parts.push(sql`AND (
      COALESCE(e.stripe_payment_intent_id, '') ILIKE ${ppr} ESCAPE '\\'
      OR COALESCE(e.stripe_checkout_session_id, '') ILIKE ${ppr} ESCAPE '\\'
      OR COALESCE(e.payment_reference_sort, '') ILIKE ${ppr} ESCAPE '\\'
    )`);
  }

  if (f.createdFrom) {
    parts.push(sql`AND e.created_at::date >= ${f.createdFrom}::date`);
  }
  if (f.createdTo) {
    parts.push(sql`AND e.created_at::date <= ${f.createdTo}::date`);
  }
  if (f.paymentFrom) {
    parts.push(
      sql`AND e.payment_at IS NOT NULL AND e.payment_at::date >= ${f.paymentFrom}::date`,
    );
  }
  if (f.paymentTo) {
    parts.push(
      sql`AND e.payment_at IS NOT NULL AND e.payment_at::date <= ${f.paymentTo}::date`,
    );
  }

  if (parts.length === 0) return sql``;
  let out: postgres.PendingQuery = sql``;
  for (const p of parts) {
    out = sql`${out} ${p}`;
  }
  return out;
}

function allowCsv<T extends string>(
  csv: string | undefined,
  ids: readonly T[],
): T[] {
  if (!csv?.trim()) return [];
  const set = new Set(ids);
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => set.has(s as T));
}

function dateOrNull(s: string | undefined): string | null {
  if (!s?.trim()) return null;
  const t = s.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function trunc(s: string | undefined, max: number): string | null {
  if (!s?.trim()) return null;
  return s.trim().slice(0, max);
}

/** Map validated GET params (flt_*) to SQL filter input. */
export function parseRegistrationColumnFiltersFromQuery(p: {
  flt_ps?: string;
  flt_at?: string;
  flt_pm?: string;
  flt_ref?: string;
  flt_email?: string;
  flt_name?: string;
  flt_phone?: string;
  flt_co?: string;
  flt_country?: string;
  flt_job?: string;
  flt_pref?: string;
  flt_dc0?: string;
  flt_dc1?: string;
  flt_dp0?: string;
  flt_dp1?: string;
}): RegistrationColumnFilters {
  return {
    pipelineStages: [...allowCsv(p.flt_ps, PIPELINE_STAGE_FILTER_IDS)],
    audienceTypes: [...allowCsv(p.flt_at, AUDIENCE_FORM_FILTER_IDS)],
    paymentMethods: [...allowCsv(p.flt_pm, PAYMENT_METHOD_FILTER_IDS)],
    txtReference: trunc(p.flt_ref, 120),
    txtEmail: trunc(p.flt_email, 320),
    txtName: trunc(p.flt_name, 200),
    txtPhone: trunc(p.flt_phone, 80),
    txtCompany: trunc(p.flt_co, 200),
    txtCountry: trunc(p.flt_country, 120),
    txtJob: trunc(p.flt_job, 200),
    txtPaymentRef: trunc(p.flt_pref, 200),
    createdFrom: dateOrNull(p.flt_dc0),
    createdTo: dateOrNull(p.flt_dc1),
    paymentFrom: dateOrNull(p.flt_dp0),
    paymentTo: dateOrNull(p.flt_dp1),
  };
}
