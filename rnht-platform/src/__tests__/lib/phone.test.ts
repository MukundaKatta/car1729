import { describe, it, expect } from "vitest";
import { normalizePhone } from "@/lib/phone";

// Locks in the shared normalizePhone used by BOTH /login and the dashboard
// inline sign-in. These previously diverged (the dashboard accepted 8–15 digits
// and blindly prepended +1, producing malformed E.164 like "+115125550123").
describe("normalizePhone", () => {
  it("formats a bare 10-digit US number to E.164", () => {
    expect(normalizePhone("5125550123")).toBe("+15125550123");
  });

  it("strips US formatting characters", () => {
    expect(normalizePhone("(512) 555-0123")).toBe("+15125550123");
    expect(normalizePhone(" 512.555.0123 ")).toBe("+15125550123");
  });

  it("rejects a US number that is not exactly 10 digits", () => {
    expect(normalizePhone("512555012")).toBeNull(); // 9
    expect(normalizePhone("51255501234")).toBeNull(); // 11, no +
  });

  it("rejects the 11-digit '1NXXNXXXXXX' form without a + (the old divergence bug)", () => {
    // The dashboard used to (wrongly) turn this into +115125550123.
    expect(normalizePhone("15125550123")).toBeNull();
  });

  it("accepts a full international E.164 with 11–15 digits", () => {
    expect(normalizePhone("+15125550123")).toBe("+15125550123"); // 11
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958"); // UK
    expect(normalizePhone("+999999999999999")).toBe("+999999999999999"); // 15
  });

  it("rejects + numbers outside 11–15 digits", () => {
    expect(normalizePhone("+1234567890")).toBeNull(); // 10
    expect(normalizePhone("+9999999999999999")).toBeNull(); // 16
  });

  it("rejects empty / non-numeric input", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("+")).toBeNull();
  });
  it("ignores invisible bidi/format marks (iOS Contacts paste, U+200E prefix)", () => {
    expect(normalizePhone("\u202a+1 (512) 555-0123\u202c")).toBe("+15125550123");
    expect(normalizePhone("\u200e+15125550123")).toBe("+15125550123");
    expect(normalizePhone("\u200b5125550123")).toBe("+15125550123");
  });
});
