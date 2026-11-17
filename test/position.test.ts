import { describe, expect, it } from "vite-plus/test";
import { pointAt, scheduledBuses, spanAt } from "../src/lib/position.ts";
import { indexTimetable } from "../src/lib/timetable.ts";
import { B, C, TUESDAY, at, fixtureTimetable } from "./fixture.ts";

const timetable = fixtureTimetable();
const index = indexTimetable(timetable);
const trip = (id: string) => {
  const found = timetable.trips.find((t) => t.id === id);
  if (!found) {
    throw new Error(`no trip ${id}`);
  }
  return found;
};
const clock = (text: string) => at(TUESDAY, text).seconds;

describe("pointAt", () => {
  it("puts the bus part-way between stops in proportion to the time gone", () => {
    const point = pointAt(timetable, trip("T1"), clock("08:05"));
    expect(point?.at).toEqual([77.5, 11]);
    expect(point?.nextCall.stop).toBe(B);
  });

  it("holds the bus at a stop while it waits there", () => {
    const point = pointAt(timetable, trip("T1"), clock("08:11"));
    expect(point?.at).toEqual([78, 11]);
    expect(point?.nextCall.stop).toBe(C);
  });

  it("covers the first departure and the last arrival, and nothing outside", () => {
    expect(pointAt(timetable, trip("T1"), clock("08:00"))?.at).toEqual([77, 11]);
    expect(pointAt(timetable, trip("T1"), clock("08:22"))?.at).toEqual([79, 11]);
    expect(pointAt(timetable, trip("T1"), clock("07:59"))).toBeNull();
    expect(pointAt(timetable, trip("T1"), clock("08:23"))).toBeNull();
  });
});

describe("spanAt", () => {
  it("runs from before to after the scheduled point, through any stop between", () => {
    expect(spanAt(timetable, trip("T1"), clock("08:11"), 180)).toEqual([
      [77.8, 11],
      [78, 11],
      [78.2, 11],
    ]);
  });

  it("is clipped to the trip's ends", () => {
    expect(spanAt(timetable, trip("T1"), clock("08:01"), 120)).toEqual([
      [77, 11],
      [77.3, 11],
    ]);
  });
});

describe("scheduledBuses", () => {
  it("lists only the buses on the road", () => {
    expect(
      scheduledBuses(timetable, index, at(TUESDAY, "08:05"), 120).map((b) => b.trip.id),
    ).toEqual(["T1"]);
    expect(scheduledBuses(timetable, index, at(TUESDAY, "10:00"), 120)).toEqual([]);
  });

  it("keeps showing yesterday's bus after midnight", () => {
    const [bus] = scheduledBuses(timetable, index, at(TUESDAY, "00:05"), 120);
    expect(bus).toMatchObject({ serviceDate: "20261116", nextArriveSeconds: 600 });
    expect(bus?.at[0]).toBeCloseTo(78.5);
  });
});
