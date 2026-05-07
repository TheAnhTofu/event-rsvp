import {
  inferDietaryYesNo,
  type RegistrationFormValues,
} from "../registration-schema.ts";

export function formatMoneyHkd(n: number): string {
  return `HKD ${n.toFixed(2)}`;
}

export function formatInvoiceDateHk(): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date());
}

export function getInvoiceIssuerName(): string {
  return process.env.INVOICE_ISSUER_NAME?.trim() || "Insurance Authority";
}

export function getIssuerAddressLinesForInvoice(): string[] {
  const raw = process.env.INVOICE_ISSUER_ADDRESS?.trim();
  if (raw) {
    return raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }
  return [
    "20/F, Sunlight Tower, 248 Queen's Road East,",
    "Wan Chai, Hong Kong",
  ];
}

export function getInvoiceBankNameValue(): string {
  return process.env.INVOICE_BANK_NAME?.trim() || "Bank of Asia Mercantile (BAM)";
}

export function getInvoiceBankAccountNameValue(): string {
  return (
    process.env.INVOICE_BANK_ACCOUNT_NAME?.trim() ||
    "IAIS Annual Conference 2026"
  );
}

export function getInvoiceBankAccountNoValue(): string {
  return process.env.INVOICE_BANK_ACCOUNT_NO?.trim() || "012-345-6789-012";
}

export function getInvoiceBankSwiftValue(): string {
  return process.env.INVOICE_BANK_SWIFT?.trim() || "BAMCHKHH";
}

export function getBankLinesForPdf(): { label: string; value: string }[] {
  return [
    { label: "Bank", value: getInvoiceBankNameValue() },
    { label: "Account Name", value: getInvoiceBankAccountNameValue() },
    { label: "Account No.", value: getInvoiceBankAccountNoValue() },
    { label: "SWIFT", value: getInvoiceBankSwiftValue() },
  ];
}

export function getInvoiceFpsBankName(): string {
  return process.env.INVOICE_FPS_BANK_NAME?.trim() || "HSBC Hong Kong";
}

export function getInvoiceFpsAccountName(): string {
  return process.env.INVOICE_FPS_ACCOUNT_NAME?.trim() || "Insurance Authority";
}

export function getInvoiceFpsId(): string {
  return process.env.INVOICE_FPS_ID?.trim() || "2786345";
}

export function getFpsLinesForPdf(): { label: string; value: string }[] {
  return [
    { label: "Bank Name", value: getInvoiceFpsBankName() },
    { label: "Account Name", value: getInvoiceFpsAccountName() },
    { label: "FPS ID", value: getInvoiceFpsId() },
  ];
}

export function getInvoiceContactEmail(): string {
  return process.env.INVOICE_CONTACT_EMAIL?.trim() || "payment@ia.org.hk";
}

export function getInvoiceContactPhone(): string {
  return process.env.INVOICE_CONTACT_PHONE?.trim() || "+852 3899 9700";
}

export function getPaymentDeadlineDate(): string {
  return process.env.INVOICE_PAYMENT_DEADLINE_DATE?.trim() || "31 October 2026";
}

export function getPaymentDeadlineTextForInvoice(): string {
  return (
    process.env.INVOICE_PAYMENT_DEADLINE_TEXT?.trim() ||
    `Please complete the payment by ${getPaymentDeadlineDate()}. Kindly quote the invoice number as the payment reference. Once payment has been successfully received and verified, a separate confirmation email with event access details will be sent.`
  );
}

function lunchLabelForInvoice(
  session: RegistrationFormValues["lunchSession"],
): string {
  switch (session) {
    case "nov12":
      return "12 Nov";
    case "nov13":
      return "13 Nov";
    case "both":
      return "12 & 13 Nov";
    case "none":
      return "Will not attend lunch";
    case undefined:
      return "—";
    default: {
      const _e: never = session;
      return _e;
    }
  }
}

export function buildParticipationDetailForInvoice(
  attendance: RegistrationFormValues["attendance"],
  payload: RegistrationFormValues,
): string {
  switch (attendance) {
    case "in_person": {
      const lunch = lunchLabelForInvoice(payload.lunchSession);
      const yn = inferDietaryYesNo(payload);
      const dietary =
        yn === "no"
          ? "none"
          : payload.dietary === "vegan"
            ? "vegan"
            : payload.dietary === "vegetarian"
              ? "vegetarian"
              : payload.dietary === "halal"
                ? "halal"
                : payload.dietary === "gluten_free"
                  ? "gluten_free"
                  : payload.dietary === "other"
                  ? payload.dietaryOtherDetails?.trim()
                    ? `other: ${payload.dietaryOtherDetails.trim()}`
                    : "other"
                  : (payload.dietary ?? "—");
      return `Physical attendance | Lunch: ${lunch} | Dietary: ${dietary} | Pass(es): 1`;
    }
    case "online":
      return "Online participation | Pass(es): 1";
    case "not_attending":
      return "Will not attend";
    default: {
      const _e: never = attendance;
      return _e;
    }
  }
}
