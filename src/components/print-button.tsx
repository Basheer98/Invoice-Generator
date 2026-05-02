"use client";

import { Printer } from "lucide-react";

export function PrintButton({
  invoiceId,
}: {
  invoiceId: string;
}) {
  function handlePrint() {
    window.open(`/api/invoices/${invoiceId}/print`, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handlePrint}
      type="button"
      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 active:bg-stone-100 sm:min-h-0 sm:flex-none"
    >
      <Printer className="h-4 w-4" />
      Print
    </button>
  );
}
