"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { safeHref } from "@/lib/url";
import type { Priest } from "@/types/database";

/**
 * "Ready to Book a Pooja?" — priest cards with WhatsApp buttons.
 *
 * Pulled from the `priests` table. Falls back to a sensible static list
 * if Supabase isn't wired up yet. The wrapper around this component on
 * the home page provides the section chrome (title, background, etc.).
 */

type FallbackPriest = Pick<
  Priest,
  "id" | "name" | "title" | "image_url" | "whatsapp_url" | "phone"
>;

const fallback: FallbackPriest[] = [
  {
    id: "fallback-1",
    name: "Pt. Aditya Sharma",
    title: "Founder & Head Priest",
    image_url: "/priests/aditya-sharma-v2.jpg",
    whatsapp_url: "https://wa.me/15125450473",
    phone: "+15125450473",
  },
  {
    id: "fallback-2",
    name: "Pt. Raghurama Sharma",
    title: "Senior Priest",
    image_url: "/priests/raghurama-sharma.jpg",
    whatsapp_url: "https://wa.me/15129980112",
    phone: "+15129980112",
  },
];

// Local photo fallbacks by name — used when the DB priests row has no image_url
// (both live rows are currently null), so the home cards still show real photos.
const localImagesByName: Record<string, string> = {
  "Pt. Aditya Sharma": "/priests/aditya-sharma-v2.jpg",
  "Pt. Raghurama Sharma": "/priests/raghurama-sharma.jpg",
};

function initials(name: string): string {
  return name
    .replace(/^(Pt\.|Sri|Shri)\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function ReadyToBookPriests() {
  const [priests, setPriests] = useState<FallbackPriest[]>(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("priests")
        .select("id, name, title, image_url, whatsapp_url, phone, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) {
        // Keep the static fallback (which always has contacts) rather than
        // trusting a failed/partial read; distinguishes "query failed" from "no data".
        setLoading(false);
        return;
      }
      if (data && data.length) {
        // Drop rows with no contact method so a misconfigured priest never
        // renders a dead card with zero actionable buttons.
        const actionable = (data as unknown as FallbackPriest[]).filter(
          (p) => p.whatsapp_url || p.phone,
        );
        if (actionable.length) {
          setPriests(actionable);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  const visiblePriests = (loading ? fallback : priests).map((priest) => ({
    ...priest,
    image_url: priest.image_url || localImagesByName[priest.name] || null,
  }));

  return (
    <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-2">
      {visiblePriests.map((priest) => (
        <div
          key={priest.id}
          className="overflow-hidden rounded-[1.75rem] border border-temple-gold/30 bg-white/5 backdrop-blur transition-colors hover:border-temple-gold/60"
        >
          <div className="relative h-64 bg-temple-maroon-deep">
            {priest.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={priest.image_url}
                alt={priest.name}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-temple-gold">
                {initials(priest.name)}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#2A0612] via-[#2A0612]/65 to-transparent" />
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg font-bold text-white">{priest.name}</p>
                <p className="truncate text-sm text-temple-gold-light">{priest.title}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {safeHref(priest.whatsapp_url) && (
                <a
                  href={safeHref(priest.whatsapp_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-500"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              )}
              {priest.phone && (
                <a
                  href={`tel:${priest.phone}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-temple-gold/50 px-3 py-2 text-xs font-semibold text-temple-gold-light transition-colors hover:bg-temple-gold/10"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
