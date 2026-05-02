"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteInvoiceButton({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Move invoice "${invoiceNumber}" to trash?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch {
      alert("Could not delete invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100 disabled:opacity-50 sm:min-h-0 sm:min-w-0 sm:justify-start sm:px-0 sm:py-0 sm:hover:bg-transparent"
      aria-label={`Delete invoice ${invoiceNumber}`}
    >
      <Trash2 className="h-4 w-4" />
      {loading ? "…" : "Delete"}
    </button>
  );
}
