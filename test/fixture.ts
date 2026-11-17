import { compileGtfs, type GtfsFiles } from "../src/lib/gtfs-compile.ts";
import type { Timetable } from "../src/lib/timetable.ts";

/**
 * Three stops in a line, one degree of longitude apart. T1 runs A→B→C daily
 * and waits two minutes at B. T2 runs C→A on weekdays only. T3 leaves A late
 * and reaches C after midnight. T4 runs A→C along a road shape that bends
 * north through (78, 12), 1000 m to the bend and 1000 m on to C.
 */
export const fixtureFiles: GtfsFiles = {
  "agency.txt": "agency_id,agency_name\nOP,Operator\n",
  "stops.txt":
    "stop_id,stop_name,stop_lat,stop_lon\nA,Avinashi,11,77\nB,Peelamedu,11,78\nC,Thekkalur,11,79\n",
  "translations.txt":
    "table_name,field_name,language,translation,record_id\nstops,stop_name,ta,அவிநாசி,A\n",
  "stop_aliases.txt": "stop_id,alias\nB,Hope College\n",
  "routes.txt": "route_id,agency_id,route_long_name\nR,OP,A to C\n",
  "calendar.txt":
    "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\n" +
    "DAILY,1,1,1,1,1,1,1,20260101,20271231\nWEEKDAY,1,1,1,1,1,0,0,20260101,20271231\n",
  "feed_info.txt": "feed_version\ntest-1\n",
  "sources.txt":
    'source_id,kind,collected_on,note\nBOARD,board_photo,20261101,"Board at A, platform 2"\nRIDE,ride_log,20261110,Ride\n',
  "trips.txt":
    "route_id,service_id,trip_id,source_id,shape_id\nR,DAILY,T1,BOARD,\nR,WEEKDAY,T2,RIDE,\nR,DAILY,T3,BOARD,\nR,DAILY,T4,RIDE,BEND\n",
  "stop_times.txt":
    "trip_id,arrival_time,departure_time,stop_id,stop_sequence,timepoint,shape_dist_traveled\n" +
    "T1,08:00:00,08:00:00,A,1,1\nT1,08:10:00,08:12:00,B,2,0\nT1,08:22:00,08:22:00,C,3,1\n" +
    "T2,09:00:00,09:00:00,C,1,1\nT2,09:20:00,09:20:00,A,2,1\n" +
    "T3,23:50:00,23:50:00,A,1,1\nT3,24:10:00,24:10:00,C,2,1\n" +
    "T4,12:00:00,12:00:00,A,1,1,0\nT4,12:20:00,12:20:00,C,2,1,2000\n",
  "shapes.txt":
    "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence,shape_dist_traveled\n" +
    "BEND,11,77,1,0\nBEND,12,78,2,1000\nBEND,11,79,3,2000\n",
};

export function fixtureTimetable(): Timetable {
  const result = compileGtfs(fixtureFiles);
  if (!result.ok) {
    throw new Error(result.problems.join("; "));
  }
  return result.timetable;
}

export const A = 0;
export const B = 1;
export const C = 2;

/** Tuesday 17 November 2026. */
export const TUESDAY = { date: "20261117", weekday: 1 };
/** Sunday 15 November 2026. */
export const SUNDAY = { date: "20261115", weekday: 6 };

export function at(day: { date: string; weekday: number }, clock: string) {
  const [hours, minutes] = clock.split(":").map(Number);
  return { ...day, seconds: (hours ?? 0) * 3600 + (minutes ?? 0) * 60 };
}
