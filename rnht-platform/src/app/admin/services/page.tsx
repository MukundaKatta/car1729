"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye, EyeOff, FileText, Upload, Loader2, Image as ImageIcon, X } from "lucide-react";
import { useSensitiveAdminApproval } from "@/lib/admin-approval";
import { supabase } from "@/lib/supabase";
import { sampleCategories, sampleServices } from "@/lib/sample-data";
import { useAuthStore } from "@/store/auth";
import type { Service, ServiceCategory } from "@/types/database";

/**
 * Simplified service admin:
 * - Reads/writes directly against Supabase `services` + `service_categories`
 * - Price, duration, location_type, what's included, items to bring are
 *   NO LONGER exposed in the UI (per product decision). Existing rows keep
 *   their values in the DB; new rows leave them at defaults.
 * - Admin role gate is handled by `src/app/admin/layout.tsx`.
 */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

type FormState = {
  id: string | null;
  name: string;
  slug: string;
  category_id: string;
  short_description: string;
  full_description: string;
  significance: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

const emptyForm: FormState = {
  id: null,
  name: "",
  slug: "",
  category_id: "",
  short_description: "",
  full_description: "",
  significance: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
};

const SERVICE_IMAGE_BUCKET = "service-images";

export default function AdminServicesPage() {
  const adminEmail = useAuthStore((state) => state.authUser?.email ?? state.user?.email ?? null);
  const { adminRole, pendingApprovals, dismissPendingApproval, confirmOrQueue } =
    useSensitiveAdminApproval(adminEmail);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    const [servicesResp, categoriesResp] = await Promise.all([
      supabase.from("services").select("*").order("sort_order").order("name"),
      supabase.from("service_categories").select("*").order("sort_order"),
    ]);
    setServices((servicesResp.data ?? []) as Service[]);
    setCategories((categoriesResp.data ?? []) as ServiceCategory[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startNew() {
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? "" });
    setShowForm(true);
  }

  function startEdit(service: Service) {
    setForm({
      id: service.id,
      name: service.name,
      slug: service.slug,
      category_id: service.category_id,
      short_description: service.short_description,
      full_description: service.full_description ?? "",
      significance: service.significance ?? "",
      image_url: service.image_url ?? "",
      is_active: service.is_active,
      sort_order: service.sort_order ?? 0,
    });
    setShowForm(true);
  }

  async function uploadServiceImage(file: File) {
    if (!supabase) return;
    setError(null);
    setUploadingImage(true);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const baseName = slugify(form.name || file.name.replace(/\.[^.]+$/, "")) || "service-image";
    const storagePath = `${new Date().getFullYear()}/${baseName}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(SERVICE_IMAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      setError(
        `Image upload failed: ${uploadError.message}. Make sure the "${SERVICE_IMAGE_BUCKET}" Storage bucket exists and is public-read.`
      );
      setUploadingImage(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(SERVICE_IMAGE_BUCKET).getPublicUrl(storagePath);

    setForm((current) => ({ ...current, image_url: publicUrl }));
    setUploadingImage(false);
  }

  async function save() {
    if (!supabase) return;
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.category_id) {
      setError("Category is required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      category_id: form.category_id,
      short_description: form.short_description.trim(),
      full_description: form.full_description || null,
      significance: form.significance || null,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    const { error: writeError } = form.id
      ? await supabase.from("services").update(payload).eq("id", form.id)
      : await supabase.from("services").insert(payload);
    setSaving(false);
    if (writeError) {
      setError(writeError.message);
      return;
    }
    setShowForm(false);
    setForm(emptyForm);
    refresh();
  }

  async function syncCatalogServices() {
    if (!supabase) return;
    setError(null);
    setSyncingCatalog(true);

    const categoryPayload = sampleCategories.map((category) => ({
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      sort_order: category.sort_order,
    }));

    const { error: categoriesError } = await supabase
      .from("service_categories")
      .upsert(categoryPayload as never, { onConflict: "slug" });

    if (categoriesError) {
      setError(categoriesError.message);
      setSyncingCatalog(false);
      return;
    }

    const { data: liveCategories, error: liveCategoriesError } = await supabase
      .from("service_categories")
      .select("*")
      .order("sort_order");

    if (liveCategoriesError || !liveCategories) {
      setError(liveCategoriesError?.message || "Unable to load service categories.");
      setSyncingCatalog(false);
      return;
    }

    const categoryIdBySlug = new Map(liveCategories.map((category) => [category.slug, category.id]));
    const categorySlugBySampleId = new Map(sampleCategories.map((category) => [category.id, category.slug]));

    const { data: existingServices } = await supabase
      .from("services")
      .select("id, slug, image_url");

    const existingServiceBySlug = new Map(
      (existingServices ?? []).map((service) => [service.slug, service])
    );

    const servicePayload = sampleServices
      .map((service) => {
        const categorySlug = categorySlugBySampleId.get(service.category_id);
        const liveCategoryId = categorySlug ? categoryIdBySlug.get(categorySlug) : null;
        if (!liveCategoryId) return null;

        const existing = existingServiceBySlug.get(service.slug);

        return {
          ...(existing?.id ? { id: existing.id } : {}),
          category_id: liveCategoryId,
          name: service.name,
          slug: service.slug,
          short_description: service.short_description,
          full_description: service.full_description,
          significance: service.significance,
          items_to_bring: service.items_to_bring,
          whats_included: service.whats_included,
          image_url: existing?.image_url ?? service.image_url ?? null,
          price: service.price,
          price_type: service.price_type,
          price_tiers: service.price_tiers,
          suggested_donation: service.suggested_donation,
          duration_minutes: service.duration_minutes,
          location_type: service.location_type,
          is_active: service.is_active,
          sort_order: service.sort_order,
        };
      })
      .filter(Boolean);

    const { error: servicesError } = await supabase
      .from("services")
      .upsert(servicePayload as never, { onConflict: "slug" });

    setSyncingCatalog(false);

    if (servicesError) {
      setError(servicesError.message);
      return;
    }

    await refresh();
  }

  async function toggleActive(service: Service) {
    if (!supabase) return;
    const nextActive = !service.is_active;
    const result = await confirmOrQueue({
      action: nextActive ? "activate_service" : "deactivate_service",
      resourceLabel: service.name,
      confirmMessage: nextActive
        ? `Restore "${service.name}" to the live services list?`
        : `Deactivate "${service.name}" from the live services list?`,
      approvalReason: `${nextActive ? "Restore" : "Deactivate"} service "${service.name}"`,
      run: async () => {
        await supabase
          .from("services")
          .update({ is_active: nextActive })
          .eq("id", service.id);
        await refresh();
      },
    });
    if (result.executed) return;
  }

  async function remove(service: Service) {
    if (!supabase) return;
    await confirmOrQueue({
      action: "delete_service",
      resourceLabel: service.name,
      confirmMessage: `Delete "${service.name}"? This can't be undone.`,
      approvalReason: `Delete service "${service.name}"`,
      run: async () => {
        await supabase.from("services").delete().eq("id", service.id);
        await refresh();
      },
    });
  }

  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="section-heading flex items-center gap-2">
          <FileText className="h-7 w-7 text-temple-red" />
          Manage Services
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/services/upload"
            className="btn-outline flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload PDF
          </Link>
          <button
            onClick={syncCatalogServices}
            disabled={syncingCatalog}
            className="btn-outline flex items-center gap-2 disabled:opacity-60"
          >
            {syncingCatalog ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {syncingCatalog ? "Syncing…" : "Sync Catalog"}
          </button>
          <button onClick={startNew} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
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
            {form.id ? "Edit Service" : "New Service"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
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
                placeholder="Ganapathi Homam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                className="input-field mt-1 font-mono text-sm"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                className="input-field mt-1"
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Short Description
              </label>
              <textarea
                className="input-field mt-1"
                rows={2}
                value={form.short_description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, short_description: e.target.value }))
                }
                placeholder="One or two lines shown on the service card."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Description
              </label>
              <textarea
                className="input-field mt-1"
                rows={5}
                value={form.full_description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_description: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Spiritual Significance
              </label>
              <textarea
                className="input-field mt-1"
                rows={3}
                value={form.significance}
                onChange={(e) => setForm((f) => ({ ...f, significance: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Service Image
              </label>
              <div className="mt-1 rounded-xl border border-dashed border-temple-gold/30 bg-temple-cream/30 p-4">
                {form.image_url ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.image_url}
                      alt={form.name || "Service image preview"}
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-temple-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-temple-maroon/90">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Replace image
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadServiceImage(file);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                      >
                        <X className="h-4 w-4" />
                        Remove image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex h-32 items-center justify-center rounded-lg bg-white text-gray-400">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm">No image uploaded yet</p>
                      </div>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-temple-maroon px-4 py-2 text-sm font-semibold text-white hover:bg-temple-maroon/90">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Upload image
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadServiceImage(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Uploads use Supabase Storage bucket{" "}
                      <span className="font-mono">{SERVICE_IMAGE_BUCKET}</span>.
                    </p>
                  </div>
                )}
              </div>
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

      <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden sm:table-cell">
                Category
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
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  No services yet. Click &ldquo;Add Service&rdquo; to create one.
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-start gap-3">
                      {service.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-temple-cream text-temple-maroon">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <p className="line-clamp-1 text-xs text-gray-500">
                          {service.short_description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {categoryName(service.category_id)}
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">
                    {service.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        <Eye className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        <EyeOff className="h-3 w-3" />
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => toggleActive(service)}
                        className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        title={service.is_active ? "Hide" : "Show"}
                        aria-label={service.is_active ? `Hide ${service.name}` : `Show ${service.name}`}
                      >
                        {service.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(service)}
                        className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        aria-label={`Edit ${service.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(service)}
                        className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${service.name}`}
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
