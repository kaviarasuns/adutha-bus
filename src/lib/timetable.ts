import { previousDay, type Moment, type ServiceDay } from "./service-time.ts";

/** `[longitude, latitude]`, the order GeoJSON uses. */
export type LonLat = readonly [number, number];

export interface LocalizedName {
  readonly en: string;
  readonly ta: string | null;
}

export interface Stop {
  readonly id: string;
  readonly name: LocalizedName;
  readonly lat: number;
  readonly lon: number;
  /** Other names riders use for this stop; search matches them. */
  readonly aliases: readonly string[];
}

export interface Agency {
  readonly id: string;
  readonly name: string;
}

export interface Route {
  readonly id: string;
  readonly agencyId: string;
  readonly name: string;
  /** Latest collection date (YYYYMMDD) among the sources of this route's trips. */
  readonly verifiedOn: string;
}

export const SOURCE_KINDS = ["board_photo", "rti_reply", "ride_log", "sample"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

/** Where a trip's times came from. */
export interface Source {
  readonly id: string;
  readonly kind: SourceKind;
  readonly note: string;
  /** YYYYMMDD */
  readonly collectedOn: string;
}

export interface Service {
  readonly id: string;
  /** Monday first. */
  readonly days: readonly boolean[];
  /** YYYYMMDD, inclusive. */
  readonly start: string;
  readonly end: string;
}

export interface Call {
  /** Index into `Timetable.stops`. */
  readonly stop: number;
  /** Seconds after midnight of the service day; past 86400 when the trip runs over midnight. */
  readonly arrive: number;
  readonly depart: number;
  /** False when the time was estimated from measured running times. */
  readonly exact: boolean;
  /** Metres along the trip's shape; null when the trip has no shape. */
  readonly dist: number | null;
}

/** The road a trip follows. */
export interface Shape {
  readonly id: string;
  readonly points: readonly LonLat[];
  /** Metres from the start of the shape to each point. */
  readonly dist: readonly number[];
}

export interface Trip {
  readonly id: string;
  readonly routeId: string;
  readonly serviceId: string;
  readonly sourceId: string;
  /** Null when no road shape was recorded; the trip is then drawn straight from stop to stop. */
  readonly shapeId: string | null;
  readonly calls: readonly Call[];
}

export interface Timetable {
  readonly feedVersion: string;
  /** True when any source is sample data, so the times are invented. */
  readonly sample: boolean;
  readonly stops: readonly Stop[];
  readonly agencies: readonly Agency[];
  readonly routes: readonly Route[];
  readonly services: readonly Service[];
  readonly sources: readonly Source[];
  readonly shapes: readonly Shape[];
  readonly trips: readonly Trip[];
}

export interface TimetableIndex {
  readonly agencies: ReadonlyMap<string, Agency>;
  readonly routes: ReadonlyMap<string, Route>;
  readonly services: ReadonlyMap<string, Service>;
  readonly shapes: ReadonlyMap<string, Shape>;
}

export function indexTimetable(timetable: Timetable): TimetableIndex {
  return {
    agencies: new Map(timetable.agencies.map((agency) => [agency.id, agency])),
    routes: new Map(timetable.routes.map((route) => [route.id, route])),
    services: new Map(timetable.services.map((service) => [service.id, service])),
    shapes: new Map(timetable.shapes.map((shape) => [shape.id, shape])),
  };
}

export function runsOn(service: Service, day: ServiceDay): boolean {
  return service.days[day.weekday] === true && service.start <= day.date && day.date <= service.end;
}

export interface RunningTrip {
  readonly trip: Trip;
  readonly serviceDate: string;
  /** Subtract from a call's time to get seconds after today's midnight. */
  readonly shift: number;
}

/**
 * Every trip whose service runs today, plus yesterday's trips, which may still
 * be on the road after midnight. A trip can appear once for each day.
 */
export function runningTrips(
  timetable: Timetable,
  index: TimetableIndex,
  moment: Moment,
): RunningTrip[] {
  const days = [
    { day: moment as ServiceDay, shift: 0 },
    { day: previousDay(moment), shift: 86400 },
  ];
  const running: RunningTrip[] = [];
  for (const trip of timetable.trips) {
    const service = index.services.get(trip.serviceId);
    if (!service) {
      continue;
    }
    for (const { day, shift } of days) {
      if (runsOn(service, day)) {
        running.push({ trip, serviceDate: day.date, shift });
      }
    }
  }
  return running;
}
