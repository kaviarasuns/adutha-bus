import { describe, expect, it } from "vite-plus/test";
import { compileGtfs, parseCsv } from "../src/lib/gtfs-compile.ts";
import { fixtureFiles, fixtureTimetable } from "./fixture.ts";

function problemsOf(files: Record<string, string>): readonly string[] {
  const result = compileGtfs({ ...fixtureFiles, ...files });
  return result.ok ? [] : result.problems;
}

describe("parseCsv", () => {
  it("reads quoted fields that hold commas and quotes", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([{ a: "x, y", b: 'say "hi"' }]);
  });

  it("skips blank lines and a byte order mark", () => {
    expect(parseCsv("﻿a\n1\n\n2\n")).toEqual([{ a: "1" }, { a: "2" }]);
  });
});

describe("compileGtfs", () => {
  it("builds stops with both names and aliases", () => {
    const { stops } = fixtureTimetable();
    expect(stops[0]).toMatchObject({ id: "A", name: { en: "Avinashi", ta: "அவிநாசி" } });
    expect(stops[1]).toMatchObject({
      name: { en: "Peelamedu", ta: null },
      aliases: ["Hope College"],
    });
  });

  it("marks estimated times and reads times past midnight", () => {
    const { trips } = fixtureTimetable();
    const t1 = trips.find((trip) => trip.id === "T1");
    const t3 = trips.find((trip) => trip.id === "T3");
    expect(t1?.calls.map((call) => call.exact)).toEqual([true, false, true]);
    expect(t1?.calls[1]).toMatchObject({ arrive: 29400, depart: 29520 });
    expect(t3?.calls[1]?.arrive).toBe(24 * 3600 + 600);
  });

  it("dates a route by its most recently collected source", () => {
    expect(fixtureTimetable().routes[0]?.verifiedOn).toBe("20261110");
  });

  it("flags the feed as sample only when a source is sample data", () => {
    expect(fixtureTimetable().sample).toBe(false);
    const result = compileGtfs({
      ...fixtureFiles,
      "sources.txt":
        "source_id,kind,collected_on,note\nBOARD,sample,20261101,x\nRIDE,ride_log,20261110,x\n",
    });
    expect(result.ok && result.timetable.sample).toBe(true);
  });

  it("names a missing file", () => {
    const { "stops.txt": _stops, ...rest } = fixtureFiles;
    expect(compileGtfs(rest)).toEqual({ ok: false, problems: ["stops.txt is missing"] });
  });

  it("rejects a trip with no traceable source", () => {
    expect(
      problemsOf({
        "trips.txt":
          "route_id,service_id,trip_id,source_id\nR,DAILY,T1,\nR,WEEKDAY,T2,RIDE\nR,DAILY,T3,BOARD\n",
      }),
    ).toEqual(["trips.txt: trip T1 has no known source_id, so its times cannot be traced"]);
  });

  it("rejects times that run backwards", () => {
    expect(
      problemsOf({
        "stop_times.txt":
          fixtureFiles["stop_times.txt"]?.replace("T1,08:10:00,08:12:00", "T1,07:59:00,08:12:00") ??
          "",
      }),
    ).toEqual(["stop_times.txt: trip T1 goes back in time at stop B"]);
  });

  it("rejects unknown stops, duplicate ids and bad positions", () => {
    expect(
      problemsOf({
        "stops.txt":
          "stop_id,stop_name,stop_lat,stop_lon\nA,Avinashi,11,77\nA,Again,11,78\nC,Thekkalur,,79\n",
      }),
    ).toEqual([
      "stops.txt: stop_id A appears twice",
      "stop_aliases.txt: unknown stop B",
      "stops.txt: stop C has no valid position",
      "stop_times.txt: trip T1 calls at unknown stop B",
    ]);
  });
});
