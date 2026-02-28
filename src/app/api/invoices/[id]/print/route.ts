import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDomesticInvoiceHtml, buildExportInvoiceHtml } from "@/lib/invoice-html";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const PRINT_BAR = (invoiceNumber: string) => `
<div class="print-bar" style="position:fixed;top:0;left:0;right:0;background:#1a1a1a;color:white;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;z-index:9999;font-family:system-ui,sans-serif;">
  <span style="font-weight:600;">Invoice ${escapeHtml(invoiceNumber)}</span>
  <button onclick="window.print()" style="background:white;color:#1a1a1a;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;">Print</button>
</div>
<div style="height:52px;"></div>
`;

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
  let html: string;

  if (invoice.type === "domestic") {
    html = buildDomesticInvoiceHtml(invoice, company);
  } else {
    html = buildExportInvoiceHtml(
      {
        ...invoice,
        dueDate: invoice.dueDate ?? null,
        client: invoice.client
          ? {
              ...invoice.client,
              country: invoice.client.country ?? null,
            }
          : null,
      },
      company
    );
  }

  const printBar = PRINT_BAR(invoice.invoiceNumber);
  const htmlWithPrintBar = html.replace(
    "<body>",
    `<body>${printBar}`
  );

  return new NextResponse(htmlWithPrintBar, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
