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
      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      aria-label={`Delete invoice ${invoiceNumber}`}
    >
      <Trash2 className="h-4 w-4" />
      {loading ? "…" : "Delete"}
    </button>
  );
}
