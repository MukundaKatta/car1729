import "server-only";

import { getPanchanga } from "@bidyashish/panchang";
import {
  DEFAULT_LOCATION,
  type ComputedPanchangam,
  type PanchangamLocation,
} from "@/lib/panchangam";
import { samplePanchangam } from "@/lib/sample-data";

type CorePanchanga = Awaited<ReturnType<typeof getPanchanga>> & {
  tithi: Awaited<ReturnType<typeof getPanchanga>>["tithi"] & {
    paksha?: string;
  };
};
type TransitionKey = "tithi" | "nakshatra" | "yoga" | "karana";

const MINUTE_MS = 60 * 1000;

const MONTH_FROM_PURNIMA_NAKSHATRA: Record<string, string> = {
  Chitra: "Chaitra",
  Vishakha: "Vaishakha",
  Jyeshtha: "Jyeshtha",
  "Purva Ashadha": "Ashadha",
  "Uttara Ashadha": "Ashadha",
  Shravana: "Shravana",
  "Purva Bhadrapada": "Bhadrapada",
  "Uttara Bhadrapada": "Bhadrapada",
  Ashwini: "Ashwayuja",
  Krittika: "Kartika",
  Mrigashira: "Margashirsha",
  Pushya: "Pausha",
  Magha: "Magha",
  "Purva Phalguni": "Phalguna",
  "Uttara Phalguni": "Phalguna",
};

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

function getZonedParts(date: Date, timeZone: string) {
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

function toLibraryDate(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    )
  );
}

function fromLibraryClock(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return {
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

function toMinutes(clock: { hour: number; minute: number; second: number }) {
  return clock.hour * 60 + clock.minute + clock.second / 60;
}

function formatMinutes(totalMinutes: number, dayOffset = 0) {
  let normalized = totalMinutes;
  while (normalized < 0) normalized += 24 * 60;
  while (normalized >= 24 * 60) normalized -= 24 * 60;

  const hour24 = Math.floor(normalized / 60);
  const minute = Math.round(normalized % 60);
  const adjustedHour24 = minute === 60 ? (hour24 + 1) % 24 : hour24;
  const adjustedMinute = minute === 60 ? 0 : minute;
  const suffix = adjustedHour24 >= 12 ? "PM" : "AM";
  const hour12 = adjustedHour24 % 12 || 12;
  const base = `${hour12}:${adjustedMinute.toString().padStart(2, "0")} ${suffix}`;

  if (dayOffset > 0) return `${base} (next day)`;
  if (dayOffset < 0) return `${base} (prev day)`;
  return base;
}

function formatLibraryClock(value: string | Date, referenceMinutes?: number) {
  const minutes = toMinutes(fromLibraryClock(value));
  if (referenceMinutes === undefined) {
    return formatMinutes(minutes);
  }

  let dayOffset = 0;
  if (minutes + 12 * 60 < referenceMinutes) dayOffset = 1;
  if (minutes - 12 * 60 > referenceMinutes) dayOffset = -1;
  return formatMinutes(minutes, dayOffset);
}

async function getCorePanchanga(
  location: PanchangamLocation,
  date: Date
): Promise<CorePanchanga> {
  return getPanchanga(date, location.lat, location.lon, location.timeZone);
}

async function findNextTransition(
  location: PanchangamLocation,
  startDate: Date,
  field: TransitionKey,
  currentNumber: number
) {
  let previous = startDate;
  let cursor = new Date(startDate.getTime() + 30 * MINUTE_MS);
  let nextValue: CorePanchanga | null = null;

  for (let i = 0; i < 96; i += 1) {
    const candidate = await getCorePanchanga(location, cursor);
    if (candidate[field].number !== currentNumber) {
      nextValue = candidate;
      break;
    }
    previous = cursor;
    cursor = new Date(cursor.getTime() + 30 * MINUTE_MS);
  }

  if (!nextValue) return null;

  let left = previous.getTime();
  let right = cursor.getTime();

  while (right - left > MINUTE_MS) {
    const mid = Math.floor((left + right) / 2);
    const candidate = await getCorePanchanga(location, new Date(mid));
    if (candidate[field].number === currentNumber) {
      left = mid;
    } else {
      right = mid;
      nextValue = candidate;
    }
  }

  return {
    transitionDate: new Date(right),
    nextValue,
  };
}

async function findRelevantPurnima(
  location: PanchangamLocation,
  date: Date,
  current: CorePanchanga
) {
  if (current.tithi.number === 15) return current;

  const direction = current.tithi.paksha === "Shukla" ? 1 : -1;
  let cursor = new Date(date);

  for (let i = 0; i < 40; i += 1) {
    cursor = new Date(cursor.getTime() + direction * 12 * 60 * MINUTE_MS);
    const candidate = await getCorePanchanga(location, cursor);
    if (candidate.tithi.number === 15) {
      return candidate;
    }
  }

  return current;
}

async function deriveMasa(
  location: PanchangamLocation,
  date: Date,
  current: CorePanchanga
) {
  const purnima = await findRelevantPurnima(location, date, current);
  return (
    MONTH_FROM_PURNIMA_NAKSHATRA[purnima.nakshatra.name] || samplePanchangam.masa
  );
}

function deriveSamvatsara(date: Date, masa: string) {
  const localYear = date.getFullYear();
  const localMonth = date.getMonth();

  const sakaYear =
    localMonth > 2 || (localMonth === 2 && masa === "Chaitra")
      ? localYear - 78
      : localYear - 79;

  const index = (sakaYear + 12) % 60;
  return SAMVATSARA_CYCLE[(index + 59) % 60] || samplePanchangam.samvatsara;
}

function computeDaySegments(sunrise: string | Date, sunset: string | Date) {
  const sunriseMinutes = toMinutes(fromLibraryClock(sunrise));
  const sunsetMinutes = toMinutes(fromLibraryClock(sunset));
  const segment = (sunsetMinutes - sunriseMinutes) / 8;
  return { sunriseMinutes, sunsetMinutes, segment };
}

function rangeFromSegment(
  sunriseMinutes: number,
  segmentLength: number,
  segmentNumber: number
) {
  const start = sunriseMinutes + (segmentNumber - 1) * segmentLength;
  const end = start + segmentLength;
  return {
    start: formatMinutes(start),
    end: formatMinutes(end),
  };
}

function computeRahuTimings(
  varaName: string,
  sunrise: string | Date,
  sunset: string | Date
) {
  const { sunriseMinutes, segment } = computeDaySegments(sunrise, sunset);

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

  return {
    rahu: rangeFromSegment(sunriseMinutes, segment, rahuSegments[varaName]),
    yama: rangeFromSegment(sunriseMinutes, segment, yamaSegments[varaName]),
    gulika: rangeFromSegment(sunriseMinutes, segment, gulikaSegments[varaName]),
  };
}

function computeAbhijitMuhurtham(sunrise: string | Date, sunset: string | Date) {
  const { sunriseMinutes, sunsetMinutes } = computeDaySegments(sunrise, sunset);
  const midday = (sunriseMinutes + sunsetMinutes) / 2;
  const duration = (sunsetMinutes - sunriseMinutes) / 15;
  return {
    name: "Abhijit Muhurtham",
    start: formatMinutes(midday - duration / 2),
    end: formatMinutes(midday + duration / 2),
  };
}

function fallbackPanchangam(location: PanchangamLocation, date: Date): ComputedPanchangam {
  return {
    ...samplePanchangam,
    date: date.toISOString().slice(0, 10),
    location: location.label,
  };
}

export async function computePanchangamOnServer(
  location: PanchangamLocation = DEFAULT_LOCATION,
  date: Date = new Date()
): Promise<ComputedPanchangam> {
  try {
    const libraryDate = toLibraryDate(date, location.timeZone);
    const core = await getCorePanchanga(location, libraryDate);

    const [tithiEnd, nakshatraEnd, yogaEnd, karanaEnd, masa] = await Promise.all([
      findNextTransition(location, libraryDate, "tithi", core.tithi.number),
      findNextTransition(location, libraryDate, "nakshatra", core.nakshatra.number),
      findNextTransition(location, libraryDate, "yoga", core.yoga.number),
      findNextTransition(location, libraryDate, "karana", core.karana.number),
      deriveMasa(location, libraryDate, core),
    ]);

    const { sunriseMinutes } = computeDaySegments(core.sunrise, core.sunset);
    const rahuTimings = computeRahuTimings(core.vara.name, core.sunrise, core.sunset);
    const muhurtham = computeAbhijitMuhurtham(core.sunrise, core.sunset);
    const zonedParts = getZonedParts(date, location.timeZone);
    const displayDate = `${zonedParts.year}-${String(zonedParts.month).padStart(
      2,
      "0"
    )}-${String(zonedParts.day).padStart(2, "0")}`;

    return {
      date: displayDate,
      location: location.label,
      sunrise: formatLibraryClock(core.sunrise),
      sunset: formatLibraryClock(core.sunset, sunriseMinutes),
      tithi: {
        name: core.tithi.name,
        start: "Current",
        end: tithiEnd
          ? formatLibraryClock(tithiEnd.transitionDate, sunriseMinutes)
          : "Until next update",
        paksha: core.tithi.paksha || samplePanchangam.tithi.paksha,
      },
      nakshatra: {
        name: core.nakshatra.name,
        start: "Current",
        end: nakshatraEnd
          ? formatLibraryClock(nakshatraEnd.transitionDate, sunriseMinutes)
          : "Until next update",
      },
      yoga: {
        name: core.yoga.name,
        start: "Current",
        end: yogaEnd
          ? formatLibraryClock(yogaEnd.transitionDate, sunriseMinutes)
          : "Until next update",
      },
      karana: {
        name: core.karana.name,
        start: "Current",
        end: karanaEnd
          ? formatLibraryClock(karanaEnd.transitionDate, sunriseMinutes)
          : "Until next update",
      },
      rahu_kalam: {
        start: rahuTimings.rahu.start,
        end: rahuTimings.rahu.end,
        warning: true,
      },
      yama_gandam: {
        start: rahuTimings.yama.start,
        end: rahuTimings.yama.end,
      },
      gulika_kalam: {
        start: rahuTimings.gulika.start,
        end: rahuTimings.gulika.end,
      },
      muhurtham,
      festival: null,
      vaara: core.vara.name,
      masa,
      samvatsara: deriveSamvatsara(date, masa),
    };
  } catch (error) {
    console.error("Failed to compute Panchangam", error);
    return fallbackPanchangam(location, date);
  }
}
