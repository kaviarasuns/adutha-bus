import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileGtfs } from "../src/lib/gtfs-compile.ts";

const root = join(import.meta.dirname, "..");
const feedDir = join(root, "data", "gtfs");
const outFile = join(root, "src", "generated", "timetable.json");

const files = Object.fromEntries(
  readdirSync(feedDir)
    .filter((name) => name.endsWith(".txt"))
    .map((name) => [name, readFileSync(join(feedDir, name), "utf8")]),
);

const result = compileGtfs(files);
if (!result.ok) {
  console.error(`data/gtfs has ${result.problems.length} problem(s):`);
  for (const problem of result.problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}

mkdirSync(join(root, "src", "generated"), { recursive: true });
writeFileSync(outFile, JSON.stringify(result.timetable));
const { stops, trips, feedVersion, sample } = result.timetable;
console.log(
  `timetable ${feedVersion}: ${stops.length} stops, ${trips.length} trips${sample ? " (sample data)" : ""}`,
);
