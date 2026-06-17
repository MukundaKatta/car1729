"use client";

import { useEffect, useState } from "react";
import { HeartHandshake, Plus, Edit2, Trash2 } from "lucide-react";
import { useSensitiveAdminApproval } from "@/lib/admin-approval";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import type { VolunteerOpportunity } from "@/types/database";

type FormState = {
  id: string | null;
  title: string;
  description: string;
  whatsapp_group_url: string;
  contact_name: string;
  contact_phone: string;
  schedule: string;
  is_active: boolean;
  sort_order: number;
};

const emptyForm: FormState = {
  id: null,
  title: "",
  description: "",
  whatsapp_group_url: "",
  contact_name: "",
  contact_phone: "",
  schedule: "",
  is_active: true,
  sort_order: 0,
};

export default function AdminVolunteersPage() {
  const adminEmail = useAuthStore((state) => state.authUser?.email ?? state.user?.email ?? null);
  const { adminRole, pendingApprovals, dismissPendingApproval, confirmOrQueue } =
    useSensitiveAdminApproval(adminEmail);
  const [items, setItems] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("volunteer_opportunities")
      .select("*")
      .order("sort_order");
    setItems((data ?? []) as unknown as VolunteerOpportunity[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startNew() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(item: VolunteerOpportunity) {
    setForm({
      id: item.id,
      title: item.title,
      description: item.description,
      whatsapp_group_url: item.whatsapp_group_url ?? "",
      contact_name: item.contact_name ?? "",
      contact_phone: item.contact_phone ?? "",
      schedule: item.schedule ?? "",
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setShowForm(true);
  }

  async function save() {
    if (!supabase) return;
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description,
      whatsapp_group_url: form.whatsapp_group_url || null,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      schedule: form.schedule || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    const { error: writeErr } = form.id
      ? await supabase
          .from("volunteer_opportunities")
          .update(payload)
          .eq("id", form.id)
      : await supabase.from("volunteer_opportunities").insert(payload);
    setSaving(false);
    if (writeErr) {
      setError(writeErr.message);
      return;
    }
    setShowForm(false);
    setForm(emptyForm);
    refresh();
  }

  async function remove(item: VolunteerOpportunity) {
    if (!supabase) return;
    await confirmOrQueue({
      action: "delete_volunteer",
      resourceLabel: item.title,
      confirmMessage: `Delete "${item.title}"?`,
      approvalReason: `Delete volunteer opportunity "${item.title}"`,
      run: async () => {
        if (!supabase) {
          setError("Not connected. Please reload.");
          return;
        }
        const { error: delErr } = await supabase
          .from("volunteer_opportunities")
          .delete()
          .eq("id", item.id);
        if (delErr) {
          setError(delErr.message);
          return;
        }
        await refresh();
      },
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="section-heading flex items-center gap-2">
          <HeartHandshake className="h-7 w-7 text-temple-red" />
          Volunteer Opportunities
        </h1>
        <button onClick={startNew} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Opportunity
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
          <h2 className="font-heading text-lg font-bold text-temple-maroon">
            {form.id ? "Edit Opportunity" : "New Opportunity"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Annadanam Seva"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                className="input-field mt-1"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                WhatsApp Group URL
              </label>
              <input
                type="url"
                className="input-field mt-1"
                value={form.whatsapp_group_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, whatsapp_group_url: e.target.value }))
                }
                placeholder="https://chat.whatsapp.com/…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Name
              </label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.contact_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact Phone
              </label>
              <input
                type="tel"
                className="input-field mt-1"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contact_phone: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Schedule</label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.schedule}
                onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                placeholder="Sundays 10 AM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort Order</label>
              <input
                type="number"
                className="input-field mt-1"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                }
              />
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
                setForm(emptyForm);
                setError(null);
              }}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No volunteer opportunities yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-lg font-bold text-temple-maroon">
                    {item.title}
                  </h3>
                  {item.schedule && (
                    <p className="text-xs text-gray-500">{item.schedule}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {item.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-3">{item.description}</p>
              )}
              {item.whatsapp_group_url && (
                <a
                  href={item.whatsapp_group_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-green-600 hover:underline"
                >
                  Join Group
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
