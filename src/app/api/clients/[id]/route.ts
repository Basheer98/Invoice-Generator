import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  country: z.string().optional(),
  gstin: z.string().optional(),
  drugLicense: z.string().optional(),
  otherLicense: z.string().optional(),
  ein: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateClientSchema.parse(body);

    const existing = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        address: data.address ?? undefined,
        city: data.city ?? undefined,
        state: data.state ?? undefined,
         pincode: data.pincode ?? undefined,
        country: data.country ?? undefined,
        gstin: data.gstin ?? undefined,
        drugLicense: data.drugLicense ?? undefined,
        otherLicense: data.otherLicense ?? undefined,
        ein: data.ein ?? undefined,
      },
    });

    return NextResponse.json(client);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Client update error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.client.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Client delete error:", err);
    return NextResponse.json(
      { error: "Unable to delete client. It may be used in existing invoices." },
      { status: 400 }
    );
  }
}

