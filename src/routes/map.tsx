import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CorridorMap } from "../components/corridor-map.tsx";
import { timetable, timetableIndex } from "../lib/data.ts";
import { stopName } from "../lib/i18n.ts";
import { useLabels, useLocale } from "../lib/locale.tsx";
import { scheduledBuses } from "../lib/position.ts";
import { formatClock } from "../lib/service-time.ts";
import { useNow } from "../lib/use-now.ts";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

const NOTE_SEEN_KEY = "adutha-bus-map-note-seen";

/** Half the length, in seconds of running time, of the stretch drawn around each bus. */
const SPAN_MARGIN = 150;

function MapPage() {
  const L = useLabels();
  const { locale } = useLocale();
  const now = useNow(5_000);
  const [selected, setSelected] = useState<string | null>(null);
  const [noteSeen, setNoteSeen] = useState(() => localStorage.getItem(NOTE_SEEN_KEY) === "1");

  const buses = useMemo(() => scheduledBuses(timetable, timetableIndex, now, SPAN_MARGIN), [now]);
  const bus = buses.find((candidate) => candidate.trip.id === selected);
  const route = bus && timetableIndex.routes.get(bus.trip.routeId);
  const agency = route && timetableIndex.agencies.get(route.agencyId);
  const nextStop = bus && timetable.stops[bus.nextCall.stop];

  return (
    <>
      <CorridorMap
        timetable={timetable}
        buses={buses}
        selected={bus ? bus.trip.id : null}
        onSelect={setSelected}
        label={L.mapLabel}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-2 p-3 pr-14">
        {noteSeen ? null : (
          <div className="pointer-events-auto max-w-md rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 shadow">
            <p>{L.mapNote}</p>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(NOTE_SEEN_KEY, "1");
                setNoteSeen(true);
              }}
              className="mt-2 rounded-md border border-amber-400 bg-white px-3 py-1 font-medium"
            >
              {L.gotIt}
            </button>
          </div>
        )}
        <p className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-neutral-800 shadow">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full bg-teal-700/55 ring-4 ring-teal-700/20"
          />
          {L.scheduledLegend}
        </p>
      </div>

      <section
        aria-live="polite"
        className="absolute inset-x-0 bottom-0 z-10 rounded-t-xl border-t border-neutral-200 bg-white p-4 pb-8 shadow-lg sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-80 sm:rounded-xl sm:border sm:pb-4"
      >
        {bus && route && agency ? (
          <>
            <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">
              {L.scheduledPosition}
            </p>
            <p className="mt-1 font-semibold">{agency.name}</p>
            <p className="text-sm text-neutral-700">{route.name}</p>
            {nextStop ? (
              <p className="mt-2 text-sm">
                {L.nextStop}: {stopName(nextStop, locale)},{" "}
                {bus.nextCall.exact ? "" : `${L.around} `}
                <span className="tabular-nums">{formatClock(bus.nextArriveSeconds)}</span>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="font-medium">{L.busesNow(buses.length)}</p>
            <p className="text-sm text-neutral-700">{L.tapBus}</p>
          </>
        )}
      </section>
    </>
  );
}
