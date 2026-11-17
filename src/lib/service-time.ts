/** India Standard Time is UTC+5:30 all year. */
const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

export interface ServiceDay {
  /** YYYYMMDD */
  readonly date: string;
  /** 0 is Monday. */
  readonly weekday: number;
}

export interface Moment extends ServiceDay {
  /** Seconds after midnight. */
  readonly seconds: number;
}

function dayOf(shifted: Date): ServiceDay {
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return { date: `${year}${month}${day}`, weekday: (shifted.getUTCDay() + 6) % 7 };
}

function parseDate(date: string): Date {
  return new Date(
    Date.UTC(Number(date.slice(0, 4)), Number(date.slice(4, 6)) - 1, Number(date.slice(6, 8))),
  );
}

/** The wall-clock date and time in Tamil Nadu at `instant`, whatever the device's time zone. */
export function momentInIst(instant: Date): Moment {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MS);
  return {
    ...dayOf(shifted),
    seconds: shifted.getUTCHours() * 3600 + shifted.getUTCMinutes() * 60 + shifted.getUTCSeconds(),
  };
}

export function previousDay(day: ServiceDay): ServiceDay {
  return dayOf(new Date(parseDate(day.date).getTime() - DAY_MS));
}

/** Reads a GTFS `H:MM:SS` time, which may pass 24:00:00. Null when malformed. */
export function parseGtfsTime(text: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec(text);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

/** `8:40 AM`. Times past midnight wrap to the next day's clock. */
export function formatClock(seconds: number): string {
  const minutes = Math.floor((((seconds % 86400) + 86400) % 86400) / 60);
  const hour24 = Math.floor(minutes / 60);
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour12}:${minute} ${hour24 < 12 ? "AM" : "PM"}`;
}

/** `17 Nov 2026` for a YYYYMMDD date; `locale` is a language code such as `en` or `ta`. */
export function formatDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-IN`, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDate(date));
}
