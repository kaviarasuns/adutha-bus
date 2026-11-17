import { useState } from "react";
import { timetable } from "../lib/data.ts";
import { stopName } from "../lib/i18n.ts";
import { useLabels, useLocale } from "../lib/locale.tsx";
import type { Departure } from "../lib/search.ts";
import { formatClock, formatDate, type Moment } from "../lib/service-time.ts";
import { ReportDialog, type ReportTarget } from "./report-dialog.tsx";

/** The next buses, one card each: when it leaves, who runs it, when it arrives, and how fresh the timing is. */
export function DepartureList({
  departures,
  now,
}: {
  readonly departures: readonly Departure[];
  readonly now: Moment;
}) {
  const { locale } = useLocale();
  const L = useLabels();
  const [reporting, setReporting] = useState<ReportTarget | null>(null);

  if (departures.length === 0) {
    return <p className="rounded-lg bg-white p-4 text-neutral-700">{L.noBuses}</p>;
  }

  return (
    <>
      <ul className="space-y-3">
        {departures.map((departure) => {
          const { trip, route, agency, from, to, departSeconds, arriveSeconds } = departure;
          const destination = timetable.stops[to.stop];
          const leaves = formatClock(departSeconds);
          return (
            <li
              key={`${trip.id}-${departure.serviceDate}`}
              className="rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-2xl font-semibold tabular-nums">
                  {from.exact ? null : (
                    <span className="mr-1.5 text-sm font-normal text-neutral-600">{L.around}</span>
                  )}
                  {leaves}
                </p>
                <p className="shrink-0 text-sm font-medium text-teal-800">
                  {L.inMinutes(Math.floor((departSeconds - now.seconds) / 60))}
                </p>
              </div>
              <p className="mt-1 font-medium">{agency.name}</p>
              <p className="text-sm text-neutral-700">{route.name}</p>
              {destination ? (
                <p className="mt-2 text-sm text-neutral-700">
                  {L.arrives}: {stopName(destination, locale)}, {to.exact ? "" : `${L.around} `}
                  <span className="tabular-nums">{formatClock(arriveSeconds)}</span>
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                <span>
                  {L.verifiedOn} {formatDate(route.verifiedOn, locale)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setReporting({
                      tripId: trip.id,
                      serviceDate: departure.serviceDate,
                      summary: `${leaves} · ${agency.name}`,
                    })
                  }
                  className="rounded-md border border-neutral-300 px-2 py-1 font-medium text-neutral-800 hover:bg-neutral-50"
                >
                  {L.report}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <ReportDialog target={reporting} onClose={() => setReporting(null)} />
    </>
  );
}
