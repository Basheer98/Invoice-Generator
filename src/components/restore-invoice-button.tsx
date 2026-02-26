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
      className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700 disabled:opacity-50"
      aria-label={`Restore invoice ${invoiceNumber}`}
    >
      <RotateCcw className="h-4 w-4" />
      {loading ? "…" : "Restore"}
    </button>
  );
}
