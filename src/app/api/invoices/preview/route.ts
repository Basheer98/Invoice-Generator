import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderDomesticInvoice, renderExportInvoice } from "@/lib/invoice-template";
import { amountInWords } from "@/lib/amount-in-words";
import { readFileSync } from "fs";
import { join } from "path";
import QRCode from "qrcode";

function getLogoDataUrl(): string | null {
  try {
    const logoPath = join(process.cwd(), "public", "logo.png");
    const buffer = readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      type,
      invoiceNumber,
      invoiceDate,
      dueDate,
      placeOfSupply,
      poNumber,
      lrNumber,
      transport,
      paymentTerms,
      termsAndConditions,
      gstRate = 18,
      cgstRate,
      sgstRate,
      items,
      clientName,
      clientAddress,
      clientCity,
      clientState,
      clientGstin,
      clientEmail,
      notes,
      exportFxRate,
      exportInrMode,
      exportSubtotalInrDirect,
      irn,
    } = body;

    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
    });
    if (!company) {
      return NextResponse.json({ html: "<p>Set company details in Settings.</p>" });
    }

    const logo = getLogoDataUrl();

    if (type === "domestic") {
      const validItems = (items || []).filter((i: { description?: string }) => i?.description?.trim());
      if (validItems.length === 0) {
        return NextResponse.json({ html: "<p>Add at least one line item.</p>" });
      }

      const invoiceGstRate = Number(gstRate) || 18;
      const invoiceCgstRate = cgstRate != null && cgstRate !== "" ? Number(cgstRate) : null;
      const invoiceSgstRate = sgstRate != null && sgstRate !== "" ? Number(sgstRate) : null;
      const useExplicitCgstSgst =
        invoiceCgstRate != null &&
        invoiceSgstRate != null &&
        Number.isFinite(invoiceCgstRate) &&
        Number.isFinite(invoiceSgstRate);
      const effectiveCgstRate = useExplicitCgstSgst ? invoiceCgstRate! : invoiceGstRate / 2;
      const effectiveSgstRate = useExplicitCgstSgst ? invoiceSgstRate! : invoiceGstRate / 2;

      const invoiceItems = validItems.map((i: { description: string; quantity: number; unit: string; rate: number; hsnCode?: string; batchNo?: string; mfgDate?: string; expDate?: string }) => ({
        description: i.description || "",
        quantity: Number(i.quantity) || 0,
        unit: i.unit || "pcs",
        rate: Number(i.rate) || 0,
        amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0),
        hsnCode: i.hsnCode || null,
        batchNo: i.batchNo || null,
        mfgDate: i.mfgDate || null,
        expDate: i.expDate || null,
      }));

      const subtotal = invoiceItems.reduce((s: number, i: { amount: number }) => s + i.amount, 0);
      const isInterState =
        placeOfSupply &&
        company?.state &&
        String(placeOfSupply).toLowerCase() !== String(company.state).toLowerCase();

      let cgst = 0,
        sgst = 0,
        igst = 0;
      if (isInterState) {
        igst = subtotal * (invoiceGstRate / 100);
      } else if (useExplicitCgstSgst) {
        cgst = invoiceItems.reduce((s: number, i: { amount: number }) => s + (i.amount * effectiveCgstRate) / 100, 0);
        sgst = invoiceItems.reduce((s: number, i: { amount: number }) => s + (i.amount * effectiveSgstRate) / 100, 0);
      } else {
        cgst = subtotal * (invoiceGstRate / 200);
        sgst = subtotal * (invoiceGstRate / 200);
      }
      const grandTotal = subtotal + cgst + sgst + igst;

      const html = renderDomesticInvoice({
        invoiceNumber: invoiceNumber || "—",
        invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
        dueDate: dueDate || null,
        paymentTerms: paymentTerms || null,
        termsAndConditions: termsAndConditions || company.defaultTermsAndConditions || "—",
        placeOfSupply: placeOfSupply || null,
        poNumber: poNumber || null,
        lrNumber: lrNumber || null,
        transport: transport || null,
        currency: "INR",
        items: invoiceItems,
        company: {
          ...company,
          fssaiLicense: company.fssaiLicense ?? null,
          defaultTermsAndConditions: company.defaultTermsAndConditions ?? null,
          signatureDataUrl: (company as { signatureDataUrl?: string | null }).signatureDataUrl ?? null,
          authorizedSignatory: (company as { authorizedSignatory?: string | null }).authorizedSignatory ?? null,
        },
        client: {
          name: clientName || "—",
          address: clientAddress || null,
          city: clientCity || null,
          state: clientState || null,
          phone: null,
          email: clientEmail || null,
          gstin: clientGstin || null,
          drugLicense: null,
          otherLicense: null,
        },
        subtotal,
        cgst,
        sgst,
        igst,
        grandTotal,
        defaultGstRate: invoiceGstRate,
        cgstRate: effectiveCgstRate,
        sgstRate: effectiveSgstRate,
        amountInWords: amountInWords(grandTotal),
        logoDataUrl: logo,
        irn: irn?.trim() || null,
        irnQrCodeDataUrl: irn?.trim()
          ? await QRCode.toDataURL(irn.trim(), { width: 80, margin: 2 })
          : null,
      });

      return NextResponse.json({ html });
    }

    if (type === "export") {
      const validItems = (items || []).filter((i: { description?: string }) => i?.description?.trim());
      if (validItems.length === 0) {
        return NextResponse.json({ html: "<p>Add at least one line item.</p>" });
      }

      const invoiceItems = validItems.map((i: { description: string; quantity: number; amount?: number; rate?: number }) => {
        const amt = typeof i.amount === "number" ? i.amount : (Number(i.quantity) || 0) * (Number(i.rate) || 0);
        return {
          description: i.description || "",
          quantity: Number(i.quantity) || 0,
          amount: amt,
        };
      });
      const subtotal = invoiceItems.reduce((s: number, i: { amount: number }) => s + i.amount, 0);
      const subtotalInr =
        exportInrMode === "direct" && exportSubtotalInrDirect?.trim()
          ? Number(exportSubtotalInrDirect)
          : exportFxRate
            ? subtotal * Number(exportFxRate)
            : subtotal;

      const html = renderExportInvoice({
        invoiceNumber: invoiceNumber || "—",
        invoiceDate: invoiceDate || new Date().toISOString().slice(0, 10),
        dueDate: dueDate || null,
        currency: "USD",
        notes: notes || null,
        items: invoiceItems,
        company: {
          ...company,
          bankName: company.bankName ?? null,
          swiftCode: company.swiftCode ?? null,
          accountName: company.name,
          accountNumber: company.bankAccount ?? null,
          ifscCode: company.bankIfsc ?? null,
          signatureDataUrl: (company as { signatureDataUrl?: string | null }).signatureDataUrl ?? null,
          authorizedSignatory: (company as { authorizedSignatory?: string | null }).authorizedSignatory ?? null,
        },
        client: {
          name: clientName || "—",
          address: clientAddress || null,
          city: body.clientCity || null,
          state: body.clientState || null,
          pincode: body.clientPincode || null,
          country: body.clientCountry || "USA",
          email: clientEmail || null,
          ein: body.clientEin || null,
        },
        subtotal,
        subtotalInr,
        amountInWordsInr: amountInWords(subtotalInr),
        logoDataUrl: logo,
      });

      return NextResponse.json({ html });
    }

    return NextResponse.json({ html: "<p>Select invoice type.</p>" });
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json({ html: "<p>Preview error.</p>" }, { status: 500 });
  }
}
