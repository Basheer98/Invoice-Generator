import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
    name,
    address,
    city,
    state,
    pincode,
    gstin,
    lutReference,
    signatureDataUrl,
    authorizedSignatory,
    fssaiLicense,
    phone,
    email,
    bankName,
    bankAccount,
    bankIfsc,
    swiftCode,
    defaultTermsAndConditions,
    defaultGstRate,
    defaultCgstRate,
    defaultSgstRate,
    invoiceNumberPrefix,
    invoiceNumberSerialLength,
  } = body;

  const company = await prisma.company.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      name: name ?? "My Company",
      address: address ?? null,
      city: city ?? null,
      state: state ?? null,
      pincode: pincode ?? null,
      gstin: gstin ?? null,
      lutReference: lutReference ?? null,
      signatureDataUrl: signatureDataUrl !== undefined ? (signatureDataUrl || null) : undefined,
      authorizedSignatory: authorizedSignatory !== undefined ? (authorizedSignatory || null) : undefined,
      fssaiLicense: fssaiLicense ?? null,
      phone: phone ?? null,
      email: email ?? null,
      bankName: bankName ?? null,
      bankAccount: bankAccount ?? null,
      bankIfsc: bankIfsc ?? null,
      swiftCode: swiftCode ?? null,
      defaultTermsAndConditions: defaultTermsAndConditions ?? null,
      defaultGstRate: defaultGstRate != null ? Number(defaultGstRate) : null,
      defaultCgstRate: defaultCgstRate != null ? Number(defaultCgstRate) : null,
      defaultSgstRate: defaultSgstRate != null ? Number(defaultSgstRate) : null,
      invoiceNumberPrefix: invoiceNumberPrefix ?? null,
      invoiceNumberSerialLength: invoiceNumberSerialLength != null ? Number(invoiceNumberSerialLength) : null,
    },
    update: {
      name: name ?? undefined,
      address: address ?? undefined,
      city: city ?? undefined,
      state: state ?? undefined,
      pincode: pincode ?? undefined,
      gstin: gstin ?? undefined,
      lutReference: lutReference !== undefined ? (lutReference || null) : undefined,
      signatureDataUrl: signatureDataUrl !== undefined ? (signatureDataUrl || null) : undefined,
      authorizedSignatory: authorizedSignatory !== undefined ? (authorizedSignatory || null) : undefined,
      fssaiLicense: fssaiLicense ?? undefined,
      phone: phone ?? undefined,
      email: email ?? undefined,
      bankName: bankName ?? undefined,
      bankAccount: bankAccount ?? undefined,
      bankIfsc: bankIfsc ?? undefined,
      swiftCode: swiftCode ?? undefined,
      defaultTermsAndConditions: defaultTermsAndConditions ?? undefined,
      defaultGstRate: defaultGstRate != null ? Number(defaultGstRate) : undefined,
      defaultCgstRate: defaultCgstRate != null ? Number(defaultCgstRate) : undefined,
      defaultSgstRate: defaultSgstRate != null ? Number(defaultSgstRate) : undefined,
      invoiceNumberPrefix: invoiceNumberPrefix !== undefined ? (invoiceNumberPrefix || null) : undefined,
      invoiceNumberSerialLength: invoiceNumberSerialLength != null ? Number(invoiceNumberSerialLength) : undefined,
    },
  });

    return NextResponse.json(company);
  } catch (err) {
    console.error("Company update error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
