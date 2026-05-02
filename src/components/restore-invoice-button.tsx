"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function RestoreInvoiceButton({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to restore");
      router.refresh();
    } catch {
      alert("Could not restore invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRestore}
      disabled={loading}
      className="inline-flex min-h-10 items-center justify-end gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 hover:text-amber-800 active:bg-amber-100 disabled:opacity-50 sm:min-h-0 sm:justify-start sm:px-0 sm:py-0 sm:hover:bg-transparent"
      aria-label={`Restore invoice ${invoiceNumber}`}
    >
      <RotateCcw className="h-4 w-4" />
      {loading ? "…" : "Restore"}
    </button>
  );
}
