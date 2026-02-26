"use client";

import { useEffect, useRef, useState } from "react";

type PreviewProps = {
  formData: Record<string, unknown>;
  type: "domestic" | "export";
};

export function InvoicePreview({ formData, type }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/invoices/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data?.html) setHtml(data.html);
      } catch {
        setHtml("<p>Preview unavailable</p>");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [formData]);

  return (
    <div className="sticky top-4 rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-200 px-4 py-2">
        <h3 className="text-sm font-semibold text-stone-900">Live Preview</h3>
      </div>
      <div className="relative min-h-[400px] max-h-[70vh] overflow-hidden bg-stone-50">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <span className="text-sm text-stone-500">Updating...</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="Invoice preview"
          className="h-full min-h-[500px] w-full border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
