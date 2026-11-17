import { describe, expect, it } from "vite-plus/test";
import { foldName, matchStops } from "../src/lib/stop-search.ts";
import { fixtureTimetable } from "./fixture.ts";

const { stops } = fixtureTimetable();
const names = (query: string) => matchStops(stops, query).map((stop) => stop.name.en);

describe("foldName", () => {
  it("brings common spellings of one name together", () => {
    expect(foldName("Avinasi")).toBe(foldName("Avinashi"));
    expect(foldName("Tekkalur")).toBe(foldName("Thekkalur"));
    expect(foldName("Pilamedu")).toBe(foldName("Peelamedu"));
  });
});

describe("matchStops", () => {
  it("finds a stop by a variant spelling, ignoring case and spaces", () => {
    expect(names("avinasi")).toEqual(["Avinashi"]);
    expect(names(" PEELA medu")).toEqual(["Peelamedu"]);
  });

  it("finds a stop by its Tamil name or an alias", () => {
    expect(names("அவி")).toEqual(["Avinashi"]);
    expect(names("hope")).toEqual(["Peelamedu"]);
  });

  it("puts names that start with the text before names that contain it", () => {
    expect(names("a")).toEqual(["Avinashi", "Peelamedu", "Thekkalur"]);
  });

  it("returns every stop for an empty search and none for no match", () => {
    expect(names("")).toHaveLength(3);
    expect(names("xyz")).toEqual([]);
  });
});
