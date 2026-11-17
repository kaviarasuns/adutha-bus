import { describe, expect, it } from "vite-plus/test";
import { formatClock, momentInIst, parseGtfsTime, previousDay } from "../src/lib/service-time.ts";

describe("momentInIst", () => {
  it("gives Tamil Nadu's date, weekday and time for any instant", () => {
    expect(momentInIst(new Date("2026-11-17T03:10:05Z"))).toEqual({
      date: "20261117",
      weekday: 1,
      seconds: 8 * 3600 + 40 * 60 + 5,
    });
  });

  it("is already the next day in India late in the UTC evening", () => {
    expect(momentInIst(new Date("2026-11-17T19:00:00Z"))).toMatchObject({
      date: "20261118",
      weekday: 2,
    });
  });
});

describe("previousDay", () => {
  it("steps back across a month and wraps the weekday", () => {
    expect(previousDay({ date: "20261201", weekday: 1 })).toEqual({ date: "20261130", weekday: 0 });
    expect(previousDay({ date: "20261116", weekday: 0 })).toEqual({ date: "20261115", weekday: 6 });
  });
});

describe("parseGtfsTime", () => {
  it("reads times, including those past midnight", () => {
    expect(parseGtfsTime("08:40:00")).toBe(31200);
    expect(parseGtfsTime("25:08:00")).toBe(90480);
  });

  it("rejects malformed times", () => {
    expect(parseGtfsTime("")).toBeNull();
    expect(parseGtfsTime("8:40")).toBeNull();
    expect(parseGtfsTime("08:61:00")).toBeNull();
  });
});

describe("formatClock", () => {
  it("writes a twelve-hour clock and wraps past midnight", () => {
    expect(formatClock(0)).toBe("12:00 AM");
    expect(formatClock(31200)).toBe("8:40 AM");
    expect(formatClock(12 * 3600 + 5 * 60)).toBe("12:05 PM");
    expect(formatClock(90480)).toBe("1:08 AM");
  });
});
