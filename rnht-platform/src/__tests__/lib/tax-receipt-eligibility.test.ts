import { describe, it, expect } from "vitest";
import {
  yearEndReceiptEligibility,
  ACK_MIN_ANNUAL_TOTAL,
} from "@/lib/tax-receipt-eligibility";

const fmt = (n: number) => `$${n.toFixed(2)}`;

describe("yearEndReceiptEligibility", () => {
  it("blocks the current tax year (not available until January of next year)", () => {
    const r = yearEndReceiptEligibility({
      year: 2026,
      currentYear: 2026,
      yearTotal: 1000,
      formatCurrency: fmt,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("not_yet");
      expect(r.message).toContain("January 2027");
    }
  });

  it("blocks a future tax year", () => {
    const r = yearEndReceiptEligibility({
      year: 2027,
      currentYear: 2026,
      yearTotal: 5000,
      formatCurrency: fmt,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not_yet");
  });

  it("blocks a completed year whose total is below $250", () => {
    const r = yearEndReceiptEligibility({
      year: 2025,
      currentYear: 2026,
      yearTotal: 249.99,
      formatCurrency: fmt,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("below_threshold");
      expect(r.message).toContain("$249.99");
    }
  });

  it("allows a completed year with exactly $250", () => {
    const r = yearEndReceiptEligibility({
      year: 2025,
      currentYear: 2026,
      yearTotal: ACK_MIN_ANNUAL_TOTAL,
      formatCurrency: fmt,
    });
    expect(r.ok).toBe(true);
  });

  it("allows a completed year comfortably over $250", () => {
    const r = yearEndReceiptEligibility({
      year: 2024,
      currentYear: 2026,
      yearTotal: 1250,
      formatCurrency: fmt,
    });
    expect(r.ok).toBe(true);
  });

  it("timing rule wins when a current-year total is also below $250", () => {
    // Current year AND below threshold → the not_yet message takes precedence.
    const r = yearEndReceiptEligibility({
      year: 2026,
      currentYear: 2026,
      yearTotal: 10,
      formatCurrency: fmt,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not_yet");
  });

  it("treats an unknown current year (NaN) as 'year complete' and applies only the threshold", () => {
    const r = yearEndReceiptEligibility({
      year: 2026,
      currentYear: NaN,
      yearTotal: 300,
      formatCurrency: fmt,
    });
    expect(r.ok).toBe(true);
  });
});
