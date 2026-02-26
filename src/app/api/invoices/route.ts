import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().default("pcs"),
  rate: z.number().nonnegative(),
  amount: z.number().nonnegative().optional(), // For export: direct amount (Project, SQFT, Amount)
  hsnCode: z.string().optional(),
  batchNo: z.string().optional(),
  mfgDate: z.string().optional().nullable(),
  expDate: z.string().optional().nullable(),
});

const invoiceSchema = z.object({
  clientId: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  type: z.enum(["domestic", "export"]),
  status: z.enum(["draft", "sent", "paid"]).default("draft"),
  currency: z.enum(["INR", "USD"]).default("INR"),
  invoiceDate: z.string(),
  dueDate: z.string().optional().nullable(),
  placeOfSupply: z.string().optional().nullable(),
  poNumber: z.string().optional().nullable(),
  lrNumber: z.string().optional().nullable(),
  transport: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  gstRate: z.number().optional().nullable(),
  cgstRate: z.number().optional().nullable(),
  sgstRate: z.number().optional().nullable(),
  exportSubtotalInr: z.number().optional().nullable(),
  irn: z.string().optional().nullable(),
  irnQrCodeDataUrl: z.string().optional().nullable(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientAddress: z.string().optional(),
  clientCity: z.string().optional(),
  clientGstin: z.string().optional(),
  clientState: z.string().optional(),
  clientPincode: z.string().optional(),
  clientCountry: z.string().optional(),
  clientEin: z.string().optional(),
  clientDrugLicense: z.string().optional(),
  clientOtherLicense: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const trash = searchParams.get("trash") === "true";

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: session.user.id,
      ...(trash ? { deletedAt: { not: null } } : { deletedAt: null }),
      ...(q && !trash && {
        OR: [
          { invoiceNumber: { contains: q } },
          { client: { name: { contains: q } } },
        ],
      }),
    },
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = invoiceSchema.parse(body);

    const company = await prisma.company.findUnique({
      where: { userId: session.user.id },
    });
  const count = await prisma.invoice.count({
    where: { userId: session.user.id, deletedAt: null },
  });

    let invoiceNumber: string;
    const customNumber = (data.invoiceNumber ?? "").trim();
    if (customNumber) {
      const existing = await prisma.invoice.findFirst({
        where: {
          userId: session.user.id,
          invoiceNumber: customNumber,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Invoice number "${customNumber}" already exists` },
          { status: 400 }
        );
      }
      invoiceNumber = customNumber;
    } else {
      const prefix = (company?.invoiceNumberPrefix ?? "").trim();
      const serialLen = company?.invoiceNumberSerialLength ?? 3;
      if (prefix) {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const fyEnd = month >= 3 ? year + 1 : year;
        const fyStart = fyEnd - 1;
        const fy = `${String(fyStart).slice(-2)}/${String(fyEnd).slice(-2)}`;
        const serial = String(count + 1).padStart(serialLen, "0");
        invoiceNumber = `${prefix}${serial}/${fy}`;
      } else {
        const year = new Date().getFullYear();
        invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
      }
    }

    let clientId = data.clientId;
    if (!clientId && data.clientName) {
      const client = await prisma.client.create({
        data: {
          userId: session.user.id,
          name: data.clientName,
          email: data.clientEmail ?? undefined,
          address: data.clientAddress ?? undefined,
          city: data.clientCity ?? undefined,
          gstin: data.clientGstin ?? undefined,
          state: data.clientState ?? undefined,
          pincode: data.clientPincode ?? undefined,
          country: data.clientCountry ?? undefined,
          ein: data.clientEin ?? undefined,
          drugLicense: data.clientDrugLicense ?? undefined,
          otherLicense: data.clientOtherLicense ?? undefined,
        },
      });
      clientId = client.id;
    }

    const items = data.items.map((item) => {
      const amount = data.type === "export" && typeof item.amount === "number"
        ? item.amount
        : item.quantity * item.rate;
      return {
        description: item.description,
        quantity: item.quantity,
        unit: data.type === "domestic" ? "Kg" : (item.unit || "pcs"),
        rate: item.rate,
        amount,
        hsnCode: item.hsnCode ?? null,
        batchNo: item.batchNo ?? null,
        mfgDate: item.mfgDate ? new Date(item.mfgDate) : null,
        expDate: item.expDate ? new Date(item.expDate) : null,
      };
    });

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        clientId: clientId ?? undefined,
        invoiceNumber,
        type: data.type,
        status: data.status,
        currency: data.currency,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        placeOfSupply: data.placeOfSupply ?? null,
        poNumber: data.poNumber ?? null,
        lrNumber: data.lrNumber ?? null,
        transport: data.transport ?? null,
        paymentTerms: data.paymentTerms ?? null,
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        termsAndConditions: data.termsAndConditions ?? null,
        gstRate: data.gstRate ?? null,
        cgstRate: data.cgstRate ?? null,
        sgstRate: data.sgstRate ?? null,
        exportSubtotalInr: data.exportSubtotalInr ?? null,
        irn: data.irn?.trim() || null,
        irnQrCodeDataUrl: data.irnQrCodeDataUrl || (data.irn?.trim() ? await QRCode.toDataURL(data.irn.trim(), { width: 120, margin: 2 }) : null),
        items: {
          create: items,
        },
      },
      include: { client: true, items: true },
    });

    return NextResponse.json(invoice);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues[0];
      const message = firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Invoice create error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
