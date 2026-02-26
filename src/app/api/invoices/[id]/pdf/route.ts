import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderDomesticInvoice, renderExportInvoice } from "@/lib/invoice-template";
import { amountInWords } from "@/lib/amount-in-words";
import { readFileSync } from "fs";
import { join } from "path";
import puppeteer from "puppeteer";

function getLogoDataUrl(): string | null {
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    const buffer = readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: { client: true, items: true, user: { include: { company: true } } },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const company = invoice.user.company;

  if (invoice.type === "domestic") {
    return generateDomesticPDF(invoice, company);
  }

  return generateExportPDF(invoice, company);
}

async function htmlToPdf(
  html: string,
  options?: {
    footerTemplate?: string;
  }
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 10000,
    });

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: !!options?.footerTemplate,
      headerTemplate: options?.footerTemplate ? "<span></span>" : undefined,
      footerTemplate: options?.footerTemplate ?? "<span></span>",
      margin: options?.footerTemplate
        ? { top: "15mm", right: "15mm", bottom: "22mm", left: "15mm" }
        : undefined,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

async function generateDomesticPDF(
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    placeOfSupply: string | null;
    poNumber: string | null;
    lrNumber: string | null;
    transport: string | null;
    paymentTerms: string | null;
    termsAndConditions: string | null;
    currency: string;
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      rate: number;
      amount: number;
      hsnCode: string | null;
      batchNo: string | null;
      mfgDate: Date | null;
      expDate: Date | null;
    }>;
    client: {
      name: string;
      address: string | null;
      city: string | null;
      state: string | null;
      phone: string | null;
      email: string | null;
      gstin: string | null;
      drugLicense: string | null;
      otherLicense: string | null;
    } | null;
  },
  company: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    gstin: string | null;
    fssaiLicense: string | null;
    phone: string | null;
    email: string | null;
    defaultTermsAndConditions: string | null;
  } | null
) {
  const invoiceGstRate = (invoice as { gstRate?: number | null }).gstRate ?? 18;
  const invoiceCgstRate = (invoice as { cgstRate?: number | null }).cgstRate;
  const invoiceSgstRate = (invoice as { sgstRate?: number | null }).sgstRate;
  const useExplicitCgstSgst =
    invoiceCgstRate != null &&
    invoiceSgstRate != null &&
    Number.isFinite(invoiceCgstRate) &&
    Number.isFinite(invoiceSgstRate);
  const effectiveCgstRate = useExplicitCgstSgst ? invoiceCgstRate! : invoiceGstRate / 2;
  const effectiveSgstRate = useExplicitCgstSgst ? invoiceSgstRate! : invoiceGstRate / 2;

  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0);

  const isInterState =
    invoice.placeOfSupply &&
    company?.state &&
    invoice.placeOfSupply.toLowerCase() !== company.state.toLowerCase();

  let cgst = 0,
    sgst = 0,
    igst = 0;
  let taxAmount = 0;

  if (isInterState) {
    taxAmount = invoice.items.reduce(
      (s, i) => s + (i.amount * invoiceGstRate) / 100,
      0
    );
    igst = taxAmount;
  } else if (useExplicitCgstSgst) {
    taxAmount = invoice.items.reduce(
      (s, i) =>
        s + (i.amount * (effectiveCgstRate + effectiveSgstRate)) / 100,
      0
    );
    cgst = invoice.items.reduce(
      (s, i) => s + (i.amount * effectiveCgstRate) / 100,
      0
    );
    sgst = invoice.items.reduce(
      (s, i) => s + (i.amount * effectiveSgstRate) / 100,
      0
    );
  } else {
    taxAmount = invoice.items.reduce(
      (s, i) => s + (i.amount * invoiceGstRate) / 100,
      0
    );
    cgst = taxAmount / 2;
    sgst = taxAmount / 2;
  }

  const grandTotal = subtotal + taxAmount;

  const html = renderDomesticInvoice({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: (invoice as { dueDate?: Date | null }).dueDate ?? null,
    paymentTerms: invoice.paymentTerms,
    termsAndConditions: invoice.termsAndConditions,
    placeOfSupply: invoice.placeOfSupply,
    poNumber: invoice.poNumber,
    lrNumber: invoice.lrNumber,
    transport: invoice.transport,
    currency: invoice.currency,
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unit: i.unit,
      rate: i.rate,
      amount: i.amount,
      hsnCode: i.hsnCode,
      batchNo: i.batchNo,
      mfgDate: i.mfgDate,
      expDate: i.expDate,
    })),
    company: company
      ? {
          ...company,
          fssaiLicense: company.fssaiLicense ?? null,
          defaultTermsAndConditions: company.defaultTermsAndConditions ?? null,
        }
      : null,
    client: invoice.client,
    subtotal,
    cgst,
    sgst,
    igst,
    grandTotal,
    defaultGstRate: invoiceGstRate,
    cgstRate: effectiveCgstRate,
    sgstRate: effectiveSgstRate,
    amountInWords: amountInWords(grandTotal),
    logoDataUrl: getLogoDataUrl(),
    irn: (invoice as { irn?: string | null }).irn ?? null,
    irnQrCodeDataUrl: (invoice as { irnQrCodeDataUrl?: string | null }).irnQrCodeDataUrl ?? null,
  });

  const pdfBuffer = await htmlToPdf(html);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}

async function generateExportPDF(
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    currency: string;
    notes: string | null;
    items: Array<{ description: string; quantity: number; amount: number }>;
    client: {
      name: string;
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      email: string | null;
      ein: string | null;
    } | null;
  },
  company: {
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    gstin: string | null;
  } | null
) {
  const comp = company as {
    bankName?: string | null;
    bankAccount?: string | null;
    bankIfsc?: string | null;
    swiftCode?: string | null;
  } | null;
  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0);
  const subtotalInr = (invoice as { exportSubtotalInr?: number | null }).exportSubtotalInr ?? subtotal;

  const html = renderExportInvoice({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: (invoice as { dueDate?: Date | null }).dueDate ?? null,
    currency: invoice.currency,
    notes: invoice.notes,
    items: invoice.items,
    company: company
      ? {
          ...company,
          bankName: comp?.bankName ?? null,
          swiftCode: comp?.swiftCode ?? null,
          accountName: company.name ?? null,
          accountNumber: comp?.bankAccount ?? null,
          ifscCode: comp?.bankIfsc ?? null,
          lutReference: (company as { lutReference?: string | null }).lutReference ?? null,
          signatureDataUrl: (company as { signatureDataUrl?: string | null }).signatureDataUrl ?? null,
          authorizedSignatory: (company as { authorizedSignatory?: string | null }).authorizedSignatory ?? null,
        }
      : null,
    client: invoice.client
      ? {
          ...invoice.client,
          pincode: (invoice.client as { pincode?: string | null }).pincode ?? null,
        }
      : null,
    subtotal,
    subtotalInr,
    amountInWordsInr: amountInWords(subtotalInr),
    logoDataUrl: getLogoDataUrl(),
  });

  const footerTemplate = `
    <div style="width:100%;font-size:9px;color:#888;text-align:center;font-family:Arial,sans-serif;padding:0 15mm;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      &nbsp;|&nbsp; Invoice #${invoice.invoiceNumber}
    </div>`;

  const pdfBuffer = await htmlToPdf(html, { footerTemplate });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
