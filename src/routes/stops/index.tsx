import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { timetable } from "../../lib/data.ts";
import { stopName } from "../../lib/i18n.ts";
import { useLabels, useLocale } from "../../lib/locale.tsx";
import { matchStops } from "../../lib/stop-search.ts";

/** `?q=<text>` keeps the search box text, so coming back from a stop restores the list. */
interface StopsSearch {
  readonly q?: string;
}

export const Route = createFileRoute("/stops/")({
  validateSearch: (search: Record<string, unknown>): StopsSearch =>
    typeof search.q === "string" && search.q !== "" ? { q: search.q } : {},
  component: StopsPage,
});

function StopsPage() {
  const L = useLabels();
  const { locale } = useLocale();
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const stops = matchStops(timetable.stops, q);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{L.allStops}</h1>
      <input
        type="search"
        aria-label={L.stopPlaceholder}
        placeholder={L.stopPlaceholder}
        value={q}
        onChange={(event) =>
          void navigate({
            search: event.target.value === "" ? {} : { q: event.target.value },
            replace: true,
          })
        }
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base"
      />
      {stops.length === 0 ? (
        <p className="text-neutral-700">{L.noStopFound}</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
          {stops.map((stop) => (
            <li key={stop.id}>
              <Link
                to="/stops/$stopId"
                params={{ stopId: stop.id }}
                className="block px-4 py-3 hover:bg-teal-50"
              >
                {stopName(stop, locale)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
