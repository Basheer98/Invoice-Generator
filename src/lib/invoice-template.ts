/**
 * Wave-style invoice template.
 * Minimal, clean, text-focused, professional.
 */

import { buildCompanyAddr } from "./format-address";

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; }
  @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
  section { margin: 0; padding: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .invoice-page {
    font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    line-height: 1.4;
    max-width: 100%;
    overflow-wrap: break-word;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 2px solid #1a1a1a;
  }
  .header-left {
    max-width: 45%;
    min-width: 0;
  }
  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 320px;
    align-self: stretch;
  }
  .header-right .meta-block {
    margin-top: auto;
  }
  .header__logo { max-width: 110px; height: auto; margin-bottom: 8px; display: block; }
  .header__company {
    font-weight: bold;
    font-size: 22px;
    letter-spacing: 0.5px;
    margin: 0 0 4px 0;
    color: #1a1a1a;
  }
  .header__line {
    font-size: 12px;
    color: #4a4a4a;
    margin: 0 0 2px 0;
    line-height: 1.4;
    word-wrap: break-word;
  }
  .header__title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
    margin-bottom: 8px;
    color: #1a1a1a;
  }
  .header__title--tax {
    font-size: 34px;
  }
  .meta-block {
    display: grid;
    grid-template-columns: auto auto;
    column-gap: 12px;
    row-gap: 4px;
    margin-left: auto;
  }
  .meta-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    white-space: nowrap;
    text-align: right;
  }
  .meta-value {
    font-size: 12px;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .header__detail {
    font-size: 12px;
    color: #4a4a4a;
    margin: 0 0 2px 0;
  }
  .detail-value {
    font-weight: 600;
  }

  .bill-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-top: 8px;
    margin-bottom: 6px;
  }
  /* BILL TO */
  .bill-to {
    max-width: 45%;
    margin-top: 6px;
    margin-bottom: 10px;
  }
  .bill-to__label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #6b7280;
    margin-bottom: 2px;
    text-transform: uppercase;
  }
  .bill-to__name {
    font-size: 16px;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 2px;
    color: #1a1a1a;
  }
  .bill-to__line {
    font-size: 13px;
    color: #374151;
    line-height: 1.35;
    margin: 1px 0;
    word-wrap: break-word;
  }
  .bill-to__line span {
    font-weight: 600;
  }

  /* INVOICE META */
  .invoice-meta { max-width: 45%; font-size: 13px; text-align: right; }
  .invoice-meta p { margin: 1px 0; }

  /* TABLE */
  .table-wrap { margin: 10px 0; }
  .invoice-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .invoice-table th, .invoice-table td { padding: 6px 8px; vertical-align: middle; }
  .invoice-table th { text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: 600; font-size: 12px; }
  .invoice-table th.qty, .invoice-table th.col-mfg, .invoice-table th.col-exp, .invoice-table th.rate, .invoice-table th.amount { white-space: nowrap; }
  .invoice-table td { border-bottom: 1px solid #e5e7eb; }
  .invoice-table td.col-desc { word-wrap: break-word; overflow-wrap: break-word; }
  .invoice-table .qty, .invoice-table .rate, .invoice-table .amount { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .invoice-table .amount { font-weight: 600; min-width: 0; }
  .invoice-table td.amount { overflow: visible; }

  /* TOTALS */
  .totals { margin: 10px 0; }
  .totals__box {
    width: 260px;
    margin-left: auto;
    display: grid;
    grid-template-columns: 1fr auto auto;
    column-gap: 6px;
    align-items: baseline;
    font-size: 12px;
  }
  .totals__row {
    display: contents;
  }
  .totals__label {
    font-weight: normal;
  }
  .totals__currency {
    text-align: right;
    padding-right: 2px;
    font-variant-numeric: tabular-nums;
    font-weight: normal;
  }
  .totals__amount {
    text-align: right;
    font-variant-numeric: tabular-nums;
    min-width: 70px;
    font-weight: normal;
    white-space: nowrap;
  }
  .totals__box > *:nth-last-child(-n+3) {
    border-top: 2px solid #999;
    padding-top: 6px;
    font-weight: bold;
    font-size: 13px;
  }
  .totals__row--subtotal .totals__label,
  .totals__row--subtotal .totals__currency,
  .totals__row--subtotal .totals__amount,
  .totals__row--grand .totals__label,
  .totals__row--grand .totals__currency,
  .totals__row--grand .totals__amount {
    font-weight: bold;
  }

  /* AMOUNT IN WORDS - above footer */
  .amount-words {
    margin: 10px 0 16px 0;
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
  }

  /* FOOTER - Terms & Signature, stays at bottom */
  .invoice-bottom {
    margin-top: auto;
  }
  .footer {
    margin-top: 20px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .footer__terms { flex: 1; max-width: 55%; min-width: 0; font-size: 10px; color: #555; line-height: 1.4; }
  .footer__terms p { margin: 0 0 4px 0; font-weight: bold; color: #333; font-size: 10px; }
  .footer__terms pre { margin: 0; white-space: pre-wrap; font-family: inherit; word-wrap: break-word; }
  .footer__sign {
    flex-shrink: 0;
    text-align: center;
    min-width: 140px;
  }
  .footer__sign .company {
    font-weight: bold;
    font-size: 14px;
    display: block;
    margin-bottom: 48px;
  }
  .footer__sign .line {
    width: 140px;
    border-top: 1px solid #999;
    margin: 0 auto;
  }
  .footer__sign .label {
    font-size: 11px;
    color: #666;
    display: block;
    margin-top: 4px;
    text-align: center;
  }
  .footer__sign-img {
    max-width: 120px;
    max-height: 40px;
    margin: 0 auto 8px auto;
    display: block;
  }
  .footer__sign-name {
    font-size: 13px;
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
  }

  .declaration { margin-top: 8px; font-size: 10px; color: #555; }

  .invoice-notes {
    font-size: 12px;
    color: #4a4a4a;
    margin: 4px 0 10px 0;
    text-align: left;
  }

  /* EXPORT-SPECIFIC */
  .export-notes { margin: 6px 0 10px 0; }
  .export-notes__label {
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 2px 0;
  }
  .export-notes__text {
    font-size: 12px;
    color: #374151;
    margin: 0;
  }
  .export-meta {
    display: flex;
    gap: 24px;
    font-size: 12px;
    color: #4a4a4a;
    margin-bottom: 8px;
  }

  .export-subtotal {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    font-size: 13px;
    font-weight: 600;
    margin: 6px 0;
    padding-right: 2px;
  }

  .export-totals { margin: 12px 0; }
  .export-totals-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .export-totals-table td {
    padding: 6px 8px;
    border: 1px solid #e5e7eb;
  }
  .etl { font-weight: 600; background: #f9fafb; }
  .export-grand td { border-top: 2px solid #999; }

  .export-words {
    font-size: 12px;
    font-weight: 700;
    margin: 8px 0;
    color: #1a1a1a;
  }
  .export-declaration {
    font-size: 11px;
    color: #555;
    margin: 6px 0 12px 0;
    padding: 8px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .footer__bank {
    font-size: 11px;
    color: #374151;
    line-height: 1.6;
  }
  .footer__bank p { margin: 0; }
  .footer__bank p:first-child { font-weight: 700; margin-bottom: 4px; }
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQtyKg(q: number): string {
  const n = Number(q);
  const s = parseFloat(n.toFixed(4)).toString();
  return `${s} KG`;
}

function formatMonthYear(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export type DomesticInvoiceData = {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate: Date | string | null;
  paymentTerms: string | null;
  termsAndConditions: string | null;
  placeOfSupply: string | null;
  poNumber: string | null;
  lrNumber: string | null;
  transport: string | null;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
    hsnCode: string | null;
    batchNo: string | null;
    mfgDate: Date | string | null;
    expDate: Date | string | null;
  }>;
  company: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    gstin: string | null;
    fssaiLicense?: string | null;
    signatureDataUrl?: string | null;
    authorizedSignatory?: string | null;
    pan?: string | null;
    phone: string | null;
    email: string | null;
    defaultTermsAndConditions: string | null;
  } | null;
  client: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    phone: string | null;
    email: string | null;
    gstin: string | null;
    drugLicense?: string | null;
    otherLicense?: string | null;
  } | null;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  defaultGstRate: number;
  cgstRate?: number;
  sgstRate?: number;
  amountInWords: string;
  logoDataUrl: string | null;
  irn?: string | null;
  irnQrCodeDataUrl?: string | null;
};

export function renderDomesticInvoice(data: DomesticInvoiceData): string {
  const company = data.company ?? {
    name: "Company",
    address: null,
    city: null,
    state: null,
    pincode: null,
    gstin: null,
    fssaiLicense: null,
    phone: null,
    email: null,
    defaultTermsAndConditions: null,
  };
  const client = data.client ?? {
    name: "—",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    gstin: "",
  };

  const companyAddr = buildCompanyAddr(company);
  const clientAddr = [client.address, client.city, client.state].filter(Boolean).join(", ");

  const currencySymbol = data.currency === "USD" ? "$" : "₹";

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td class="col-desc">${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.hsnCode || "—")}</td>
      <td>${escapeHtml(item.batchNo || "—")}</td>
      <td class="qty">${formatQtyKg(item.quantity)}</td>
      <td class="col-mfg">${formatMonthYear(item.mfgDate)}</td>
      <td class="col-exp">${formatMonthYear(item.expDate)}</td>
      <td class="rate">${currencySymbol} ${fmtNum(item.rate)}</td>
      <td class="amount">${currencySymbol} ${fmtNum(item.amount)}</td>
    </tr>`
    )
    .join("");

  const cgstRateVal = data.cgstRate ?? data.defaultGstRate / 2;
  const sgstRateVal = data.sgstRate ?? data.defaultGstRate / 2;
  const gstRows =
    data.cgst > 0 || data.sgst > 0
      ? `
      <div class="totals__row"><span class="totals__label">CGST (${cgstRateVal}%)</span><span class="totals__currency">₹</span><span class="totals__amount">${fmtNum(data.cgst)}</span></div>
      <div class="totals__row"><span class="totals__label">SGST (${sgstRateVal}%)</span><span class="totals__currency">₹</span><span class="totals__amount">${fmtNum(data.sgst)}</span></div>`
      : data.igst > 0
        ? `<div class="totals__row"><span class="totals__label">IGST (${data.defaultGstRate}%)</span><span class="totals__currency">₹</span><span class="totals__amount">${fmtNum(data.igst)}</span></div>`
        : "";

  const terms = data.termsAndConditions || company.defaultTermsAndConditions || "—";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${STYLES}</style>
</head>
<body>
  <div class="invoice-page">
  <header class="header">
    <div class="header-left">
      ${data.logoDataUrl ? `<img src="${data.logoDataUrl}" alt="Logo" class="header__logo" />` : ""}
      <p class="header__company">${escapeHtml(company.name)}</p>
      ${companyAddr ? `<p class="header__line">${escapeHtml(companyAddr)}</p>` : ""}
      ${
        company.gstin
          ? `<p class="header__detail">GSTIN: <span class="detail-value">${escapeHtml(company.gstin)}</span></p>`
          : ""
      }
      ${
        company.fssaiLicense
          ? `<p class="header__detail">FSSAI Lic. No.: <span class="detail-value">${escapeHtml(company.fssaiLicense)}</span></p>`
          : ""
      }
    </div>
    <div class="header-right">
      ${data.irn && data.irnQrCodeDataUrl ? `
      <div class="irn-block" style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <img src="${data.irnQrCodeDataUrl.replace(/"/g, "&quot;")}" alt="E-Invoice QR" style="width:80px;height:80px;border:1px solid #ddd;" />
        <div>
          <p style="font-size:10px;color:#666;margin:0 0 2px 0;">IRN</p>
          <p style="font-size:11px;font-weight:600;margin:0;word-break:break-all;">${escapeHtml(data.irn)}</p>
        </div>
      </div>
      ` : ""}
      <div class="header__title header__title--tax">TAX INVOICE</div>
      <div class="meta-block">
        <span class="meta-label">Invoice Number:</span>
        <span class="meta-value">${escapeHtml(data.invoiceNumber)}</span>
        <span class="meta-label">Invoice Date:</span>
        <span class="meta-value">${formatDate(data.invoiceDate)}</span>
        <span class="meta-label">Due Date:</span>
        <span class="meta-value">${formatDate(data.dueDate)}</span>
      </div>
    </div>
  </header>

  <section class="bill-row">
    <div class="bill-to">
      <p class="bill-to__label">BILL TO</p>
      <p class="bill-to__name">${escapeHtml(client.name)}</p>
      ${clientAddr ? `<p class="bill-to__line">${escapeHtml(clientAddr)}</p>` : ""}
      ${
        client.gstin
          ? `<p class="bill-to__line">GSTIN: <span>${escapeHtml(client.gstin)}</span></p>`
          : ""
      }
      ${
        client.drugLicense
          ? `<p class="bill-to__line">Drug Lic. No.: <span>${escapeHtml(client.drugLicense)}</span></p>`
          : ""
      }
      ${
        client.otherLicense
          ? `<p class="bill-to__line">Other Lic. No.: <span>${escapeHtml(client.otherLicense)}</span></p>`
          : ""
      }
    </div>
    <div class="invoice-meta">
      <div class="meta-block">
        <span class="meta-label">Place of Supply:</span>
        <span class="meta-value">${escapeHtml(data.placeOfSupply || "—")}</span>

        <span class="meta-label">Currency:</span>
        <span class="meta-value">${escapeHtml(data.currency)}</span>

        ${
          data.poNumber
            ? `<span class="meta-label">PO No.:</span><span class="meta-value">${escapeHtml(
                data.poNumber
              )}</span>`
            : ""
        }
        ${
          data.lrNumber
            ? `<span class="meta-label">L.R. No.:</span><span class="meta-value">${escapeHtml(
                data.lrNumber
              )}</span>`
            : ""
        }
        ${
          data.transport
            ? `<span class="meta-label">Transport:</span><span class="meta-value">${escapeHtml(
                data.transport
              )}</span>`
            : ""
        }
        ${
          data.paymentTerms
            ? `<span class="meta-label">Payment Terms:</span><span class="meta-value">${escapeHtml(
                data.paymentTerms
              )}</span>`
            : ""
        }
      </div>
    </div>
  </section>

  <section class="table-wrap">
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>HSN</th>
          <th>Batch No.</th>
          <th class="qty">QTY</th>
          <th class="col-mfg">Mfg date</th>
          <th class="col-exp">Exp date</th>
          <th class="rate">Rate</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
  </section>

  <div class="totals">
    <div class="totals__box">
      <div class="totals__row totals__row--subtotal"><span class="totals__label">Subtotal</span><span class="totals__currency">₹</span><span class="totals__amount">${fmtNum(data.subtotal)}</span></div>
      ${gstRows}
      <div class="totals__row totals__row--grand"><span class="totals__label">Grand Total</span><span class="totals__currency">₹</span><span class="totals__amount">${fmtNum(data.grandTotal)}</span></div>
    </div>
  </div>

  <div class="invoice-bottom">
    <p class="amount-words">Amount in Words: ${escapeHtml(data.amountInWords)}</p>
    <footer class="footer">
    <div class="footer__terms">
      <p>Terms & Conditions</p>
      <pre>${escapeHtml(terms)}</pre>
    </div>
    <div class="footer__sign">
      ${company.signatureDataUrl ? `<img src="${company.signatureDataUrl.replace(/"/g, "&quot;")}" alt="Signature" class="footer__sign-img" />` : ""}
      <span class="company">For ${escapeHtml(company.name)}</span>
      ${company.authorizedSignatory ? `<span class="footer__sign-name">${escapeHtml(company.authorizedSignatory)}</span>` : ""}
      ${!company.signatureDataUrl ? `<div class="line"></div>` : ""}
      <span class="label">Authorized Signature</span>
    </div>
  </footer>
  </div>
  </div>
</body>
</html>`;
}

export type ExportInvoiceData = {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate: Date | string | null;
  currency: string;
  notes: string | null;
  items: Array<{ description: string; quantity: number; amount: number }>;
  company: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    gstin: string | null;
    lutReference: string | null;
    signatureDataUrl?: string | null;
    authorizedSignatory?: string | null;
    phone?: string | null;
    email?: string | null;
    bankName: string | null;
    swiftCode: string | null;
    accountName: string | null;
    accountNumber: string | null;
    ifscCode: string | null;
  } | null;
  client: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string | null;
    email: string | null;
    ein: string | null;
  } | null;
  subtotal: number;
  subtotalInr: number;
  amountInWordsInr: string;
  logoDataUrl: string | null;
};

export function renderExportInvoice(data: ExportInvoiceData): string {
  const company = data.company ?? {
    name: "Company",
    address: null,
    city: null,
    state: null,
    pincode: null,
    gstin: null,
    lutReference: null,
    bankName: null,
    swiftCode: null,
    accountName: null,
    accountNumber: null,
    ifscCode: null,
  };
  const client = data.client ?? {
    name: "Client",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    email: "",
    ein: "",
  };
  const symbol = data.currency === "USD" ? "$" : "₹";

  const companyAddr = buildCompanyAddr(company);

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td class="qty">${fmtNum(item.quantity)}</td>
      <td class="amount">${symbol} ${fmtNum(item.amount)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice for Export of Services - ${escapeHtml(data.invoiceNumber)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${STYLES}</style>
</head>
<body>
  <div class="invoice-page">
  <header class="header">
    <div class="header-left">
      ${data.logoDataUrl ? `<img src="${data.logoDataUrl}" alt="Logo" class="header__logo" />` : ""}
      <p class="header__company">${escapeHtml(company.name)}</p>
      ${companyAddr ? `<p class="header__line">${escapeHtml(companyAddr)}</p>` : ""}
      ${
        company.gstin
          ? `<p class="header__detail">GSTIN: <span class="detail-value">${escapeHtml(company.gstin)}</span></p>`
          : ""
      }
      ${
        company.lutReference
          ? `<p class="header__detail">LUT Reference: <span class="detail-value">${escapeHtml(company.lutReference)}</span></p>`
          : ""
      }
    </div>
    <div class="header-right">
      <div class="header__title">INVOICE FOR EXPORT OF SERVICES</div>
      <div class="meta-block">
        <span class="meta-label">Invoice Number:</span>
        <span class="meta-value">${escapeHtml(data.invoiceNumber)}</span>
        <span class="meta-label">Invoice Date:</span>
        <span class="meta-value">${formatDate(data.invoiceDate)}</span>
        <span class="meta-label">Due Date:</span>
        <span class="meta-value">${formatDate(data.dueDate)}</span>
        <span class="meta-label">Place of Supply:</span>
        <span class="meta-value">Outside India</span>
        <span class="meta-label">Currency:</span>
        <span class="meta-value">${escapeHtml(data.currency)}</span>
      </div>
    </div>
  </header>

  <section class="bill-row">
    <div class="bill-to">
      <p class="bill-to__label">BILL TO</p>
      <p class="bill-to__name">${escapeHtml(client.name)}</p>
      ${client.address ? `<p class="bill-to__line">${escapeHtml(client.address)}</p>` : ""}
      ${[client.city, client.state, client.pincode].filter(Boolean).length
        ? `<p class="bill-to__line">${escapeHtml(
            [client.city, client.state, client.pincode].filter(Boolean).join(", ")
          )}</p>`
        : ""}
      ${client.country ? `<p class="bill-to__line">${escapeHtml(client.country)}</p>` : ""}
      ${client.email ? `<p class="bill-to__line">${escapeHtml(client.email)}</p>` : ""}
      ${client.ein ? `<p class="bill-to__line">EIN: ${escapeHtml(client.ein)}</p>` : ""}
    </div>
  </section>

  ${data.notes ? `
  <div class="export-notes">
    <p class="export-notes__label">Description</p>
    <p class="export-notes__text">${escapeHtml(data.notes)}</p>
  </div>` : ""}

  <div class="export-meta">
    <span>SAC Code: <strong>998599</strong></span>
    <span>GST: <strong>IGST @ 0% (Export of Services)</strong></span>
  </div>

  <section class="table-wrap">
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Project</th>
          <th class="qty">SQFT</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
  </section>

  <div class="export-subtotal">
    <span>Subtotal:</span>
    <span>${symbol} ${fmtNum(data.subtotal)}</span>
  </div>

  <div class="export-totals">
    <table class="export-totals-table">
      <tr>
        <td class="etl">Description</td>
        <td class="etl">Amount (USD)</td>
        <td class="etl">Currency INR</td>
      </tr>
      <tr>
        <td>Service Charges</td>
        <td>${symbol} ${fmtNum(data.subtotal)}</td>
        <td>₹ ${fmtNum(data.subtotalInr)}</td>
      </tr>
      <tr>
        <td>IGST @ 0%</td>
        <td></td>
        <td>0.00</td>
      </tr>
      <tr class="export-grand">
        <td><strong>Total Invoice Value (INR)</strong></td>
        <td></td>
        <td><strong>₹ ${fmtNum(data.subtotalInr)}</strong></td>
      </tr>
    </table>
  </div>

  <div class="export-words">
    Indian Currency: INR ${fmtNum(data.subtotalInr)} (${escapeHtml(data.amountInWordsInr)})
  </div>
  <div class="export-declaration">
    <strong>Export Declaration</strong><br/>
    Supply meant for export under Letter of Undertaking (LUT) without payment of IGST, as per Section 16 of IGST Act, 2017.
  </div>

  <footer class="footer">
    <div class="footer__bank">
      <p><strong>Bank Details</strong></p>
      <p>Account Name: ${escapeHtml(company.accountName ?? company.name)}</p>
      <p>Bank Name: ${escapeHtml(company.bankName ?? "—")}</p>
      <p>Account Number: ${escapeHtml(company.accountNumber ?? "—")}</p>
      <p>IFSC: ${escapeHtml(company.ifscCode ?? "—")}</p>
      <p>SWIFT Code: ${escapeHtml(company.swiftCode ?? "—")}</p>
    </div>
    <div class="footer__sign">
      ${company.signatureDataUrl ? `<img src="${company.signatureDataUrl.replace(/"/g, "&quot;")}" alt="Signature" class="footer__sign-img" />` : ""}
      <span class="company">For ${escapeHtml(company.name)}</span>
      ${company.authorizedSignatory ? `<span class="footer__sign-name">${escapeHtml(company.authorizedSignatory)}</span>` : ""}
      ${!company.signatureDataUrl ? `<div class="line"></div>` : ""}
      <span class="label">Authorized Signatory Signature & Stamp</span>
    </div>
  </footer>
  </div>
</body>
</html>`;
}
