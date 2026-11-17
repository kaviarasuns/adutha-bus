import type { Moment } from "./service-time.ts";
import {
  runningTrips,
  type Call,
  type LonLat,
  type Timetable,
  type TimetableIndex,
  type Trip,
} from "./timetable.ts";

export type { LonLat };

/**
 * The line a trip is drawn along, with a measure that rises along it. With a
 * road shape the measure is metres along the shape. Without one the line runs
 * straight from stop to stop and the measure counts stops.
 */
interface Path {
  readonly vertices: readonly LonLat[];
  readonly vertexMeasures: readonly number[];
  /** The measure of each of the trip's calls. */
  readonly callMeasures: readonly number[];
}

function pathOf(timetable: Timetable, index: TimetableIndex, trip: Trip): Path | null {
  const shape = trip.shapeId === null ? undefined : index.shapes.get(trip.shapeId);
  if (shape) {
    const callMeasures = trip.calls.map((call) => call.dist ?? Number.NaN);
    return callMeasures.some(Number.isNaN)
      ? null
      : { vertices: shape.points, vertexMeasures: shape.dist, callMeasures };
  }
  const vertices: LonLat[] = [];
  for (const call of trip.calls) {
    const stop = timetable.stops[call.stop];
    if (!stop) {
      return null;
    }
    vertices.push([stop.lon, stop.lat]);
  }
  const counted = vertices.map((_, i) => i);
  return { vertices, vertexMeasures: counted, callMeasures: counted };
}

function pointOn(path: Path, measure: number): LonLat | null {
  let low = 0;
  let high = path.vertices.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if ((path.vertexMeasures[middle] ?? 0) <= measure) {
      low = middle;
    } else {
      high = middle;
    }
  }
  const a = path.vertices[low];
  const b = path.vertices[high];
  const from = path.vertexMeasures[low];
  const to = path.vertexMeasures[high];
  if (!a || !b || from === undefined || to === undefined) {
    return null;
  }
  const done = to > from ? Math.min(Math.max((measure - from) / (to - from), 0), 1) : 0;
  return [a[0] + (b[0] - a[0]) * done, a[1] + (b[1] - a[1]) * done];
}

interface Progress {
  readonly measure: number;
  readonly nextCall: Call;
}

/**
 * How far along its path the timetable puts a bus at `time` (seconds on the
 * trip's own service day). It waits at a stop between arriving and leaving,
 * and covers the stretch to the next stop at an even pace. Null outside the trip.
 */
function progressAt(trip: Trip, path: Path, time: number): Progress | null {
  const { calls } = trip;
  const first = calls[0];
  const last = calls.at(-1);
  if (!first || !last || time < first.depart || time > last.arrive) {
    return null;
  }
  for (let i = 0; i < calls.length - 1; i++) {
    const here = calls[i];
    const next = calls[i + 1];
    const from = path.callMeasures[i];
    const to = path.callMeasures[i + 1];
    if (!here || !next || from === undefined || to === undefined || time > next.arrive) {
      continue;
    }
    const running = next.arrive - here.depart;
    const done = running > 0 ? Math.min(Math.max((time - here.depart) / running, 0), 1) : 1;
    return { measure: from + (to - from) * done, nextCall: next };
  }
  return null;
}

export interface TripPoint {
  readonly at: LonLat;
  /** The stop the bus is scheduled to reach next. */
  readonly nextCall: Call;
}

/** Where the timetable puts a bus at `time`, on its road shape when it has one. */
export function pointAt(
  timetable: Timetable,
  index: TimetableIndex,
  trip: Trip,
  time: number,
): TripPoint | null {
  const path = pathOf(timetable, index, trip);
  const progress = path && progressAt(trip, path, time);
  const at = path && progress ? pointOn(path, progress.measure) : null;
  return at && progress ? { at, nextCall: progress.nextCall } : null;
}

/**
 * The stretch of route the bus is scheduled to cover from `margin` seconds
 * before `time` to `margin` seconds after, clipped to the trip.
 */
export function spanAt(
  timetable: Timetable,
  index: TimetableIndex,
  trip: Trip,
  time: number,
  margin: number,
): LonLat[] {
  const first = trip.calls[0];
  const last = trip.calls.at(-1);
  const path = pathOf(timetable, index, trip);
  if (!first || !last || !path) {
    return [];
  }
  const from = progressAt(trip, path, Math.max(time - margin, first.depart));
  const to = progressAt(trip, path, Math.min(time + margin, last.arrive));
  const start = from && pointOn(path, from.measure);
  const end = to && pointOn(path, to.measure);
  if (!from || !to || !start || !end) {
    return [];
  }
  const between = path.vertices.filter((_, i) => {
    const measure = path.vertexMeasures[i];
    return measure !== undefined && measure > from.measure && measure < to.measure;
  });
  return [start, ...between, end];
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
    const point = pointAt(timetable, index, trip, time);
    if (!point) {
      continue;
    }
    buses.push({
      trip,
      serviceDate,
      at: point.at,
      span: spanAt(timetable, index, trip, time, margin),
      nextCall: point.nextCall,
      nextArriveSeconds: point.nextCall.arrive - shift,
    });
  }
  return buses;
}
