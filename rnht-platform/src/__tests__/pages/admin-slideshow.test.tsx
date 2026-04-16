/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: any) => <img {...props} /> }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/slideshow",
  useSearchParams: () => new URLSearchParams(),
}));

const { mockUpload, mockGetPublicUrl } = vi.hoisted(() => ({
  mockUpload: vi.fn().mockResolvedValue({ error: null }),
  mockGetPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://cdn.example.com/slide_123.jpg" } })),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { onAuthStateChange: vi.fn(), signInWithOtp: vi.fn().mockResolvedValue({ error: null }), verifyOtp: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({}), signInWithOAuth: vi.fn().mockResolvedValue({ error: null }) },
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null }), order: () => ({ data: [], limit: () => ({ data: [] }) }) }), order: () => ({ data: [] }) }), insert: () => ({ then: vi.fn() }), update: () => ({ eq: () => ({ then: vi.fn() }) }), delete: () => ({ eq: () => ({ then: vi.fn() }) }) }),
    storage: { from: () => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }) },
  },
}));
vi.mock("@/store/cart", () => ({ useCartStore: (sel: any) => { const s = { items: [], addItem: vi.fn(), removeItem: vi.fn(), updateItem: vi.fn(), clearCart: vi.fn(), getTotal: () => 0, getItemCount: () => 0 }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/language", () => ({ useLanguageStore: (sel: any) => { const s = { locale: "en", setLocale: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));
vi.mock("@/store/auth", () => ({ useAuthStore: (sel: any) => { const s = { isAuthenticated: false, user: null, authUser: null, bookings: [], donations: [], activities: [], loading: false, initialized: true, initialize: vi.fn(), sendOtp: vi.fn().mockResolvedValue({}), verifyOtp: vi.fn().mockResolvedValue({}), logout: vi.fn(), addDonation: vi.fn(), addBooking: vi.fn(), updateProfile: vi.fn(), addFamilyMember: vi.fn(), removeFamilyMember: vi.fn(), fetchUserData: vi.fn() }; return typeof sel === 'function' ? sel(s) : s; }}));

const { mockFetchSlides, mockAddSlide, mockUpdateSlide, mockRemoveSlide, mockReorderSlides } = vi.hoisted(() => ({
  mockFetchSlides: vi.fn(),
  mockAddSlide: vi.fn(),
  mockUpdateSlide: vi.fn(),
  mockRemoveSlide: vi.fn(),
  mockReorderSlides: vi.fn(),
}));

let mockSlideshowState: any;

vi.mock("@/store/slideshow", () => ({
  useSlideshowStore: (sel: any) => typeof sel === 'function' ? sel(mockSlideshowState) : mockSlideshowState,
}));

import AdminSlideshowPage from "@/app/admin/slideshow/page";

const testSlides = [
  { id: "1", type: "image" as const, url: "https://example.com/img1.jpg", title: "Test Slide 1", subtitle: "Subtitle 1", ctaText: "Learn More", ctaLink: "/services", isActive: true, showText: true, sortOrder: 0 },
  { id: "2", type: "video" as const, url: "https://example.com/vid.mp4", title: "Test Slide 2", subtitle: "Subtitle 2", ctaText: "Book Now", ctaLink: "/services", isActive: false, showText: true, sortOrder: 1 },
];

describe("AdminSlideshowPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSlideshowState = {
      slides: testSlides,
      loading: false,
      fetchSlides: mockFetchSlides,
      addSlide: mockAddSlide,
      updateSlide: mockUpdateSlide,
      removeSlide: mockRemoveSlide,
      reorderSlides: mockReorderSlides,
    };
  });

  it("renders without crashing", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText("Hero Slideshow")).toBeInTheDocument();
  });

  it("shows page description", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText(/Upload photos & videos/)).toBeInTheDocument();
  });

  it("shows back to admin link", () => {
    render(<AdminSlideshowPage />);
    const backLink = screen.getByLabelText("Back to admin");
    expect(backLink).toHaveAttribute("href", "/admin");
  });

  it("shows Add Slide button", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText("Add Slide")).toBeInTheDocument();
  });

  it("displays slide cards", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText("Test Slide 1")).toBeInTheDocument();
    expect(screen.getByText("Test Slide 2")).toBeInTheDocument();
  });

  it("shows slide subtitles", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText("Subtitle 1")).toBeInTheDocument();
    expect(screen.getByText("Subtitle 2")).toBeInTheDocument();
  });

  it("shows type badges", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText("image")).toBeInTheDocument();
    expect(screen.getByText("video")).toBeInTheDocument();
  });

  it("shows Hidden badge for inactive slides", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText("Hidden")).toBeInTheDocument();
  });

  it("shows CTA text and links", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText(/Learn More/)).toBeInTheDocument();
    expect(screen.getByText(/Book Now/)).toBeInTheDocument();
  });

  it("has reorder buttons", () => {
    render(<AdminSlideshowPage />);
    const moveUpButtons = screen.getAllByLabelText("Move up");
    const moveDownButtons = screen.getAllByLabelText("Move down");
    expect(moveUpButtons.length).toBe(2);
    expect(moveDownButtons.length).toBe(2);
  });

  it("first slide move up is disabled", () => {
    render(<AdminSlideshowPage />);
    const moveUpButtons = screen.getAllByLabelText("Move up");
    expect(moveUpButtons[0]).toBeDisabled();
  });

  it("last slide move down is disabled", () => {
    render(<AdminSlideshowPage />);
    const moveDownButtons = screen.getAllByLabelText("Move down");
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
  });

  it("shows edit and delete buttons", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getAllByLabelText("Edit slide").length).toBe(2);
    expect(screen.getAllByLabelText("Delete slide").length).toBe(2);
  });

  it("shows visibility toggle buttons", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByLabelText("Hide slide")).toBeInTheDocument();
    expect(screen.getByLabelText("Show slide")).toBeInTheDocument();
  });

  it("shows delete confirmation on delete click", () => {
    render(<AdminSlideshowPage />);
    const deleteButtons = screen.getAllByLabelText("Delete slide");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    // Cancel confirmation
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });

  it("opens slide editor when clicking Add Slide", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    expect(screen.getByText("Add New Slide")).toBeInTheDocument();
    expect(screen.getByText("Title *")).toBeInTheDocument();
  });

  it("opens slide editor when clicking edit", () => {
    render(<AdminSlideshowPage />);
    const editButtons = screen.getAllByLabelText("Edit slide");
    fireEvent.click(editButtons[0]);
    expect(screen.getByText("Edit Slide")).toBeInTheDocument();
  });

  it("shows tips section", () => {
    render(<AdminSlideshowPage />);
    expect(screen.getByText("Tips")).toBeInTheDocument();
    expect(screen.getByText(/1920x800px recommended/)).toBeInTheDocument();
  });

  it("calls fetchSlides on mount", () => {
    render(<AdminSlideshowPage />);
    expect(mockFetchSlides).toHaveBeenCalled();
  });

  it("shows file upload area in editor", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    expect(screen.getByText("Upload Photo / Video")).toBeInTheDocument();
    expect(screen.getByText(/Drop a photo or video here/)).toBeInTheDocument();
  });

  it("shows show text overlay checkbox in editor", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    expect(screen.getByText(/Show text overlay/)).toBeInTheDocument();
  });

  it("shows active checkbox in editor", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    expect(screen.getByText(/Active \(visible on homepage\)/)).toBeInTheDocument();
  });

  // --- Additional coverage tests ---

  it("calls removeSlide when confirming delete", () => {
    render(<AdminSlideshowPage />);
    const deleteButtons = screen.getAllByLabelText("Delete slide");
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByText("Confirm"));
    expect(mockRemoveSlide).toHaveBeenCalledWith("1");
  });

  it("toggles slide active state via visibility button", () => {
    render(<AdminSlideshowPage />);
    // Hide the active slide
    fireEvent.click(screen.getByLabelText("Hide slide"));
    expect(mockUpdateSlide).toHaveBeenCalledWith("1", { isActive: false });
  });

  it("toggles inactive slide to active via Show button", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByLabelText("Show slide"));
    expect(mockUpdateSlide).toHaveBeenCalledWith("2", { isActive: true });
  });

  it("moves a slide down and calls reorderSlides", () => {
    render(<AdminSlideshowPage />);
    const moveDownButtons = screen.getAllByLabelText("Move down");
    fireEvent.click(moveDownButtons[0]); // Move first slide down
    expect(mockReorderSlides).toHaveBeenCalledTimes(1);
    const newOrder = mockReorderSlides.mock.calls[0][0];
    expect(newOrder[0].id).toBe("2");
    expect(newOrder[1].id).toBe("1");
  });

  it("moves a slide up and calls reorderSlides", () => {
    render(<AdminSlideshowPage />);
    const moveUpButtons = screen.getAllByLabelText("Move up");
    fireEvent.click(moveUpButtons[1]); // Move second slide up
    expect(mockReorderSlides).toHaveBeenCalledTimes(1);
    const newOrder = mockReorderSlides.mock.calls[0][0];
    expect(newOrder[0].id).toBe("2");
    expect(newOrder[1].id).toBe("1");
  });

  it("does not reorder when trying to move first slide up (boundary)", () => {
    render(<AdminSlideshowPage />);
    const moveUpButtons = screen.getAllByLabelText("Move up");
    fireEvent.click(moveUpButtons[0]);
    expect(mockReorderSlides).not.toHaveBeenCalled();
  });

  it("does not reorder when trying to move last slide down (boundary)", () => {
    render(<AdminSlideshowPage />);
    const moveDownButtons = screen.getAllByLabelText("Move down");
    fireEvent.click(moveDownButtons[1]);
    expect(mockReorderSlides).not.toHaveBeenCalled();
  });

  it("shows empty state when there are no slides", () => {
    mockSlideshowState = {
      ...mockSlideshowState,
      slides: [],
    };
    render(<AdminSlideshowPage />);
    expect(screen.getByText(/No slides yet/)).toBeInTheDocument();
    expect(screen.getByText("Upload First Slide")).toBeInTheDocument();
  });

  it("opens editor from empty state upload button", () => {
    mockSlideshowState = { ...mockSlideshowState, slides: [] };
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Upload First Slide"));
    expect(screen.getByText("Add New Slide")).toBeInTheDocument();
  });

  it("closes the editor via Close button", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    expect(screen.getByText("Add New Slide")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByText("Add New Slide")).not.toBeInTheDocument();
  });

  it("closes the editor via Cancel button", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    expect(screen.getByText("Add New Slide")).toBeInTheDocument();
    // Cancel is the btn-outline in the footer
    const cancelBtns = screen.getAllByText("Cancel");
    const editorCancel = cancelBtns.find((el) => el.className.includes("btn-outline"));
    fireEvent.click(editorCancel!);
    expect(screen.queryByText("Add New Slide")).not.toBeInTheDocument();
  });

  it("fills out title and calls addSlide when saving new slide", async () => {
    mockAddSlide.mockResolvedValue(undefined);
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    // Fill title
    const titleInput = screen.getByPlaceholderText("e.g., Rudra Narayana Hindu Temple");
    fireEvent.change(titleInput, { target: { value: "New Slide Title" } });

    // Click the save button in the editor footer (contains "Add Slide" text in btn-primary)
    const addSlideBtns = screen.getAllByText("Add Slide");
    const footerSaveBtn = addSlideBtns.find(
      (el) => el.closest(".border-t") !== null
    );
    fireEvent.click(footerSaveBtn!.closest("button")!);

    await waitFor(() => {
      expect(mockAddSlide).toHaveBeenCalledTimes(1);
    });
    const call = mockAddSlide.mock.calls[0][0];
    expect(call.title).toBe("New Slide Title");
    expect(call.isActive).toBe(true);
    expect(call.showText).toBe(true);
  });

  it("save button is disabled when title is empty", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    // The save button should be disabled
    const saveBtns = screen.getAllByText("Add Slide");
    const footerSaveBtn = saveBtns.find(
      (el) => el.closest(".border-t")
    );
    expect(footerSaveBtn?.closest("button")).toBeDisabled();
  });

  it("fills form fields in new slide editor", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    // Fill subtitle
    const subtitleInput = screen.getByPlaceholderText("Describe this slide...");
    fireEvent.change(subtitleInput, { target: { value: "My subtitle" } });
    expect(subtitleInput).toHaveValue("My subtitle");

    // Fill button text
    const ctaTextInput = screen.getByPlaceholderText("Book a Pooja");
    fireEvent.change(ctaTextInput, { target: { value: "Book Now" } });
    expect(ctaTextInput).toHaveValue("Book Now");

    // Fill button link
    const ctaLinkInput = screen.getByPlaceholderText("/services");
    fireEvent.change(ctaLinkInput, { target: { value: "/donate" } });
    expect(ctaLinkInput).toHaveValue("/donate");

    // URL input
    const urlInput = screen.getByPlaceholderText("/slideshow/photo.jpg or https://...");
    fireEvent.change(urlInput, { target: { value: "https://example.com/photo.jpg" } });
    expect(urlInput).toHaveValue("https://example.com/photo.jpg");
  });

  it("toggles showText checkbox", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    const showTextCheckbox = screen.getByLabelText(/Show text overlay/);
    expect(showTextCheckbox).toBeChecked();
    fireEvent.click(showTextCheckbox);
    expect(showTextCheckbox).not.toBeChecked();
  });

  it("toggles isActive checkbox", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    const activeCheckbox = screen.getByLabelText(/Active \(visible on homepage\)/);
    expect(activeCheckbox).toBeChecked();
    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).not.toBeChecked();
  });

  it("clicks the video type button in the editor", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    // Type toggle buttons in the editor
    const videoBtn = screen.getAllByText("video").find(
      (el) => el.closest("button") && el.closest(".flex.gap-1")
    );
    fireEvent.click(videoBtn!);
    // After clicking video, the video button should have active styling
    expect(videoBtn?.closest("button")?.className).toContain("border-temple-red");
  });

  it("clicks the image type button in the editor", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    // First click video, then switch back to image
    const videoBtn = screen.getAllByText("video").find(
      (el) => el.closest("button") && el.closest(".flex.gap-1")
    );
    fireEvent.click(videoBtn!);
    const imageBtn = screen.getAllByText("image").find(
      (el) => el.closest("button") && el.closest(".flex.gap-1")
    );
    fireEvent.click(imageBtn!);
    expect(imageBtn?.closest("button")?.className).toContain("border-temple-red");
  });

  it("calls updateSlide when saving edits to existing slide", async () => {
    mockUpdateSlide.mockResolvedValue(undefined);
    render(<AdminSlideshowPage />);
    const editButtons = screen.getAllByLabelText("Edit slide");
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("Edit Slide")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();

    // Change the title
    const titleInput = screen.getByDisplayValue("Test Slide 1");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    fireEvent.click(screen.getByText("Save Changes"));
    await waitFor(() => {
      expect(mockUpdateSlide).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateSlide.mock.calls[0][0]).toBe("1");
    expect(mockUpdateSlide.mock.calls[0][1].title).toBe("Updated Title");
  });

  it("pre-fills editor fields when editing an existing slide", () => {
    render(<AdminSlideshowPage />);
    const editButtons = screen.getAllByLabelText("Edit slide");
    fireEvent.click(editButtons[0]);

    expect(screen.getByDisplayValue("Test Slide 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Subtitle 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Learn More")).toBeInTheDocument();
  });

  it("shows image preview when editing a slide with URL", () => {
    render(<AdminSlideshowPage />);
    const editButtons = screen.getAllByLabelText("Edit slide");
    fireEvent.click(editButtons[0]); // image slide
    // FileUploader should show the current image
    expect(screen.getByText("Click or drag to replace")).toBeInTheDocument();
  });

  it("shows No description for slide without subtitle", () => {
    mockSlideshowState = {
      ...mockSlideshowState,
      slides: [
        { id: "3", type: "image" as const, url: "", title: "No Sub", subtitle: "", ctaText: "", ctaLink: "", isActive: true, showText: true, sortOrder: 0 },
      ],
    };
    render(<AdminSlideshowPage />);
    expect(screen.getByText("No description")).toBeInTheDocument();
  });

  it("shows gradient placeholder for slide without URL", () => {
    mockSlideshowState = {
      ...mockSlideshowState,
      slides: [
        { id: "3", type: "image" as const, url: "", title: "No Image", subtitle: "test", ctaText: "", ctaLink: "", isActive: true, showText: true, sortOrder: 0 },
      ],
    };
    render(<AdminSlideshowPage />);
    // The Om character should be visible
    expect(screen.getByText("\u0950")).toBeInTheDocument();
  });

  it("handles image onError fallback", () => {
    render(<AdminSlideshowPage />);
    // Find the img for slide 1
    const imgs = document.querySelectorAll("img[alt='Test Slide 1']");
    expect(imgs.length).toBeGreaterThan(0);
    fireEvent.error(imgs[0]);
    expect((imgs[0] as HTMLImageElement).src).toContain("data:image/svg+xml");
  });

  it("handles file upload via file input", async () => {
    mockUpload.mockResolvedValue({ error: null });
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });
  });

  it("handles file upload error for disallowed type", async () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "doc.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/File type not allowed/)).toBeInTheDocument();
    });
  });

  it("handles file upload error for oversized file", async () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Create a file > 50MB
    const bigContent = new ArrayBuffer(51 * 1024 * 1024);
    const file = new File([bigContent], "big.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/File too large/)).toBeInTheDocument();
    });
  });

  it("handles supabase upload failure", async () => {
    mockUpload.mockResolvedValue({ error: new Error("Storage error") });
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Storage error")).toBeInTheDocument();
    });
  });

  it("handles drag and drop file upload", async () => {
    mockUpload.mockResolvedValue({ error: null });
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    const dropZone = screen.getByText(/Drop a photo or video here/).closest("div[class*='border-dashed']")!;

    // Drag over
    fireEvent.dragOver(dropZone, { preventDefault: vi.fn() });

    // Drop
    const file = new File(["test"], "photo.png", { type: "image/png" });
    fireEvent.drop(dropZone, {
      preventDefault: vi.fn(),
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });
  });

  it("handles dragLeave on upload zone", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    const dropZone = screen.getByText(/Drop a photo or video here/).closest("div[class*='border-dashed']")!;
    fireEvent.dragOver(dropZone, { preventDefault: vi.fn() });
    fireEvent.dragLeave(dropZone);
    // Should revert to non-highlighted state (no crash)
    expect(dropZone).toBeInTheDocument();
  });

  it("identifies video files during upload", async () => {
    mockUpload.mockResolvedValue({ error: null });
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "video.mp4", { type: "video/mp4" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });
  });

  it("clicks on drop zone triggers file input click", () => {
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));
    const dropZone = screen.getByText(/Drop a photo or video here/).closest("div[class*='border-dashed']")!;
    // Clicking the drop zone shouldn't crash
    fireEvent.click(dropZone);
    expect(dropZone).toBeInTheDocument();
  });

  it("handles non-Error upload failures gracefully", async () => {
    mockUpload.mockResolvedValue({ error: { message: "Unknown" } });
    render(<AdminSlideshowPage />);
    fireEvent.click(screen.getByText("Add Slide"));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      // The error thrown is an object, not an Error instance, so fallback message
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });
  });
});
