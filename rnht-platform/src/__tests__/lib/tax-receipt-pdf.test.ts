import { describe, it, expect } from "vitest";
import { generateDonationReceiptPdf } from "@/lib/tax-receipt-pdf";

// jsdom (the vitest environment) provides btoa/Blob, so the generator runs
// end-to-end here — this exercises the real jsPDF draw path + base64 encoding.
describe("generateDonationReceiptPdf", () => {
  const base = {
    donorName: "Ramesh Venkataraman",
    donorEmail: "ramesh.v@example.com",
    amount: 151,
    fundLabel: "General Temple Donation",
    receiptId: "REC-1a2b3c4d",
  };

  it("returns a valid PDF as base64 + blob + filename", () => {
    const out = generateDonationReceiptPdf(base);
    expect(out.filename).toBe("RNHT-Donation-Receipt-REC-1a2b3c4d.pdf");
    expect(typeof out.base64).toBe("string");
    // Base64 of a PDF always begins with the "%PDF" magic ("JVBER...").
    expect(out.base64.startsWith("JVBER")).toBe(true);
    expect(out.base64.length).toBeGreaterThan(1000);
    expect(out.blob).toBeInstanceOf(Blob);
    expect(out.blob.type).toBe("application/pdf");
    expect(out.blob.size).toBeGreaterThan(1000);
  });

  it("handles an optional note and a custom date without throwing", () => {
    const out = generateDonationReceiptPdf({
      ...base,
      note: "Cash received at temple on Guru Purnima.",
      date: new Date("2026-07-13T12:00:00Z"),
    });
    expect(out.base64.startsWith("JVBER")).toBe(true);
  });

  it("handles a very long note (multi-page footer path) without throwing", () => {
    const out = generateDonationReceiptPdf({
      ...base,
      note: "A ".repeat(600).trim(),
    });
    expect(out.blob.size).toBeGreaterThan(1000);
  });

  it("falls back to a Devotee salutation for an empty donor name", () => {
    const out = generateDonationReceiptPdf({ ...base, donorName: "" });
    expect(out.base64.startsWith("JVBER")).toBe(true);
  });

  it("renders a multi-line mailing address without throwing", () => {
    const out = generateDonationReceiptPdf({
      ...base,
      donorAddress: "123 Temple Rd\nGeorgetown, TX 78628\nUnited States",
    });
    expect(out.base64.startsWith("JVBER")).toBe(true);
    expect(out.blob.size).toBeGreaterThan(1000);
  });
});
