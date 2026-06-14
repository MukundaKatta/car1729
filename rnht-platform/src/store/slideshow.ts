import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export type SlideType = "image" | "video";

export type Slide = {
  id: string;
  type: SlideType;
  url: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  showText: boolean;
  sortOrder: number;
};

type SlideshowStore = {
  slides: Slide[];
  loading: boolean;
  fetchSlides: () => Promise<void>;
  // Mutations return true on success, false on a failed/blocked write so the
  // admin UI can surface the failure instead of falsely reporting success.
  addSlide: (slide: Slide) => Promise<boolean>;
  updateSlide: (id: string, updates: Partial<Slide>) => Promise<boolean>;
  removeSlide: (id: string) => Promise<boolean>;
  reorderSlides: (slides: Slide[]) => Promise<boolean>;
};

// Map DB row (snake_case) to app type (camelCase).
// Column names match the actual `slides` table: image_url / link_url / active.
function rowToSlide(row: Record<string, unknown>): Slide {
  return {
    id: row.id as string,
    type: (row.type as SlideType) || "image",
    url: (row.image_url as string) || "",
    title: (row.title as string) || "",
    subtitle: (row.subtitle as string) || "",
    ctaText: (row.cta_text as string) || "Learn More",
    ctaLink: (row.link_url as string) || "/services",
    isActive: (row.active as boolean) ?? true,
    showText: (row.show_text as boolean) ?? true,
    sortOrder: (row.sort_order as number) || 0,
  };
}

// Map app type to DB row. Never sends `id` — the DB generates the uuid PK
// (a client string id would violate the uuid column).
function slideToRow(slide: Partial<Slide>) {
  const row: Record<string, unknown> = {};
  if (slide.type !== undefined) row.type = slide.type;
  if (slide.url !== undefined) row.image_url = slide.url;
  if (slide.title !== undefined) row.title = slide.title;
  if (slide.subtitle !== undefined) row.subtitle = slide.subtitle;
  if (slide.ctaText !== undefined) row.cta_text = slide.ctaText;
  if (slide.ctaLink !== undefined) row.link_url = slide.ctaLink;
  if (slide.isActive !== undefined) row.active = slide.isActive;
  if (slide.showText !== undefined) row.show_text = slide.showText;
  if (slide.sortOrder !== undefined) row.sort_order = slide.sortOrder;
  return row;
}

export const useSlideshowStore = create<SlideshowStore>()((set) => ({
  slides: [],
  loading: true,

  fetchSlides: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }
    const { data, error } = await supabase
      .from("slides")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) {
      set({ slides: data.map(rowToSlide), loading: false });
    } else {
      set({ loading: false });
    }
  },

  addSlide: async (slide) => {
    if (!supabase) return false;
    const row = slideToRow(slide);
    // Insert without a client id and read back the DB-generated row so state
    // holds the real uuid (needed for later update/delete/reorder).
    const { data, error } = await supabase
      .from("slides")
      .insert(row)
      .select("*")
      .single();
    if (error || !data) return false;
    set((state) => ({ slides: [...state.slides, rowToSlide(data)] }));
    return true;
  },

  updateSlide: async (id, updates) => {
    if (!supabase) return false;
    const row = slideToRow(updates);
    const { error } = await supabase.from("slides").update(row).eq("id", id);
    if (error) return false;
    set((state) => ({
      slides: state.slides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    return true;
  },

  removeSlide: async (id) => {
    if (!supabase) return false;
    const { error } = await supabase.from("slides").delete().eq("id", id);
    if (error) return false;
    set((state) => ({ slides: state.slides.filter((s) => s.id !== id) }));
    return true;
  },

  reorderSlides: async (slides) => {
    const previous = useSlideshowStore.getState().slides;
    set({ slides }); // optimistic
    if (!supabase) return true;
    // Persist sort_order sequentially, stopping on the first error. Running
    // these in parallel could leave a mix of old/new sort_order if one write
    // fails mid-flight; sequential awaits keep the rollback unambiguous.
    for (let i = 0; i < slides.length; i++) {
      const { error } = await supabase
        .from("slides")
        .update({ sort_order: i })
        .eq("id", slides[i].id);
      if (error) {
        // Roll back the local order so the UI doesn't drift out of sync with
        // the database, and report failure to the caller.
        set({ slides: previous });
        return false;
      }
    }
    return true;
  },
}));
