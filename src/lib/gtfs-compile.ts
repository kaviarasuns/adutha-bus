import { parseGtfsTime } from "./service-time.ts";
import {
  SOURCE_KINDS,
  type Agency,
  type Call,
  type Route,
  type Service,
  type Shape,
  type Source,
  type SourceKind,
  type Stop,
  type Timetable,
  type Trip,
} from "./timetable.ts";

/** File name (`stops.txt`) to file text. */
export type GtfsFiles = Readonly<Record<string, string>>;

export type CompileResult =
  | { readonly ok: true; readonly timetable: Timetable }
  | { readonly ok: false; readonly problems: readonly string[] };

type Row = Readonly<Record<string, string>>;

/**
 * `sources.txt` and `stop_aliases.txt` are our additions to GTFS, as is the
 * `source_id` column of `trips.txt`. GTFS readers ignore files and columns
 * they do not know.
 */
const REQUIRED_FILES = [
  "agency.txt",
  "stops.txt",
  "routes.txt",
  "trips.txt",
  "stop_times.txt",
  "calendar.txt",
  "feed_info.txt",
  "sources.txt",
];

const DAY_COLUMNS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DATE = /^\d{8}$/;

export function parseCsv(text: string): Row[] {
  const source = text.replace(/^﻿/, "");
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source.charAt(i);
    if (quoted) {
      if (ch !== '"') {
        field += ch;
      } else if (source.charAt(i + 1) === '"') {
        field += '"';
        i++;
      } else {
        quoted = false;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      record.push(field);
      field = "";
    } else if (ch === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const [header, ...rows] = records;
  if (!header) {
    return [];
  }
  return rows
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) =>
      Object.fromEntries(header.map((name, i) => [name.trim(), (row[i] ?? "").trim()])),
    );
}

/** Checks a GTFS feed and turns it into the one object the app loads. */
export function compileGtfs(files: GtfsFiles): CompileResult {
  const missing = REQUIRED_FILES.filter((name) => files[name] === undefined);
  if (missing.length > 0) {
    return { ok: false, problems: missing.map((name) => `${name} is missing`) };
  }

  const problems: string[] = [];
  const rows = (name: string) => parseCsv(files[name] ?? "");
  const cell = (row: Row, column: string) => row[column] ?? "";

  const uniqueIds = (name: string, column: string): Set<string> => {
    const ids = new Set<string>();
    for (const row of rows(name)) {
      const id = cell(row, column);
      if (id === "") {
        problems.push(`${name}: a row has no ${column}`);
      } else if (ids.has(id)) {
        problems.push(`${name}: ${column} ${id} appears twice`);
      }
      ids.add(id);
    }
    return ids;
  };

  const agencyIds = uniqueIds("agency.txt", "agency_id");
  const agencies: Agency[] = rows("agency.txt").map((row) => ({
    id: cell(row, "agency_id"),
    name: cell(row, "agency_name"),
  }));

  const tamilNames = new Map<string, string>();
  for (const row of rows("translations.txt")) {
    if (
      cell(row, "table_name") === "stops" &&
      cell(row, "field_name") === "stop_name" &&
      cell(row, "language") === "ta"
    ) {
      tamilNames.set(cell(row, "record_id"), cell(row, "translation"));
    }
  }

  const stopIds = uniqueIds("stops.txt", "stop_id");
  const aliases = new Map<string, string[]>();
  for (const row of rows("stop_aliases.txt")) {
    const stopId = cell(row, "stop_id");
    if (!stopIds.has(stopId)) {
      problems.push(`stop_aliases.txt: unknown stop ${stopId}`);
      continue;
    }
    aliases.set(stopId, [...(aliases.get(stopId) ?? []), cell(row, "alias")]);
  }
  for (const stopId of tamilNames.keys()) {
    if (!stopIds.has(stopId)) {
      problems.push(`translations.txt: unknown stop ${stopId}`);
    }
  }

  const stopIndex = new Map<string, number>();
  const stops: Stop[] = rows("stops.txt").map((row, i) => {
    const id = cell(row, "stop_id");
    const name = cell(row, "stop_name");
    const lat = Number(cell(row, "stop_lat"));
    const lon = Number(cell(row, "stop_lon"));
    if (name === "") {
      problems.push(`stops.txt: stop ${id} has no name`);
    }
    const hasPosition = cell(row, "stop_lat") !== "" && cell(row, "stop_lon") !== "";
    if (!hasPosition || !(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) {
      problems.push(`stops.txt: stop ${id} has no valid position`);
    }
    stopIndex.set(id, i);
    return {
      id,
      name: { en: name, ta: tamilNames.get(id) ?? null },
      lat,
      lon,
      aliases: aliases.get(id) ?? [],
    };
  });

  const sourceIds = uniqueIds("sources.txt", "source_id");
  const sources: Source[] = rows("sources.txt").map((row) => {
    const id = cell(row, "source_id");
    const kind = cell(row, "kind");
    const collectedOn = cell(row, "collected_on");
    if (!(SOURCE_KINDS as readonly string[]).includes(kind)) {
      problems.push(`sources.txt: source ${id} has unknown kind "${kind}"`);
    }
    if (!DATE.test(collectedOn)) {
      problems.push(`sources.txt: source ${id} needs collected_on as YYYYMMDD`);
    }
    return { id, kind: kind as SourceKind, note: cell(row, "note"), collectedOn };
  });
  const collectedOn = new Map(sources.map((source) => [source.id, source.collectedOn]));

  uniqueIds("calendar.txt", "service_id");
  const services: Service[] = rows("calendar.txt").map((row) => {
    const id = cell(row, "service_id");
    const start = cell(row, "start_date");
    const end = cell(row, "end_date");
    if (!DATE.test(start) || !DATE.test(end)) {
      problems.push(`calendar.txt: service ${id} needs start_date and end_date as YYYYMMDD`);
    }
    return { id, days: DAY_COLUMNS.map((day) => cell(row, day) === "1"), start, end };
  });
  const serviceIds = new Set(services.map((service) => service.id));

  const routeIds = uniqueIds("routes.txt", "route_id");
  for (const row of rows("routes.txt")) {
    if (!agencyIds.has(cell(row, "agency_id"))) {
      problems.push(`routes.txt: route ${cell(row, "route_id")} has unknown agency`);
    }
  }

  const shapePoints = new Map<string, Row[]>();
  for (const row of rows("shapes.txt")) {
    const shapeId = cell(row, "shape_id");
    shapePoints.set(shapeId, [...(shapePoints.get(shapeId) ?? []), row]);
  }
  const shapes: Shape[] = [];
  for (const [id, pointRows] of shapePoints) {
    const ordered = pointRows.toSorted(
      (a, b) => Number(cell(a, "shape_pt_sequence")) - Number(cell(b, "shape_pt_sequence")),
    );
    const dist = ordered.map((row) => Number(cell(row, "shape_dist_traveled") || "NaN"));
    if (ordered.length < 2 || dist.some((d, i) => Number.isNaN(d) || d < (dist[i - 1] ?? 0))) {
      problems.push(
        `shapes.txt: shape ${id} needs two or more points with a rising shape_dist_traveled`,
      );
    }
    shapes.push({
      id,
      points: ordered.map((row) => [
        Number(cell(row, "shape_pt_lon")),
        Number(cell(row, "shape_pt_lat")),
      ]),
      dist,
    });
  }

  const callRows = new Map<string, Row[]>();
  for (const row of rows("stop_times.txt")) {
    const tripId = cell(row, "trip_id");
    const list = callRows.get(tripId);
    if (list) {
      list.push(row);
    } else {
      callRows.set(tripId, [row]);
    }
  }

  const tripIds = uniqueIds("trips.txt", "trip_id");
  for (const tripId of callRows.keys()) {
    if (!tripIds.has(tripId)) {
      problems.push(`stop_times.txt: unknown trip ${tripId}`);
    }
  }

  const verifiedOn = new Map<string, string>();
  const trips: Trip[] = [];
  for (const row of rows("trips.txt")) {
    const id = cell(row, "trip_id");
    const routeId = cell(row, "route_id");
    const serviceId = cell(row, "service_id");
    const sourceId = cell(row, "source_id");
    if (!routeIds.has(routeId)) {
      problems.push(`trips.txt: trip ${id} has unknown route ${routeId}`);
    }
    if (!serviceIds.has(serviceId)) {
      problems.push(`trips.txt: trip ${id} has unknown service ${serviceId}`);
    }
    if (!sourceIds.has(sourceId)) {
      problems.push(`trips.txt: trip ${id} has no known source_id, so its times cannot be traced`);
    }

    const shapeId = cell(row, "shape_id") || null;
    if (shapeId !== null && !shapePoints.has(shapeId)) {
      problems.push(`trips.txt: trip ${id} has unknown shape ${shapeId}`);
    }

    const calls: Call[] = [];
    const ordered = (callRows.get(id) ?? []).toSorted(
      (a, b) => Number(cell(a, "stop_sequence")) - Number(cell(b, "stop_sequence")),
    );
    let clock = 0;
    for (const callRow of ordered) {
      const stop = stopIndex.get(cell(callRow, "stop_id"));
      const arrive = parseGtfsTime(cell(callRow, "arrival_time"));
      const depart = parseGtfsTime(cell(callRow, "departure_time"));
      if (stop === undefined) {
        problems.push(
          `stop_times.txt: trip ${id} calls at unknown stop ${cell(callRow, "stop_id")}`,
        );
        continue;
      }
      if (arrive === null || depart === null) {
        problems.push(`stop_times.txt: trip ${id} has a missing or malformed time`);
        continue;
      }
      if (arrive < clock || depart < arrive) {
        problems.push(
          `stop_times.txt: trip ${id} goes back in time at stop ${cell(callRow, "stop_id")}`,
        );
      }
      clock = depart;
      const travelled = cell(callRow, "shape_dist_traveled");
      const dist = shapeId === null || travelled === "" ? null : Number(travelled);
      if (shapeId !== null && (dist === null || dist < (calls.at(-1)?.dist ?? 0))) {
        problems.push(
          `stop_times.txt: trip ${id} follows a shape, so stop ${cell(callRow, "stop_id")} needs a shape_dist_traveled that does not fall`,
        );
      }
      calls.push({ stop, arrive, depart, exact: cell(callRow, "timepoint") !== "0", dist });
    }
    if (calls.length < 2) {
      problems.push(`stop_times.txt: trip ${id} needs at least two stops`);
    }

    const collected = collectedOn.get(sourceId);
    if (collected !== undefined && collected > (verifiedOn.get(routeId) ?? "")) {
      verifiedOn.set(routeId, collected);
    }
    trips.push({ id, routeId, serviceId, sourceId, shapeId, calls });
  }

  const routes: Route[] = [];
  for (const row of rows("routes.txt")) {
    const id = cell(row, "route_id");
    const verified = verifiedOn.get(id);
    if (verified === undefined) {
      problems.push(`routes.txt: route ${id} has no trips`);
      continue;
    }
    routes.push({
      id,
      agencyId: cell(row, "agency_id"),
      name: cell(row, "route_long_name") || cell(row, "route_short_name"),
      verifiedOn: verified,
    });
  }

  const feedVersion = cell(rows("feed_info.txt")[0] ?? {}, "feed_version");
  if (feedVersion === "") {
    problems.push("feed_info.txt: feed_version is missing");
  }

  if (problems.length > 0) {
    return { ok: false, problems };
  }

  trips.sort((a, b) => (a.calls[0]?.depart ?? 0) - (b.calls[0]?.depart ?? 0));
  return {
    ok: true,
    timetable: {
      feedVersion,
      sample: sources.some((source) => source.kind === "sample"),
      stops,
      agencies,
      routes,
      services,
      sources,
      shapes,
      trips,
    },
  };
}
