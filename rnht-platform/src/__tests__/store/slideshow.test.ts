import { describe, it, expect, beforeEach, vi } from "vitest";

// Mutable mock references
const { mockSelect, mockInsert, mockUpdate, mockDelete, mockOrder, mockEq, mockUpdateEq } = vi.hoisted(() => ({
  mockOrder: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockEq: vi.fn(),
  mockUpdateEq: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (table: string) => ({
      select: (...args: any[]) => {
        mockSelect(table, ...args);
        return { order: mockOrder };
      },
      insert: (row: any) => {
        mockInsert(row);
        return { error: (mockInsert as any)._error ?? null };
      },
      update: (row: any) => {
        mockUpdate(row);
        return {
          eq: (...eqArgs: any[]) => {
            mockUpdateEq(...eqArgs);
            return { error: (mockUpdate as any)._error ?? null };
          },
        };
      },
      delete: () => {
        mockDelete(table);
        return {
          eq: (...eqArgs: any[]) => {
            mockEq(...eqArgs);
            return { error: (mockDelete as any)._error ?? null };
          },
        };
      },
    }),
  },
}));

import { useSlideshowStore, type Slide } from "@/store/slideshow";

const testSlide: Slide = {
  id: "test-slide",
  type: "image",
  url: "https://example.com/photo.jpg",
  title: "Test Slide",
  subtitle: "Test subtitle",
  ctaText: "Learn More",
  ctaLink: "/test",
  isActive: true,
  showText: true,
  sortOrder: 10,
};

describe("useSlideshowStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock errors
    (mockInsert as any)._error = null;
    (mockUpdate as any)._error = null;
    (mockDelete as any)._error = null;
    // Default mock return for order (fetchSlides)
    mockOrder.mockResolvedValue({ data: [], error: null });

    useSlideshowStore.setState({
      slides: [
        {
          id: "slide-1",
          type: "image",
          url: "",
          title: "Rudra Narayana Hindu Temple",
          subtitle: "A sacred haven for devotees.",
          ctaText: "Book a Pooja",
          ctaLink: "/services",
          isActive: true,
          showText: true,
          sortOrder: 0,
        },
      ],
      loading: false,
    });
  });

  it("has slides", () => {
    expect(useSlideshowStore.getState().slides.length).toBeGreaterThan(0);
  });

  it("adds a slide", async () => {
    const initial = useSlideshowStore.getState().slides.length;
    await useSlideshowStore.getState().addSlide(testSlide);
    expect(useSlideshowStore.getState().slides.length).toBe(initial + 1);
    expect(
      useSlideshowStore.getState().slides.find((s) => s.id === "test-slide")
    ).toBeDefined();
  });

  it("updates a slide", async () => {
    await useSlideshowStore.getState().updateSlide("slide-1", { title: "Updated" });
    expect(useSlideshowStore.getState().slides[0].title).toBe("Updated");
  });

  it("removes a slide", async () => {
    await useSlideshowStore.getState().addSlide(testSlide);
    await useSlideshowStore.getState().removeSlide("test-slide");
    expect(
      useSlideshowStore.getState().slides.find((s) => s.id === "test-slide")
    ).toBeUndefined();
  });

  it("reorders slides", async () => {
    const reordered = [testSlide, ...useSlideshowStore.getState().slides];
    await useSlideshowStore.getState().reorderSlides(reordered);
    expect(useSlideshowStore.getState().slides[0].id).toBe("test-slide");
  });

  // --- Additional coverage tests ---

  describe("fetchSlides", () => {
    it("fetches slides successfully and maps DB rows to app types", async () => {
      const dbRows = [
        {
          id: "s1",
          type: "video",
          url: "https://example.com/v.mp4",
          title: "Title",
          subtitle: "Sub",
          cta_text: "Click",
          cta_link: "/link",
          is_active: false,
          show_text: false,
          sort_order: 5,
        },
      ];
      mockOrder.mockResolvedValue({ data: dbRows, error: null });

      useSlideshowStore.setState({ loading: true });
      await useSlideshowStore.getState().fetchSlides();

      const state = useSlideshowStore.getState();
      expect(state.loading).toBe(false);
      expect(state.slides).toHaveLength(1);
      expect(state.slides[0]).toEqual({
        id: "s1",
        type: "video",
        url: "https://example.com/v.mp4",
        title: "Title",
        subtitle: "Sub",
        ctaText: "Click",
        ctaLink: "/link",
        isActive: false,
        showText: false,
        sortOrder: 5,
      });
    });

    it("handles fetchSlides error gracefully", async () => {
      mockOrder.mockResolvedValue({ data: null, error: new Error("DB error") });

      useSlideshowStore.setState({ loading: true, slides: [] });
      await useSlideshowStore.getState().fetchSlides();

      const state = useSlideshowStore.getState();
      expect(state.loading).toBe(false);
      // slides should remain unchanged (empty)
      expect(state.slides).toHaveLength(0);
    });

    it("handles fetchSlides with null data (no error object)", async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });

      useSlideshowStore.setState({ loading: true, slides: [] });
      await useSlideshowStore.getState().fetchSlides();

      const state = useSlideshowStore.getState();
      expect(state.loading).toBe(false);
    });
  });

  describe("addSlide error handling", () => {
    it("does not add slide to state when insert fails", async () => {
      (mockInsert as any)._error = new Error("Insert failed");

      const initial = useSlideshowStore.getState().slides.length;
      await useSlideshowStore.getState().addSlide(testSlide);
      expect(useSlideshowStore.getState().slides.length).toBe(initial);
    });
  });

  describe("updateSlide error handling", () => {
    it("does not update slide in state when update fails", async () => {
      (mockUpdate as any)._error = new Error("Update failed");

      await useSlideshowStore.getState().updateSlide("slide-1", { title: "Should Not Update" });
      expect(useSlideshowStore.getState().slides[0].title).toBe("Rudra Narayana Hindu Temple");
    });
  });

  describe("removeSlide error handling", () => {
    it("does not remove slide from state when delete fails", async () => {
      (mockDelete as any)._error = new Error("Delete failed");

      const initial = useSlideshowStore.getState().slides.length;
      await useSlideshowStore.getState().removeSlide("slide-1");
      expect(useSlideshowStore.getState().slides.length).toBe(initial);
    });
  });

  describe("rowToSlide mapping", () => {
    it("maps all fields from DB row with defaults for missing values", async () => {
      const dbRows = [
        {
          id: "s2",
          // no type, url, title, subtitle, cta_text, cta_link, sort_order
          // is_active and show_text are undefined
        },
      ];
      mockOrder.mockResolvedValue({ data: dbRows, error: null });

      await useSlideshowStore.getState().fetchSlides();

      const slide = useSlideshowStore.getState().slides[0];
      expect(slide.id).toBe("s2");
      expect(slide.type).toBe("image"); // default
      expect(slide.url).toBe(""); // default
      expect(slide.title).toBe(""); // default
      expect(slide.subtitle).toBe(""); // default
      expect(slide.ctaText).toBe("Learn More"); // default
      expect(slide.ctaLink).toBe("/services"); // default
      expect(slide.isActive).toBe(true); // default via ??
      expect(slide.showText).toBe(true); // default via ??
      expect(slide.sortOrder).toBe(0); // default
    });

    it("maps is_active=false correctly (not replaced by default)", async () => {
      const dbRows = [{ id: "s3", is_active: false, show_text: false }];
      mockOrder.mockResolvedValue({ data: dbRows, error: null });

      await useSlideshowStore.getState().fetchSlides();

      const slide = useSlideshowStore.getState().slides[0];
      expect(slide.isActive).toBe(false);
      expect(slide.showText).toBe(false);
    });
  });

  describe("slideToRow mapping", () => {
    it("maps all camelCase fields to snake_case in addSlide call", async () => {
      await useSlideshowStore.getState().addSlide(testSlide);
      expect(mockInsert).toHaveBeenCalledWith({
        id: "test-slide",
        type: "image",
        url: "https://example.com/photo.jpg",
        title: "Test Slide",
        subtitle: "Test subtitle",
        cta_text: "Learn More",
        cta_link: "/test",
        is_active: true,
        show_text: true,
        sort_order: 10,
      });
    });

    it("only includes defined fields in partial update", async () => {
      await useSlideshowStore.getState().updateSlide("slide-1", { title: "New" });
      expect(mockUpdate).toHaveBeenCalledWith({ title: "New" });
    });

    it("maps ctaText and ctaLink in partial update", async () => {
      await useSlideshowStore.getState().updateSlide("slide-1", { ctaText: "Go", ctaLink: "/go" });
      expect(mockUpdate).toHaveBeenCalledWith({ cta_text: "Go", cta_link: "/go" });
    });

    it("maps isActive and showText in partial update", async () => {
      await useSlideshowStore.getState().updateSlide("slide-1", { isActive: false, showText: false });
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false, show_text: false });
    });

    it("maps sortOrder in partial update", async () => {
      await useSlideshowStore.getState().updateSlide("slide-1", { sortOrder: 5 });
      expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 5 });
    });
  });

  describe("reorderSlides", () => {
    it("updates sort_order for each slide in the DB", async () => {
      const slides = [
        { ...testSlide, id: "a", sortOrder: 0 },
        { ...testSlide, id: "b", sortOrder: 1 },
      ];
      await useSlideshowStore.getState().reorderSlides(slides);
      // update should have been called twice (once per slide)
      expect(mockUpdate).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 0 });
      expect(mockUpdate).toHaveBeenCalledWith({ sort_order: 1 });
      expect(mockUpdateEq).toHaveBeenCalledWith("id", "a");
      expect(mockUpdateEq).toHaveBeenCalledWith("id", "b");
      // State should be updated immediately
      expect(useSlideshowStore.getState().slides).toEqual(slides);
    });
  });
});
