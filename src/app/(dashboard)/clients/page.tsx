"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, User, X } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  gstin?: string | null;
  ein?: string | null;
  drugLicense?: string | null;
  otherLicense?: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    gstin: "",
    drugLicense: "",
    otherLicense: "",
    ein: "",
  });

  useEffect(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  function openNewClient() {
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      gstin: "",
      drugLicense: "",
      otherLicense: "",
      ein: "",
    });
    setEditingClient(null);
    setError("");
    setShowForm(true);
  }

  function openEditClient(c: Client) {
    setForm({
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      city: c.city ?? "",
      state: c.state ?? "",
      pincode: c.pincode ?? "",
      country: c.country ?? "",
      gstin: c.gstin ?? "",
      drugLicense: c.drugLicense ?? "",
      otherLicense: c.otherLicense ?? "",
      ein: c.ein ?? "",
    });
    setEditingClient(c);
    setError("");
    setShowForm(true);
  }

  async function handleDeleteClient(c: Client) {
    if (!confirm(`Delete client "${c.name}"? This cannot be undone.`)) return;
    setError("");
    try {
      const res = await fetch(`/api/clients/${c.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? `Failed to delete client (${res.status})`);
      }
      setClients((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete client"
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        pincode: form.pincode || undefined,
        country: form.country || undefined,
        gstin: form.gstin || undefined,
        drugLicense: form.drugLicense || undefined,
        otherLicense: form.otherLicense || undefined,
        ein: form.ein || undefined,
      };

      const url = editingClient
        ? `/api/clients/${editingClient.id}`
        : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error ?? `Failed to ${editingClient ? "update" : "add"} client`
        );

      setClients((prev) => {
        if (editingClient) {
          return prev
            .map((c) => (c.id === data.id ? data : c))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        return [...prev, data].sort((a, b) => a.name.localeCompare(b.name));
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
        gstin: "",
        drugLicense: "",
        otherLicense: "",
        ein: "",
      });
      setEditingClient(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setSaving(false);
    }
  }

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Clients</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openNewClient}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            New Invoice
          </Link>
        </div>
      </div>

      <p className="text-stone-600">
        Add clients here, then select them from the dropdown when creating an invoice.
      </p>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">
                {editingClient ? "Edit Client" : "Add Client"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-stone-700">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Company or client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Pincode / ZIP</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. India, USA"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-700">GSTIN (India)</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="15-character GSTIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">EIN (USA)</label>
                  <input
                    type="text"
                    value={form.ein}
                    onChange={(e) => setForm((p) => ({ ...p, ein: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-700">Drug Lic. No.</label>
                  <input
                    type="text"
                    value={form.drugLicense}
                    onChange={(e) => setForm((p) => ({ ...p, drugLicense: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Other Lic. No.</label>
                  <input
                    type="text"
                    value={form.otherLicense}
                    onChange={(e) => setForm((p) => ({ ...p, otherLicense: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving
                    ? editingClient
                      ? "Saving..."
                      : "Adding..."
                    : editingClient
                      ? "Save Changes"
                      : "Add Client"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingClient(null);
                    setError("");
                  }}
                  className="rounded-lg border border-stone-300 px-4 py-2.5 font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.length === 0 ? (
          <div className="col-span-full rounded-xl border border-stone-200 bg-white p-12 text-center">
            <User className="mx-auto h-12 w-12 text-stone-300" />
            <p className="mt-4 text-stone-600">No clients yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Add your first client to get started
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <p className="font-semibold text-stone-900">{client.name}</p>
              {client.email && (
                <p className="mt-1 text-sm text-stone-600">{client.email}</p>
              )}
              {client.phone && (
                <p className="text-sm text-stone-600">{client.phone}</p>
              )}
              {client.address && (
                <p className="mt-1 text-sm text-stone-500 line-clamp-2">
                  {client.address}
                  {client.city && `, ${client.city}`}
                  {client.state && `, ${client.state}`}
                  {client.pincode && `, ${client.pincode}`}
                </p>
              )}
              {(client.gstin || client.ein) && (
                <p className="mt-1 text-xs text-stone-500">
                  {client.gstin && `GSTIN: ${client.gstin}`}
                  {client.gstin && client.ein && " • "}
                  {client.ein && `EIN: ${client.ein}`}
                </p>
              )}
              {client.country && (
                <p className="mt-1 text-xs text-stone-500">{client.country}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={`/invoices/new?clientId=${client.id}`}
                  className="text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  Create invoice
                </Link>
                <button
                  type="button"
                  onClick={() => openEditClient(client)}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClient(client)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
