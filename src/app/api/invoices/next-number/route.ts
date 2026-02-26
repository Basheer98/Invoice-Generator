import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });
  const count = await prisma.invoice.count({
    where: { userId: session.user.id },
  });

  const prefix = (company?.invoiceNumberPrefix ?? "").trim();
  const serialLen = company?.invoiceNumberSerialLength ?? 3;
  let suggested: string;
  if (prefix) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const fyEnd = month >= 3 ? year + 1 : year;
    const fyStart = fyEnd - 1;
    const fy = `${String(fyStart).slice(-2)}/${String(fyEnd).slice(-2)}`;
    const serial = String(count + 1).padStart(serialLen, "0");
    suggested = `${prefix}${serial}/${fy}`;
  } else {
    const year = new Date().getFullYear();
    suggested = `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  return NextResponse.json({ suggested });
}
