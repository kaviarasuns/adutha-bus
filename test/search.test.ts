import { describe, expect, it } from "vite-plus/test";
import { departuresBetween, departuresFrom } from "../src/lib/search.ts";
import { indexTimetable } from "../src/lib/timetable.ts";
import { A, B, C, SUNDAY, TUESDAY, at, fixtureTimetable } from "./fixture.ts";

const timetable = fixtureTimetable();
const index = indexTimetable(timetable);
const ids = (departures: readonly { trip: { id: string } }[]) => departures.map((d) => d.trip.id);

describe("departuresBetween", () => {
  it("lists the buses still to leave, soonest first", () => {
    const found = departuresBetween(timetable, index, A, C, at(TUESDAY, "07:00"), 10);
    expect(ids(found)).toEqual(["T1", "T3"]);
    expect(found[0]).toMatchObject({ departSeconds: 8 * 3600, arriveSeconds: 8 * 3600 + 22 * 60 });
  });

  it("includes a bus leaving this very minute and drops one that has left", () => {
    expect(ids(departuresBetween(timetable, index, A, C, at(TUESDAY, "08:00"), 10))).toEqual([
      "T1",
      "T3",
    ]);
    expect(ids(departuresBetween(timetable, index, A, C, at(TUESDAY, "08:01"), 10))).toEqual([
      "T3",
    ]);
  });

  it("uses the departure time at an intermediate stop", () => {
    const found = departuresBetween(timetable, index, B, C, at(TUESDAY, "08:11"), 10);
    expect(found[0]).toMatchObject({ departSeconds: 8 * 3600 + 12 * 60 });
    expect(found[0]?.from.exact).toBe(false);
  });

  it("only offers buses travelling in the asked direction", () => {
    expect(ids(departuresBetween(timetable, index, C, A, at(TUESDAY, "00:00"), 10))).toEqual([
      "T2",
    ]);
    expect(departuresBetween(timetable, index, C, B, at(TUESDAY, "00:00"), 10)).toEqual([]);
  });

  it("leaves out services that do not run that day", () => {
    expect(departuresBetween(timetable, index, C, A, at(SUNDAY, "00:00"), 10)).toEqual([]);
  });

  it("respects the limit", () => {
    expect(ids(departuresBetween(timetable, index, A, C, at(TUESDAY, "00:00"), 1))).toEqual(["T1"]);
  });
});

describe("departuresFrom", () => {
  it("lists buses in every direction and skips those ending at the stop", () => {
    expect(ids(departuresFrom(timetable, index, C, at(TUESDAY, "00:00"), 10))).toEqual(["T2"]);
    expect(ids(departuresFrom(timetable, index, A, at(TUESDAY, "00:00"), 10))).toEqual([
      "T1",
      "T3",
    ]);
  });

  it("reports the last stop as the destination", () => {
    const [first] = departuresFrom(timetable, index, B, at(TUESDAY, "08:00"), 10);
    expect(first?.to.stop).toBe(C);
  });
});
