"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Video,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Upload,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  useSlideshowStore,
  type Slide,
  type SlideType,
} from "@/store/slideshow";
import { supabase } from "@/lib/supabase";
import { pushOverlay } from "@/lib/overlay-stack";

function FileUploader({
  onUpload,
  currentUrl,
  mediaType,
}: {
  onUpload: (url: string, type: SlideType) => void;
  currentUrl: string;
  mediaType: SlideType;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setError("File type not allowed. Use JPEG, PNG, WebP, GIF, MP4, or WebM.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum 50MB.");
      return;
    }
    if (!supabase) {
      setError("Storage is not configured. Add Supabase env vars.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `slide_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("slideshow")
        .upload(filename, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("slideshow")
        .getPublicUrl(filename);
      const type = file.type.startsWith("video/") ? "video" : "image";
      onUpload(urlData.publicUrl, type as SlideType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label htmlFor="slide-file-input" className="block text-sm font-medium text-gray-700 mb-1">
        Upload Photo / Video
      </label>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload photo or video. Drop a file here, or activate to browse."
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-temple-gold ${
          dragOver
            ? "border-temple-gold bg-temple-gold/5"
            : "border-gray-300 hover:border-temple-gold/50 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileRef}
          id="slide-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-temple-gold animate-spin" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : currentUrl ? (
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-gray-200">
              {mediaType === "video" ? (
                <video src={currentUrl} className="h-32 w-full object-cover" muted playsInline />
              ) : (
                <Image
                  src={currentUrl}
                  alt="Current"
                  width={512}
                  height={256}
                  unoptimized
                  className="h-32 w-full object-cover"
                />
              )}
            </div>
            <p className="text-xs text-gray-500">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              Drop a photo or video here, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, WebP, GIF, MP4, WebM — Max 50MB
            </p>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SlideEditor({
  slide,
  onClose,
}: {
  slide: Slide | null;
  onClose: () => void;
}) {
  const { addSlide, updateSlide } = useSlideshowStore();
  const slides = useSlideshowStore((s) => s.slides);

  const isNew = !slide;
  // New slides go after the current max sort_order — using slides.length can
  // collide with an existing order after deletes/reorders (nondeterministic tie).
  const nextSortOrder = slides.length
    ? Math.max(...slides.map((s) => s.sortOrder)) + 1
    : 0;
  const [form, setForm] = useState<Omit<Slide, "id">>({
    type: slide?.type || "image",
    url: slide?.url || "",
    title: slide?.title || "",
    subtitle: slide?.subtitle || "",
    ctaText: slide?.ctaText || "Learn More",
    ctaLink: slide?.ctaLink || "/services",
    isActive: slide?.isActive ?? true,
    showText: slide?.showText ?? true,
    sortOrder: slide?.sortOrder ?? nextSortOrder,
  });
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus management: remember what was focused, move focus into the dialog,
    // trap Tab within it, close on Escape, and restore focus to the trigger on
    // close. Mirrors the shared pattern in ServiceDetailModal.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    // Android back button closes the modal (this component only mounts when open).
    const unregister = pushOverlay(onClose);
    return () => {
      document.removeEventListener("keydown", handleKey);
      unregister();
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  // Accept only a same-origin relative path ("/services") or an absolute https URL.
  // Rejects javascript:, data:, http:, protocol-relative ("//evil"), and other
  // schemes that would turn a saved value into an off-site / unsafe jump.
  const isSafeLink = (value: string) => {
    if (value.startsWith("//")) return false;
    if (value.startsWith("/")) return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    setSaveError("");
    if (!form.title.trim()) {
      setSaveError("Please enter a title for this slide.");
      return;
    }
    const ctaLink = form.ctaLink.trim();
    const url = form.url.trim();
    if (ctaLink && !isSafeLink(ctaLink)) {
      setSaveError("Button Link must be an internal path starting with “/” (e.g. /services) or an https:// URL.");
      return;
    }
    // Skip validating the placeholder shown for inline-uploaded data URLs.
    if (url && !url.startsWith("data:") && !isSafeLink(url)) {
      setSaveError("Media URL must be an internal path starting with “/” (e.g. /slideshow/photo.jpg) or an https:// URL.");
      return;
    }
    // Require a photo or video: previously a slide with no media was created
    // silently (and a failed upload — e.g. missing storage bucket — left the
    // media empty without blocking the save).
    if (!url) {
      setSaveError("Please add a photo or video for this slide — upload one above, or paste an image/video URL.");
      return;
    }
    const normalized = { ...form, ctaLink, url };
    setSaving(true);
    const ok = isNew
      ? await addSlide({ ...normalized, id: `slide-${Date.now()}` })
      : await updateSlide(slide.id, normalized);
    setSaving(false);
    if (!ok) {
      setSaveError("Couldn't save the slide. Check your connection and try again.");
      return;
    }
    onClose();
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slide-editor-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 id="slide-editor-title" className="font-heading text-lg font-bold text-gray-900">
            {isNew ? "Add New Slide" : "Edit Slide"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* File Upload */}
          <FileUploader
            currentUrl={form.url}
            mediaType={form.type}
            onUpload={(url, type) => setForm({ ...form, url, type })}
          />

          {/* Or enter URL manually */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Or enter URL directly
            </label>
            <div className="mt-1 flex gap-2">
              <div className="flex gap-1 shrink-0">
                {(["image", "video"] as SlideType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, type })}
                    className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                      form.type === type
                        ? "border-temple-red bg-red-50 text-temple-red"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {type === "image" ? <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> : <Video className="h-3.5 w-3.5" aria-hidden="true" />}
                    {type}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="input-field flex-1"
                value={form.url.startsWith("data:") ? "(uploaded file)" : form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="/slideshow/photo.jpg or https://..."
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Leave empty for default temple gradient background
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              className="input-field mt-1"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Rudra Narayana Hindu Temple"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subtitle / Description
            </label>
            <textarea
              className="input-field mt-1"
              rows={2}
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="Describe this slide..."
            />
          </div>

          {/* CTA */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Button Text
              </label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                placeholder="Book a Pooja"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Button Link
              </label>
              <input
                type="text"
                className="input-field mt-1"
                value={form.ctaLink}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                placeholder="/services"
              />
            </div>
          </div>

          {/* Show Text Overlay */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showText}
              onChange={(e) => setForm({ ...form, showText: e.target.checked })}
              className="h-4 w-4 rounded text-temple-red"
            />
            <span className="text-sm font-medium text-gray-700">
              Show text overlay (title, subtitle)
            </span>
          </label>

          {/* Active */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded text-temple-red"
            />
            <span className="text-sm font-medium text-gray-700">
              Active (visible on homepage)
            </span>
          </label>
        </div>

        {saveError && (
          <p className="px-6 text-sm text-red-600" role="alert">{saveError}</p>
        )}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title || saving}
            className="btn-primary"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : isNew ? "Add Slide" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSlideshowPage() {
  const { slides, removeSlide, updateSlide, reorderSlides, fetchSlides } =
    useSlideshowStore();
  const [editingSlide, setEditingSlide] = useState<Slide | null | "new">(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const sortedSlides = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);

  const moveSlide = async (index: number, direction: "up" | "down") => {
    const newSlides = [...sortedSlides];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newSlides.length) return;
    [newSlides[index], newSlides[swapIndex]] = [
      newSlides[swapIndex],
      newSlides[index],
    ];
    setReorderError(null);
    const ok = await reorderSlides(
      newSlides.map((s, i) => ({ ...s, sortOrder: i }))
    );
    if (!ok) {
      setReorderError("Failed to save the new slide order. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Back to admin"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="section-heading flex items-center gap-2">
            <ImageIcon className="h-7 w-7 text-temple-red" aria-hidden="true" />
            Hero Slideshow
          </h1>
          <p className="mt-1 text-gray-600">
            Upload photos & videos, add text, and manage homepage slides
          </p>
        </div>
        <button
          onClick={() => setEditingSlide("new")}
          className="btn-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Slide
        </button>
      </div>

      {reorderError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {reorderError}
        </div>
      )}

      {/* Slide List */}
      <div className="mt-8 space-y-3">
        {sortedSlides.length === 0 && (
          <div className="card p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
            <p className="mt-4 text-gray-600">No slides yet. Upload your first photo or video to get started.</p>
            <button
              onClick={() => setEditingSlide("new")}
              className="btn-primary mt-4"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload First Slide
            </button>
          </div>
        )}

        {sortedSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`card overflow-hidden ${
              !slide.isActive ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-stretch">
              {/* Thumbnail */}
              <div className="w-32 shrink-0 sm:w-48">
                {slide.url ? (
                  slide.type === "video" ? (
                    <div className="flex h-full items-center justify-center bg-gray-900">
                      <Video className="h-8 w-8 text-white/60" />
                    </div>
                  ) : (
                    <Image
                      src={slide.url}
                      alt={slide.title}
                      width={400}
                      height={300}
                      unoptimized
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23e5e7eb'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' font-size='14' text-anchor='middle' dy='.3em'%3EImage not found%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-temple-maroon to-temple-red">
                    <span className="text-2xl text-white/40">&#x0950;</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 items-center gap-3 p-4">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveSlide(index, "up")}
                    disabled={index === 0}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <GripVertical className="h-4 w-4 text-gray-300" />
                  <button
                    onClick={() => moveSlide(index, "down")}
                    disabled={index === sortedSlides.length - 1}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {slide.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        slide.type === "video"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {slide.type}
                    </span>
                    {!slide.isActive && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                    {slide.subtitle || "No description"}
                  </p>
                  {slide.ctaText && (
                    <p className="mt-1 text-xs text-temple-red">
                      {slide.ctaText} &rarr; {slide.ctaLink}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={async () => {
                      setReorderError(null);
                      const ok = await updateSlide(slide.id, { isActive: !slide.isActive });
                      if (!ok) setReorderError("Couldn't update the slide's visibility. Please try again.");
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label={
                      slide.isActive ? "Hide slide" : "Show slide"
                    }
                    title={slide.isActive ? "Hide" : "Show"}
                  >
                    {slide.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingSlide(slide)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-temple-red"
                    aria-label="Edit slide"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {deleteConfirm === slide.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          setReorderError(null);
                          const ok = await removeSlide(slide.id);
                          setDeleteConfirm(null);
                          if (!ok) setReorderError("Couldn't delete the slide. Please try again.");
                        }}
                        className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(slide.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      aria-label="Delete slide"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help */}
      <div className="mt-8 rounded-lg bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-blue-900">Tips</h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>
            Upload high-quality photos (1920x800px recommended) or short MP4 videos.
          </li>
          <li>
            Drag and drop files directly onto the upload area, or click to browse.
          </li>
          <li>
            Add a title and description for each slide — these appear as overlay text on the homepage.
          </li>
          <li>
            Each slide needs a photo or video (upload one, or paste an image/video URL).
          </li>
          <li>
            Slides auto-rotate every 6 seconds. Reorder with arrows, toggle visibility with the eye icon.
          </li>
        </ul>
      </div>

      {/* Edit Modal */}
      {editingSlide && (
        <SlideEditor
          slide={editingSlide === "new" ? null : editingSlide}
          onClose={() => setEditingSlide(null)}
        />
      )}
    </div>
  );
}
