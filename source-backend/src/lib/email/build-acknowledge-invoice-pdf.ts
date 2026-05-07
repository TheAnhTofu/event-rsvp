import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RegistrationFormValues } from "../registration-schema.ts";
import {
  buildParticipationDetailForInvoice,
  formatInvoiceDateHk,
  formatMoneyHkd,
  getBankLinesForPdf,
  getFpsLinesForPdf,
  getInvoiceContactEmail,
  getInvoiceContactPhone,
  getInvoiceIssuerName,
  getIssuerAddressLinesForInvoice,
  getPaymentDeadlineTextForInvoice,
} from "./invoice-field-helpers";
import { renderHtmlToPdf } from "./render-html-to-pdf";

export type AcknowledgeInvoicePdfInput = {
  eventTitle: string;
  reference: string;
  amountHkd: number;
  attendance: RegistrationFormValues["attendance"];
  attendanceLabel: string;
  payload: RegistrationFormValues;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getLogoBase64(): string {
  try {
    const logoPath = join(
      process.cwd(),
      "..",
      "web",
      "public",
      "email",
      "insurance-authority-logo.png",
    );
    const buf = readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

function buildInvoiceHtml(input: AcknowledgeInvoicePdfInput): string {
  const issuerName = esc(getInvoiceIssuerName());
  const addressLines = getIssuerAddressLinesForInvoice().map(esc);
  const invoiceDate = esc(formatInvoiceDateHk());
  const ref = esc(input.reference);
  const amount = esc(formatMoneyHkd(input.amountHkd));
  const eventTitle = esc(input.eventTitle);
  const attendanceLabel = esc(input.attendanceLabel);
  const logoSrc = getLogoBase64();

  const title = input.payload.title?.trim()
    ? `${esc(input.payload.title.trim())} `
    : "";
  const firstName = esc(input.payload.firstName.trim());
  const lastName = esc(input.payload.lastName.trim());
  const fullName = `${title}${firstName} ${lastName}`;
  const company = esc(input.payload.company.trim());
  const country = esc(input.payload.country.trim());
  const email = esc(input.payload.email.trim());

  const participation = esc(
    buildParticipationDetailForInvoice(input.attendance, input.payload),
  );

  const bankLines = getBankLinesForPdf();
  const fpsLines = getFpsLinesForPdf();
  const payerRef = `${input.reference} / ${input.payload.firstName.trim()} ${input.payload.lastName.trim()}`;
  const deadlineText = esc(getPaymentDeadlineTextForInvoice());
  const contactEmail = esc(getInvoiceContactEmail());
  const contactPhone = esc(getInvoiceContactPhone());

  const maxRows = Math.max(bankLines.length, fpsLines.length);
  const bankFpsRowsHtml = Array.from({ length: maxRows })
    .map((_, i) => {
      const b = bankLines[i];
      const f = fpsLines[i];
      const labelCell = b
        ? `<td class="bk-label">${esc(b.label)}:</td><td class="bk-value">${esc(b.value)}</td>`
        : `<td></td><td></td>`;
      const fpsCell = f
        ? `<td class="fps-val">${esc(f.value)}</td>`
        : `<td class="fps-val"></td>`;
      return `<tr>${labelCell}${fpsCell}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    font-size: 9.5px;
    line-height: 1.45;
    padding: 32px 40px;
    padding-right: 40px;
    width: 595px;
    min-height: 842px;
    position: relative;
    overflow: hidden;
  }

  /* Invoice badge — solid blue, diagonal parallelogram, offset from top */
  .invoice-badge {
    position: absolute;
    top: 18px;
    right: 0;
    background: #1a3a6e;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    padding: 10px 28px 10px 40px;
    letter-spacing: 1.5px;
    clip-path: polygon(18% 0, 100% 0, 100% 100%, 0% 100%);
  }

  .header { display: flex; align-items: flex-start; margin-bottom: 14px; }
  .logo-block img { width: 120px; height: auto; }
  .issuer-info { margin-bottom: 10px; }
  .issuer-info .name { font-size: 10.5px; font-weight: 700; color: #1a3a6e; margin-bottom: 1px; }
  .issuer-info .addr { font-size: 9px; color: #444; line-height: 1.45; }
  .section-title { font-size: 10.5px; font-weight: 700; color: #111; margin: 10px 0 3px; }
  .bill-to { margin-bottom: 4px; }
  .bill-to .name { font-size: 10px; font-weight: 700; }
  .bill-to .detail { font-size: 9px; color: #333; line-height: 1.45; }
  .ref-line { font-size: 9px; margin-bottom: 1px; }
  .ref-line strong { color: #111; }
  .ref-highlight { color: #111; font-weight: 700; font-size: 9.5px; margin-bottom: 2px; }

  /* Payment details table */
  .payment-table { width: 100%; border-collapse: collapse; margin: 6px 0 0; }
  .payment-table th {
    background: #eef0f4;
    font-size: 8.5px;
    font-weight: 700;
    color: #333;
    padding: 5px 6px;
    text-align: left;
    border: 1px solid #ccc;
  }
  .payment-table th:nth-child(n+3) { text-align: center; }
  .payment-table th:last-child { text-align: right; }
  .payment-table td {
    font-size: 9px;
    padding: 5px 6px;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  .payment-table td:nth-child(n+3) { text-align: center; }
  .payment-table td:last-child { text-align: right; }
  .payment-table .event-name { font-weight: 700; font-size: 9px; }
  .payment-table .sub-desc { color: #555; font-size: 8.5px; }

  /* Totals rows inside payment table */
  .payment-table .subtotal-row td {
    border-bottom: 1px solid #ddd;
    font-size: 9px;
    text-align: right;
    padding: 5px 6px;
  }
  .payment-table .discount-row td {
    font-size: 9px;
    text-align: right;
    padding: 5px 6px;
    border-bottom: 1px solid #ddd;
  }
  .payment-table .total-row td {
    font-size: 10px;
    font-weight: 700;
    text-align: right;
    padding: 6px 6px;
    border-bottom: 1px solid #ddd;
    color: #111;
  }
  .payment-table .total-row .total-amount {
    color: #1a3a6e;
    font-size: 11px;
    font-weight: 700;
  }

  /* Bank / FPS unified table */
  .bank-fps-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
    margin-top: 10px;
    border: 1px solid #ccc;
  }
  .bank-fps-tbl .hdr-bank,
  .bank-fps-tbl .hdr-fps {
    background: #eaecf0;
    font-size: 9.5px;
    font-weight: 700;
    color: #1a3a6e;
    padding: 5px 8px;
    border-top: 3px solid #1a3a6e;
    border-bottom: 1px solid #ccc;
  }
  .bank-fps-tbl .hdr-fps { border-left: 1px solid #ccc; }
  .bank-fps-tbl td {
    padding: 3px 8px;
    font-size: 8.5px;
    color: #222;
    border-bottom: 1px solid #e8e8e8;
    vertical-align: top;
  }
  .bank-fps-tbl .bk-label {
    white-space: nowrap;
    color: #333;
    font-weight: 600;
    width: 110px;
  }
  .bank-fps-tbl .bk-value { color: #111; }
  .bank-fps-tbl .fps-val {
    color: #111;
    border-left: 1px solid #ccc;
    padding-left: 10px;
  }
  .bank-fps-tbl .payer-row td {
    background: #f3f3f3;
    padding: 5px 8px;
    font-size: 9px;
    border-bottom: none;
    border-top: 1px solid #ccc;
  }
  .footer-note {
    margin-top: 10px;
    font-size: 8.5px;
    color: #444;
    line-height: 1.55;
  }

  /* Contact box — gray bg, flush to page right edge */
  .contact-box {
    position: absolute;
    right: -40px;
    background: #e8e8e8;
    border: 1px solid #bbb;
    border-right: none;
    padding: 5px 44px 5px 10px;
    font-size: 8.5px;
    color: #333;
  }
  .contact-box .cb-title { margin-bottom: 1px; }
  .computer-gen {
    margin-top: 6px;
    font-size: 8px;
    color: #888;
    font-style: italic;
  }
</style>
</head>
<body>

<!-- INVOICE BADGE — absolute, flush right, diagonal cut -->
<div class="invoice-badge">INVOICE</div>

<!-- HEADER: logo only (no text) -->
<div class="header">
  <div class="logo-block">
    ${logoSrc ? `<img src="${logoSrc}" alt="Insurance Authority" />` : ""}
  </div>
</div>

<!-- ISSUER + INVOICE META -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;">
  <div class="issuer-info">
    <div class="name">${issuerName}</div>
    <div class="addr">${addressLines.join("<br/>")}</div>
    <div class="addr" style="margin-top:4px;">${email}</div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:8.5px;color:#666;">Invoice Number</div>
    <div style="font-size:13px;font-weight:700;margin:1px 0;">${ref}</div>
    <div style="font-size:8.5px;color:#666;margin-top:2px;">Payment Reference: ${ref.replace(/^[A-Z]+-/, "")}</div>
    <div style="font-size:8.5px;color:#666;margin-top:2px;">Invoice Date: ${invoiceDate}</div>
  </div>
</div>

<!-- BILL TO -->
<div class="section-title">Bill To:</div>
<div class="bill-to">
  <div class="name">${fullName}</div>
  <div class="detail">${company}</div>
  <div class="detail">${country}</div>
</div>

<div class="ref-highlight">Reference: ${ref}</div>
<div class="ref-line">Category: ${attendanceLabel}</div>
<div class="ref-line">Participation Mode: ${participation}</div>

<!-- PAYMENT DETAILS -->
<div class="section-title" style="margin-top:12px;">Payment details</div>
<table class="payment-table">
  <thead>
    <tr>
      <th>Description</th>
      <th>Category</th>
      <th>Quantity</th>
      <th>Unit Price</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="event-name">${eventTitle}</span> (${ref})</td>
      <td></td>
      <td>1</td>
      <td>HKD ${input.amountHkd.toFixed(0)}</td>
      <td>${amount}</td>
    </tr>
    <tr>
      <td><span class="sub-desc">Standard Registration</span></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
    <tr class="subtotal-row">
      <td colspan="3" style="text-align:right;font-weight:600;">Subtotal:</td>
      <td>HKD ${input.amountHkd.toFixed(2)}</td>
      <td>${amount}</td>
    </tr>
    <tr class="discount-row">
      <td colspan="3" style="text-align:right;">Discount:</td>
      <td></td>
      <td>HKD 0.00</td>
    </tr>
    <tr class="total-row">
      <td colspan="3" style="text-align:right;">Amount Payable:</td>
      <td></td>
      <td class="total-amount">${amount}</td>
    </tr>
  </tbody>
</table>

<!-- BANK TRANSFER + FPS (unified table) -->
<table class="bank-fps-tbl">
  <thead>
    <tr>
      <td class="hdr-bank" colspan="2">Bank Transfer Details</td>
      <td class="hdr-fps">FPS / Local Transfer</td>
    </tr>
  </thead>
  <tbody>
    ${bankFpsRowsHtml}
    <tr class="payer-row">
      <td colspan="3">Payment Reference: <strong>${esc(payerRef)}</strong></td>
    </tr>
  </tbody>
</table>

<!-- FOOTER -->
<div class="footer-note">
  ${deadlineText}
</div>
<div style="position:relative;margin-top:6px;min-height:36px;">
  <div class="footer-note" style="margin-top:0;">
    <a href="mailto:${contactEmail}" style="color:#1a3a6e;">${contactEmail}</a> | Phone agent: ${contactPhone}
  </div>
  <div class="contact-box">
    <div class="cb-title">Contact information: ${issuerName}</div>
    <div>Payment Office: &nbsp;&nbsp;${contactPhone}</div>
  </div>
</div>

<div class="computer-gen">(This is a computer generated document and no signature required)</div>

</body>
</html>`;
}

export async function buildAcknowledgeInvoicePdf(
  input: AcknowledgeInvoicePdfInput,
): Promise<Uint8Array> {
  return renderHtmlToPdf(buildInvoiceHtml(input));
}
