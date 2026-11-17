import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DepartureList } from "../components/departure-list.tsx";
import { StopPicker } from "../components/stop-picker.tsx";
import { stopIndexOf, timetable, timetableIndex } from "../lib/data.ts";
import { useLabels } from "../lib/locale.tsx";
import { departuresBetween } from "../lib/search.ts";
import { useNow } from "../lib/use-now.ts";

/** `?from=<stop id>&to=<stop id>`, so a search can be shared or bookmarked. */
interface JourneySearch {
  readonly from?: string;
  readonly to?: string;
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): JourneySearch => ({
    ...(typeof search.from === "string" ? { from: search.from } : {}),
    ...(typeof search.to === "string" ? { to: search.to } : {}),
  }),
  component: SearchPage,
});

const SHOWN = 12;

function SearchPage() {
  const L = useLabels();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const now = useNow(20_000);

  const from = stopIndexOf(search.from);
  const to = stopIndexOf(search.to);
  const setStops = (next: JourneySearch) => void navigate({ search: next, replace: true });
  const idOf = (stop: number | null) => (stop === null ? undefined : timetable.stops[stop]?.id);
  const pair = (fromId: string | undefined, toId: string | undefined): JourneySearch => ({
    ...(fromId === undefined ? {} : { from: fromId }),
    ...(toId === undefined ? {} : { to: toId }),
  });

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <StopPicker
          label={L.from}
          value={from}
          onChange={(stop) => setStops(pair(idOf(stop), idOf(to)))}
        />
        <StopPicker
          label={L.to}
          value={to}
          onChange={(stop) => setStops(pair(idOf(from), idOf(stop)))}
        />
        <button
          type="button"
          onClick={() => setStops(pair(idOf(to), idOf(from)))}
          disabled={from === null && to === null}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          ⇅ {L.swap}
        </button>
      </section>

      {from === null || to === null ? (
        <p className="text-neutral-700">{L.chooseStops}</p>
      ) : from === to ? (
        <p className="text-neutral-700">{L.sameStop}</p>
      ) : (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{L.nextBuses}</h2>
          <DepartureList
            departures={departuresBetween(timetable, timetableIndex, from, to, now, SHOWN)}
            now={now}
          />
        </section>
      )}
    </div>
  );
}
