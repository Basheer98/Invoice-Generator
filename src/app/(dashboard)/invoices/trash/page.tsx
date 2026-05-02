import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateDDMMYYYY } from "@/lib/format-date";
import { Trash2, ArrowLeft } from "lucide-react";
import { RestoreInvoiceButton } from "@/components/restore-invoice-button";

export default async function InvoicesTrashPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: session.user.id,
      deletedAt: { not: null },
    },
    include: { client: true, items: true },
    orderBy: { deletedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <Link
            href="/invoices"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 sm:w-auto sm:min-h-0 sm:justify-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Link>
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-stone-900 sm:text-2xl">
            <Trash2 className="h-7 w-7 text-stone-500" />
            Trash
          </h1>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-x-auto">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Trash2 className="h-12 w-12 text-stone-300" />
            <p className="mt-4 text-stone-600">No deleted invoices</p>
            <Link
              href="/invoices"
              className="mt-4 text-amber-600 font-medium hover:text-amber-700"
            >
              Back to Invoices
            </Link>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Invoice
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Client
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Status
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Amount
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const total = inv.items.reduce((s, i) => s + i.amount, 0);
                return (
                  <tr
                    key={inv.id}
                    className="border-b border-stone-100 hover:bg-stone-50/50"
                  >
                    <td className="px-3 py-3 text-sm font-medium text-stone-900 sm:px-6 sm:py-4 sm:text-base">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-3 py-3 text-sm text-stone-600 sm:px-6 sm:py-4 sm:text-base">
                      {inv.client?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-stone-600 sm:px-6 sm:py-4 sm:text-base">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          inv.type === "export"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-stone-100 text-stone-800"
                        }`}
                      >
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-stone-600 sm:px-6 sm:py-4 sm:text-base">
                      {formatDateDDMMYYYY(inv.invoiceDate)}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          inv.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : inv.status === "sent"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-100 text-stone-800"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-stone-900 sm:px-6 sm:py-4 sm:text-base">
                      {inv.currency === "USD" ? "$" : "₹"}
                      {total.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                      <RestoreInvoiceButton
                        invoiceId={inv.id}
                        invoiceNumber={inv.invoiceNumber}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
