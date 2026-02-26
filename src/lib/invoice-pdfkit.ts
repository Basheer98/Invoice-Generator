/**
 * PDFKit-based invoice PDF generator.
 * Clean, predictable layout with full control.
 */

import PDFDocument from "pdfkit";
import { buildCompanyAddr } from "./format-address";

const MARGIN = 56;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type DomesticData = {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate: Date | string | null;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    hsnCode: string | null;
  }>;
  company: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    gstin: string | null;
  } | null;
  client: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    gstin: string | null;
  } | null;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  defaultGstRate: number;
  amountInWords: string;
  termsAndConditions: string;
  logoBuffer: Buffer | null;
};

type ExportData = {
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
    bankName: string | null;
    swiftCode: string | null;
  } | null;
  client: {
    name: string;
    address: string | null;
    email: string | null;
    ein: string | null;
  } | null;
  subtotal: number;
  logoBuffer: Buffer | null;
};

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

function collectBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function addHeader(
  doc: PDFKit.PDFDocument,
  data: { company: DomesticData["company"]; invoiceNumber: string; invoiceDate: Date | string; dueDate: Date | string | null },
  logoBuffer: Buffer | null
): number {
  let y = MARGIN;
  const leftWidth = CONTENT_WIDTH * 0.5;
  const rightX = MARGIN + leftWidth + 24;

  // Left: Logo + Company
  doc.fontSize(10).fillColor("#333333");
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, y, { width: 70 });
      y += 52;
    } catch {
      y += 4;
    }
  }
  const company = data.company ?? { name: "Company", address: null, city: null, state: null, pincode: null, gstin: null };
  doc.font("Helvetica-Bold").fontSize(14).text(company.name, MARGIN, y, { width: leftWidth });
  y += 18;
  doc.font("Helvetica").fontSize(10).fillColor("#555555");
  const addr = buildCompanyAddr(company);
  if (addr) {
    doc.text(addr, MARGIN, y, { width: leftWidth, lineGap: 2 });
    y += doc.heightOfString(addr, { width: leftWidth }) + 4;
  }
  if (company.gstin) {
    doc.text("GSTIN: " + company.gstin, MARGIN, y, { width: leftWidth });
    y += 14;
  }

  // Right: INVOICE + meta
  y = MARGIN;
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#1a1a1a").text("INVOICE", rightX, y, { align: "right", width: CONTENT_WIDTH - leftWidth - 24 });
  y += 22;
  doc.font("Helvetica").fontSize(10).fillColor("#555555");
  doc.text("Invoice Number: " + data.invoiceNumber, rightX, y, { align: "right", width: CONTENT_WIDTH - leftWidth - 24 });
  y += 14;
  doc.text("Invoice Date: " + formatDate(data.invoiceDate), rightX, y, { align: "right", width: CONTENT_WIDTH - leftWidth - 24 });
  y += 14;
  doc.text("Due Date: " + formatDate(data.dueDate), rightX, y, { align: "right", width: CONTENT_WIDTH - leftWidth - 24 });

  return Math.max(y, MARGIN + 60);
}

function addBillTo(doc: PDFKit.PDFDocument, data: DomesticData, startY: number): number {
  let y = startY + 16;
  const client = data.client ?? { name: "—", address: "", city: "", state: "", gstin: "" };
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#666666").text("BILL TO", MARGIN, y);
  y += 14;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#1a1a1a").text(client.name, MARGIN, y, { width: CONTENT_WIDTH * 0.45 });
  y += 14;
  doc.font("Helvetica").fontSize(10).fillColor("#555555");
  const addr = [client.address, client.city, client.state].filter(Boolean).join(", ");
  if (addr) {
    doc.text(addr, MARGIN, y, { width: CONTENT_WIDTH * 0.45, lineGap: 2 });
    y += doc.heightOfString(addr, { width: CONTENT_WIDTH * 0.45 }) + 4;
  }
  if (client.gstin) {
    doc.text("GSTIN: " + client.gstin, MARGIN, y);
    y += 14;
  }
  return y;
}

function addTable(doc: PDFKit.PDFDocument, data: DomesticData, startY: number): number {
  let y = startY + 12;
  const colWidths = [CONTENT_WIDTH * 0.4, CONTENT_WIDTH * 0.12, CONTENT_WIDTH * 0.12, CONTENT_WIDTH * 0.12, CONTENT_WIDTH * 0.14];
  let x = MARGIN;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333");
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 18).fillAndStroke("#f5f5f5", "#dddddd");
  doc.fillColor("#333333");
  doc.text("Description", x, y, { width: colWidths[0] });
  x += colWidths[0];
  doc.text("HSN", x, y, { width: colWidths[1] });
  x += colWidths[1];
  doc.text("Qty", x, y, { width: colWidths[2], align: "right" });
  x += colWidths[2];
  doc.text("Rate", x, y, { width: colWidths[3], align: "right" });
  x += colWidths[3];
  doc.text("Amount", x, y, { width: colWidths[4], align: "right" });
  y += 20;

  doc.font("Helvetica").fontSize(10).fillColor("#333333");
  for (const row of data.items) {
    if (y > PAGE_HEIGHT - MARGIN - 80) {
      doc.addPage();
      y = MARGIN;
    }
    x = MARGIN;
    const desc = (row.description || "—").slice(0, 80);
    doc.text(desc, x, y, { width: colWidths[0] });
    x += colWidths[0];
    doc.text(row.hsnCode || "—", x, y, { width: colWidths[1] });
    x += colWidths[1];
    doc.text(fmtNum(row.quantity), x, y, { width: colWidths[2], align: "right" });
    x += colWidths[2];
    doc.text("₹ " + fmtNum(row.rate), x, y, { width: colWidths[3], align: "right" });
    x += colWidths[3];
    doc.text("₹ " + fmtNum(row.amount), x, y, { width: colWidths[4], align: "right" });
    y += 16;
  }
  return y;
}

function addTotals(doc: PDFKit.PDFDocument, data: DomesticData, startY: number): number {
  let y = startY + 12;
  const boxWidth = 180;
  const boxX = MARGIN + CONTENT_WIDTH - boxWidth;

  doc.font("Helvetica").fontSize(10).fillColor("#333333");
  doc.text("Subtotal", boxX, y, { width: boxWidth - 80 });
  doc.text("₹ " + fmtNum(data.subtotal), boxX + boxWidth - 80, y, { width: 80, align: "right" });
  y += 14;

  const cgstRate = data.defaultGstRate / 2;
  if (data.cgst > 0 || data.sgst > 0) {
    doc.text(`CGST (${cgstRate}%)`, boxX, y, { width: boxWidth - 80 });
    doc.text("₹ " + fmtNum(data.cgst), boxX + boxWidth - 80, y, { width: 80, align: "right" });
    y += 14;
    doc.text(`SGST (${cgstRate}%)`, boxX, y, { width: boxWidth - 80 });
    doc.text("₹ " + fmtNum(data.sgst), boxX + boxWidth - 80, y, { width: 80, align: "right" });
    y += 14;
  } else if (data.igst > 0) {
    doc.text(`IGST (${data.defaultGstRate}%)`, boxX, y, { width: boxWidth - 80 });
    doc.text("₹ " + fmtNum(data.igst), boxX + boxWidth - 80, y, { width: 80, align: "right" });
    y += 14;
  }

  y += 4;
  doc.moveTo(boxX, y).lineTo(boxX + boxWidth, y).strokeColor("#999999").stroke();
  y += 10;
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Grand Total", boxX, y, { width: boxWidth - 80 });
  doc.text("₹ " + fmtNum(data.grandTotal), boxX + boxWidth - 80, y, { width: 80, align: "right" });
  y += 20;
  return y;
}

function addFooter(doc: PDFKit.PDFDocument, data: DomesticData, startY: number): void {
  let y = startY + 8;
  const company = data.company ?? { name: "Company" };

  doc.font("Helvetica").fontSize(10).fillColor("#555555");
  doc.text("Amount in Words: " + data.amountInWords, MARGIN, y, { width: CONTENT_WIDTH });
  y += 20;

  doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor("#e0e0e0").stroke();
  y += 14;

  const termsWidth = CONTENT_WIDTH * 0.55;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#333333").text("Terms & Conditions", MARGIN, y);
  y += 12;
  doc.font("Helvetica").fontSize(9).fillColor("#555555");
  doc.text(data.termsAndConditions || "—", MARGIN, y, { width: termsWidth, lineGap: 2 });
  const termsHeight = doc.heightOfString(data.termsAndConditions || "—", { width: termsWidth });

  const signX = MARGIN + termsWidth + 24;
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333").text("For " + company.name, signX, startY + 8 + 20 + 14 + 14);
  doc.moveTo(signX, startY + 8 + 20 + 14 + 14 + 20).lineTo(signX + 100, startY + 8 + 20 + 14 + 14 + 20).strokeColor("#999999").stroke();
  doc.font("Helvetica").fontSize(9).fillColor("#666666").text("Authorized Signature", signX, startY + 8 + 20 + 14 + 14 + 26);
}

export async function generateDomesticPDF(data: DomesticData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN });
  const bufferPromise = collectBuffer(doc);

  let y = addHeader(doc, data, data.logoBuffer);
  y = addBillTo(doc, data, y);
  y = addTable(doc, data, y);
  y = addTotals(doc, data, y);
  addFooter(doc, data, y);

  doc.end();
  return bufferPromise;
}

export async function generateExportPDF(data: ExportData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN });
  const bufferPromise = collectBuffer(doc);

  let y = MARGIN;
  const company = data.company ?? { name: "Company", address: null, city: null, state: null, pincode: null, gstin: null, bankName: null, swiftCode: null };
  const symbol = data.currency === "USD" ? "$" : "₹";

  if (data.logoBuffer) {
    try {
      doc.image(data.logoBuffer, MARGIN, y, { width: 70 });
      y += 52;
    } catch {
      y += 4;
    }
  }
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#1a1a1a").text("INVOICE", MARGIN + CONTENT_WIDTH * 0.5 + 24, MARGIN, { align: "right", width: CONTENT_WIDTH * 0.5 - 24 });
  doc.font("Helvetica-Bold").fontSize(14).text(company.name, MARGIN, y);
  y += 18;
  doc.font("Helvetica").fontSize(10).fillColor("#555555");
  const addr = buildCompanyAddr(company);
  if (addr) doc.text(addr, MARGIN, y, { width: CONTENT_WIDTH * 0.5 });
  y += 36;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#666666").text("BILL TO", MARGIN, y);
  y += 14;
  const client = data.client ?? { name: "Client", address: "", email: "", ein: "" };
  doc.font("Helvetica-Bold").fontSize(11).text(client.name, MARGIN, y);
  y += 14;
  doc.font("Helvetica").fontSize(10).fillColor("#555555");
  if (client.address) { doc.text(client.address, MARGIN, y, { width: CONTENT_WIDTH * 0.5 }); y += 14; }
  if (client.email) { doc.text(client.email, MARGIN, y); y += 14; }
  if (client.ein) { doc.text("EIN: " + client.ein, MARGIN, y); y += 14; }
  y += 8;

  doc.font("Helvetica").fontSize(10).text("Invoice Number: " + data.invoiceNumber, MARGIN + CONTENT_WIDTH * 0.5 + 24, MARGIN, { align: "right", width: CONTENT_WIDTH * 0.5 - 24 });
  doc.text("Invoice Date: " + formatDate(data.invoiceDate), MARGIN + CONTENT_WIDTH * 0.5 + 24, MARGIN + 14, { align: "right", width: CONTENT_WIDTH * 0.5 - 24 });
  doc.text("Due Date: " + formatDate(data.dueDate), MARGIN + CONTENT_WIDTH * 0.5 + 24, MARGIN + 28, { align: "right", width: CONTENT_WIDTH * 0.5 - 24 });
  doc.text("Place of Supply: Outside India", MARGIN + CONTENT_WIDTH * 0.5 + 24, MARGIN + 42, { align: "right", width: CONTENT_WIDTH * 0.5 - 24 });
  doc.text("Currency: " + data.currency, MARGIN + CONTENT_WIDTH * 0.5 + 24, MARGIN + 56, { align: "right", width: CONTENT_WIDTH * 0.5 - 24 });

  y += 12;
  const colWidths = [CONTENT_WIDTH * 0.55, CONTENT_WIDTH * 0.2, CONTENT_WIDTH * 0.25];
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 18).fillAndStroke("#f5f5f5", "#dddddd");
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333");
  doc.text("Project", MARGIN, y, { width: colWidths[0] });
  doc.text("SQFT", MARGIN + colWidths[0], y, { width: colWidths[1], align: "right" });
  doc.text("Amount", MARGIN + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: "right" });
  y += 20;

  doc.font("Helvetica").fontSize(10).fillColor("#333333");
  for (const row of data.items) {
    const desc = row.description.slice(0, 80);
    doc.text(desc, MARGIN, y, { width: colWidths[0] });
    doc.text(fmtNum(row.quantity), MARGIN + colWidths[0], y, { width: colWidths[1], align: "right" });
    doc.text(symbol + " " + fmtNum(row.amount), MARGIN + colWidths[0] + colWidths[1], y, { width: colWidths[2], align: "right" });
    y += 16;
  }

  y += 12;
  const boxWidth = 180;
  const boxX = MARGIN + CONTENT_WIDTH - boxWidth;
  doc.text("Subtotal", boxX, y, { width: boxWidth - 80 });
  doc.text(symbol + " " + fmtNum(data.subtotal), boxX + boxWidth - 80, y, { width: 80, align: "right" });
  y += 14;
  doc.text("GST", boxX, y, { width: boxWidth - 80 });
  doc.text("NIL (Export)", boxX + boxWidth - 80, y, { width: 80, align: "right" });
  y += 18;
  doc.moveTo(boxX, y).lineTo(boxX + boxWidth, y).strokeColor("#999999").stroke();
  y += 10;
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Grand Total", boxX, y, { width: boxWidth - 80 });
  doc.text(symbol + " " + fmtNum(data.subtotal), boxX + boxWidth - 80, y, { width: 80, align: "right" });
  y += 24;

  doc.font("Helvetica").fontSize(9).fillColor("#555555").text("Services exported from India. Supply covered under zero-rated export of services.", MARGIN, y);
  y += 14;
  if (company.bankName) {
    doc.text("Bank: " + company.bankName + (company.swiftCode ? " | SWIFT: " + company.swiftCode : ""), MARGIN, y);
    y += 14;
  }

  doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_WIDTH, y).strokeColor("#e0e0e0").stroke();
  y += 14;
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#333333").text("For " + company.name, MARGIN + CONTENT_WIDTH * 0.55 + 24, y);
  doc.moveTo(MARGIN + CONTENT_WIDTH * 0.55 + 24, y + 20).lineTo(MARGIN + CONTENT_WIDTH * 0.55 + 124, y + 20).strokeColor("#999999").stroke();
  doc.font("Helvetica").fontSize(9).fillColor("#666666").text("Authorized Signature", MARGIN + CONTENT_WIDTH * 0.55 + 24, y + 26);

  doc.end();
  return bufferPromise;
}
