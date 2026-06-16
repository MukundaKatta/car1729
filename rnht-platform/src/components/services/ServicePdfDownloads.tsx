"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ServicePdf } from "@/types/database";

/**
 * "Download our Services List (PDF)" callout on /services.
 *
 * Shows the latest admin-uploaded PDF (if any). The "live on-demand PDF
 * generated from current DB rows" from the plan required a server API
 * route, which isn't available with `output: 'export'`. It can be added
 * later as a client-side generation button using @react-pdf/renderer —
 * see `src/app/admin/services/upload/page.tsx` for where that lands.
 */

/** True only for an absolute http(s) URL, so a blank/malformed stored value never becomes a dead Download link. */
function isValidPdfUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function ServicePdfDownloads() {
  const [current, setCurrent] = useState<ServicePdf | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("service_pdfs")
        .select("*")
        .eq("is_active", true)
        .eq("is_current", true)
        .maybeSingle();
      setCurrent((data as unknown as ServicePdf) ?? null);
      setLoading(false);
    }
    load();
  }, []);

  if (!loading && !isValidPdfUrl(current?.public_url)) {
    // Don't show a dead card when there's nothing valid to download
    // (no row, or a row whose public_url is blank/malformed).
    return null;
  }

  return (
    <div className="rounded-2xl border border-temple-gold/25 bg-gradient-to-br from-temple-cream to-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-temple-gold/15 text-temple-gold">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-temple-maroon">
              Services List PDF
            </h3>
            <p className="mt-0.5 text-sm text-gray-600">
              Download the full list of services the temple offers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isValidPdfUrl(current?.public_url) && (
            <a
              href={current!.public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-temple-maroon px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-temple-maroon/90"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
