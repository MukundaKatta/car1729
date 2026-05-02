import { samplePanchangam } from "@/lib/sample-data";

export type PanchangamLocation = {
  lat: number;
  lon: number;
  label: string;
  timeZone: string;
};

export type ComputedPanchangam = typeof samplePanchangam;

export const DEFAULT_LOCATION: PanchangamLocation = {
  lat: 30.6333,
  lon: -97.6778,
  label: "Georgetown, TX",
  timeZone: "America/Chicago",
};

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
  };
}

export function createPanchangamLoadingState(
  location: PanchangamLocation,
  date = new Date()
): ComputedPanchangam {
  const { year, month, day } = getZonedDateParts(date, location.timeZone);
  const vaara = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: location.timeZone,
  }).format(date);

  return {
    ...samplePanchangam,
    date: `${year}-${month}-${day}`,
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
      name: "Abhijit Muhurtham",
      start: "--",
      end: "--",
    },
    festival: null,
    vaara,
    masa: "Calculating",
    samvatsara: "Calculating",
  };
}
