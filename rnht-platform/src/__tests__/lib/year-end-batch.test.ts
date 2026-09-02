import { describe, it, expect } from "vitest";
import {
  groupDonationsByDonor,
  eligibleDonors,
  templeYearWindow,
  currentTempleYear,
  normalizeEmail,
  receiptNumber,
  toReceiptDonation,
  type DbDonation,
  type DonorProfile,
} from "@/lib/year-end-batch";

const d = (over: Partial<DbDonation>): DbDonation => ({
  id: "00000000-0000-0000-0000-000000000000",
  user_id: null,
  donor_name: "Someone",
  donor_email: "a@example.com",
  amount: 100,
  fund_type: "general",
  payment_method: "stripe",
  is_recurring: false,
  created_at: "2026-06-01T12:00:00Z",
  ...over,
});

describe("groupDonationsByDonor", () => {
  it("groups a devotee's account + guest gifts by normalized email and sums", () => {
    const rows = [
      d({ id: "1", donor_email: "Aditya@Example.com", amount: 100, created_at: "2026-02-01T00:00:00Z" }),
      d({ id: "2", donor_email: "aditya@example.com ", amount: "151.50", created_at: "2026-09-01T00:00:00Z", donor_name: "Aditya S." }),
      d({ id: "3", donor_email: "other@example.com", amount: 300 }),
    ];
    const groups = groupDonationsByDonor(rows);
    expect(groups).toHaveLength(2);
    const aditya = groups.find((g) => g.email === "aditya@example.com")!;
    expect(aditya.donations).toHaveLength(2);
    expect(aditya.total).toBe(251.5);
    // freshest gift (2026-09) is first → its name is used
    expect(aditya.name).toBe("Aditya S.");
  });

  it("prefers the profile name + one-line address when available", () => {
    const rows = [d({ donor_email: "x@example.com", donor_name: "Guest Name" })];
    const profiles = new Map<string, DonorProfile>([
      ["x@example.com", { name: "Official Name", address: "1 Main St", city: "Georgetown", state: "TX", zip: "78628" }],
    ]);
    const [g] = groupDonationsByDonor(rows, profiles);
    expect(g.name).toBe("Official Name");
    expect(g.address).toBe("1 Main St, Georgetown, TX, 78628");
  });

  it("falls back to the admin-captured custom_fields.donor_address when the profile has none (gap J)", () => {
    const rows: DbDonation[] = [
      { id: "a1", user_id: null, donor_name: "Cash Donor", donor_email: "cash@x.org", amount: 100, fund_type: "general",
        created_at: "2026-02-01T00:00:00Z", custom_fields: { source: "manual_admin", donor_address: "  12 Temple Rd,\n Austin, TX 78701 " } },
      { id: "a2", user_id: null, donor_name: "Cash Donor", donor_email: "cash@x.org", amount: 200, fund_type: "general",
        created_at: "2026-01-01T00:00:00Z", custom_fields: { source: "manual_admin" } },
    ];
    const [g] = groupDonationsByDonor(rows);
    expect(g.address).toBe("12 Temple Rd, Austin, TX 78701");
    // the profile address still wins when present
    const profiles = new Map([["cash@x.org", { address: "1 Main", city: "Round Rock", state: "TX", zip: "78664" }]]);
    const [g2] = groupDonationsByDonor(rows, profiles);
    expect(g2.address).toBe("1 Main, Round Rock, TX, 78664");
    // object-shaped address is also accepted
    const [g3] = groupDonationsByDonor([{ ...rows[1], custom_fields: { donor_address: { address: "5 Oak", city: "Austin", state: "TX", zip: "78702" } } }]);
    expect(g3.address).toBe("5 Oak, Austin, TX, 78702");
  });

  it("never groups gifts with a blank email together", () => {
    const rows = [d({ id: "a", donor_email: "" }), d({ id: "b", donor_email: "  " })];
    expect(groupDonationsByDonor(rows)).toHaveLength(0);
  });

  it("rounds the total to cents (no float drift)", () => {
    const rows = [d({ id: "1", amount: 0.1 }), d({ id: "2", amount: 0.2 })];
    expect(groupDonationsByDonor(rows)[0].total).toBe(0.3);
  });
});

describe("eligibleDonors", () => {
  const mk = (total: number, email: string): ReturnType<typeof groupDonationsByDonor>[number] =>
    ({ email, name: "n", donations: [], total });

  it("includes >= $250, excludes below", () => {
    const groups = [mk(250, "a@x.com"), mk(249.99, "b@x.com"), mk(1000, "c@x.com")];
    const r = eligibleDonors(groups, 2026, 2027);
    expect(r.eligible.map((g) => g.email)).toEqual(["a@x.com", "c@x.com"]);
    expect(r.skippedBelowThreshold.map((g) => g.email)).toEqual(["b@x.com"]);
    expect(r.notYet).toBe(false);
  });

  it("refuses to issue for a year that is not complete (not_yet)", () => {
    const r = eligibleDonors([mk(1000, "a@x.com")], 2027, 2027);
    expect(r.notYet).toBe(true);
    expect(r.eligible).toHaveLength(0);
  });
});

describe("templeYearWindow", () => {
  it("spans temple-local Jan 1 -> next Jan 1 (Central = 06:00 UTC, standard time)", () => {
    const w = templeYearWindow(2026);
    expect(w.startUtc).toBe("2026-01-01T06:00:00.000Z");
    expect(w.endUtc).toBe("2027-01-01T06:00:00.000Z");
  });
  it("currentTempleYear reads the year in temple time", () => {
    // 2027-01-01T04:00Z is still 2026-12-31 22:00 in Central
    expect(currentTempleYear(new Date("2027-01-01T04:00:00Z"))).toBe(2026);
  });
});

describe("helpers", () => {
  it("normalizeEmail lowercases + trims", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
  it("receiptNumber is REC- + 8 upper hex of the id", () => {
    expect(receiptNumber("1a2b3c4d-5e6f-7890-abcd-ef1234567890")).toBe("REC-1A2B3C4D");
  });
  it("toReceiptDonation maps DB fields to the generator shape", () => {
    const r = toReceiptDonation(d({ id: "abcdef12-0000-0000-0000-000000000000", fund_type: "festival", amount: "51.00" }));
    expect(r).toMatchObject({ fund: "festival", amount: 51, taxDeductible: true, receiptId: "REC-ABCDEF12", status: "completed" });
  });
});
