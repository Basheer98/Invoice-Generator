import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateDDMMYYYY } from "@/lib/format-date";
import { FileText, Plus, Trash2 } from "lucide-react";
import { InvoiceSearch } from "@/components/invoice-search";
import { DeleteInvoiceButton } from "@/components/delete-invoice-button";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { q } = await searchParams;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
      ...(q && {
        OR: [
          { invoiceNumber: { contains: q } },
          { client: { name: { contains: q } } },
        ],
      }),
    },
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Invoices</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[200px] sm:flex-1">
            <InvoiceSearch initialQuery={q ?? ""} />
          </div>
          <Link
            href="/invoices/trash"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            <Trash2 className="h-4 w-4" />
            Trash
          </Link>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-x-auto">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <FileText className="h-12 w-12 text-stone-300" />
            <p className="mt-4 text-stone-600">
              {q ? "No invoices match your search" : "No invoices yet"}
            </p>
            {!q && (
              <Link
                href="/invoices/new"
                className="mt-4 text-amber-600 font-medium hover:text-amber-700"
              >
                Create your first invoice
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600">
                  Invoice
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-stone-600">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-stone-600">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-stone-600">
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
                    <td className="px-6 py-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium text-stone-900 hover:text-amber-600"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {inv.client?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-stone-600">
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
                    <td className="px-6 py-4 text-stone-600">
                      {formatDateDDMMYYYY(inv.invoiceDate)}
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right font-medium text-stone-900">
                      {inv.currency === "USD" ? "$" : "₹"}
                      {total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-sm font-medium text-amber-600 hover:text-amber-700"
                        >
                          View
                        </Link>
                        <DeleteInvoiceButton invoiceId={inv.id} invoiceNumber={inv.invoiceNumber} />
                      </div>
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
