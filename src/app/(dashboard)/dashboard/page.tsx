import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateDDMMYYYY } from "@/lib/format-date";
import { FileText, Plus, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const [recentInvoices, allInvoices, monthInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: session.user.id, deletedAt: null },
      include: { client: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { userId: session.user.id, deletedAt: null },
      include: { items: true },
    }),
    prisma.invoice.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
        invoiceDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      include: { items: true },
    }),
  ]);

  const totalInvoiced = allInvoices.reduce((sum, inv) => {
    const amt = inv.items.reduce((s, i) => s + i.amount, 0);
    return sum + amt;
  }, 0);

  const monthInvoiced = monthInvoices.reduce((sum, inv) => {
    const amt = inv.items.reduce((s, i) => s + i.amount, 0);
    return sum + amt;
  }, 0);

  const invoices = recentInvoices;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold leading-snug text-stone-900 sm:text-2xl">
          Welcome back{session.user.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-stone-600">
          Here&apos;s an overview of your invoices
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-stone-500">Total Invoiced</p>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            ₹{totalInvoiced.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-stone-500">This Month</p>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            ₹{monthInvoiced.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-stone-500">Recent Invoices</p>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            {invoices.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          Recent Invoices
        </h2>
        <Link
          href="/invoices/new"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 active:bg-amber-800 sm:w-auto sm:min-h-0 sm:py-2"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-x-auto">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <FileText className="h-12 w-12 text-stone-300" />
            <p className="mt-4 text-stone-600">No invoices yet</p>
            <Link
              href="/invoices/new"
              className="mt-4 inline-flex items-center gap-2 text-amber-600 font-medium hover:text-amber-700"
            >
              Create your first invoice
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50">
                <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Invoice
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-stone-600 sm:px-6 sm:py-4 sm:text-sm">
                  Client
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
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-sm font-medium text-stone-900 hover:text-amber-600 sm:text-base"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm text-stone-600 sm:px-6 sm:py-4 sm:text-base">
                      {inv.client?.name ?? "—"}
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
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex min-h-10 items-center justify-end text-sm font-medium text-amber-600 hover:text-amber-700 active:text-amber-800"
                      >
                        View
                      </Link>
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
