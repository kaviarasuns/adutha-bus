export const REPORT_KINDS = ["did_not_come", "wrong_time", "wrong_stop", "other"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export const REPORT_NOTE_LIMIT = 500;

/** A rider's report that a trip in the timetable is wrong. */
export interface Report {
  readonly tripId: string;
  readonly kind: ReportKind;
  readonly note: string;
  readonly feedVersion: string;
  /** YYYYMMDD: the service day the rider was looking at. */
  readonly serviceDate: string;
}

function shortText(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.length <= limit ? value : null;
}

/** Returns the report when `input` is a well-formed one, otherwise null. */
export function parseReport(input: unknown): Report | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }
  const { tripId, kind, note, feedVersion, serviceDate } = input as Record<string, unknown>;
  const cleanTripId = shortText(tripId, 100);
  const cleanNote = shortText(note, REPORT_NOTE_LIMIT);
  const cleanFeedVersion = shortText(feedVersion, 100);
  if (
    !cleanTripId ||
    cleanNote === null ||
    !cleanFeedVersion ||
    typeof serviceDate !== "string" ||
    !/^\d{8}$/.test(serviceDate) ||
    !(REPORT_KINDS as readonly unknown[]).includes(kind)
  ) {
    return null;
  }
  return {
    tripId: cleanTripId,
    kind: kind as ReportKind,
    note: cleanNote.trim(),
    feedVersion: cleanFeedVersion,
    serviceDate,
  };
}
