import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDomesticInvoiceHtml, buildExportInvoiceHtml } from "@/lib/invoice-html";
import puppeteer from "puppeteer";

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

async function generateDomesticPDF(invoice: Parameters<typeof buildDomesticInvoiceHtml>[0], company: Parameters<typeof buildDomesticInvoiceHtml>[1]) {
  const html = buildDomesticInvoiceHtml(invoice, company);
  const pdfBuffer = await htmlToPdf(html);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}

async function generateExportPDF(
  invoice: Parameters<typeof buildExportInvoiceHtml>[0] & { invoiceNumber: string },
  company: Parameters<typeof buildExportInvoiceHtml>[1]
) {
  const html = buildExportInvoiceHtml(invoice, company);

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
