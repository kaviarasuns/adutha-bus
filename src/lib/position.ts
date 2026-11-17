import type { Moment } from "./service-time.ts";
import {
  runningTrips,
  type Call,
  type Timetable,
  type TimetableIndex,
  type Trip,
} from "./timetable.ts";

/** `[longitude, latitude]`, the order GeoJSON uses. */
export type LonLat = readonly [number, number];

export interface TripPoint {
  readonly at: LonLat;
  /** The stop the bus is scheduled to reach next; the last stop once it has arrived. */
  readonly nextCall: Call;
}

/**
 * Where the timetable puts a bus at `time` (seconds on the trip's own service
 * day): at a stop while it waits there, otherwise on the straight line between
 * two stops, as far along as the time elapsed. Null outside the trip.
 */
export function pointAt(timetable: Timetable, trip: Trip, time: number): TripPoint | null {
  const { calls } = trip;
  const first = calls[0];
  const last = calls.at(-1);
  if (!first || !last || time < first.depart || time > last.arrive) {
    return null;
  }
  for (let i = 0; i < calls.length - 1; i++) {
    const here = calls[i];
    const next = calls[i + 1];
    if (!here || !next || time > next.arrive) {
      continue;
    }
    const a = timetable.stops[here.stop];
    const b = timetable.stops[next.stop];
    if (!a || !b) {
      return null;
    }
    const running = next.arrive - here.depart;
    const done = running > 0 ? Math.min(Math.max((time - here.depart) / running, 0), 1) : 1;
    return {
      at: [a.lon + (b.lon - a.lon) * done, a.lat + (b.lat - a.lat) * done],
      nextCall: next,
    };
  }
  return null;
}

/**
 * The stretch of route the bus is scheduled to cover from `margin` seconds
 * before `time` to `margin` seconds after, clipped to the trip.
 */
export function spanAt(timetable: Timetable, trip: Trip, time: number, margin: number): LonLat[] {
  const first = trip.calls[0];
  const last = trip.calls.at(-1);
  if (!first || !last) {
    return [];
  }
  const from = Math.max(time - margin, first.depart);
  const to = Math.min(time + margin, last.arrive);
  const start = pointAt(timetable, trip, from);
  const end = pointAt(timetable, trip, to);
  if (!start || !end) {
    return [];
  }
  const passed: LonLat[] = [];
  for (const call of trip.calls) {
    const stop = timetable.stops[call.stop];
    if (stop && call.arrive > from && call.depart < to) {
      passed.push([stop.lon, stop.lat]);
    }
  }
  return [start.at, ...passed, end.at];
}

export interface ScheduledBus {
  readonly trip: Trip;
  readonly serviceDate: string;
  readonly at: LonLat;
  readonly span: readonly LonLat[];
  readonly nextCall: Call;
  /** Seconds after today's midnight when the bus is due at `nextCall`. */
  readonly nextArriveSeconds: number;
}

/** Every bus the timetable says is on the road at `moment`. */
export function scheduledBuses(
  timetable: Timetable,
  index: TimetableIndex,
  moment: Moment,
  margin: number,
): ScheduledBus[] {
  const buses: ScheduledBus[] = [];
  for (const { trip, serviceDate, shift } of runningTrips(timetable, index, moment)) {
    const time = moment.seconds + shift;
    const point = pointAt(timetable, trip, time);
    if (!point) {
      continue;
    }
    buses.push({
      trip,
      serviceDate,
      at: point.at,
      span: spanAt(timetable, trip, time, margin),
      nextCall: point.nextCall,
      nextArriveSeconds: point.nextCall.arrive - shift,
    });
  }
  return buses;
}
