import { describe, it, expect } from "vitest";
import { describeRecurrence } from "@/lib/recurrence";

// Locks in the cadence labels shown on recurring EventCards. Recurring events
// carry only a first-occurrence start_date, so the calendar shows this cadence
// instead of a date that goes stale months after launch.
describe("describeRecurrence", () => {
  it("returns null for empty/missing rules (caller falls back to the date)", () => {
    expect(describeRecurrence(null)).toBeNull();
    expect(describeRecurrence(undefined)).toBeNull();
    expect(describeRecurrence("")).toBeNull();
    expect(describeRecurrence("   ")).toBeNull();
  });

  it("formats weekly weekday rules", () => {
    expect(describeRecurrence("weekly-saturday")).toBe("Every Saturday");
    expect(describeRecurrence("weekly-sunday")).toBe("Every Sunday");
    expect(describeRecurrence("weekly-wednesday")).toBe("Every Wednesday");
  });

  it("formats every-other-week rules", () => {
    expect(describeRecurrence("biweekly-friday")).toBe("Every other Friday");
    expect(describeRecurrence("fortnightly-monday")).toBe("Every other Monday");
  });

  it("falls back to a plain cadence when weekly has no weekday", () => {
    expect(describeRecurrence("weekly")).toBe("Weekly");
    expect(describeRecurrence("biweekly")).toBe("Every other week");
  });

  it("formats monthly ordinal-weekday rules", () => {
    expect(describeRecurrence("monthly-4th-sunday")).toBe("Monthly · 4th Sunday");
    expect(describeRecurrence("monthly-1st-monday")).toBe("Monthly · 1st Monday");
    expect(describeRecurrence("monthly-last-friday")).toBe("Monthly · Last Friday");
  });

  it("formats monthly tithi (lunar) rules without inventing a Gregorian date", () => {
    expect(describeRecurrence("monthly-purnima")).toBe("Monthly · Purnima (full moon)");
    expect(describeRecurrence("monthly-amavasya")).toBe("Monthly · Amavasya (new moon)");
    expect(describeRecurrence("monthly-ekadashi")).toBe("Monthly · Ekadashi");
  });

  it("formats plain monthly / weekday-only monthly", () => {
    expect(describeRecurrence("monthly")).toBe("Monthly");
    expect(describeRecurrence("monthly-sunday")).toBe("Monthly · Sunday");
  });

  it("formats daily and yearly", () => {
    expect(describeRecurrence("daily")).toBe("Daily");
    expect(describeRecurrence("yearly")).toBe("Annually");
    expect(describeRecurrence("annual")).toBe("Annually");
  });

  it("is tolerant of separators and casing", () => {
    expect(describeRecurrence("WEEKLY_SATURDAY")).toBe("Every Saturday");
    expect(describeRecurrence("Monthly 4th Sunday")).toBe("Monthly · 4th Sunday");
  });

  it("degrades to a generic label for unknown-but-recurring shapes", () => {
    expect(describeRecurrence("every-full-moon")).toBe("Recurring event");
    expect(describeRecurrence("custom")).toBe("Recurring event");
  });
});
