"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useSensitiveAdminApproval } from "@/lib/admin-approval";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import type { DonationType, DonationTypeCustomField } from "@/types/database";

type Tab = "inflow" | "types";

/* ─── Types tab ─── */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

type TypeForm = {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  custom_fields: DonationTypeCustomField[];
  is_active: boolean;
  sort_order: number;
};

const emptyTypeForm: TypeForm = {
  id: null,
  name: "",
  slug: "",
  description: "",
  custom_fields: [],
  is_active: true,
  sort_order: 0,
};

function DonationTypesTab() {
  const adminEmail = useAuthStore((state) => state.authUser?.email ?? state.user?.email ?? null);
  const { adminRole, pendingApprovals, dismissPendingApproval, confirmOrQueue } =
    useSensitiveAdminApproval(adminEmail);
  const [types, setTypes] = useState<DonationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TypeForm>(emptyTypeForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("donation_types")
      .select("*")
      .order("sort_order");
    setTypes((data ?? []) as unknown as DonationType[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startNew() {
    setForm(emptyTypeForm);
    setShowForm(true);
  }

  function startEdit(type: DonationType) {
    setForm({
      id: type.id,
      name: type.name,
      slug: type.slug,
      description: type.description ?? "",
      custom_fields: type.custom_fields ?? [],
      is_active: type.is_active,
      sort_order: type.sort_order,
    });
    setShowForm(true);
  }

  async function save() {
    if (!supabase) return;
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    const slug = form.slug.trim() || slugify(form.name);
    // slugify() drops non-alphanumerics, so a name like "###" yields an empty
    // slug — reject it (an empty slug breaks the public donate form's fund
    // matching and collides on the unique constraint).
    if (!slug) {
      setError("Name must contain at least one letter or number.");
      return;
    }
    // Validate + normalize custom fields: donor answers on the public form are
    // keyed by field.key, so empty/duplicate/malformed keys collide or lose
    // donor input. Require a non-empty label, derive a normalized slug key, and
    // reject duplicates before persisting.
    const normalizedFields: DonationTypeCustomField[] = [];
    for (let i = 0; i < form.custom_fields.length; i++) {
      const field = form.custom_fields[i];
      const label = field.label.trim();
      if (!label) {
        setError(`Custom field ${i + 1}: label is required.`);
        return;
      }
      const key = slugify(field.key.trim() || label).replace(/-/g, "_");
      if (!key) {
        setError(`Custom field ${i + 1}: key must contain letters or numbers.`);
        return;
      }
      normalizedFields.push({ ...field, key, label });
    }
    const keys = normalizedFields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
      setError("Custom field keys must be unique.");
      return;
    }
    const { data: existing } = await supabase
      .from("donation_types")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing && existing.id !== form.id) {
      setError("This slug is already in use");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description || null,
      custom_fields: normalizedFields,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    const { error: writeErr } = form.id
      ? await supabase.from("donation_types").update(payload).eq("id", form.id)
      : await supabase.from("donation_types").insert(payload);
    setSaving(false);
    if (writeErr) {
      setError(writeErr.message);
      return;
    }
    setShowForm(false);
    setForm(emptyTypeForm);
    refresh();
  }

  async function toggleActive(type: DonationType) {
    if (!supabase) return;
    const nextActive = !type.is_active;
    await confirmOrQueue({
      action: nextActive ? "activate_donation_type" : "deactivate_donation_type",
      resourceLabel: type.name,
      confirmMessage: nextActive
        ? `Restore "${type.name}" to the donation form?`
        : `Deactivate "${type.name}" from the donation form?`,
      approvalReason: `${nextActive ? "Restore" : "Deactivate"} donation type "${type.name}"`,
      run: async () => {
        if (!supabase) {
          setError("Not connected. Please reload.");
          return;
        }
        const { error: toggleErr } = await supabase
          .from("donation_types")
          .update({ is_active: nextActive })
          .eq("id", type.id);
        if (toggleErr) {
          setError(toggleErr.message);
          return;
        }
        await refresh();
      },
    });
  }

  async function remove(type: DonationType) {
    if (!supabase) return;
    await confirmOrQueue({
      action: "delete_donation_type",
      resourceLabel: type.name,
      confirmMessage: `Delete "${type.name}"? Donations already tagged with this fund won't be deleted.`,
      approvalReason: `Delete donation type "${type.name}"`,
      run: async () => {
        if (!supabase) {
          setError("Not connected. Please reload.");
          return;
        }
        const { error: delErr } = await supabase
          .from("donation_types")
          .delete()
          .eq("id", type.id);
        if (delErr) {
          setError(delErr.message);
          return;
        }
        await refresh();
      },
    });
  }

  function addCustomField() {
    setForm((f) => ({
      ...f,
      custom_fields: [...f.custom_fields, { key: "", label: "", type: "text", required: false }],
    }));
  }

  function updateCustomField(index: number, updates: Partial<DonationTypeCustomField>) {
    setForm((f) => ({
      ...f,
      custom_fields: f.custom_fields.map((field, i) =>
        i === index ? { ...field, ...updates } : field
      ),
    }));
  }

  function removeCustomField(index: number) {
    setForm((f) => ({
      ...f,
      custom_fields: f.custom_fields.filter((_, i) => i !== index),
    }));
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-xl font-bold text-temple-maroon">
          Donation Types
        </h2>
        <button onClick={startNew} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Type
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {pendingApprovals.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            Sensitive changes require approver review for your role ({adminRole}).
          </p>
          <ul className="mt-2 space-y-2">
            {pendingApprovals.slice(0, 3).map((approval) => (
              <li key={approval.id} className="flex items-center justify-between gap-4">
                <span>
                  {approval.reason} · requested {new Date(approval.requestedAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-amber-800 underline"
                  onClick={() => dismissPendingApproval(approval.id)}
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showForm && (
        <div className="mt-6 rounded-2xl border border-temple-gold/20 bg-white p-6 shadow-sm">
          <h3 className="font-heading text-lg font-bold text-temple-maroon">
            {form.id ? "Edit Type" : "New Type"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="dt-name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                id="dt-name"
                type="text"
                className="input-field mt-1"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: f.id ? f.slug : slugify(e.target.value),
                  }))
                }
                placeholder="Annadanam Fund"
              />
            </div>
            <div>
              <label htmlFor="dt-slug" className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                id="dt-slug"
                type="text"
                className="input-field mt-1 font-mono text-sm"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              />
            </div>
            <div>
              <label htmlFor="dt-sort-order" className="block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                id="dt-sort-order"
                type="number"
                className="input-field mt-1"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dt-description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="dt-description"
                className="input-field mt-1"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Custom Fields (optional)
                </label>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="text-sm text-temple-red hover:underline"
                >
                  + Add field
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Extra fields donors fill in when picking this fund (e.g. &ldquo;In honor of&rdquo;).
              </p>
              <div className="mt-3 space-y-3">
                {form.custom_fields.map((field, i) => (
                  <div key={i} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-4">
                    <input
                      type="text"
                      placeholder="key"
                      aria-label={`Custom field ${i + 1} key`}
                      className="input-field text-sm"
                      value={field.key}
                      onChange={(e) => updateCustomField(i, { key: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Label"
                      aria-label={`Custom field ${i + 1} label`}
                      className="input-field text-sm"
                      value={field.label}
                      onChange={(e) => updateCustomField(i, { label: e.target.value })}
                    />
                    <select
                      aria-label={`Custom field ${i + 1} type`}
                      className="input-field text-sm"
                      value={field.type}
                      onChange={(e) =>
                        updateCustomField(i, {
                          type: e.target.value as DonationTypeCustomField["type"],
                        })
                      }
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={field.required ?? false}
                          onChange={(e) =>
                            updateCustomField(i, { required: e.target.checked })
                          }
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeCustomField(i)}
                        className="ml-auto text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm(emptyTypeForm);
                setError(null);
              }}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden sm:table-cell">
                Fields
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden md:table-cell">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  No donation types yet.
                </td>
              </tr>
            ) : (
              types.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-900">{type.name}</p>
                    <p className="text-xs text-gray-500">{type.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {type.custom_fields?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    {type.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        <Eye className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        <EyeOff className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => toggleActive(type)}
                        className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      >
                        {type.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(type)}
                        className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(type)}
                        className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Inflow tab ─── */

type InflowRow = {
  id: string;
  /** Raw DB primary key (unprefixed) — used to target the row for updates. */
  rawId: string;
  source: "donation" | "service";
  date: string;
  donor: string;
  /** Donor contact for follow-up (esp. pending Zelle pledges). */
  email: string;
  phone: string;
  fund_or_service: string;
  amount: number;
  status: string;
};

function DonationInflowTab() {
  const [rows, setRows] = useState<InflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationTotal, setDonationTotal] = useState(0);
  const [serviceTotal, setServiceTotal] = useState(0);
  const [marking, setMarking] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      // created_at is TIMESTAMPTZ (UTC). Compute the "this year" window on a
      // consistent UTC basis so the label and the .gte filter agree and a gift
      // near Jan 1 isn't bucketed into the wrong year by a local-vs-UTC skew.
      const year = new Date().getUTCFullYear();
      const yearStart = new Date(Date.UTC(year, 0, 1)).toISOString();

      const [donationsResp, bookingsResp, donationSumResp, bookingSumResp] = await Promise.all([
        supabase
          .from("donations")
          .select("id, donor_name, donor_email, amount, fund_type, payment_status, created_at, custom_fields")
          .gte("created_at", yearStart)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("bookings")
          .select(
            "id, devotee_name, devotee_email, total_amount, payment_status, booking_date, created_at, services(name)"
          )
          .gte("created_at", yearStart)
          .order("created_at", { ascending: false })
          .limit(100),
        // Year-to-date totals must cover ALL completed gifts, not just the
        // latest 100 displayed rows (which would understate revenue once the
        // temple has > 100 gifts in a year). Amount-only, status-filtered.
        supabase
          .from("donations")
          .select("amount")
          .eq("payment_status", "completed")
          .gte("created_at", yearStart)
          .limit(10000),
        supabase
          .from("bookings")
          .select("total_amount")
          .eq("payment_status", "paid")
          .gte("created_at", yearStart)
          .limit(10000),
      ]);

      const donations = donationsResp.data ?? [];
      const bookings = bookingsResp.data ?? [];

      const donationRows: InflowRow[] = donations.map((d) => {
        const cf = (d.custom_fields ?? {}) as Record<string, unknown>;
        const phone =
          typeof cf.donor_phone === "string"
            ? cf.donor_phone
            : typeof cf.phone === "string"
              ? cf.phone
              : "";
        return {
          id: `d-${d.id}`,
          rawId: d.id as string,
          source: "donation",
          date: (d.created_at as string) ?? "",
          donor: (d.donor_name as string) || (d.donor_email as string) || "—",
          email: (d.donor_email as string) ?? "",
          phone,
          fund_or_service: (d.fund_type as string) ?? "General",
          amount: Number(d.amount ?? 0),
          status: (d.payment_status as string) ?? "pending",
        };
      });

      const serviceRows: InflowRow[] = bookings.map((b) => {
        const rel = (b as unknown as { services: { name: string } | { name: string }[] | null }).services;
        const svc = Array.isArray(rel) ? rel[0]?.name : rel?.name;
        return {
          id: `s-${b.id}`,
          rawId: b.id as string,
          source: "service",
          date: (b.created_at as string) ?? "",
          donor: (b.devotee_name as string) || (b.devotee_email as string) || "—",
          email: (b.devotee_email as string) ?? "",
          phone: "",
          fund_or_service: svc ?? "Service",
          amount: Number(b.total_amount ?? 0),
          status: (b.payment_status as string) ?? "pending",
        };
      });

      setDonationTotal(
        (donationSumResp.data ?? []).reduce((s, d) => s + Number(d.amount ?? 0), 0)
      );
      setServiceTotal(
        (bookingSumResp.data ?? []).reduce((s, b) => s + Number(b.total_amount ?? 0), 0)
      );

      const merged = [...donationRows, ...serviceRows].sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
      setRows(merged);
      setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Mark a pending pledge (esp. a Zelle transfer the temple has confirmed in
  // its bank) as received. Allowed by the "Admins can update donations" RLS
  // policy (migration 006); flips payment_status to completed so it counts
  // toward the year's total and stops showing as an open pledge.
  async function markReceived(row: InflowRow) {
    if (!supabase || row.source !== "donation") return;
    if (
      !window.confirm(
        `Mark ${formatCurrency(row.amount)} from ${row.donor} as received? This records the pledge as completed.`
      )
    ) {
      return;
    }
    setActionError(null);
    setMarking(row.id);
    const { error } = await supabase
      .from("donations")
      .update({ payment_status: "completed" })
      .eq("id", row.rawId);
    setMarking(null);
    if (error) {
      setActionError(`Couldn't mark as received: ${error.message}`);
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Donations this year</p>
          <p className="mt-2 text-3xl font-bold text-temple-maroon">
            {formatCurrency(donationTotal)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Service revenue this year</p>
          <p className="mt-2 text-3xl font-bold text-temple-maroon">
            {formatCurrency(serviceTotal)}
          </p>
        </div>
      </div>

      <h2 className="mt-8 font-heading text-xl font-bold text-temple-maroon">
        Recent Inflow
      </h2>
      {actionError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden sm:table-cell">
                Donor / Devotee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden lg:table-cell">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden md:table-cell">
                Fund / Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                  No inflow this year yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {row.date ? new Date(row.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.source === "donation"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {row.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {row.donor}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">
                    {row.email ? (
                      <a
                        href={`mailto:${row.email}`}
                        className="block truncate text-blue-600 hover:underline"
                      >
                        {row.email}
                      </a>
                    ) : null}
                    {row.phone ? (
                      <a
                        href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}
                        className="block text-blue-600 hover:underline"
                      >
                        {row.phone}
                      </a>
                    ) : null}
                    {!row.email && !row.phone ? (
                      <span className="text-gray-400">—</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                    {row.fund_or_service}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        row.status === "completed" || row.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.status}
                    </span>
                    {row.source === "donation" && row.status === "pending" && (
                      <button
                        onClick={() => markReceived(row)}
                        disabled={marking === row.id}
                        className="mt-1 flex items-center gap-1 rounded-md border border-green-300 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {marking === row.id ? "Marking…" : "Mark received"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function AdminDonationsPage() {
  const [tab, setTab] = useState<Tab>("inflow");

  return (
    <div>
      <h1 className="section-heading flex items-center gap-2">
        <DollarSign className="h-7 w-7 text-temple-red" />
        Donations
      </h1>

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("inflow")}
          className={`relative -mb-px px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "inflow"
              ? "border-b-2 border-temple-red text-temple-red"
              : "text-gray-600 hover:text-temple-maroon"
          }`}
        >
          Inflow
        </button>
        <button
          onClick={() => setTab("types")}
          className={`relative -mb-px px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "types"
              ? "border-b-2 border-temple-red text-temple-red"
              : "text-gray-600 hover:text-temple-maroon"
          }`}
        >
          Types
        </button>
      </div>

      <div className="mt-6">
        {tab === "inflow" ? <DonationInflowTab /> : <DonationTypesTab />}
      </div>
    </div>
  );
}
