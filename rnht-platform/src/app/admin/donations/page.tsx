"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Receipt,
  Download,
} from "lucide-react";
import { useSensitiveAdminApproval } from "@/lib/admin-approval";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { STANDARD_FUNDS, FUND_LABELS, prettyFund } from "@/lib/fund";
import { useAuthStore } from "@/store/auth";
import type { DonationType, DonationTypeCustomField } from "@/types/database";

type Tab = "inflow" | "record" | "types";

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
    setError(null); // clear a stale error banner from a prior failed save
    setForm(emptyTypeForm);
    setShowForm(true);
  }

  function startEdit(type: DonationType) {
    setError(null); // clear a stale error banner from a prior failed save
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
                        aria-label={`${type.is_active ? "Hide" : "Show"} ${type.name}`}
                        title={type.is_active ? "Hide" : "Show"}
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
                        aria-label={`Edit ${type.name}`}
                        title="Edit"
                        className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(type)}
                        aria-label={`Delete ${type.name}`}
                        title="Delete"
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

      // Surface a load failure instead of silently showing $0 / an empty table:
      // `?? []` masks a query error (e.g. RLS/network), which used to look like
      // "no donations this year" to the admin.
      const loadErr =
        donationsResp.error ||
        bookingsResp.error ||
        donationSumResp.error ||
        bookingSumResp.error;
      setActionError(
        loadErr
          ? `Couldn't load all donation data (${loadErr.message}). Figures may be incomplete — please refresh.`
          : null,
      );

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
    // Only flip a still-PENDING row, and check a row was actually updated before
    // emailing the receipt. Without .select() the update reports no error even
    // when it matched 0 rows (already completed / removed / RLS-filtered), so the
    // donor could be emailed a receipt for a no-op.
    const { data: updatedRows, error } = await supabase
      .from("donations")
      .update({ payment_status: "completed" })
      .eq("id", row.rawId)
      .eq("payment_status", "pending")
      .select("id");
    if (error) {
      setMarking(null);
      setActionError(`Couldn't mark as received: ${error.message}`);
      return;
    }
    if (!updatedRows || updatedRows.length === 0) {
      setMarking(null);
      setActionError(
        "This donation couldn't be marked received — it may already be completed or was removed. Refreshing…",
      );
      await load();
      return;
    }
    // Best-effort: email the donor their tax-deductible receipt (server-side,
    // admin-verified). Never blocks the status change — if it can't send (e.g.
    // no verified email domain yet), the pledge is still marked received.
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke("send-donation-receipt", {
          body: { donationId: row.rawId },
          headers: { "x-user-token": session.access_token },
        });
      }
    } catch (e) {
      console.error("[receipt] send-on-mark-received failed:", e);
    }
    setMarking(null);
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

/* ─── Record (manual cash/offline donation) tab ─── */

type FundOption = { slug: string; name: string };

type RecordForm = {
  donorName: string;
  donorEmail: string;
  amount: string;
  fundType: string;
  note: string;
};

const emptyRecordForm: RecordForm = {
  donorName: "",
  donorEmail: "",
  amount: "",
  fundType: STANDARD_FUNDS[0]?.slug ?? "general",
  note: "",
};

type RecordResult = {
  kind: "success" | "partial";
  title: string;
  detail: string;
  downloadUrl: string;
  filename: string;
};

type ManualDonationPayload = {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  fundType: string;
  note: string;
  receiptId: string;
  pdfBase64: string;
  filename: string;
};

// RFC-ish email check, mirrors the edge function's server-side guard.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Prefer the platform's UUID, fall back to a v4 generator for the rare browser
// where crypto.randomUUID is unavailable (older WebView / non-secure context).
function makeUuid(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function RecordDonationTab() {
  const [funds, setFunds] = useState<FundOption[]>(STANDARD_FUNDS);
  const [form, setForm] = useState<RecordForm>(emptyRecordForm);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RecordResult | null>(null);
  // The single live receipt object URL, tracked in a ref so it's always revoked
  // on unmount even if a submit is still in flight (result may still be null).
  const objectUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  // A stable donation id for the current gift, so a "Try again" resend reuses
  // the same id (the edge function treats a duplicate id as an idempotent
  // success) instead of minting a new id and filing the gift twice. Cleared by
  // "Record another" (resetForm) so the next gift gets a fresh id.
  const sessionIdRef = useRef<string | null>(null);
  // The last built request body, so "Try again" can resend without
  // regenerating the PDF.
  const payloadRef = useRef<ManualDonationPayload | null>(null);

  const revokeUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Load admin-managed donation types and merge them with the standard funds.
  // Known standard slugs keep their canonical FUND_LABELS name (so a legacy
  // donation_types seed like 'general' → "General Temple Fund" can't put the
  // dropped "Fund" wording back on the receipt, and the label matches the
  // year-end acknowledgment, which resolves via prettyFund). Custom admin funds
  // keep their own name.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("donation_types")
        .select("slug, name")
        .eq("is_active", true)
        .order("sort_order");
      if (!active || !data) return;
      const map = new Map<string, string>();
      for (const f of STANDARD_FUNDS) map.set(f.slug, f.name);
      for (const dt of data as { slug: string; name: string }[]) {
        if (dt.slug && dt.name) map.set(dt.slug, FUND_LABELS[dt.slug] ?? dt.name);
      }
      setFunds(Array.from(map, ([slug, name]) => ({ slug, name })));
    })();
    return () => {
      active = false;
    };
  }, []);

  // Revoke the live receipt URL and mark unmounted so in-flight submits don't
  // set state on / leak a URL from an unmounted component.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      revokeUrl();
    };
  }, [revokeUrl]);

  function resetForm() {
    revokeUrl();
    sessionIdRef.current = null;
    payloadRef.current = null;
    setForm(emptyRecordForm);
    setFieldError(null);
    setResult(null);
  }

  // Invokes the edge function with an already-built payload and renders the
  // outcome. Reused by the initial submit and by "Try again" (same id ⇒
  // idempotent). Assumes objectUrlRef.current already holds the receipt URL.
  async function sendPayload(payload: ManualDonationPayload) {
    const { receiptId, amount, donorEmail, filename } = payload;
    const downloadUrl = objectUrlRef.current ?? "";
    let serverError = "";
    let emailed = false;
    let saved = false;
    try {
      if (!supabase) throw new Error("Not connected.");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        serverError = "Your admin session expired. Please sign in again.";
      } else {
        const { data, error } = await supabase.functions.invoke("record-manual-donation", {
          body: payload,
          headers: { "x-user-token": session.access_token },
        });
        if (error) {
          // Surface the function's own error message (non-2xx bodies arrive on
          // error.context as a Response).
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            try {
              const j = await ctx.json();
              serverError = j?.error ?? "";
            } catch {
              /* ignore parse error */
            }
          }
          if (!serverError) serverError = error.message || "Could not reach the server.";
        } else {
          const res = data as { ok?: boolean; emailed?: boolean; error?: string };
          if (res?.ok) {
            saved = true;
            emailed = res.emailed === true;
          } else {
            serverError = res?.error ?? "The server did not confirm the save.";
          }
        }
      }
    } catch (e) {
      serverError = e instanceof Error ? e.message : "Could not reach the server.";
    }

    if (!mountedRef.current) return;
    if (saved) {
      setResult({
        kind: "success",
        title: emailed ? `Receipt emailed to ${donorEmail}` : "Donation saved to history",
        detail: emailed
          ? `${formatCurrency(amount)} recorded and the receipt (${receiptId}) was emailed to the donor.`
          : `${formatCurrency(amount)} recorded (${receiptId}). The receipt couldn't be emailed automatically — download it below and send it to the donor.`,
        downloadUrl,
        filename,
      });
    } else {
      setResult({
        kind: "partial",
        title: "Receipt generated — not yet saved",
        detail: `The receipt PDF (${receiptId}) was created and can be downloaded below, but it couldn't be saved to history or emailed automatically${
          serverError ? `: ${serverError}` : "."
        } Use "Try again", or download the PDF and send it to the donor manually.`,
        downloadUrl,
        filename,
      });
    }
  }

  async function retrySend() {
    if (!payloadRef.current || submitting) return;
    setSubmitting(true);
    try {
      await sendPayload(payloadRef.current);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }

  async function handleGenerate() {
    setFieldError(null);
    const donorName = form.donorName.trim();
    const donorEmail = form.donorEmail.trim();
    const amount = Number(form.amount);
    const fundType = form.fundType;
    const note = form.note.trim();

    if (!donorName) {
      setFieldError("Donor name is required.");
      return;
    }
    if (!donorEmail || !EMAIL_RE.test(donorEmail)) {
      setFieldError("Enter a valid donor email address.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldError("Enter a donation amount greater than $0.");
      return;
    }
    if (amount > 100000) {
      setFieldError("Amount looks too large — please double-check.");
      return;
    }
    if (!fundType) {
      setFieldError("Choose a donation type.");
      return;
    }
    if (!supabase) {
      setFieldError("Not connected. Please reload and try again.");
      return;
    }

    setSubmitting(true);
    setResult(null);

    // Reuse the current session's id so an accidental resend doesn't file a
    // second gift (the edge function is idempotent on a duplicate id).
    if (!sessionIdRef.current) sessionIdRef.current = makeUuid();
    const id = sessionIdRef.current;
    const receiptId = `REC-${id.slice(0, 8)}`;
    // Use the canonical fund label (matches the year-end acknowledgment and
    // avoids the dropped "Fund" wording); prettyFund covers custom slugs.
    const fundLabel = funds.find((f) => f.slug === fundType)?.name ?? prettyFund(fundType);

    try {
      const { generateDonationReceiptPdf } = await import("@/lib/tax-receipt-pdf");
      if (!mountedRef.current) return;
      const { base64, blob, filename } = generateDonationReceiptPdf({
        donorName,
        donorEmail,
        amount,
        fundLabel,
        receiptId,
        note,
      });
      revokeUrl();
      objectUrlRef.current = URL.createObjectURL(blob);
      payloadRef.current = {
        id,
        donorName,
        donorEmail,
        amount,
        fundType,
        note,
        receiptId,
        pdfBase64: base64,
        filename,
      };
      await sendPayload(payloadRef.current);
    } catch (e) {
      if (mountedRef.current) {
        setFieldError(
          `Couldn't generate the receipt PDF: ${e instanceof Error ? e.message : "unknown error"}`,
        );
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }

  if (result) {
    const success = result.kind === "success";
    return (
      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-2xl border p-6 ${
            success ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className={`mt-0.5 h-6 w-6 shrink-0 ${
                success ? "text-green-600" : "text-amber-600"
              }`}
            />
            <div>
              <h3
                className={`font-heading text-lg font-bold ${
                  success ? "text-green-900" : "text-amber-900"
                }`}
              >
                {result.title}
              </h3>
              <p className={`mt-1 text-sm ${success ? "text-green-800" : "text-amber-800"}`}>
                {result.detail}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={result.downloadUrl}
              download={result.filename}
              className="btn-outline flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download receipt PDF
            </a>
            {!success && (
              <button
                onClick={retrySend}
                disabled={submitting}
                className="btn-outline flex items-center gap-2 disabled:opacity-60"
              >
                <Receipt className="h-4 w-4" />
                {submitting ? "Trying…" : "Try again"}
              </button>
            )}
            <button onClick={resetForm} className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-temple-gold/20 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-temple-maroon">
          <Receipt className="h-5 w-5 text-temple-red" />
          Record Cash / Offline Donation
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter a donation received in person. The temple receipt PDF is generated with the
          official letterhead and signature, emailed to the donor, and saved to donation
          history.
        </p>

        {fieldError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fieldError}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="md-name" className="block text-sm font-medium text-gray-700">
              Donor Name
            </label>
            <input
              id="md-name"
              type="text"
              className="input-field mt-1"
              value={form.donorName}
              onChange={(e) => setForm((f) => ({ ...f, donorName: e.target.value }))}
              placeholder="e.g. Ramesh Venkataraman"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="md-email" className="block text-sm font-medium text-gray-700">
              Donor Email
            </label>
            <input
              id="md-email"
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              className="input-field mt-1"
              value={form.donorEmail}
              onChange={(e) => setForm((f) => ({ ...f, donorEmail: e.target.value }))}
              placeholder="donor@example.com"
            />
          </div>
          <div>
            <label htmlFor="md-amount" className="block text-sm font-medium text-gray-700">
              Amount (USD)
            </label>
            <input
              id="md-amount"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              className="input-field mt-1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="15.00"
            />
          </div>
          <div>
            <label htmlFor="md-fund" className="block text-sm font-medium text-gray-700">
              Donation Type
            </label>
            <select
              id="md-fund"
              className="input-field mt-1"
              value={form.fundType}
              onChange={(e) => setForm((f) => ({ ...f, fundType: e.target.value }))}
            >
              {funds.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="md-note" className="block text-sm font-medium text-gray-700">
              Note (optional)
            </label>
            <textarea
              id="md-note"
              rows={2}
              className="input-field mt-1"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Cash received at temple on Guru Purnima"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={submitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <Receipt className="h-4 w-4" />
            {submitting ? "Generating…" : "Generate & Send Receipt"}
          </button>
        </div>
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
          onClick={() => setTab("record")}
          className={`relative -mb-px px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "record"
              ? "border-b-2 border-temple-red text-temple-red"
              : "text-gray-600 hover:text-temple-maroon"
          }`}
        >
          Record Donation
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
        {tab === "inflow" ? (
          <DonationInflowTab />
        ) : tab === "record" ? (
          <RecordDonationTab />
        ) : (
          <DonationTypesTab />
        )}
      </div>
    </div>
  );
}
