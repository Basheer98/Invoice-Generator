import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatDateDDMMYYYY } from "@/lib/format-date";
import { ArrowLeft } from "lucide-react";
import { DownloadButton } from "@/components/download-button";
import { PrintButton } from "@/components/print-button";
import { amountInWords } from "@/lib/amount-in-words";
import { formatAmount } from "@/lib/format-amount";
import { buildCompanyAddr } from "@/lib/format-address";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { client: true, items: true, user: { include: { company: true } } },
  });

  if (!invoice) notFound();

  const subtotal = invoice.items.reduce((s, i) => s + i.amount, 0);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  const invoiceGstRate = invoice.gstRate ?? 18;
  const invoiceCgstRate = (invoice as { cgstRate?: number | null }).cgstRate;
  const invoiceSgstRate = (invoice as { sgstRate?: number | null }).sgstRate;
  const useExplicitCgstSgst =
    invoiceCgstRate != null &&
    invoiceSgstRate != null &&
    Number.isFinite(invoiceCgstRate) &&
    Number.isFinite(invoiceSgstRate);
  let taxAmount = 0;
  const effectiveCgstRate = useExplicitCgstSgst ? invoiceCgstRate! : invoiceGstRate / 2;
  const effectiveSgstRate = useExplicitCgstSgst ? invoiceSgstRate! : invoiceGstRate / 2;

  if (invoice.type === "domestic") {
    const companyState = invoice.user.company?.state;
    const isInterState =
      invoice.placeOfSupply &&
      companyState &&
      invoice.placeOfSupply.toLowerCase() !== companyState.toLowerCase();
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
  }

  const total = subtotal + taxAmount;

  const company = invoice.user.company;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PrintButton invoiceId={invoice.id} />
          <DownloadButton invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {invoice.type === "export"
                ? "INVOICE FOR EXPORT OF SERVICES"
                : "TAX INVOICE"}
            </h1>
            <p className="mt-1 text-stone-600">{invoice.invoiceNumber}</p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              invoice.status === "paid"
                ? "bg-green-100 text-green-800"
                : invoice.status === "sent"
                ? "bg-amber-100 text-amber-800"
                : "bg-stone-100 text-stone-800"
            }`}
          >
            {invoice.status}
          </span>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-500">From</h3>
            {company ? (
              <div className="mt-2">
                <p className="font-medium text-stone-900">{company.name}</p>
                {(() => {
                  const addr = buildCompanyAddr(company);
                  return addr ? <p className="text-stone-600">{addr}</p> : null;
                })()}
                {company.gstin && (
                  <p className="text-stone-600">GSTIN: {company.gstin}</p>
                )}
                {invoice.type === "export" && company.lutReference && (
                  <p className="text-stone-600">LUT Reference: {company.lutReference}</p>
                )}
                {invoice.type === "domestic" && company.fssaiLicense && (
                  <p className="text-stone-600">FSSAI Lic. No.: {company.fssaiLicense}</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-stone-500">
                Set company details in{" "}
                <Link href="/settings" className="text-amber-600 hover:underline">
                  Settings
                </Link>
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-500">Bill To</h3>
            {invoice.client ? (
              <div className="mt-2 space-y-0.5">
                <p className="font-medium text-stone-900">{invoice.client.name}</p>
                {(invoice.client.address || invoice.client.city || invoice.client.state || invoice.client.pincode) && (
                  <p className="text-stone-900">
                    {[invoice.client.address, invoice.client.city, invoice.client.state, invoice.client.pincode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {invoice.client.email && (
                  <p className="text-stone-900">{invoice.client.email}</p>
                )}
                {invoice.client.phone && (
                  <p className="text-stone-900">{invoice.client.phone}</p>
                )}
                {invoice.type === "domestic" && invoice.client.gstin && (
                  <p className="text-stone-900">GST/UIN: {invoice.client.gstin}</p>
                )}
                {invoice.type === "domestic" && invoice.client.drugLicense && (
                  <p className="text-stone-900">Drug Lic. No.: {invoice.client.drugLicense}</p>
                )}
                {invoice.type === "domestic" && invoice.client.otherLicense && (
                  <p className="text-stone-900">Other Lic. No.: {invoice.client.otherLicense}</p>
                )}
                {invoice.type === "export" && invoice.client.ein && (
                  <p className="text-stone-900">EIN: {invoice.client.ein}</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-stone-500">No client</p>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-stone-600">Invoice Date</p>
            <p className="font-medium text-stone-900">{formatDateDDMMYYYY(invoice.invoiceDate)}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-sm text-stone-600">Due Date</p>
              <p className="font-medium text-stone-900">{formatDateDDMMYYYY(invoice.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-stone-600">Place of Supply</p>
            <p className="font-medium text-stone-900">
              {invoice.placeOfSupply ?? (invoice.type === "export" ? "Outside India" : "—")}
            </p>
          </div>
          <div>
            <p className="text-sm text-stone-600">Currency</p>
            <p className="font-medium text-stone-900">{invoice.currency}</p>
          </div>
          {invoice.type === "domestic" && (
            <>
              {invoice.poNumber && (
                <div>
                  <p className="text-sm text-stone-600">PO No.</p>
                  <p className="font-medium text-stone-900">{invoice.poNumber}</p>
                </div>
              )}
              {invoice.lrNumber && (
                <div>
                  <p className="text-sm text-stone-600">L.R. No.</p>
                  <p className="font-medium text-stone-900">{invoice.lrNumber}</p>
                </div>
              )}
              {invoice.transport && (
                <div>
                  <p className="text-sm text-stone-600">Transport</p>
                  <p className="font-medium text-stone-900">{invoice.transport}</p>
                </div>
              )}
              {invoice.paymentTerms && (
                <div>
                  <p className="text-sm text-stone-600">Payment Terms</p>
                  <p className="font-medium text-stone-900">{invoice.paymentTerms}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-8 overflow-x-auto rounded-lg border border-stone-200">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-stone-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">S. No.</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">
                  {invoice.type === "export" ? "Project" : "Description"}
                </th>
                {invoice.type === "domestic" ? (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">HSN</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Batch No.</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">QTY</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Mfg date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Exp date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">Amount</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">SQFT</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-stone-600">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-t border-stone-200">
                  <td className="px-4 py-3 text-center text-stone-600">{i + 1}</td>
                  <td className="px-4 py-3 text-stone-900">{item.description}</td>
                  {invoice.type === "domestic" ? (
                    <>
                      <td className="px-4 py-3 text-stone-600">{item.hsnCode ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{item.batchNo ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {parseFloat(Number(item.quantity).toFixed(4))} KG
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {item.mfgDate ? format(new Date(item.mfgDate), "MMM yy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {item.expDate ? format(new Date(item.expDate), "MMM yy") : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-600">
                        {formatAmount(item.rate, invoice.currency as "INR" | "USD")}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-stone-900">
                        {formatAmount(item.amount, invoice.currency as "INR" | "USD")}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-stone-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-stone-900">
                        {formatAmount(item.amount, invoice.currency as "INR" | "USD")}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
          {invoice.type === "domestic" && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-stone-500">Grand Total in Words</p>
              <p className="font-medium text-stone-900">{amountInWords(total)}</p>
            </div>
          )}
          <div className={`space-y-2 text-right ${invoice.type === "domestic" ? "sm:ml-auto" : "sm:ml-auto"}`}>
            <div className="flex justify-between gap-8">
              <span className="text-stone-700">Subtotal</span>
              <span className="text-stone-900 font-medium">
                {formatAmount(subtotal, invoice.currency as "INR" | "USD")}
              </span>
            </div>
            {invoice.type === "domestic" && (cgst > 0 || sgst > 0) && (
              <>
                <div className="flex justify-between gap-8">
                  <span className="text-stone-700">CGST @ {effectiveCgstRate}%</span>
                  <span className="text-stone-900 font-medium">{formatAmount(cgst, "INR")}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-stone-700">SGST @ {effectiveSgstRate}%</span>
                  <span className="text-stone-900 font-medium">{formatAmount(sgst, "INR")}</span>
                </div>
              </>
            )}
            {invoice.type === "domestic" && igst > 0 && (
              <div className="flex justify-between gap-8">
                <span className="text-stone-700">IGST @ {invoiceGstRate}%</span>
                <span className="text-stone-900 font-medium">{formatAmount(igst, "INR")}</span>
              </div>
            )}
            {invoice.type === "export" && (
              <div className="flex justify-between gap-8 text-sm text-stone-500">
                <span>GST</span>
                <span>NIL (Export of Services)</span>
              </div>
            )}
            <div className="flex justify-between gap-8 border-t border-stone-200 pt-2 text-lg font-bold text-stone-900">
              <span>Grand Total</span>
              <span>
                {formatAmount(total, invoice.currency as "INR" | "USD")}
              </span>
            </div>
          </div>
        </div>

        {invoice.type === "domestic" && (
          <div className="mt-8 grid grid-cols-1 border border-stone-200 rounded-lg overflow-hidden sm:grid-cols-[1fr_220px] sm:items-start">
            <div className="border-b border-stone-200 bg-stone-50/50 p-4 sm:border-b-0 sm:border-r">
              <p className="mb-2 text-sm font-semibold text-stone-700">Terms & Conditions</p>
              <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans">
                {invoice.termsAndConditions || company?.defaultTermsAndConditions || "—"}
              </pre>
            </div>
            <div className="flex items-start justify-center p-4">
              <div className="text-center">
                <p className="font-semibold text-stone-900">{company?.name ?? "Company"}</p>
                <p className="mt-2 text-sm text-stone-600">Authorized Signature</p>
                <div className="mx-auto mt-2 h-0.5 w-40 border-b border-stone-400" />
              </div>
            </div>
          </div>
        )}

        {invoice.type === "export" && (
          <>
            {invoice.notes && (
              <div className="mt-8 rounded-lg border border-stone-200 bg-stone-50/50 p-4">
                <p className="mb-2 text-sm font-semibold text-stone-700">Description</p>
                <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans">
                  {invoice.notes}
                </pre>
              </div>
            )}
            <p className="mt-8 text-sm text-stone-600">
              Declaration: Services exported from India. Supply covered under
              zero-rated export of services.
            </p>
            <div className="mt-8 flex justify-end">
              <div className="text-right">
                <p className="font-semibold text-stone-900">{company?.name ?? "Company"}</p>
                <p className="mt-1 text-sm text-stone-600">Authorized Signature</p>
                <div className="mt-2 h-0.5 w-44 border-b border-stone-400" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
