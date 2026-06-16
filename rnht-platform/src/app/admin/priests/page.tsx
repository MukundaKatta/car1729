"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Edit2, Trash2, Star } from "lucide-react";
import { useSensitiveAdminApproval } from "@/lib/admin-approval";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import type { Priest } from "@/types/database";

type FormState = {
  id: string | null;
  name: string;
  title: string;
  bio: string;
  image_url: string;
  phone: string;
  whatsapp_url: string;
  email: string;
  years_experience: number | "";
  specializations: string;
  languages: string;
  is_head: boolean;
  is_active: boolean;
  sort_order: number;
};

const emptyForm: FormState = {
  id: null,
  name: "",
  title: "Priest",
  bio: "",
  image_url: "",
  phone: "",
  whatsapp_url: "",
  email: "",
  years_experience: "",
  specializations: "",
  languages: "",
  is_head: false,
  is_active: true,
  sort_order: 0,
};

export default function AdminPriestsPage() {
  const adminEmail = useAuthStore((state) => state.authUser?.email ?? state.user?.email ?? null);
  const { adminRole, pendingApprovals, dismissPendingApproval, confirmOrQueue } =
    useSensitiveAdminApproval(adminEmail);
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: readErr } = await supabase
      .from("priests")
      .select("*")
      .order("sort_order");
    if (readErr) {
      setError(`Failed to load priests: ${readErr.message}`);
      setPriests([]);
      setLoading(false);
      return;
    }
    setPriests((data ?? []) as unknown as Priest[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startNew() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(priest: Priest) {
    setForm({
      id: priest.id,
      name: priest.name,
      title: priest.title,
      bio: priest.bio,
      image_url: priest.image_url ?? "",
      phone: priest.phone ?? "",
      whatsapp_url: priest.whatsapp_url ?? "",
      email: priest.email ?? "",
      years_experience: priest.years_experience ?? "",
      specializations: (priest.specializations ?? []).join(", "),
      languages: (priest.languages ?? []).join(", "),
      is_head: priest.is_head,
      is_active: priest.is_active,
      sort_order: priest.sort_order,
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
    const toArray = (csv: string) =>
      csv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const specializations = toArray(form.specializations);
    const languages = toArray(form.languages);

    if (specializations.length < 1 || specializations.length > 20) {
      setError("Add between 1 and 20 specializations.");
      return;
    }
    if (specializations.some((s) => s.length > 100)) {
      setError("Each specialization must be 100 characters or fewer.");
      return;
    }
    if (languages.length < 1 || languages.length > 20) {
      setError("Add between 1 and 20 languages.");
      return;
    }
    if (languages.some((s) => s.length > 50)) {
      setError("Each language must be 50 characters or fewer.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      title: form.title.trim() || "Priest",
      bio: form.bio,
      image_url: form.image_url || null,
      phone: form.phone || null,
      whatsapp_url: form.whatsapp_url || null,
      email: form.email || null,
      years_experience:
        form.years_experience === "" ? null : Number(form.years_experience),
      specializations,
      languages,
      is_head: form.is_head,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    // If setting a new head, demote others first (partial unique index
    // enforces single head, so we can't have two `true` rows at once).
    // Abort if the demote fails so we don't proceed on a false premise.
    // (Full atomicity of demote+write ideally needs a DB transaction/RPC — see
    // backlog. As a client-side safeguard we remember the previously-demoted
    // head and re-promote it if the subsequent write fails, so a failed save
    // never strands the table with zero heads.)
    let demotedHeadId: string | null = null;
    if (form.is_head) {
      const previousHead = priests.find(
        (p) => p.is_head && p.id !== form.id,
      );
      demotedHeadId = previousHead?.id ?? null;
      const { error: demoteErr } = await supabase
        .from("priests")
        .update({ is_head: false })
        .eq("is_head", true);
      if (demoteErr) {
        setSaving(false);
        setError(demoteErr.message);
        return;
      }
    }

    const { error: writeErr } = form.id
      ? await supabase.from("priests").update(payload).eq("id", form.id)
      : await supabase.from("priests").insert(payload);
    if (writeErr) {
      // The new head was never committed but the prior head was demoted —
      // re-promote it so we don't leave the table with zero heads.
      if (demotedHeadId) {
        await supabase
          .from("priests")
          .update({ is_head: true })
          .eq("id", demotedHeadId);
      }
      setSaving(false);
      setError(writeErr.message);
      return;
    }
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    refresh();
  }

  async function remove(priest: Priest) {
    if (!supabase) return;
    await confirmOrQueue({
      action: "delete_priest",
      resourceLabel: priest.name,
      confirmMessage: `Delete "${priest.name}"? This can't be undone.`,
      approvalReason: `Delete priest "${priest.name}"`,
      run: async () => {
        const { error: delErr } = await supabase.from("priests").delete().eq("id", priest.id);
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
          <Users className="h-7 w-7 text-temple-red" />
          Priests
        </h1>
        <button onClick={startNew} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Priest
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
            {form.id ? "Edit Priest" : "New Priest"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Head Priest"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                className="input-field mt-1"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Photo URL</label>
              <input
                type="url"
                className="input-field mt-1"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="/priests/name.jpg or https://…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                className="input-field mt-1"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+15125450473"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp URL</label>
              <input
                type="url"
                className="input-field mt-1"
                value={form.whatsapp_url}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp_url: e.target.value }))}
                placeholder="https://wa.me/15125450473"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="input-field mt-1"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                type="number"
                className="input-field mt-1"
                value={form.years_experience}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    years_experience:
                      e.target.value === "" ? "" : parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Specializations (comma-separated)
              </label>
              <input
                type="text"
                className="input-field mt-1"
                maxLength={2100}
                value={form.specializations}
                onChange={(e) =>
                  setForm((f) => ({ ...f, specializations: e.target.value }))
                }
                placeholder="Vastu, Astrology, Homam"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Languages (comma-separated)
              </label>
              <input
                type="text"
                className="input-field mt-1"
                maxLength={1100}
                value={form.languages}
                onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
                placeholder="English, Telugu, Tamil, Sanskrit"
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
            <div className="flex items-end gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_head}
                  onChange={(e) => setForm((f) => ({ ...f, is_head: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Head priest</span>
              </label>
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
        ) : priests.length === 0 ? (
          <p className="text-sm text-gray-500">No priests yet.</p>
        ) : (
          priests.map((priest) => (
            <div key={priest.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-lg font-bold text-temple-maroon">
                      {priest.name}
                    </h3>
                    {priest.is_head && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-temple-gold/20 px-2 py-0.5 text-xs font-semibold text-temple-maroon">
                        <Star className="h-3 w-3 text-temple-gold" />
                        Head
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-temple-red">{priest.title}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(priest)}
                    className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(priest)}
                    className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {priest.bio && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-3">{priest.bio}</p>
              )}
              {priest.whatsapp_url && (
                <a
                  href={priest.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-green-600 hover:underline"
                >
                  {priest.whatsapp_url}
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
