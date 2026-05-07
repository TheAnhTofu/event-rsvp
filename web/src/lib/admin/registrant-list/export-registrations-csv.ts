import type { Registration } from "@/lib/admin/registrant-list/types";
import {
  formatAmountHkd,
  formatPaymentMethodLabel,
  formatRegistrantTelephone,
  formatTrDate,
  formatTrDateTime,
  paymentReferenceDisplay,
  stageLabel,
} from "@/lib/admin/registrant-list/utils";
import { registrationFormCategoryLabel } from "@/lib/admin/registrant-list/registration-form-category";

/** RFC 4180-style quoting; commas inside cells (e.g. HK$1,234) must be quoted for Excel. */
function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

type RegistrationCsvColumn = {
  header: string;
  cell: (reg: Registration) => string;
};

function paymentRefCell(reg: Registration): string {
  return reg.payment_method === "bank_transfer" && reg.has_bank_slip
    ? reg.reference
    : paymentReferenceDisplay(reg);
}

/** Same column order as the admin registrant list table (excluding the checkbox column). */
const FULL_REGISTRATION_CSV_COLUMNS: readonly RegistrationCsvColumn[] = [
  { header: "Registrant ID", cell: (reg) => reg.reference },
  { header: "Registrant Status", cell: (reg) => stageLabel(reg) },
  {
    header: "Registration Type",
    cell: (reg) => registrationFormCategoryLabel(reg.audience_type),
  },
  { header: "First name", cell: (reg) => reg.first_name?.trim() || "—" },
  { header: "Last name", cell: (reg) => reg.last_name?.trim() || "—" },
  { header: "Email Address", cell: (reg) => reg.email },
  {
    header: "Telephone",
    cell: (reg) =>
      formatRegistrantTelephone(reg.phone_country, reg.phone_number),
  },
  {
    header: "Payment Method",
    cell: (reg) => formatPaymentMethodLabel(reg.payment_method),
  },
  { header: "Amount Paid", cell: (reg) => formatAmountHkd(reg.fee_hkd) },
  {
    header: "Payment Date",
    cell: (reg) => (reg.payment_at ? formatTrDate(reg.payment_at) : "—"),
  },
  {
    header: "Receipt",
    cell: (reg) => (reg.has_bank_slip ? "Bank slip" : "—"),
  },
  { header: "Payment Reference", cell: (reg) => paymentRefCell(reg) },
  { header: "Country/Region", cell: (reg) => reg.country?.trim() || "—" },
  {
    header: "Company / Organization",
    cell: (reg) => reg.company?.trim() || "—",
  },
  { header: "Job Title", cell: (reg) => reg.job_title?.trim() || "—" },
  {
    header: "Check-in time",
    cell: (reg) => formatTrDateTime(reg.check_in_at),
  },
  {
    header: "Check-out time",
    cell: (reg) => formatTrDateTime(reg.check_out_at),
  },
  { header: "Created At", cell: (reg) => formatTrDate(reg.created_at) },
];

/** Columns matching the Send Email review modal: ID, first name, last name, email (no status/type). */
const SEND_EMAIL_MODAL_CSV_COLUMNS: readonly RegistrationCsvColumn[] = [
  FULL_REGISTRATION_CSV_COLUMNS[0],
  FULL_REGISTRATION_CSV_COLUMNS[3],
  FULL_REGISTRATION_CSV_COLUMNS[4],
  FULL_REGISTRATION_CSV_COLUMNS[5],
];

/**
 * UTF-8 CSV with BOM for Excel.
 * First line `sep=,` hints comma as delimiter when Windows list separator is `;` (EU/VN locales).
 */
function buildExcelCsvContent(
  registrations: Registration[],
  columns: readonly RegistrationCsvColumn[],
): string {
  const headerLine = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const dataLines = registrations.map((reg) =>
    columns.map((c) => escapeCsvCell(String(c.cell(reg)))).join(","),
  );
  const body = ["sep=,", headerLine, ...dataLines].join("\r\n");
  return `\uFEFF${body}`;
}

/** Columns match the admin registrant table (current page). */
export function buildRegistrationsCsvContent(
  registrations: Registration[],
): string {
  return buildExcelCsvContent(registrations, FULL_REGISTRATION_CSV_COLUMNS);
}

/** Same columns as the Send Email confirmation modal (no extra fields after email). */
export function buildSendEmailModalCsvContent(
  registrations: Registration[],
): string {
  return buildExcelCsvContent(registrations, SEND_EMAIL_MODAL_CSV_COLUMNS);
}

const CSV_MIME = "text/csv;charset=utf-8";

export function downloadRegistrationsCsv(
  registrations: Registration[],
  filenameBase: string,
): void {
  if (registrations.length === 0 || typeof document === "undefined") return;
  const safe = filenameBase.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const blob = new Blob([buildRegistrationsCsvContent(registrations)], {
    type: CSV_MIME,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSendEmailModalCsv(
  registrations: Registration[],
  filenameBase: string,
): void {
  if (registrations.length === 0 || typeof document === "undefined") return;
  const safe = filenameBase.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const blob = new Blob([buildSendEmailModalCsvContent(registrations)], {
    type: CSV_MIME,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
