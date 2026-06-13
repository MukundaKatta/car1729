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
  addSlide: (slide: Slide) => Promise<void>;
  updateSlide: (id: string, updates: Partial<Slide>) => Promise<void>;
  removeSlide: (id: string) => Promise<void>;
  reorderSlides: (slides: Slide[]) => Promise<void>;
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
    if (!supabase) return;
    const row = slideToRow(slide);
    // Insert without a client id and read back the DB-generated row so state
    // holds the real uuid (needed for later update/delete/reorder).
    const { data, error } = await supabase
      .from("slides")
      .insert(row)
      .select("*")
      .single();
    if (!error && data) {
      set((state) => ({ slides: [...state.slides, rowToSlide(data)] }));
    }
  },

  updateSlide: async (id, updates) => {
    if (!supabase) return;
    const row = slideToRow(updates);
    const { error } = await supabase.from("slides").update(row).eq("id", id);
    if (!error) {
      set((state) => ({
        slides: state.slides.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
    }
  },

  removeSlide: async (id) => {
    if (!supabase) return;
    const { error } = await supabase.from("slides").delete().eq("id", id);
    if (!error) {
      set((state) => ({ slides: state.slides.filter((s) => s.id !== id) }));
    }
  },

  reorderSlides: async (slides) => {
    const previous = useSlideshowStore.getState().slides;
    set({ slides }); // optimistic
    if (!supabase) return;
    // Persist sort_order for each slide; if any write fails, roll back the
    // local order so the UI doesn't drift out of sync with the database.
    const results = await Promise.all(
      slides.map((s, i) =>
        supabase!.from("slides").update({ sort_order: i }).eq("id", s.id),
      ),
    );
    if (results.some((r) => r.error)) {
      set({ slides: previous });
    }
  },
}));
