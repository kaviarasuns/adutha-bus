import type { Stop } from "./timetable.ts";

/**
 * Reduces a name to a form in which common English spellings of a Tamil place
 * name coincide: "Avinashi" and "Avinasi", "Thekkalur" and "Tekkalur",
 * "Peelamedu" and "Pilamedu". Tamil text only loses its spaces and marks.
 */
export function foldName(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]/gu, "")
    .replace(/sh/g, "s")
    .replace(/th/g, "t")
    .replace(/dh/g, "d")
    .replace(/zh/g, "l")
    .replace(/oo/g, "u")
    .replace(/ee/g, "i")
    .replace(/([a-z])\1+/g, "$1");
}

/**
 * Stops whose English name, Tamil name or an alias contains `query`. Names
 * that start with it come first. An empty query returns every stop.
 */
export function matchStops(stops: readonly Stop[], query: string): Stop[] {
  const wanted = foldName(query);
  if (wanted === "") {
    return [...stops];
  }
  const starts: Stop[] = [];
  const contains: Stop[] = [];
  for (const stop of stops) {
    const names = [stop.name.en, stop.name.ta ?? "", ...stop.aliases].map(foldName);
    if (names.some((name) => name.startsWith(wanted))) {
      starts.push(stop);
    } else if (names.some((name) => name.includes(wanted))) {
      contains.push(stop);
    }
  }
  return [...starts, ...contains];
}
