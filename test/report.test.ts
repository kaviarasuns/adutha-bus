import { describe, expect, it } from "vite-plus/test";
import { parseReport } from "../src/lib/report.ts";

const valid = {
  tripId: "T1",
  kind: "wrong_time",
  note: "  Left at 8:10  ",
  feedVersion: "test-1",
  serviceDate: "20261117",
};

describe("parseReport", () => {
  it("accepts a complete report and trims the note", () => {
    expect(parseReport(valid)).toEqual({ ...valid, note: "Left at 8:10" });
  });

  it("accepts an empty note", () => {
    expect(parseReport({ ...valid, note: "" })?.note).toBe("");
  });

  it("rejects an unknown kind, a bad date, an overlong note and non-objects", () => {
    expect(parseReport({ ...valid, kind: "spam" })).toBeNull();
    expect(parseReport({ ...valid, serviceDate: "2026-11-17" })).toBeNull();
    expect(parseReport({ ...valid, note: "x".repeat(501) })).toBeNull();
    expect(parseReport({ ...valid, tripId: "" })).toBeNull();
    expect(parseReport("T1")).toBeNull();
    expect(parseReport(null)).toBeNull();
  });
});
