"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Newspaper, Eye, EyeOff } from "lucide-react";
import { useSensitiveAdminApproval } from "@/lib/admin-approval";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import type { NewsPost } from "@/types/database";

type Category = NewsPost["category"];

const categoryLabels: Record<Category, string> = {
  announcement: "Announcement",
  festival: "Festival",
  update: "Update",
  event: "Event",
};

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
  title: string;
  slug: string;
  excerpt: string;
  body_markdown: string;
  category: Category;
  hero_image_url: string;
  is_published: boolean;
  published_at: string | null;
};

const emptyForm: FormState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  body_markdown: "",
  category: "announcement",
  hero_image_url: "",
  is_published: false,
  published_at: null,
};

export default function AdminNewsPage() {
  const adminEmail = useAuthStore((state) => state.authUser?.email ?? state.user?.email ?? null);
  const { adminRole, pendingApprovals, dismissPendingApproval, confirmOrQueue } =
    useSensitiveAdminApproval(adminEmail);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("news_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setPosts((data ?? []) as unknown as NewsPost[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function startNew() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(post: NewsPost) {
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body_markdown: post.body_markdown,
      category: post.category,
      hero_image_url: post.hero_image_url ?? "",
      is_published: post.is_published,
      published_at: post.published_at,
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
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim(),
      body_markdown: form.body_markdown,
      category: form.category,
      hero_image_url: form.hero_image_url.trim() || null,
      is_published: form.is_published,
      // Preserve the original publish time on edits; only stamp now when a post
      // is being published for the first time.
      published_at: form.is_published ? (form.published_at ?? new Date().toISOString()) : null,
    };
    const { error } = form.id
      ? await supabase.from("news_posts").update(payload).eq("id", form.id)
      : await supabase.from("news_posts").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setShowForm(false);
    setForm(emptyForm);
    refresh();
  }

  async function togglePublish(post: NewsPost) {
    if (!supabase) return;
    const nextPublished = !post.is_published;
    await confirmOrQueue({
      action: "publish_news_post",
      resourceLabel: post.title,
      confirmMessage: nextPublished
        ? `Publish "${post.title}" now?`
        : `Unpublish "${post.title}" and remove it from the public feed?`,
      approvalReason: `${nextPublished ? "Publish" : "Unpublish"} news post "${post.title}"`,
      run: async () => {
        const { error } = await supabase
          .from("news_posts")
          .update({
            is_published: nextPublished,
            published_at: nextPublished ? (post.published_at ?? new Date().toISOString()) : null,
          })
          .eq("id", post.id);
        if (error) {
          setError(error.message);
          return;
        }
        await refresh();
      },
    });
  }

  async function remove(post: NewsPost) {
    if (!supabase) return;
    await confirmOrQueue({
      action: "delete_news_post",
      resourceLabel: post.title,
      confirmMessage: `Delete "${post.title}"? This can't be undone.`,
      approvalReason: `Delete news post "${post.title}"`,
      run: async () => {
        const { error } = await supabase.from("news_posts").delete().eq("id", post.id);
        if (error) {
          setError(error.message);
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
          <Newspaper className="h-7 w-7 text-temple-red" />
          News &amp; Updates
        </h1>
        <button onClick={startNew} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Post
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
            {form.id ? "Edit Post" : "New Post"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    title: e.target.value,
                    slug: f.id ? f.slug : slugify(e.target.value),
                  }))
                }
                placeholder="Maha Shivaratri 2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                className="input-field mt-1 font-mono text-sm"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="maha-shivaratri-2026"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                className="input-field mt-1"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
              >
                {(Object.keys(categoryLabels) as Category[]).map((key) => (
                  <option key={key} value={key}>
                    {categoryLabels[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Hero Image URL</label>
              <input
                type="url"
                className="input-field mt-1"
                value={form.hero_image_url}
                onChange={(e) => setForm((f) => ({ ...f, hero_image_url: e.target.value }))}
                placeholder="https://…/news-image.jpg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Excerpt</label>
              <textarea
                className="input-field mt-1"
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="A one or two line summary shown on cards."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Body (Markdown)</label>
              <textarea
                className="input-field mt-1 font-mono text-sm"
                rows={10}
                value={form.body_markdown}
                onChange={(e) => setForm((f) => ({ ...f, body_markdown: e.target.value }))}
                placeholder="# Heading&#10;&#10;Write the full article in markdown."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                />
                <span className="text-sm text-gray-700">Publish now</span>
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
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden sm:table-cell">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden md:table-cell">
                Published
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
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  No posts yet. Click “New Post” to create one.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-900">{post.title}</p>
                    <p className="text-xs text-gray-500">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                    {categoryLabels[post.category]}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                    {post.is_published ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        <Eye className="h-3 w-3" />
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => togglePublish(post)}
                        className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                        title={post.is_published ? "Unpublish" : "Publish"}
                      >
                        {post.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(post)}
                        aria-label={`Edit post: ${post.title}`}
                        className="rounded-md border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(post)}
                        aria-label={`Delete post: ${post.title}`}
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
