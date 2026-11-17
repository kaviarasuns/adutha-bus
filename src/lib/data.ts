import raw from "../generated/timetable.json";
import { indexTimetable, type Timetable } from "./timetable.ts";

/** The whole timetable, compiled from `data/gtfs` by `pnpm data` and bundled with the app. */
export const timetable = raw as unknown as Timetable;
export const timetableIndex = indexTimetable(timetable);

const stopIndexes = new Map(timetable.stops.map((stop, i) => [stop.id, i]));

export function stopIndexOf(stopId: string | undefined): number | null {
  return (stopId === undefined ? undefined : stopIndexes.get(stopId)) ?? null;
}
