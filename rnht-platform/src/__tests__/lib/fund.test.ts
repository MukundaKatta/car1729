import { describe, it, expect } from "vitest";
import { prettyFund } from "@/lib/fund";

describe("prettyFund", () => {
  it("maps known slugs to donate-page display names", () => {
    expect(prettyFund("general")).toBe("General Temple Donation");
    expect(prettyFund("festival")).toBe("Festival Donation");
  });

  it("is case-insensitive and trims for known slugs", () => {
    expect(prettyFund("  General ")).toBe("General Temple Donation");
    expect(prettyFund("FESTIVAL")).toBe("Festival Donation");
  });

  it("Title-Cases unknown slug/free-text funds", () => {
    expect(prettyFund("annadanam")).toBe("Annadanam");
    expect(prettyFund("go_seva")).toBe("Go Seva");
    expect(prettyFund("special-abhishekam")).toBe("Special Abhishekam");
  });

  it("falls back to a sensible default for empty input", () => {
    expect(prettyFund("")).toBe("General Temple Donation");
    expect(prettyFund("   ")).toBe("General Temple Donation");
  });
});
