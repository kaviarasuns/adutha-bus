import type { Moment } from "./service-time.ts";
import {
  runningTrips,
  type Agency,
  type Call,
  type Route,
  type Timetable,
  type TimetableIndex,
  type Trip,
} from "./timetable.ts";

export interface Departure {
  readonly trip: Trip;
  readonly route: Route;
  readonly agency: Agency;
  readonly serviceDate: string;
  readonly from: Call;
  /** The stop the rider asked for, or the trip's last stop when they named none. */
  readonly to: Call;
  /** Seconds after today's midnight. */
  readonly departSeconds: number;
  readonly arriveSeconds: number;
}

function collect(
  timetable: Timetable,
  index: TimetableIndex,
  moment: Moment,
  limit: number,
  pick: (calls: readonly Call[]) => { from: Call; to: Call } | null,
): Departure[] {
  const departures: Departure[] = [];
  for (const { trip, serviceDate, shift } of runningTrips(timetable, index, moment)) {
    const picked = pick(trip.calls);
    const route = index.routes.get(trip.routeId);
    const agency = route && index.agencies.get(route.agencyId);
    if (!picked || !route || !agency) {
      continue;
    }
    const departSeconds = picked.from.depart - shift;
    if (departSeconds < moment.seconds) {
      continue;
    }
    departures.push({
      trip,
      route,
      agency,
      serviceDate,
      from: picked.from,
      to: picked.to,
      departSeconds,
      arriveSeconds: picked.to.arrive - shift,
    });
  }
  return departures.sort((a, b) => a.departSeconds - b.departSeconds).slice(0, limit);
}

/** The next buses that leave `fromStop` and later call at `toStop`, soonest first. */
export function departuresBetween(
  timetable: Timetable,
  index: TimetableIndex,
  fromStop: number,
  toStop: number,
  moment: Moment,
  limit: number,
): Departure[] {
  return collect(timetable, index, moment, limit, (calls) => {
    const fromAt = calls.findIndex((call) => call.stop === fromStop);
    const from = calls[fromAt];
    const to = calls.find((call, i) => i > fromAt && call.stop === toStop);
    return from && to ? { from, to } : null;
  });
}

/** The next buses leaving `stop` in any direction. Buses that end there are left out. */
export function departuresFrom(
  timetable: Timetable,
  index: TimetableIndex,
  stop: number,
  moment: Moment,
  limit: number,
): Departure[] {
  return collect(timetable, index, moment, limit, (calls) => {
    const fromAt = calls.findIndex((call) => call.stop === stop);
    const from = calls[fromAt];
    const to = calls.at(-1);
    return from && to && fromAt < calls.length - 1 ? { from, to } : null;
  });
}
