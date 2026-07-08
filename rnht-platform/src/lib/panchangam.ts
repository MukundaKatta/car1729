import { samplePanchangam } from "@/lib/sample-data";

export type PanchangamLocation = {
  lat: number;
  lon: number;
  label: string;
  timeZone: string;
};

export type ComputedPanchangam = typeof samplePanchangam;

export const DEFAULT_LOCATION: PanchangamLocation = {
  lat: 30.2672,
  lon: -97.7431,
  label: "Austin, TX",
  timeZone: "America/Chicago",
};

const TITHI_NAMES = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
];

const NAKSHATRA_NAMES = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

const YOGA_NAMES = [
  "Vishkumbha",
  "Preeti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarman",
  "Dhriti",
  "Shoola",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyan",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];

const KARANA_NAMES = [
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Gara",
  "Vanija",
  "Vishti",
  "Shakuni",
  "Chatushpada",
  "Naga",
  "Kimstughna",
];

// Approximate Gregorian-month -> masa table for the client. The astronomically
// exact masa is derived server-side (via purnima nakshatra); the static export
// can't run that at runtime, so this simplified per-month label is shown.
const MASA_BY_MONTH = [
  "Pausha",
  "Magha",
  "Phalguna",
  "Chaitra",
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashwayuja",
  "Kartika",
  "Margashirsha",
];

// Day-precise amanta masa ranges sourced from the temple's own 2026 calendar
// PDF (2026-rnht.pdf, "Panchanga by mypanchang.com" for Austin, TX). The 2026
// leap (Adhika) Jyeshtha shifts every month boundary until Shravana, so the
// coarse month map below gets mid-May through mid-August wrong (client 07-08:
// July 8 must read "Nija Jyeshtha", not Ashadha). Checked FIRST; ISO-date
// string compare. Extend from the temple calendar as later months need it.
const MASA_RANGES: Array<{ from: string; to: string; label: string }> = [
  { from: "2026-05-17", to: "2026-06-14", label: "Adhika Jyeshtha" },
  { from: "2026-06-15", to: "2026-07-13", label: "Nija Jyeshtha" },
  { from: "2026-07-14", to: "2026-08-13", label: "Ashadha" },
  { from: "2026-08-14", to: "2026-09-10", label: "Shravana" },
  { from: "2026-09-11", to: "2026-10-10", label: "Bhadrapada" },
  { from: "2026-10-11", to: "2026-11-08", label: "Ashwayuja" },
  { from: "2026-11-09", to: "2026-12-08", label: "Karthika" },
  // Runs to year end; extend from the temple's 2027 calendar when it arrives.
  { from: "2026-12-09", to: "2026-12-31", label: "Margasira" },
];

const SAMVATSARA_CYCLE = [
  "Prabhava",
  "Vibhava",
  "Shukla",
  "Pramoda",
  "Prajotpatti",
  "Angirasa",
  "Shrimukha",
  "Bhava",
  "Yuva",
  "Dhata",
  "Ishvara",
  "Bahudhanya",
  "Pramathi",
  "Vikrama",
  "Vrisha",
  "Chitrabhanu",
  "Svabhanu",
  "Tarana",
  "Parthiva",
  "Vyaya",
  "Sarvajit",
  "Sarvadhari",
  "Virodhi",
  "Vikruti",
  "Khara",
  "Nandana",
  "Vijaya",
  "Jaya",
  "Manmatha",
  "Durmukhi",
  "Hevilambi",
  "Vilambi",
  "Vikari",
  "Sharvari",
  "Plava",
  "Shubhakruth",
  "Shobhakruth",
  "Krodhi",
  "Vishvavasu",
  "Parabhava",
  "Plavanga",
  "Kilaka",
  "Saumya",
  "Sadharana",
  "Virodhikruth",
  "Paridhavi",
  "Pramadicha",
  "Ananda",
  "Rakshasa",
  "Nala",
  "Pingala",
  "Kalayukthi",
  "Siddharthi",
  "Raudri",
  "Durmathi",
  "Dundubhi",
  "Rudhirodgari",
  "Raktakshi",
  "Krodhana",
  "Akshaya",
] as const;

const MINUTE_MS = 60 * 1000;
const TITHI_DEGREES = 12;
const NAKSHATRA_DEGREES = 360 / 27;

type FieldKey = "tithi" | "nakshatra" | "yoga" | "karana";

type CorePanchangam = {
  date: string;
  vaara: string;
  sunriseDate: Date;
  sunsetDate: Date;
  tithi: { number: number; name: string; paksha: string };
  nakshatra: { number: number; name: string };
  yoga: { number: number; name: string };
  karana: { number: number; name: string };
};

function normalizeAngle(value: number) {
  let angle = value % 360;
  if (angle < 0) angle += 360;
  return angle;
}

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function daysSinceJ2000(date: Date) {
  return julianDay(date) - 2451545.0;
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function getZonedDateString(date: Date, timeZone: string) {
  const { year, month, day } = getZonedDateParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getWeekday(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  }).format(date);
}

function getLahiriAyanamsa(date: Date) {
  const parts = getZonedDateParts(date, "UTC");
  const centuries =
    (parts.year + (parts.month - 1) / 12 + (parts.day - 1) / 365.25 - 1900) /
    100;

  return (
    22.46 +
    1.3915817 * centuries -
    0.0130125 * centuries * centuries -
    0.000000333 * centuries * centuries * centuries
  );
}

function getApproximateSunLongitude(date: Date) {
  const d = daysSinceJ2000(date);
  const meanLongitude = 280.46 + 0.9856474 * d;
  const meanAnomaly = (357.528 + 0.9856003 * d) * (Math.PI / 180);
  const longitude =
    meanLongitude +
    1.915 * Math.sin(meanAnomaly) +
    0.02 * Math.sin(2 * meanAnomaly);

  return normalizeAngle(longitude - getLahiriAyanamsa(date));
}

function getApproximateMoonLongitude(date: Date) {
  const d = daysSinceJ2000(date);
  const longitude =
    218.316 +
    13.176396 * d +
    6.289 * Math.sin((134.963 + 13.064993 * d) * (Math.PI / 180)) +
    1.274 * Math.sin((2 * (297.85 + 12.190749 * d) - (134.963 + 13.064993 * d)) * (Math.PI / 180)) +
    0.658 * Math.sin((2 * (297.85 + 12.190749 * d)) * (Math.PI / 180)) +
    0.214 * Math.sin((2 * (134.963 + 13.064993 * d)) * (Math.PI / 180)) +
    0.11 * Math.sin((297.85 + 12.190749 * d) * (Math.PI / 180));

  return normalizeAngle(longitude - getLahiriAyanamsa(date));
}

function getSunriseSunset(date: Date, location: PanchangamLocation) {
  const zoned = getZonedDateParts(date, location.timeZone);
  const utcNoon = new Date(
    Date.UTC(zoned.year, zoned.month - 1, zoned.day, 12, 0, 0)
  );
  const n = julianDay(utcNoon) - 2451545.0 + 0.0008;
  const jStar = n - location.lon / 360;
  const m = normalizeAngle(357.5291 + 0.98560028 * jStar);
  const c =
    1.9148 * Math.sin((m * Math.PI) / 180) +
    0.02 * Math.sin((2 * m * Math.PI) / 180) +
    0.0003 * Math.sin((3 * m * Math.PI) / 180);
  const lambda = normalizeAngle(m + c + 180 + 102.9372);
  const jTransit =
    2451545.0 +
    jStar +
    0.0053 * Math.sin((m * Math.PI) / 180) -
    0.0069 * Math.sin((2 * lambda * Math.PI) / 180);
  const delta = Math.asin(
    Math.sin((lambda * Math.PI) / 180) * Math.sin((23.44 * Math.PI) / 180)
  );
  const phi = (location.lat * Math.PI) / 180;
  const altitude = (-0.833 * Math.PI) / 180;
  // Clamp the cosine to [-1, 1] before acos. At high latitudes (polar day /
  // night) the ratio can fall slightly outside that range, which makes acos
  // return NaN → `new Date(NaN)` (Invalid Date) → the panchangam view crashes
  // and the offending location gets persisted, re-crashing on every reload.
  const cosHourAngle =
    (Math.sin(altitude) - Math.sin(phi) * Math.sin(delta)) /
    (Math.cos(phi) * Math.cos(delta));
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle)));
  const jSet = jTransit + hourAngle / (2 * Math.PI);
  const jRise = jTransit - hourAngle / (2 * Math.PI);

  return {
    sunrise: new Date((jRise - 2440587.5) * 86400000),
    sunset: new Date((jSet - 2440587.5) * 86400000),
  };
}

function formatTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getLocalDayDifference(date: Date, reference: Date, timeZone: string) {
  const dateKey = getZonedDateString(date, timeZone);
  const referenceKey = getZonedDateString(reference, timeZone);
  if (dateKey === referenceKey) return 0;
  return date.getTime() > reference.getTime() ? 1 : -1;
}

function formatRelativeTime(date: Date, reference: Date, timeZone: string) {
  const base = formatTime(date, timeZone);
  const diff = getLocalDayDifference(date, reference, timeZone);
  if (diff > 0) return `${base} (next day)`;
  if (diff < 0) return `${base} (prev day)`;
  return base;
}

function getTithi(sunLongitude: number, moonLongitude: number) {
  const difference = normalizeAngle(moonLongitude - sunLongitude);
  const number = Math.floor(difference / TITHI_DEGREES) + 1;
  const paksha = number <= 15 ? "Shukla" : "Krishna";
  const normalizedNumber = number <= 15 ? number : number - 15;

  return {
    number,
    name:
      normalizedNumber === 15
        ? paksha === "Shukla"
          ? "Purnima"
          : "Amavasya"
        : TITHI_NAMES[normalizedNumber - 1],
    paksha,
  };
}

function getNakshatra(moonLongitude: number) {
  const number = Math.floor(normalizeAngle(moonLongitude) / NAKSHATRA_DEGREES) + 1;
  return { number, name: NAKSHATRA_NAMES[number - 1] || "Unknown" };
}

function getYoga(sunLongitude: number, moonLongitude: number) {
  const number =
    Math.floor(normalizeAngle(sunLongitude + moonLongitude) / NAKSHATRA_DEGREES) + 1;
  return { number, name: YOGA_NAMES[number - 1] || "Unknown" };
}

function getKarana(sunLongitude: number, moonLongitude: number) {
  const difference = normalizeAngle(moonLongitude - sunLongitude);
  const rawKarana = Math.floor(difference / 6) + 1; // 1..60
  // Of the 60 half-tithis: #1 is the fixed Kimstughna, #2..57 cycle the 7
  // movable karanas (Bava..Vishti, Bava-aligned), and #58..60 are the fixed
  // Shakuni / Chatushpada / Naga.
  let index: number;
  if (rawKarana === 1) {
    index = 10; // Kimstughna
  } else if (rawKarana >= 58) {
    index = 7 + (rawKarana - 58); // Shakuni / Chatushpada / Naga
  } else {
    index = (rawKarana - 2) % 7; // movable cycle
  }

  return {
    number: rawKarana,
    name: KARANA_NAMES[Math.min(index, KARANA_NAMES.length - 1)] || "Unknown",
  };
}

function getCorePanchangam(location: PanchangamLocation, date: Date): CorePanchangam {
  const { sunrise, sunset } = getSunriseSunset(date, location);
  const sunLongitude = getApproximateSunLongitude(date);
  const moonLongitude = getApproximateMoonLongitude(date);

  return {
    date: getZonedDateString(date, location.timeZone),
    vaara: getWeekday(date, location.timeZone),
    sunriseDate: sunrise,
    sunsetDate: sunset,
    tithi: getTithi(sunLongitude, moonLongitude),
    nakshatra: getNakshatra(moonLongitude),
    yoga: getYoga(sunLongitude, moonLongitude),
    karana: getKarana(sunLongitude, moonLongitude),
  };
}

function getFieldNumber(core: CorePanchangam, field: FieldKey) {
  return core[field].number;
}

async function findTransition(
  location: PanchangamLocation,
  date: Date,
  field: FieldKey,
  direction: 1 | -1
) {
  const current = getFieldNumber(getCorePanchangam(location, date), field);
  let previous = date;
  let cursor = new Date(date.getTime() + direction * 30 * MINUTE_MS);
  let boundary: Date | null = null;

  for (let i = 0; i < 96; i += 1) {
    const candidate = getCorePanchangam(location, cursor);
    if (getFieldNumber(candidate, field) !== current) {
      boundary = cursor;
      break;
    }
    previous = cursor;
    cursor = new Date(cursor.getTime() + direction * 30 * MINUTE_MS);
  }

  if (!boundary) return null;

  let left = Math.min(previous.getTime(), boundary.getTime());
  let right = Math.max(previous.getTime(), boundary.getTime());

  while (right - left > MINUTE_MS) {
    const mid = Math.floor((left + right) / 2);
    const candidate = getCorePanchangam(location, new Date(mid));
    if (getFieldNumber(candidate, field) === current) {
      if (direction > 0) {
        left = mid;
      } else {
        right = mid;
      }
    } else if (direction > 0) {
      right = mid;
    } else {
      left = mid;
    }
  }

  return new Date(direction > 0 ? right : left);
}

function computeDaySegments(sunrise: Date, sunset: Date) {
  const segment = (sunset.getTime() - sunrise.getTime()) / 8;
  return { sunrise, segment };
}

function segmentRange(sunrise: Date, segment: number, position: number, timeZone: string) {
  const start = new Date(sunrise.getTime() + (position - 1) * segment);
  const end = new Date(start.getTime() + segment);
  return {
    start: formatTime(start, timeZone),
    end: formatTime(end, timeZone),
  };
}

function getMasa(date: Date, timeZone: string) {
  const iso = getZonedDateString(date, timeZone);
  const range = MASA_RANGES.find((r) => iso >= r.from && iso <= r.to);
  if (range) return range.label;
  const { month } = getZonedDateParts(date, timeZone);
  return MASA_BY_MONTH[month - 1] || samplePanchangam.masa;
}

function getSamvatsara(date: Date, masa: string, timeZone: string) {
  const { year, month } = getZonedDateParts(date, timeZone);
  const sakaYear = month > 3 || (month === 3 && masa === "Chaitra") ? year - 78 : year - 79;
  const index = (sakaYear + 11) % 60;
  return SAMVATSARA_CYCLE[index] || samplePanchangam.samvatsara;
}

export function createPanchangamLoadingState(
  location: PanchangamLocation,
  // Pass `null` for the initial SSG/hydration render: baking today's date into
  // the static HTML causes a hydration text mismatch (React #425) when the page
  // is viewed on a different day than it was built. The real date is filled in
  // client-side once computePanchangam runs in a useEffect.
  date: Date | null = new Date()
): ComputedPanchangam {
  const dateString = date ? getZonedDateString(date, location.timeZone) : "";
  const vaara = date ? getWeekday(date, location.timeZone) : "";

  return {
    ...samplePanchangam,
    date: dateString,
    location: location.label,
    sunrise: "--",
    sunset: "--",
    tithi: {
      name: "Calculating...",
      start: "--",
      end: "--",
      paksha: "--",
    },
    nakshatra: {
      name: "Calculating...",
      start: "--",
      end: "--",
    },
    yoga: {
      name: "Calculating...",
      start: "--",
      end: "--",
    },
    karana: {
      name: "Calculating...",
      start: "--",
      end: "--",
    },
    rahu_kalam: {
      start: "--",
      end: "--",
      warning: true,
    },
    yama_gandam: {
      start: "--",
      end: "--",
    },
    gulika_kalam: {
      start: "--",
      end: "--",
    },
    muhurtham: {
      name: "Amrut Kalam",
      start: "--",
      end: "--",
    },
    festival: null,
    vaara,
    masa: "Calculating",
    samvatsara: "Calculating",
  };
}

export async function computePanchangam(
  location: PanchangamLocation,
  date = new Date()
): Promise<ComputedPanchangam> {
  const core = getCorePanchangam(location, date);
  const [
    tithiStart,
    tithiEnd,
    nakshatraStart,
    nakshatraEnd,
    yogaStart,
    yogaEnd,
    karanaStart,
    karanaEnd,
  ] = await Promise.all([
    findTransition(location, date, "tithi", -1),
    findTransition(location, date, "tithi", 1),
    findTransition(location, date, "nakshatra", -1),
    findTransition(location, date, "nakshatra", 1),
    findTransition(location, date, "yoga", -1),
    findTransition(location, date, "yoga", 1),
    findTransition(location, date, "karana", -1),
    findTransition(location, date, "karana", 1),
  ]);

  const { sunrise, segment } = computeDaySegments(core.sunriseDate, core.sunsetDate);
  const rahuSegments: Record<string, number> = {
    Sunday: 8,
    Monday: 2,
    Tuesday: 7,
    Wednesday: 5,
    Thursday: 6,
    Friday: 4,
    Saturday: 3,
  };
  const yamaSegments: Record<string, number> = {
    Sunday: 5,
    Monday: 4,
    Tuesday: 3,
    Wednesday: 2,
    Thursday: 1,
    Friday: 7,
    Saturday: 6,
  };
  const gulikaSegments: Record<string, number> = {
    Sunday: 7,
    Monday: 6,
    Tuesday: 5,
    Wednesday: 4,
    Thursday: 3,
    Friday: 2,
    Saturday: 1,
  };

  const solarNoon = new Date((core.sunriseDate.getTime() + core.sunsetDate.getTime()) / 2);
  const muhurthamStart = new Date(solarNoon.getTime() - 24 * MINUTE_MS);
  const muhurthamEnd = new Date(solarNoon.getTime() + 24 * MINUTE_MS);
  const masa = getMasa(date, location.timeZone);

  return {
    ...samplePanchangam,
    date: core.date,
    location: location.label,
    sunrise: formatTime(core.sunriseDate, location.timeZone),
    sunset: formatTime(core.sunsetDate, location.timeZone),
    tithi: {
      name: core.tithi.name,
      paksha: core.tithi.paksha,
      start: tithiStart
        ? formatRelativeTime(tithiStart, date, location.timeZone)
        : "--",
      end: tithiEnd ? formatRelativeTime(tithiEnd, date, location.timeZone) : "--",
    },
    nakshatra: {
      name: core.nakshatra.name,
      start: nakshatraStart
        ? formatRelativeTime(nakshatraStart, date, location.timeZone)
        : "--",
      end: nakshatraEnd
        ? formatRelativeTime(nakshatraEnd, date, location.timeZone)
        : "--",
    },
    yoga: {
      name: core.yoga.name,
      start: yogaStart ? formatRelativeTime(yogaStart, date, location.timeZone) : "--",
      end: yogaEnd ? formatRelativeTime(yogaEnd, date, location.timeZone) : "--",
    },
    karana: {
      name: core.karana.name,
      start: karanaStart
        ? formatRelativeTime(karanaStart, date, location.timeZone)
        : "--",
      end: karanaEnd
        ? formatRelativeTime(karanaEnd, date, location.timeZone)
        : "--",
    },
    rahu_kalam: {
      ...segmentRange(
        sunrise,
        segment,
        rahuSegments[core.vaara] || 1,
        location.timeZone
      ),
      warning: true,
    },
    yama_gandam: segmentRange(
      sunrise,
      segment,
      yamaSegments[core.vaara] || 1,
      location.timeZone
    ),
    gulika_kalam: segmentRange(
      sunrise,
      segment,
      gulikaSegments[core.vaara] || 1,
      location.timeZone
    ),
    muhurtham: {
      name: "Amrut Kalam",
      start: formatTime(muhurthamStart, location.timeZone),
      end: formatTime(muhurthamEnd, location.timeZone),
    },
    festival: null,
    vaara: core.vaara,
    masa,
    samvatsara: getSamvatsara(date, masa, location.timeZone),
  };
}
