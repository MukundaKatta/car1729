import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, formatTime } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind conflicts correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("", undefined, null)).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats whole dollar amounts", () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });

  it("formats cents", () => {
    expect(formatCurrency(49.99)).toBe("$49.99");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats large amounts with commas", () => {
    expect(formatCurrency(1000)).toBe("$1,000.00");
    expect(formatCurrency(10000)).toBe("$10,000.00");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    // Use Date constructor to avoid timezone offset issues with date-only strings
    const result = formatDate(new Date(2026, 2, 15));
    expect(result).toContain("March");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date(2026, 2, 15));
    expect(result).toContain("March");
    expect(result).toContain("15");
  });

  it("includes day of week", () => {
    const result = formatDate(new Date(2026, 2, 15));
    expect(result).toContain("Sunday");
  });
});

describe("formatTime", () => {
  it("formats a time with AM/PM", () => {
    const result = formatTime("2026-03-15T14:30:00");
    expect(result).toMatch(/2:30\s*PM/i);
  });

  it("formats midnight-adjacent time", () => {
    const result = formatTime("2026-03-15T00:15:00");
    expect(result).toMatch(/12:15\s*AM/i);
  });
});

// Null/undefined guards — a missing date used to render "Invalid Date" or the
// 1969 epoch; both now return a neutral placeholder.
describe("formatDate / formatTime null safety", () => {
  it("returns -- for null/undefined/empty date", () => {
    expect(formatDate(null)).toBe("--");
    expect(formatDate(undefined)).toBe("--");
    expect(formatDate("")).toBe("--");
    expect(formatTime(null)).toBe("--");
    expect(formatTime(undefined)).toBe("--");
    expect(formatTime("")).toBe("--");
  });

  it("still formats valid dates normally", () => {
    expect(formatDate(new Date(2026, 2, 15))).toContain("2026");
    expect(formatTime("2026-03-15T14:30:00")).toMatch(/2:30\s*PM/i);
  });
});
