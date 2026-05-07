import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RegistrationFormValues } from "../registration-schema.ts";
import {
  formatInvoiceDateHk,
  formatMoneyHkd,
  getInvoiceContactEmail,
  getInvoiceContactPhone,
  getInvoiceIssuerName,
  getIssuerAddressLinesForInvoice,
} from "./invoice-field-helpers";
import { renderHtmlToPdf } from "./render-html-to-pdf";

export type PaymentReceiptPdfInput = {
  eventTitle: string;
  reference: string;
  amountHkd: number;
  attendance: RegistrationFormValues["attendance"];
  attendanceLabel: string;
  payload: RegistrationFormValues;
  paymentMethod?: string;
  /** When set, receipt shows subtotal → discount → amount paid */
  subtotalHkd?: number;
  discountAmountHkd?: number;
  /** Human-readable codes, e.g. "EARLYBIRD, IAIS10" */
  discountCodesLabel?: string;
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

function getSignatureBase64(): string {
  try {
    const sigPath = join(
      process.cwd(),
      "..",
      "web",
      "public",
      "email",
      "receipt-signature.png",
    );
    const buf = readFileSync(sigPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

function buildReceiptHtml(input: PaymentReceiptPdfInput): string {
  const issuerName = esc(getInvoiceIssuerName());
  const addressLines = getIssuerAddressLinesForInvoice().map(esc);
  const receiptDate = esc(formatInvoiceDateHk());
  const ref = esc(input.reference);
  const receiptNo = `${ref} / REC`;
  const amount = esc(formatMoneyHkd(input.amountHkd));
  const eventTitle = esc(input.eventTitle);
  const logoSrc = getLogoBase64();
  const sigSrc = getSignatureBase64();
  const contactEmail = esc(getInvoiceContactEmail());
  const contactPhone = esc(getInvoiceContactPhone());

  const title = input.payload.title?.trim()
    ? `${esc(input.payload.title.trim())} `
    : "";
  const firstName = esc(input.payload.firstName.trim());
  const lastName = esc(input.payload.lastName.trim());
  const fullName = `${title}${firstName} ${lastName}`;
  const company = esc(input.payload.company.trim());
  const country = esc(input.payload.country.trim());
  const registrantEmail = esc(input.payload.email.trim());
  const paymentMethod = esc(input.paymentMethod || "Bank Transfer");
  const payerRef = `${ref} / ${firstName.charAt(0)}.${lastName.charAt(0)}. ${lastName}`;
  const showDiscount =
    input.subtotalHkd != null &&
    input.discountAmountHkd != null &&
    input.discountAmountHkd > 0 &&
    input.discountCodesLabel?.trim();
  const subtotalStr = showDiscount
    ? esc(formatMoneyHkd(input.subtotalHkd!))
    : "";
  const discStr = showDiscount
    ? esc(formatMoneyHkd(input.discountAmountHkd!))
    : "";
  const discLabel = showDiscount ? esc(input.discountCodesLabel!.trim()) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    font-size: 9px;
    line-height: 1.45;
    padding: 30px 36px;
    width: 595px;
    min-height: 842px;
    position: relative;
    overflow: hidden;
    background: #fff;
  }

  .receipt-badge {
    position: absolute;
    top: 16px; right: 0;
    background: #1a3a6e; color: #fff;
    font-size: 13px; font-weight: 700;
    padding: 8px 24px 8px 36px;
    letter-spacing: 1.5px;
    clip-path: polygon(18% 0, 100% 0, 100% 100%, 0% 100%);
  }

  .header { display: flex; align-items: flex-start; margin-bottom: 10px; }
  .logo-block img { width: 110px; height: auto; }
  .issuer-info { margin-bottom: 8px; }
  .issuer-info .name { font-size: 10px; font-weight: 700; color: #1a3a6e; margin-bottom: 1px; }
  .issuer-info .addr { font-size: 8.5px; color: #444; line-height: 1.45; }
  .meta-right { text-align: right; }
  .meta-right .label { font-size: 8px; color: #666; }
  .meta-right .small-val { font-size: 8.5px; font-weight: 400; color: #222; }

  /* --- Received From (NO underline, semi-bold) --- */
  .section-box { border: 1px solid #d0d4dc; margin-top: 12px; }
  .section-box .section-label {
    font-size: 9px; font-weight: 600; color: #1a3a6e;
    padding: 5px 10px;
    border-bottom: 1px solid #e0e2e6;
    background: #eef0f4;
  }
  .section-box .section-body { padding: 8px 10px; }
  .section-box .person-name { font-size: 9.5px; font-weight: 700; color: #111; }
  .section-box .detail { font-size: 8px; color: #333; line-height: 1.5; }

  /* ====================================================
     Payment block: single bordered container wrapping
     the 2-col table + discount + amount/signature.
     Vertical center border via td + td (auto-skips colspan).
     ==================================================== */
  .payment-block { border: 1px solid #d0d4dc; margin-top: 12px; }

  .pf-tbl { width: 100%; border-collapse: collapse; }
  .pf-tbl td {
    padding: 6px 12px;
    font-size: 8.5px; color: #222;
    border-bottom: 1px solid #e0e2e6;
    vertical-align: middle;
  }
  .pf-tbl td + td { border-left: 1px solid #d0d4dc; }

  /* Header row — NO underline, semi-bold */
  .pf-hdr td {
    background: #eef0f4;
    font-weight: 600; color: #1a3a6e;
    font-size: 9px;
  }
  .pf-data td { font-size: 9px; font-weight: 700; color: #111; }
  .pf-alt td { background: #f8f9fb; }
  .dlbl { color: #666; }

  /* Amount area (inside payment-block, below table) */
  .amt-area { padding: 8px 12px; }
  .amt-lbl { font-size: 8px; color: #666; }
  .amt-row {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-top: 2px;
  }
  .amt-val { font-size: 18px; font-weight: 700; color: #1a3a6e; }
  .sig-block { text-align: right; }
  .sig-block img { height: 34px; }
  .sig-block .sig-name { font-size: 8.5px; font-weight: 700; color: #333; margin-top: 2px; }
  .sig-block .sig-sub { font-size: 8px; color: #666; }

  /* ====================================================
     Received By — full HTML table.
     Header keeps underline + bold. Body rows use td + td
     for vertical border (auto-skips colspan full-width rows).
     ==================================================== */
  .rb-block { border: 1px solid #d0d4dc; margin-top: 16px; }
  .rb-hdr {
    font-size: 9px; font-weight: 700; color: #1a3a6e;
    text-decoration: underline;
    padding: 5px 10px;
    background: #eef0f4;
    border-bottom: 1px solid #e0e2e6;
  }
  .rb-tbl { width: 100%; border-collapse: collapse; }
  .rb-tbl td {
    padding: 6px 10px;
    font-size: 8.5px; color: #333;
    border-bottom: 1px solid #e0e2e6;
    vertical-align: middle;
  }
  .rb-tbl td + td { border-left: 1px solid #d0d4dc; }
  .rb-org-cell { color: #333; }
  .rb-evt-cell { font-size: 9px; font-weight: 700; color: #111; background: #f8f9fb; }
  .rb-alt td { background: #f8f9fb; }

  .footer-note { margin-top: 14px; font-size: 7.5px; color: #555; line-height: 1.5; }
</style>
</head>
<body>

<div class="receipt-badge">RECEIPT</div>

<div class="header">
  <div class="logo-block">
    ${logoSrc ? `<img src="${logoSrc}" alt="${issuerName}" />` : ""}
  </div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-start;">
  <div class="issuer-info">
    <div class="name">${issuerName}</div>
    <div class="addr">${addressLines.join("<br/>")}</div>
    <div class="addr" style="margin-top:4px;">${registrantEmail}</div>
  </div>
  <div class="meta-right">
    <div class="label">Receipt No: <strong style="color:#111;font-size:10px;">${receiptNo}</strong></div>
    <div class="label" style="margin-top:3px;">Date: <span class="small-val">${receiptDate}</span></div>
    <div class="label" style="margin-top:3px;">Payment Method: <strong style="color:#222;">${paymentMethod}</strong></div>
  </div>
</div>

<!-- ============ Received From ============ -->
<div class="section-box">
  <div class="section-label">Received From:</div>
  <div class="section-body">
    <div class="person-name">${fullName}</div>
    <div class="detail">${company}</div>
    <div class="detail">${country}</div>
  </div>
</div>

<!-- ============ Payment For / Details / Amount ============ -->
<div class="payment-block">
  <table class="pf-tbl">
    <tr class="pf-hdr">
      <td style="width:55%;">Payment For:</td>
      <td>Payment Reference:</td>
    </tr>
    <tr class="pf-data">
      <td><strong>${eventTitle}</strong> Registration</td>
      <td>${payerRef}</td>
    </tr>
    <tr class="pf-detail pf-alt">
      <td><span class="dlbl">Invoice Number:</span></td>
      <td><span class="dlbl">Date of Receipt:</span> <strong>${receiptDate}</strong></td>
    </tr>
    <tr class="pf-detail">
      <td><span class="dlbl">Amount Number:</span> ${ref}</td>
      <td><span class="dlbl">Account Name:</span> ${issuerName}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="dlbl">Amount Paid:</span></td>
    </tr>
  </table>${
    showDiscount
      ? `
  <div style="padding:6px 12px;border-top:1px solid #e0e2e6;">
    <table style="width:100%;font-size:8.5px;border-collapse:collapse;">
      <tr>
        <td style="color:#666;padding:2px 0;">Subtotal:</td>
        <td style="text-align:right;font-weight:600;color:#111;">${subtotalStr}</td>
      </tr>
      <tr>
        <td style="color:#666;padding:2px 0;">Discount (${discLabel}):</td>
        <td style="text-align:right;font-weight:600;color:#166534;">\u2212${discStr}</td>
      </tr>
    </table>
  </div>`
      : ""
  }
  <div class="amt-area">
    <div class="amt-row">
      <div class="amt-val">${amount}</div>
      <div class="sig-block">
        ${sigSrc ? `<img src="${sigSrc}" alt="Signature" />` : ""}
        <div class="sig-name">${issuerName}</div>
        <div class="sig-sub">Payment Office</div>
      </div>
    </div>
  </div>
</div>

<!-- ============ Received By ============ -->
<div class="rb-block">
  <div class="rb-hdr">Received By:</div>
  <table class="rb-tbl">
    <tr>
      <td colspan="2" class="rb-org-cell">${issuerName} Payment Office</td>
    </tr>
    <tr>
      <td colspan="2" class="rb-evt-cell"><strong>${eventTitle}</strong> Registration</td>
    </tr>
    <tr class="rb-alt">
      <td style="width:45%;"><span class="dlbl">Invoice Number:</span></td>
      <td><span class="dlbl">Date of Receipt:</span>&nbsp; <strong>${receiptDate}</strong></td>
    </tr>
    <tr>
      <td><span class="dlbl">Account Name:</span></td>
      <td style="text-align:right;">${issuerName}</td>
    </tr>
  </table>
</div>

<!-- ============ Footer ============ -->
<div class="footer-note">
  (This is a computer-generated document and no signature required) ${contactPhone}
</div>
<div class="footer-note" style="margin-top:4px;">
  <a href="mailto:${contactEmail}" style="color:#1a3a6e;">${contactEmail}</a> | Phone agent ${contactPhone}
</div>

</body>
</html>`;
}

export async function buildPaymentReceiptPdf(
  input: PaymentReceiptPdfInput,
): Promise<Uint8Array> {
  return renderHtmlToPdf(buildReceiptHtml(input));
}
