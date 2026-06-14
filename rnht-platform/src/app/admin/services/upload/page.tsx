"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, Trash2, Check } from "lucide-react";
import { useSensitiveAdminApproval } from "@/lib/admin-approval";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";
import type { ServicePdf } from "@/types/database";

/**
 * Admin services PDF upload.
 *
 * Keeps things simple for now:
 * 1. Admin uploads a PDF → stored in Supabase Storage `service-pdfs` bucket
 * 2. A row is inserted into `service_pdfs` with the public URL
 * 3. The newest uploaded row becomes `is_current=true` (so /services shows it)
 *
 * Auto-parsing the PDF into candidate service records (the "extract + review"
 * flow from the plan) is left as a follow-up and clearly marked below.
 */
const BUCKET = "service-pdfs";

export default function AdminServicesUploadPage() {
  const adminEmail = useAuthStore((state) => state.authUser?.email ?? state.user?.email ?? null);
  const { adminRole, pendingApprovals, dismissPendingApproval, confirmOrQueue } =
    useSensitiveAdminApproval(adminEmail);
  const [pdfs, setPdfs] = useState<ServicePdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from("service_pdfs")
      .select("*")
      .order("created_at", { ascending: false });
    if (fetchErr) setError(fetchErr.message);
    setPdfs((data ?? []) as unknown as ServicePdf[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const storagePath = `${new Date().getFullYear()}/${timestamp}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) {
      setError(
        `Upload failed: ${uploadErr.message}. Make sure the "${BUCKET}" Storage bucket exists and is public-read.`
      );
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // Mark any previous "current" row as not current so only one exists.
    await supabase
      .from("service_pdfs")
      .update({ is_current: false })
      .eq("is_current", true);

    const { error: insertErr } = await supabase.from("service_pdfs").insert({
      file_name: file.name,
      storage_path: storagePath,
      public_url: publicUrl,
      is_current: true,
      is_active: true,
    });

    if (insertErr) {
      setError(insertErr.message);
    }

    // TODO (parse): run client-side pdf.js parsing here to extract service
    // candidates and show a review step before inserting into `services`.
    // Left as a follow-up to keep this page shippable today.

    (e.target as HTMLInputElement).value = "";
    setUploading(false);
    refresh();
  }

  async function makeCurrent(pdf: ServicePdf) {
    if (!supabase) return;
    await supabase
      .from("service_pdfs")
      .update({ is_current: false })
      .eq("is_current", true);
    await supabase
      .from("service_pdfs")
      .update({ is_current: true })
      .eq("id", pdf.id);
    refresh();
  }

  async function remove(pdf: ServicePdf) {
    if (!supabase) return;
    await confirmOrQueue({
      action: "delete_service_pdf",
      resourceLabel: pdf.file_name,
      confirmMessage: `Delete "${pdf.file_name}"? This also removes the file from storage.`,
      approvalReason: `Delete services PDF "${pdf.file_name}"`,
      run: async () => {
        await supabase.storage.from(BUCKET).remove([pdf.storage_path]);
        await supabase.from("service_pdfs").delete().eq("id", pdf.id);
        await refresh();
      },
    });
  }

  return (
    <div>
      <Link
        href="/admin/services"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-temple-red"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Services
      </Link>

      <h1 className="section-heading mt-4 flex items-center gap-2">
        <Upload className="h-7 w-7 text-temple-red" />
        Services PDF
      </h1>
      <p className="mt-2 text-gray-600">
        Upload the temple&apos;s services list as a PDF. Devotees will see the
        most recent upload on the public Services page.
      </p>

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

      <div className="mt-6 rounded-2xl border-2 border-dashed border-temple-gold/30 bg-temple-cream/40 p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-temple-gold" />
        <p className="mt-3 font-heading text-lg font-bold text-temple-maroon">
          Upload a Services PDF
        </p>
        <p className="mt-1 text-sm text-gray-600">
          The new file becomes the current download immediately.
        </p>
        <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-temple-maroon px-5 py-2.5 text-sm font-semibold text-white hover:bg-temple-maroon/90">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Choose PDF…
            </>
          )}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-lg font-bold text-temple-maroon">
          Previous Uploads
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                  File
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500 hidden sm:table-cell">
                  Uploaded
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
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
              ) : pdfs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    No PDFs uploaded yet.
                  </td>
                </tr>
              ) : (
                pdfs.map((pdf) => (
                  <tr key={pdf.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={pdf.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-temple-red hover:underline"
                      >
                        {pdf.file_name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      {new Date(pdf.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {pdf.is_current ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          <Check className="h-3 w-3" />
                          Current
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Archived</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {!pdf.is_current && (
                          <button
                            onClick={() => makeCurrent(pdf)}
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Make current
                          </button>
                        )}
                        <button
                          onClick={() => remove(pdf)}
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

        <p className="mt-4 text-xs text-gray-500">
          Auto-parsing PDFs into service records is a planned follow-up.
          For now, add services manually from the Services admin page.
        </p>
      </div>
    </div>
  );
}
