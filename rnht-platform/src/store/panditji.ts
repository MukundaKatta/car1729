import { create } from "zustand";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * "Contact Panditji" routing.
 *
 * The fallback is the head priest's WhatsApp number. Once migration-002
 * lands, `panditji_routing` points at a `priests` row whose `whatsapp_url`
 * overrides the fallback. Any component can call `usePanditjiWhatsApp()`
 * to get a URL ready to drop into an `<a href>`.
 */

const FALLBACK_WHATSAPP = "https://wa.me/15125450473";

type PanditjiStore = {
  whatsappUrl: string;
  loaded: boolean;
  load: () => Promise<void>;
};

// Dedupe concurrent load() calls. Without this, every component that mounts
// in the same paint (Header + ServiceCards + Footer + ...) fires its own
// query before any of them finishes setting `loaded: true`.
let inFlight: Promise<void> | null = null;

export const usePanditjiStore = create<PanditjiStore>((set, get) => ({
  whatsappUrl: FALLBACK_WHATSAPP,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    if (inFlight) return inFlight;
    if (!supabase) {
      set({ loaded: true });
      return;
    }
    inFlight = (async () => {
      try {
        const { data, error } = await supabase
          .from("panditji_routing")
          .select("priest_id, priests(whatsapp_url)")
          .eq("id", 1)
          .maybeSingle();
        if (!error && data) {
          const rel = (data as unknown as {
            priests: { whatsapp_url: string | null } | { whatsapp_url: string | null }[] | null;
          }).priests;
          const url = Array.isArray(rel)
            ? rel[0]?.whatsapp_url ?? null
            : rel?.whatsapp_url ?? null;
          if (url) set({ whatsappUrl: url });
        }
      } catch {
        /* fall through to fallback */
      }
      set({ loaded: true });
    })();
    try {
      await inFlight;
    } finally {
      inFlight = null;
    }
  },
}));

/**
 * React hook that loads panditji routing once per mount and returns the
 * current WhatsApp URL. Components should append `?text=...` as needed.
 */
export function usePanditjiWhatsApp(): string {
  const { whatsappUrl, loaded, load } = usePanditjiStore();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);
  return whatsappUrl;
}
