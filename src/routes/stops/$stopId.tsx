import { createFileRoute, Link } from "@tanstack/react-router";
import { DepartureList } from "../../components/departure-list.tsx";
import { stopIndexOf, timetable, timetableIndex } from "../../lib/data.ts";
import { stopName } from "../../lib/i18n.ts";
import { useLabels, useLocale } from "../../lib/locale.tsx";
import { departuresFrom, type Departure } from "../../lib/search.ts";
import { useNow } from "../../lib/use-now.ts";

export const Route = createFileRoute("/stops/$stopId")({
  component: StopPage,
});

const SHOWN = 40;

function StopPage() {
  const L = useLabels();
  const { locale } = useLocale();
  const { stopId } = Route.useParams();
  const now = useNow(20_000);
  const index = stopIndexOf(stopId);
  const stop = index === null ? undefined : timetable.stops[index];

  if (index === null || !stop) {
    return (
      <p className="text-neutral-700">
        {L.noStopFound}{" "}
        <Link to="/stops" className="font-medium text-teal-800 underline">
          {L.allStops}
        </Link>
      </p>
    );
  }

  const byDestination = new Map<number, Departure[]>();
  for (const departure of departuresFrom(timetable, timetableIndex, index, now, SHOWN)) {
    const group = byDestination.get(departure.to.stop);
    if (group) {
      group.push(departure);
    } else {
      byDestination.set(departure.to.stop, [departure]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{stopName(stop, locale)}</h1>
        <p className="text-sm text-neutral-700">{L.departuresFrom}</p>
      </div>
      {byDestination.size === 0 ? (
        <DepartureList departures={[]} now={now} />
      ) : (
        [...byDestination].map(([destination, departures]) => {
          const towards = timetable.stops[destination];
          return (
            <section key={destination}>
              <h2 className="mb-3 text-lg font-semibold">
                {L.towards}: {towards ? stopName(towards, locale) : ""}
              </h2>
              <DepartureList departures={departures} now={now} />
            </section>
          );
        })
      )}
    </div>
  );
}
