"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { InvoicePreview } from "@/components/invoice-preview";

type Client = { id: string; name: string; email?: string | null; address?: string | null; city?: string | null; gstin?: string | null; state?: string | null; pincode?: string | null; country?: string | null; ein?: string | null; drugLicense?: string | null; otherLicense?: string | null };

type Item = {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount?: number; // For export: direct amount
  hsnCode?: string;
  batchNo?: string;
  mfgDate?: string;
  expDate?: string;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [type, setType] = useState<"domestic" | "export">("domestic");
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientGstin, setClientGstin] = useState("");
  const [clientState, setClientState] = useState("");
  const [clientPincode, setClientPincode] = useState("");
  const [clientCountry, setClientCountry] = useState("");
  const [clientEin, setClientEin] = useState("");
  const [clientDrugLicense, setClientDrugLicense] = useState("");
  const [clientOtherLicense, setClientOtherLicense] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [transport, setTransport] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [gstRate, setGstRate] = useState<number | "">(18);
  const [cgstRate, setCgstRate] = useState<number | "">("");
  const [sgstRate, setSgstRate] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [exportFxRate, setExportFxRate] = useState<string>("");
  const [exportInrMode, setExportInrMode] = useState<"rate" | "direct">("rate");
  const [exportSubtotalInrDirect, setExportSubtotalInrDirect] = useState<string>("");
  const [irn, setIrn] = useState<string>("");
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unit: "pcs", rate: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  useEffect(() => {
    fetch("/api/invoices/next-number")
      .then((r) => r.json())
      .then((data) => {
        if (data?.suggested && !invoiceNumber) setInvoiceNumber(data.suggested);
      })
      .catch(() => {});
  }, []);

  const [defaultTermsFetched, setDefaultTermsFetched] = useState(false);
  useEffect(() => {
    if (type === "domestic" && !defaultTermsFetched) {
      fetch("/api/company")
        .then((r) => r.json())
        .then((company) => {
          if (company?.defaultTermsAndConditions) {
            setTermsAndConditions((prev) => prev || company.defaultTermsAndConditions);
          }
          if (company?.defaultGstRate != null && gstRate === 18) {
            setGstRate(company.defaultGstRate);
          }
          if (company?.defaultCgstRate != null) setCgstRate(company.defaultCgstRate);
          if (company?.defaultSgstRate != null) setSgstRate(company.defaultSgstRate);
          setDefaultTermsFetched(true);
        });
    }
  }, [type, defaultTermsFetched]);

  const urlClientId = searchParams.get("clientId");
  useEffect(() => {
    if (urlClientId && clients.length > 0) {
      const c = clients.find((x) => x.id === urlClientId);
      if (c) {
        setClientId(urlClientId);
        setClientName(c.name);
        setClientEmail(c.email ?? "");
        setClientAddress(c.address ?? "");
        setClientCity(c.city ?? "");
        setClientGstin(c.gstin ?? "");
        setClientState(c.state ?? "");
        setClientPincode(c.pincode ?? "");
        setClientCountry(c.country ?? "");
        setClientEin(c.ein ?? "");
        setClientDrugLicense(c.drugLicense ?? "");
        setClientOtherLicense(c.otherLicense ?? "");
      }
    }
  }, [urlClientId, clients]);

  useEffect(() => {
    if (type === "export") {
      setPlaceOfSupply("Outside India");
      setClientCountry("USA");
      setItems((p) => p.map((i) => (typeof i.amount !== "number" ? { ...i, amount: 0 } : i)));
    }
  }, [type]);

  const handleClientSelect = (id: string) => {
    setClientId(id);
    if (id) {
      const c = clients.find((x) => x.id === id);
      if (c) {
        setClientName(c.name);
        setClientEmail(c.email ?? "");
        setClientAddress(c.address ?? "");
        setClientCity(c.city ?? "");
        setClientGstin(c.gstin ?? "");
        setClientState(c.state ?? "");
        setClientPincode(c.pincode ?? "");
        setClientCountry(c.country ?? "");
        setClientEin(c.ein ?? "");
        setClientDrugLicense(c.drugLicense ?? "");
        setClientOtherLicense(c.otherLicense ?? "");
      }
    } else {
      setClientName("");
      setClientEmail("");
      setClientAddress("");
      setClientCity("");
      setClientGstin("");
      setClientState("");
      setClientPincode("");
      setClientCountry("");
      setClientEin("");
      setClientDrugLicense("");
      setClientOtherLicense("");
    }
  };

  const addItem = () => {
    setItems((p) => [
      ...p,
      type === "export"
        ? { description: "", quantity: 0, unit: "pcs", rate: 0, amount: 0 }
        : { description: "", quantity: 1, unit: "pcs", rate: 0 },
    ]);
  };

  const removeItem = (i: number) => {
    if (items.length > 1) setItems((p) => p.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, field: keyof Item, value: string | number) => {
    setItems((p) => {
      const next = [...p];
      (next[i] as Record<string, unknown>)[field] = value;
      if (field === "quantity" || field === "rate" || field === "amount") {
        next[i].quantity = Number(next[i].quantity) || 0;
        next[i].rate = Number(next[i].rate) || 0;
        if (typeof (next[i] as Item).amount === "number" || field === "amount") {
          (next[i] as Item).amount = Number((next[i] as Record<string, unknown>).amount) || 0;
        }
      }
      return next;
    });
  };

  const getItemAmount = (i: Item) =>
    type === "export" && typeof i.amount === "number" ? i.amount : i.quantity * i.rate;
  const subtotal = items.reduce((s, i) => s + getItemAmount(i), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      setError(`Please add at least one line item with a ${type === "export" ? "project" : "description"}.`);
      return;
    }
    if (type === "domestic") {
      const hasInvalidQty = validItems.some((i) => !i.quantity || i.quantity <= 0);
      if (hasInvalidQty) {
        setError("Each item must have a quantity greater than 0.");
        return;
      }
    } else {
      const hasInvalidAmount = validItems.some((i) => getItemAmount(i) < 0);
      if (hasInvalidAmount) {
        setError("Each item must have a valid amount.");
        return;
      }
    }
    setLoading(true);
    try {
      const exportSubtotalInr =
        type === "export"
          ? exportInrMode === "direct" && exportSubtotalInrDirect.trim() !== ""
            ? Number(exportSubtotalInrDirect)
            : exportFxRate !== ""
              ? subtotal * Number(exportFxRate)
              : null
          : null;

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null,
          invoiceNumber: invoiceNumber.trim() || undefined,
          type,
          status: "draft",
          currency: type === "export" ? "USD" : "INR",
          invoiceDate,
          dueDate: dueDate || null,
          placeOfSupply: placeOfSupply || null,
          poNumber: type === "domestic" ? (poNumber || null) : null,
          lrNumber: type === "domestic" ? (lrNumber || null) : null,
          transport: type === "domestic" ? (transport || null) : null,
          paymentTerms: type === "domestic" ? (paymentTerms || null) : null,
          termsAndConditions: type === "domestic" ? (termsAndConditions || null) : null,
          gstRate: type === "domestic" && gstRate !== "" && Number(gstRate) >= 0 ? Number(gstRate) : null,
          cgstRate: type === "domestic" && cgstRate !== "" && Number(cgstRate) >= 0 ? Number(cgstRate) : null,
          sgstRate: type === "domestic" && sgstRate !== "" && Number(sgstRate) >= 0 ? Number(sgstRate) : null,
          exportSubtotalInr,
          irn: type === "domestic" && irn.trim() ? irn.trim() : null,
          notes: notes || null,
          clientName: clientId ? undefined : clientName,
          clientEmail: clientId ? undefined : clientEmail,
          clientAddress: clientId ? undefined : clientAddress,
          clientCity: clientId ? undefined : clientCity,
          clientGstin: clientId ? undefined : clientGstin,
          clientState: clientId ? undefined : clientState,
          clientPincode: clientId ? undefined : clientPincode,
          clientCountry: clientId ? undefined : clientCountry,
          clientEin: clientId ? undefined : clientEin,
          clientDrugLicense: clientId ? undefined : clientDrugLicense,
          clientOtherLicense: clientId ? undefined : clientOtherLicense,
          items: validItems.map((i) => {
              const amt = getItemAmount(i);
              return {
              description: i.description,
              quantity: i.quantity,
              unit: type === "domestic" ? "Kg" : (i.unit || "pcs"),
              rate: i.rate,
              amount: type === "export" ? amt : undefined,
              hsnCode: type === "domestic" ? i.hsnCode || undefined : undefined,
              batchNo: type === "domestic" ? i.batchNo || undefined : undefined,
              mfgDate: type === "domestic" && i.mfgDate ? i.mfgDate : null,
              expDate: type === "domestic" && i.expDate ? i.expDate : null,
            };
            }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      router.push(`/invoices/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const previewData = {
    type,
    invoiceNumber,
    invoiceDate,
    dueDate,
    placeOfSupply,
    poNumber,
    lrNumber,
    transport,
    paymentTerms,
    termsAndConditions,
    gstRate,
    cgstRate,
    sgstRate,
    items,
    clientName,
    clientEmail,
    clientAddress,
    clientCity,
    clientState,
    clientGstin,
    clientPincode,
    clientCountry,
    clientEin,
    notes,
    exportFxRate,
    exportInrMode,
    exportSubtotalInrDirect,
    irn,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <h1 className="text-2xl font-bold text-stone-900">New Invoice</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Invoice Type</h2>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-stone-900">
              <input
                type="radio"
                name="type"
                checked={type === "domestic"}
                onChange={() => setType("domestic")}
                className="h-4 w-4 text-amber-600"
              />
              Domestic (India – GST)
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-stone-900">
              <input
                type="radio"
                name="type"
                checked={type === "export"}
                onChange={() => setType("export")}
                className="h-4 w-4 text-amber-600"
              />
              Export (USA – No GST)
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Client</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">Select existing client</label>
              <select
                value={clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">— New client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Client name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Company or client name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Address</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {type === "domestic" && (
              <div>
                <label className="block text-sm font-medium text-stone-700">City</label>
                <input
                  type="text"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
            {type === "domestic" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Client GSTIN</label>
                  <input
                    type="text"
                    value={clientGstin}
                    onChange={(e) => setClientGstin(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="15-character GSTIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Client State</label>
                  <input
                    type="text"
                    value={clientState}
                    onChange={(e) => setClientState(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Drug Lic. No.</label>
                  <input
                    type="text"
                    value={clientDrugLicense}
                    onChange={(e) => setClientDrugLicense(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Other Lic. No.</label>
                  <input
                    type="text"
                    value={clientOtherLicense}
                    onChange={(e) => setClientOtherLicense(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Optional"
                  />
                </div>
              </>
            )}
            {type === "export" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700">City</label>
                  <input
                    type="text"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">State</label>
                  <input
                    type="text"
                    value={clientState}
                    onChange={(e) => setClientState(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">ZIP Code</label>
                  <input
                    type="text"
                    value={clientPincode}
                    onChange={(e) => setClientPincode(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. 10001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Client EIN (USA)</label>
                <input
                  type="text"
                  value={clientEin}
                  onChange={(e) => setClientEin(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="XX-XXXXXXX"
                />
              </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-stone-900">Dates & Transaction Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">Invoice number</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g. Akp 018/25/26"
              />
              <p className="mt-1 text-xs text-stone-500">
                Pre-filled with suggested number. Edit or leave as-is.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Invoice date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                title="DD/MM/YYYY"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-0.5 text-xs text-stone-500">Format: DD/MM/YYYY</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                title="DD/MM/YYYY"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-0.5 text-xs text-stone-500">Format: DD/MM/YYYY</p>
            </div>
            {type === "domestic" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Place of supply</label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="State name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">PO No.</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Purchase order number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">L.R. No.</label>
                  <input
                    type="text"
                    value={lrNumber}
                    onChange={(e) => setLrNumber(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Logistics receipt number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Transport</label>
                  <input
                    type="text"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Carrier name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Payment terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="e.g. Immediately, Net 30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">GST Rate (%)</label>
                  <select
                    value={
                      [5, 12, 18, 28].includes(Number(gstRate))
                        ? String(gstRate)
                        : gstRate === ""
                          ? ""
                          : "custom"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") setGstRate(0); // 0 = custom, user will type
                      else if (v === "") setGstRate("");
                      else setGstRate(Number(v));
                    }}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                    <option value="custom">Custom %</option>
                  </select>
                  {([5, 12, 18, 28].includes(Number(gstRate)) ? false : gstRate !== "") && (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={gstRate === "" ? "" : gstRate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setGstRate(v === "" ? "" : Number(v));
                      }}
                      className="mt-2 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="Enter custom %"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">CGST Rate (%)</label>
                  <select
                    value={
                      [2.5, 6, 9, 14].includes(Number(cgstRate))
                        ? String(cgstRate)
                        : cgstRate === ""
                          ? ""
                          : "custom"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") setCgstRate(0);
                      else if (v === "") setCgstRate("");
                      else setCgstRate(Number(v));
                    }}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Use GST split (auto)</option>
                    <option value="2.5">2.5%</option>
                    <option value="6">6%</option>
                    <option value="9">9%</option>
                    <option value="14">14%</option>
                    <option value="custom">Custom %</option>
                  </select>
                  {([2.5, 6, 9, 14].includes(Number(cgstRate)) ? false : cgstRate !== "") && (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={cgstRate === "" ? "" : cgstRate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCgstRate(v === "" ? "" : Number(v));
                      }}
                      className="mt-2 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="Enter custom CGST %"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">SGST Rate (%)</label>
                  <select
                    value={
                      [2.5, 6, 9, 14].includes(Number(sgstRate))
                        ? String(sgstRate)
                        : sgstRate === ""
                          ? ""
                          : "custom"
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") setSgstRate(0);
                      else if (v === "") setSgstRate("");
                      else setSgstRate(Number(v));
                    }}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">Use GST split (auto)</option>
                    <option value="2.5">2.5%</option>
                    <option value="6">6%</option>
                    <option value="9">9%</option>
                    <option value="14">14%</option>
                    <option value="custom">Custom %</option>
                  </select>
                  {([2.5, 6, 9, 14].includes(Number(sgstRate)) ? false : sgstRate !== "") && (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={sgstRate === "" ? "" : sgstRate}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSgstRate(v === "" ? "" : Number(v));
                      }}
                      className="mt-2 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="Enter custom SGST %"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border-2 border-stone-800">
            {type === "domestic" ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-stone-700">
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">S. No.</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Description</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">HSN</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Batch No.</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">QTY</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Mfg date</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Exp date</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Rate</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Amount</th>
                    <th className="w-10 border border-stone-600 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-stone-300 bg-white">
                      <td className="border border-stone-300 px-2 py-1 text-center text-sm text-stone-900">{i + 1}</td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(i, "description", e.target.value)}
                          placeholder="Description"
                          className="block w-full border-0 bg-transparent px-1 py-1 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="text"
                          value={item.hsnCode ?? ""}
                          onChange={(e) => updateItem(i, "hsnCode", e.target.value)}
                          placeholder="HSN"
                          className="block w-full min-w-16 border-0 bg-transparent px-1 py-1 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="text"
                          value={item.batchNo ?? ""}
                          onChange={(e) => updateItem(i, "batchNo", e.target.value)}
                          placeholder="Batch"
                          className="block w-full min-w-16 border-0 bg-transparent px-1 py-1 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(i, "quantity", e.target.value)}
                          placeholder="0"
                          min={0}
                          step={0.01}
                          className="block w-full min-w-12 border-0 bg-transparent px-1 py-1 text-right text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="date"
                          value={item.mfgDate ?? ""}
                          onChange={(e) => updateItem(i, "mfgDate", e.target.value)}
                          className="block w-full min-w-20 border-0 bg-transparent px-1 py-1 text-sm text-stone-900 focus:ring-1 focus:ring-amber-500 [color-scheme:light]"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="date"
                          value={item.expDate ?? ""}
                          onChange={(e) => updateItem(i, "expDate", e.target.value)}
                          className="block w-full min-w-20 border-0 bg-transparent px-1 py-1 text-sm text-stone-900 focus:ring-1 focus:ring-amber-500 [color-scheme:light]"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="number"
                          value={item.rate || ""}
                          onChange={(e) => updateItem(i, "rate", e.target.value)}
                          placeholder="0"
                          min={0}
                          step={0.01}
                          className="block w-full min-w-16 border-0 bg-transparent px-1 py-1 text-right text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1 text-right text-sm font-medium text-stone-900">
                        ₹{(item.quantity * item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-stone-300 px-1 py-1">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-stone-700">
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">S. No.</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Project</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">SQFT</th>
                    <th className="border border-stone-600 px-2 py-2 text-center text-xs font-medium text-white">Amount</th>
                    <th className="w-10 border border-stone-600 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-stone-300 bg-white">
                      <td className="border border-stone-300 px-2 py-1 text-center text-sm text-stone-900">{i + 1}</td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(i, "description", e.target.value)}
                          placeholder="Project"
                          className="block w-full border-0 bg-transparent px-1 py-1 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) => updateItem(i, "quantity", e.target.value)}
                          placeholder="0"
                          min={0}
                          step={0.01}
                          className="block w-full min-w-12 border-0 bg-transparent px-1 py-1 text-right text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-2 py-1">
                        <input
                          type="number"
                          value={typeof item.amount === "number" && item.amount !== 0 ? item.amount : ""}
                          onChange={(e) => updateItem(i, "amount", e.target.value)}
                          placeholder="0"
                          min={0}
                          step={0.01}
                          className="block w-full min-w-20 border-0 bg-transparent px-1 py-1 text-right text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="border border-stone-300 px-1 py-1">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-stone-700">
            Subtotal: {type === "export" ? "$" : "₹"}
            {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {type === "export" && (
          <>
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-medium text-stone-700">Description</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Enter a description of the services or deliverables for this export invoice."
                className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-medium text-stone-900">INR amount for export invoice</h3>
              <p className="mt-0.5 text-xs text-stone-500">
                Used for INR total and amount in words on the export PDF.
              </p>
              <div className="mt-4 flex gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-stone-900">
                  <input
                    type="radio"
                    name="exportInrMode"
                    checked={exportInrMode === "rate"}
                    onChange={() => setExportInrMode("rate")}
                    className="h-4 w-4 text-amber-600"
                  />
                  Conversion rate (1 USD = ? INR)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-stone-900">
                  <input
                    type="radio"
                    name="exportInrMode"
                    checked={exportInrMode === "direct"}
                    onChange={() => setExportInrMode("direct")}
                    className="h-4 w-4 text-amber-600"
                  />
                  Enter INR amount directly
                </label>
              </div>
              {exportInrMode === "rate" ? (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-stone-700">
                    Conversion rate (1 USD = ? INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.0001}
                    value={exportFxRate}
                    onChange={(e) => setExportFxRate(e.target.value)}
                    placeholder="e.g. 83.2500"
                    className="mt-1 block w-full max-w-xs rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {exportFxRate !== "" && (
                    <p className="mt-1 text-xs text-stone-600">
                      INR subtotal preview: ₹{" "}
                      {(subtotal * Number(exportFxRate)).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-stone-700">
                    Amount in INR (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={exportSubtotalInrDirect}
                    onChange={(e) => setExportSubtotalInrDirect(e.target.value)}
                    placeholder="e.g. 46500.00"
                    className="mt-1 block w-full max-w-xs rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {exportSubtotalInrDirect !== "" && (
                    <p className="mt-1 text-xs text-stone-600">
                      This amount will appear on the invoice.
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {type === "domestic" && (
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-stone-700">Terms & Conditions</label>
            <textarea
              value={termsAndConditions}
              onChange={(e) => setTermsAndConditions(e.target.value)}
              rows={4}
              placeholder="Enter each term on a new line. e.g.&#10;1. First term&#10;2. Second term"
              className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}
        {type === "domestic" && (
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-stone-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}
        {type === "domestic" && (
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-stone-700">E-Invoice IRN (optional)</label>
            <input
              type="text"
              value={irn}
              onChange={(e) => setIrn(e.target.value)}
              placeholder="Paste IRN from GST e-invoice portal"
              className="mt-1 block w-full max-w-md rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="mt-1 text-xs text-stone-500">
              IRN and QR code will appear on the invoice. Leave blank if not applicable.
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
          <Link
            href="/invoices"
            className="rounded-lg border border-stone-300 px-6 py-2.5 font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </Link>
        </div>
      </form>
      <aside className="hidden lg:block">
        <InvoicePreview formData={previewData} type={type} />
      </aside>
      </div>
    </div>
  );
}
