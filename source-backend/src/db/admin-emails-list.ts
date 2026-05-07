import { getSql } from "@db/postgres";
import type { EmailLogRow } from "@db/email-logs";
import {
  type RegistrationColumnFilters,
  registrationColumnFilterSql,
} from "@db/admin-emails-column-filters";

const REG_SORT: Record<string, string> = {
  created_at: "e.created_at",
  email: "e.email",
  reference: "e.reference",
  first_name: "e.first_name",
  last_name: "e.last_name",
  payment_status: "e.payment_status",
  approval_status: "e.approval_status",
  pipeline_stage: "e.pipeline_stage",
  attendance: "e.attendance",
  audience_type: "e.audience_type",
  phone: "e.phone_number",
  payment_method: "e.payment_method",
  fee_hkd: "e.fee_hkd",
  payment_date: "e.payment_at",
  payment_reference: "e.payment_reference_sort",
  country: "e.country",
  company: "e.company",
  job_title: "e.job_title",
};

const LOG_SORT: Record<string, string> = {
  created_at: "e.created_at",
  to_email: "e.to_email",
  template_key: "e.template_key",
  status: "e.status",
  registration_reference: "e.registration_reference",
};

function orderFragment(
  sort: string,
  order: "asc" | "desc",
  map: Record<string, string>,
  fallback: string,
): string {
  const col = map[sort] ?? fallback;
  const dir = order === "asc" ? "ASC" : "DESC";
  return `${col} ${dir} NULLS LAST`;
}

export type RegistrationEmailsRow = {
  reference: string;
  email: string;
  payment_status: string;
  approval_status: string;
  payment_method: string;
  created_at: string;
  fee_hkd: string;
  first_name: string | null;
  last_name: string | null;
  attendance: string | null;
  audience_type: string | null;
  phone_country: string | null;
  phone_number: string | null;
  country: string | null;
  company: string | null;
  job_title: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_at: string | null;
  has_bank_slip: boolean;
  thank_you_email_sent: boolean;
  pipeline_stage: string;
  /** First check-in time from `check_in_logs` (on-site), ISO string or null. */
  check_in_at: string | null;
  /** First check-out time from `check_in_logs`, ISO string or null. */
  check_out_at: string | null;
  /** Last sent timestamp per transactional template (NULL if never sent / failed). */
  acknowledge_email_sent_at: string | null;
  payment_confirmation_email_sent_at: string | null;
  email_confirmation_sent_at: string | null;
  thank_you_email_sent_at: string | null;
};

const EMPTY_COLUMN_FILTERS: RegistrationColumnFilters = {
  pipelineStages: [],
  audienceTypes: [],
  paymentMethods: [],
  txtReference: null,
  txtEmail: null,
  txtName: null,
  txtPhone: null,
  txtCompany: null,
  txtCountry: null,
  txtJob: null,
  txtPaymentRef: null,
  createdFrom: null,
  createdTo: null,
  paymentFrom: null,
  paymentTo: null,
};

export async function listRegistrationsForEmailsAdmin(input: {
  q: string | null;
  stage: string | null;
  /** `stripe` | `bank_transfer` or null for all */
  paymentMethod: string | null;
  sort: string;
  order: "asc" | "desc";
  limit: number;
  offset: number;
  columnFilters?: RegistrationColumnFilters;
}): Promise<{ rows: RegistrationEmailsRow[]; total: number }> {
  const sql = getSql();
  const pattern = input.q?.trim() ? `%${input.q.trim()}%` : null;
  const stageFilter =
    input.stage && input.stage !== "all" ? input.stage : null;
  const pmFilter = input.paymentMethod?.trim() ? input.paymentMethod : null;
  const colFrag = registrationColumnFilterSql(
    sql,
    input.columnFilters ?? EMPTY_COLUMN_FILTERS,
  );

  const orderSql = orderFragment(
    input.sort,
    input.order,
    REG_SORT,
    REG_SORT.created_at,
  );
  const orderBy = sql.unsafe(orderSql);

  const countRows = await sql`
    WITH enriched AS (
      SELECT
        r.reference,
        r.email,
        r.payment_status,
        COALESCE(r.approval_status, 'pending') AS approval_status,
        r.payment_method,
        r.created_at,
        r.fee_hkd,
        r.webhook_verified_at,
        r.approved_at,
        r.stripe_checkout_session_id,
        r.stripe_payment_intent_id,
        r.payload->>'firstName' AS first_name,
        r.payload->>'lastName' AS last_name,
        r.payload->>'attendance' AS attendance,
        COALESCE(
          NULLIF(TRIM(r.audience_type), ''),
          NULLIF(TRIM(r.payload->>'audienceType'), '')
        ) AS audience_type,
        r.payload->>'phoneCountry' AS phone_country,
        r.payload->>'phoneNumber' AS phone_number,
        r.payload->>'country' AS country,
        r.payload->>'company' AS company,
        r.payload->>'jobTitle' AS job_title,
        COALESCE(r.webhook_verified_at, r.approved_at) AS payment_at,
        COALESCE(
          NULLIF(TRIM(r.stripe_payment_intent_id), ''),
          NULLIF(TRIM(r.stripe_checkout_session_id), ''),
          ''
        ) AS payment_reference_sort,
        EXISTS (
          SELECT 1 FROM bank_transfer_slips s
          WHERE s.registration_reference = r.reference
        ) AS has_bank_slip,
        EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'sent'
        ) AS thank_you_email_sent,
        r.pipeline_stage
      FROM registrations r
      WHERE (
        ${pmFilter}::text IS NULL OR
        r.payment_method = ${pmFilter}
      )
    )
    SELECT COUNT(*)::int AS total
    FROM enriched e
    WHERE (
      ${pattern}::text IS NULL OR
      e.reference ILIKE ${pattern} OR
      e.email ILIKE ${pattern} OR
      COALESCE(e.first_name, '') ILIKE ${pattern} OR
      COALESCE(e.last_name, '') ILIKE ${pattern} OR
      COALESCE(e.phone_number, '') ILIKE ${pattern} OR
      COALESCE(e.company, '') ILIKE ${pattern} OR
      COALESCE(e.job_title, '') ILIKE ${pattern} OR
      COALESCE(e.country, '') ILIKE ${pattern} OR
      COALESCE(e.stripe_payment_intent_id, '') ILIKE ${pattern} OR
      COALESCE(e.stripe_checkout_session_id, '') ILIKE ${pattern}
    )
    AND (
      ${stageFilter}::text IS NULL OR
      e.pipeline_stage = ${stageFilter}
    )
    ${colFrag}
  `;

  const total = (countRows[0] as { total: number }).total;

  const dataRows = await sql`
    WITH enriched AS (
      SELECT
        r.reference,
        r.email,
        r.payment_status,
        COALESCE(r.approval_status, 'pending') AS approval_status,
        r.payment_method,
        r.created_at::text AS created_at,
        r.fee_hkd,
        r.webhook_verified_at,
        r.approved_at,
        r.stripe_checkout_session_id,
        r.stripe_payment_intent_id,
        r.payload->>'firstName' AS first_name,
        r.payload->>'lastName' AS last_name,
        r.payload->>'attendance' AS attendance,
        COALESCE(
          NULLIF(TRIM(r.audience_type), ''),
          NULLIF(TRIM(r.payload->>'audienceType'), '')
        ) AS audience_type,
        r.payload->>'phoneCountry' AS phone_country,
        r.payload->>'phoneNumber' AS phone_number,
        r.payload->>'country' AS country,
        r.payload->>'company' AS company,
        r.payload->>'jobTitle' AS job_title,
        COALESCE(r.webhook_verified_at, r.approved_at) AS payment_at,
        COALESCE(
          NULLIF(TRIM(r.stripe_payment_intent_id), ''),
          NULLIF(TRIM(r.stripe_checkout_session_id), ''),
          ''
        ) AS payment_reference_sort,
        EXISTS (
          SELECT 1 FROM bank_transfer_slips s
          WHERE s.registration_reference = r.reference
        ) AS has_bank_slip,
        EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'sent'
        ) AS thank_you_email_sent,
        r.pipeline_stage,
        (
          SELECT MIN(cil.created_at)
          FROM check_in_logs cil
          WHERE cil.registration_reference = r.reference
            AND cil.type = 'check_in'
        ) AS check_in_at,
        (
          SELECT MIN(cil.created_at)
          FROM check_in_logs cil
          WHERE cil.registration_reference = r.reference
            AND cil.type = 'check_out'
        ) AS check_out_at,
        /** Latest "sent" timestamp for each transactional email template; NULL if never sent. */
        (
          SELECT MAX(el.created_at)
          FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'acknowledge'
            AND el.status = 'sent'
        ) AS acknowledge_email_sent_at,
        (
          SELECT MAX(el.created_at)
          FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'payment_confirmation'
            AND el.status = 'sent'
        ) AS payment_confirmation_email_sent_at,
        (
          SELECT MAX(el.created_at)
          FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'email_confirmation_physical_attendance'
            AND el.status = 'sent'
        ) AS email_confirmation_sent_at,
        (
          SELECT MAX(el.created_at)
          FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'sent'
        ) AS thank_you_email_sent_at
      FROM registrations r
      WHERE (
        ${pmFilter}::text IS NULL OR
        r.payment_method = ${pmFilter}
      )
    )
    SELECT
      e.reference,
      e.email,
      e.payment_status,
      e.approval_status,
      e.payment_method,
      e.created_at,
      e.fee_hkd::text AS fee_hkd,
      e.first_name,
      e.last_name,
      e.attendance,
      e.audience_type,
      e.phone_country,
      e.phone_number,
      e.country,
      e.company,
      e.job_title,
      e.stripe_checkout_session_id,
      e.stripe_payment_intent_id,
      e.payment_at::text AS payment_at,
      e.has_bank_slip,
      e.thank_you_email_sent,
      e.pipeline_stage,
      e.check_in_at::text AS check_in_at,
      e.check_out_at::text AS check_out_at,
      e.acknowledge_email_sent_at::text AS acknowledge_email_sent_at,
      e.payment_confirmation_email_sent_at::text AS payment_confirmation_email_sent_at,
      e.email_confirmation_sent_at::text AS email_confirmation_sent_at,
      e.thank_you_email_sent_at::text AS thank_you_email_sent_at
    FROM enriched e
    WHERE (
      ${pattern}::text IS NULL OR
      e.reference ILIKE ${pattern} OR
      e.email ILIKE ${pattern} OR
      COALESCE(e.first_name, '') ILIKE ${pattern} OR
      COALESCE(e.last_name, '') ILIKE ${pattern} OR
      COALESCE(e.phone_number, '') ILIKE ${pattern} OR
      COALESCE(e.company, '') ILIKE ${pattern} OR
      COALESCE(e.job_title, '') ILIKE ${pattern} OR
      COALESCE(e.country, '') ILIKE ${pattern} OR
      COALESCE(e.stripe_payment_intent_id, '') ILIKE ${pattern} OR
      COALESCE(e.stripe_checkout_session_id, '') ILIKE ${pattern}
    )
    AND (
      ${stageFilter}::text IS NULL OR
      e.pipeline_stage = ${stageFilter}
    )
    ${colFrag}
    ORDER BY ${orderBy}
    LIMIT ${input.limit}
    OFFSET ${input.offset}
  `;

  const rows = dataRows as unknown as RegistrationEmailsRow[];
  return { rows, total };
}

export async function listEmailLogsPaginated(input: {
  q: string | null;
  sort: string;
  order: "asc" | "desc";
  limit: number;
  offset: number;
  /** When true, only rows whose template_key matches digest sends. */
  digestOnly?: boolean;
}): Promise<{ rows: EmailLogRow[]; total: number }> {
  const sql = getSql();
  const pattern = input.q?.trim() ? `%${input.q.trim()}%` : null;
  const orderSql = orderFragment(
    input.sort,
    input.order,
    LOG_SORT,
    LOG_SORT.created_at,
  );
  const orderBy = sql.unsafe(orderSql);
  const digestClause = input.digestOnly
    ? sql`AND e.template_key ILIKE ${"%digest%"}`
    : sql``;

  const countRows = await sql`
    SELECT COUNT(*)::int AS total
    FROM email_logs e
    WHERE (
      ${pattern}::text IS NULL OR
      e.registration_reference ILIKE ${pattern} OR
      e.to_email ILIKE ${pattern} OR
      e.template_key ILIKE ${pattern}
    )
    ${digestClause}
  `;
  const total = (countRows[0] as { total: number }).total;

  const dataRows = await sql`
    SELECT e.id, e.created_at::text, e.registration_reference, e.template_key,
           e.to_email, e.status, e.provider_message_id, e.error_message, e.provider
    FROM email_logs e
    WHERE (
      ${pattern}::text IS NULL OR
      e.registration_reference ILIKE ${pattern} OR
      e.to_email ILIKE ${pattern} OR
      e.template_key ILIKE ${pattern}
    )
    ${digestClause}
    ORDER BY ${orderBy}
    LIMIT ${input.limit}
    OFFSET ${input.offset}
  `;

  return { rows: dataRows as unknown as EmailLogRow[], total };
}

export async function countPipelineStages(): Promise<Record<string, number>> {
  const sql = getSql();
  const rows = await sql`
    SELECT pipeline_stage, COUNT(*)::int AS c
    FROM registrations
    GROUP BY pipeline_stage
  `;

  const out: Record<string, number> = {
    registered: 0,
    bank_slip_received: 0,
    paid: 0,
    payment_received: 0,
    registration_confirmed: 0,
    sending_confirmation_email: 0,
    confirmation_email_sent: 0,
    sending_thank_you_email: 0,
    thank_you_email_sent: 0,
  };
  for (const row of rows as unknown as { pipeline_stage: string; c: number }[]) {
    if (row.pipeline_stage in out) {
      out[row.pipeline_stage] = row.c;
    }
  }
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  return { ...out, all: sum };
}
