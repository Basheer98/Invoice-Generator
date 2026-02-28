import { readFileSync } from "fs";
import { join } from "path";
import { renderDomesticInvoice, renderExportInvoice } from "./invoice-template";
import { amountInWords } from "./amount-in-words";

function getLogoDataUrl(): string | null {
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    const buffer = readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export function buildDomesticInvoiceHtml(
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date | null;
    placeOfSupply: string | null;
    poNumber: string | null;
    lrNumber: string | null;
    transport: string | null;
    paymentTerms: string | null;
    termsAndConditions: string | null;
    currency: string;
    gstRate?: number | null;
    cgstRate?: number | null;
    sgstRate?: number | null;
    irn?: string | null;
    irnQrCodeDataUrl?: string | null;
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
): string {
  const invoiceGstRate = invoice.gstRate ?? 18;
  const invoiceCgstRate = invoice.cgstRate;
  const invoiceSgstRate = invoice.sgstRate;
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

  return renderDomesticInvoice({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
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
    irn: invoice.irn ?? null,
    irnQrCodeDataUrl: invoice.irnQrCodeDataUrl ?? null,
  });
}

export function buildExportInvoiceHtml(
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date | null;
    currency: string;
    notes: string | null;
    exportSubtotalInr?: number | null;
    items: Array<{ description: string; quantity: number; amount: number }>;
    client: {
      name: string;
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      pincode?: string | null;
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
    bankName?: string | null;
    bankAccount?: string | null;
    bankIfsc?: string | null;
    swiftCode?: string | null;
    lutReference?: string | null;
    signatureDataUrl?: string | null;
    authorizedSignatory?: string | null;
  } | null
): string {
  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0);
  const subtotalInr = invoice.exportSubtotalInr ?? subtotal;

  return renderExportInvoice({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    notes: invoice.notes,
    items: invoice.items,
    company: company
      ? {
          ...company,
          bankName: company.bankName ?? null,
          swiftCode: company.swiftCode ?? null,
          accountName: company.name ?? null,
          accountNumber: company.bankAccount ?? null,
          ifscCode: company.bankIfsc ?? null,
          lutReference: company.lutReference ?? null,
          signatureDataUrl: company.signatureDataUrl ?? null,
          authorizedSignatory: company.authorizedSignatory ?? null,
        }
      : null,
    client: invoice.client
      ? {
          ...invoice.client,
          pincode: invoice.client.pincode ?? null,
        }
      : null,
    subtotal,
    subtotalInr,
    amountInWordsInr: amountInWords(subtotalInr),
    logoDataUrl: getLogoDataUrl(),
  });
}
