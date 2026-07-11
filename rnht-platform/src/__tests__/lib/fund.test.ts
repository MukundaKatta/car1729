import { describe, it, expect } from "vitest";
import { prettyFund } from "@/lib/fund";

describe("prettyFund", () => {
  it("maps all backend fund-labels slugs to their canonical display names", () => {
    // Must stay in sync with supabase/functions/_shared/fund-labels.ts.
    expect(prettyFund("general")).toBe("General Temple Donation");
    expect(prettyFund("festival")).toBe("Festival Donation");
    expect(prettyFund("annadanam")).toBe("Annadanam Donation");
    expect(prettyFund("building")).toBe("Building Donation");
    expect(prettyFund("rudra-narayana")).toBe("Sri Rudra Narayana Seva");
    expect(prettyFund("hanuman")).toBe("Lord Hanuman Seva");
  });

  it("is case-insensitive and trims for known slugs", () => {
    expect(prettyFund("  General ")).toBe("General Temple Donation");
    expect(prettyFund("FESTIVAL")).toBe("Festival Donation");
  });

  it("Title-Cases unknown slug/free-text funds", () => {
    expect(prettyFund("go_seva")).toBe("Go Seva");
    expect(prettyFund("special-abhishekam")).toBe("Special Abhishekam");
  });

  it("falls back to a sensible default for empty input", () => {
    expect(prettyFund("")).toBe("General Temple Donation");
    expect(prettyFund("   ")).toBe("General Temple Donation");
  });
});
