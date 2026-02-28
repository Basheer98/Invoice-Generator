"use client";

import { useState, useEffect } from "react";
import { SignatureDraw } from "@/components/signature-draw";
import { useRouter } from "next/navigation";

type Company = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  lutReference?: string | null;
  signatureDataUrl?: string | null;
  authorizedSignatory?: string | null;
  phone?: string | null;
  email?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankIfsc?: string | null;
  swiftCode?: string | null;
  defaultTermsAndConditions?: string | null;
  defaultGstRate?: number | null;
  defaultCgstRate?: number | null;
  defaultSgstRate?: number | null;
  invoiceNumberPrefix?: string | null;
  invoiceNumberSerialLength?: number | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    lutReference: "",
    signatureDataUrl: "",
    authorizedSignatory: "",
    fssaiLicense: "",
    phone: "",
    email: "",
    bankName: "",
    bankAccount: "",
    bankIfsc: "",
    swiftCode: "",
    defaultTermsAndConditions: "",
    defaultGstRate: "",
    defaultCgstRate: "",
    defaultSgstRate: "",
    invoiceNumberPrefix: "",
    invoiceNumberSerialLength: "3",
  });

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((data) => {
        setCompany(data);
          if (data) {
          setForm({
            name: data.name ?? "",
            address: data.address ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            pincode: data.pincode ?? "",
            gstin: data.gstin ?? "",
            lutReference: data.lutReference ?? "",
            signatureDataUrl: data.signatureDataUrl ?? "",
            authorizedSignatory: data.authorizedSignatory ?? "",
            fssaiLicense: data.fssaiLicense ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            bankName: data.bankName ?? "",
            bankAccount: data.bankAccount ?? "",
            bankIfsc: data.bankIfsc ?? "",
            swiftCode: data.swiftCode ?? "",
            defaultTermsAndConditions: data.defaultTermsAndConditions ?? "",
            defaultGstRate: data.defaultGstRate != null ? String(data.defaultGstRate) : "",
            defaultCgstRate: data.defaultCgstRate != null ? String(data.defaultCgstRate) : "",
            defaultSgstRate: data.defaultSgstRate != null ? String(data.defaultSgstRate) : "",
            invoiceNumberPrefix: data.invoiceNumberPrefix ?? "",
            invoiceNumberSerialLength: data.invoiceNumberSerialLength != null ? String(data.invoiceNumberSerialLength) : "3",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/company/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name || "My Company",
          defaultGstRate: form.defaultGstRate !== "" ? Number(form.defaultGstRate) : null,
          defaultCgstRate: form.defaultCgstRate !== "" ? Number(form.defaultCgstRate) : null,
          defaultSgstRate: form.defaultSgstRate !== "" ? Number(form.defaultSgstRate) : null,
          invoiceNumberPrefix: form.invoiceNumberPrefix || null,
          invoiceNumberSerialLength: form.invoiceNumberSerialLength !== "" ? Number(form.invoiceNumberSerialLength) : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? `Failed to save (${res.status})`);
      }
      setMessage({ type: "success", text: "Company details saved successfully" });
      setCompany(data);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Company Settings</h1>
      <p className="text-stone-600">
        This information will appear on your invoices.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Business Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700">
                Company name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                State
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Pincode
              </label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                GSTIN
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))}
                placeholder="15-character GSTIN"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                LUT Reference
              </label>
              <input
                type="text"
                value={form.lutReference}
                onChange={(e) => setForm((p) => ({ ...p, lutReference: e.target.value }))}
                placeholder="e.g. AD360126009011T (for export invoices)"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-stone-500">
                Letter of Undertaking reference. Shown on export invoices below GSTIN.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                FSSAI Lic. No.
              </label>
              <input
                type="text"
                value={form.fssaiLicense}
                onChange={(e) => setForm((p) => ({ ...p, fssaiLicense: e.target.value }))}
                placeholder="Optional - for food products"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Default GST Rate (%)
              </label>
              <select
                value={form.defaultGstRate}
                onChange={(e) => setForm((p) => ({ ...p, defaultGstRate: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">None (select per invoice)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Pre-filled when creating domestic invoices. Can be overridden per invoice.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Default CGST (%)
              </label>
              <select
                value={form.defaultCgstRate}
                onChange={(e) => setForm((p) => ({ ...p, defaultCgstRate: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">None (use GST split)</option>
                <option value="2.5">2.5%</option>
                <option value="6">6%</option>
                <option value="9">9%</option>
                <option value="14">14%</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Intrastate CGST rate. When set with SGST, overrides the GST split.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Default SGST (%)
              </label>
              <select
                value={form.defaultSgstRate}
                onChange={(e) => setForm((p) => ({ ...p, defaultSgstRate: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">None (use GST split)</option>
                <option value="2.5">2.5%</option>
                <option value="6">6%</option>
                <option value="9">9%</option>
                <option value="14">14%</option>
              </select>
              <p className="mt-1 text-xs text-stone-500">
                Intrastate SGST rate. When set with CGST, overrides the GST split.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Invoice number prefix
              </label>
              <input
                type="text"
                value={form.invoiceNumberPrefix}
                onChange={(e) => setForm((p) => ({ ...p, invoiceNumberPrefix: e.target.value }))}
                placeholder="e.g. Akp "
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-stone-500">
                Used for auto-generated numbers like &quot;Akp 018/25/26&quot;. Leave empty for INV-2025-0001.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Serial length (digits)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={form.invoiceNumberSerialLength}
                onChange={(e) => setForm((p) => ({ ...p, invoiceNumberSerialLength: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-stone-500">
                Padding for serial (e.g. 3 → 018). Default 3.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Default Terms & Conditions
          </h2>
          <p className="mb-4 text-sm text-stone-600">
            These will be pre-filled when creating domestic invoices. You can still edit them per invoice.
          </p>
          <textarea
            value={form.defaultTermsAndConditions}
            onChange={(e) =>
              setForm((p) => ({ ...p, defaultTermsAndConditions: e.target.value }))
            }
            rows={5}
            placeholder="1. All Materials are properly checked before Dispatch...&#10;2. Any dispute is subject to Hyderabad Jurisdiction Only.&#10;3. Please receive the above goods in good order & condition..."
            className="block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Digital Signature
          </h2>
          <p className="mb-4 text-sm text-stone-600">
            Shown on invoice footer. Choose one: upload image, draw, or enter signatory name.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Authorized Signatory Name
              </label>
              <input
                type="text"
                value={form.authorizedSignatory}
                onChange={(e) =>
                  setForm((p) => ({ ...p, authorizedSignatory: e.target.value }))
                }
                placeholder="e.g. John Doe, Director"
                className="mt-1 block w-full max-w-md rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-stone-500">
                Typed name shown as signatory (if no image).
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Upload Signature Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const result = reader.result as string;
                      setForm((p) => ({ ...p, signatureDataUrl: result }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="mt-1 block w-full max-w-md text-sm text-stone-600"
              />
              {form.signatureDataUrl && (
                <div className="mt-2 flex items-center gap-4">
                  <img
                    src={form.signatureDataUrl}
                    alt="Signature preview"
                    className="h-10 max-w-[120px] border border-stone-200 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, signatureDataUrl: "" }))
                    }
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Draw Signature
              </label>
              <p className="mt-0.5 mb-2 text-xs text-stone-500">
                Draw your signature below and click &quot;Use this signature&quot;
              </p>
              <SignatureDraw
                onSave={(dataUrl) =>
                  setForm((p) => ({ ...p, signatureDataUrl: dataUrl }))
                }
                onClear={() =>
                  setForm((p) => ({ ...p, signatureDataUrl: "" }))
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Bank Details (for Export Invoices)
          </h2>
          <p className="mb-4 text-sm text-stone-600">
            Used for wire transfer instructions on export invoices.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700">
                Bank name
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankName: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                Account number
              </label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankAccount: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                IFSC
              </label>
              <input
                type="text"
                value={form.bankIfsc}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankIfsc: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">
                SWIFT code (for international)
              </label>
              <input
                type="text"
                value={form.swiftCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, swiftCode: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
