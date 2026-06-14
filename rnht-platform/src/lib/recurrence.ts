/**
 * Human-readable cadence labels for recurring events.
 *
 * Recurring events (weekly bhajans, monthly vratams) carry a `recurrence_rule`
 * string and a `start_date` that is just the *first* occurrence. Rendering that
 * absolute start_date on the calendar is misleading — months after launch a
 * weekly bhajan would still read "March 14, 2026". Instead we surface the
 * cadence ("Every Saturday", "Monthly · 4th Sunday"), which stays correct
 * forever and is what a devotee actually wants to know.
 *
 * Returns null for an unknown/empty rule so callers can fall back gracefully.
 */

const WEEKDAYS: Record<string, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

// Lunar (tithi-based) monthly observances — these can't be reduced to a fixed
// weekday/ordinal, so we name the tithi rather than guess a Gregorian date.
const TITHI_LABELS: Record<string, string> = {
  purnima: "Purnima (full moon)",
  amavasya: "Amavasya (new moon)",
  ekadashi: "Ekadashi",
  pradosham: "Pradosham",
  sankashti: "Sankashti Chaturthi",
  chaturthi: "Chaturthi",
};

const ORDINALS: Record<string, string> = {
  "1st": "1st",
  "2nd": "2nd",
  "3rd": "3rd",
  "4th": "4th",
  "5th": "5th",
  last: "Last",
  first: "1st",
  second: "2nd",
  third: "3rd",
  fourth: "4th",
  fifth: "5th",
};

export function describeRecurrence(rule: string | null | undefined): string | null {
  if (!rule) return null;
  const parts = rule.trim().toLowerCase().split(/[-_\s]+/).filter(Boolean);
  if (parts.length === 0) return null;

  const [freq, ...rest] = parts;

  switch (freq) {
    case "daily":
      return "Daily";

    case "weekly":
    case "biweekly":
    case "fortnightly": {
      const everyOther = freq !== "weekly";
      const day = rest.find((p) => WEEKDAYS[p]);
      if (day) {
        return everyOther
          ? `Every other ${WEEKDAYS[day]}`
          : `Every ${WEEKDAYS[day]}`;
      }
      return everyOther ? "Every other week" : "Weekly";
    }

    case "monthly": {
      // Tithi-based (lunar) — e.g. monthly-purnima
      const tithi = rest.find((p) => TITHI_LABELS[p]);
      if (tithi) return `Monthly · ${TITHI_LABELS[tithi]}`;

      // Ordinal weekday — e.g. monthly-4th-sunday
      const ord = rest.find((p) => ORDINALS[p]);
      const day = rest.find((p) => WEEKDAYS[p]);
      if (ord && day) return `Monthly · ${ORDINALS[ord]} ${WEEKDAYS[day]}`;
      if (day) return `Monthly · ${WEEKDAYS[day]}`;

      return "Monthly";
    }

    case "yearly":
    case "annual":
    case "annually":
      return "Annually";

    default:
      // Known-to-be-recurring but in a shape we don't parse — better than a
      // stale date, and honest about the cadence being non-specific.
      return "Recurring event";
  }
}
