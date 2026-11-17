import { useId, useRef, useState } from "react";
import { stopIndexOf, timetable } from "../lib/data.ts";
import { stopName } from "../lib/i18n.ts";
import { useLabels, useLocale } from "../lib/locale.tsx";
import { matchStops } from "../lib/stop-search.ts";

/** A text box that searches the stops as the rider types and offers the matches below it. */
export function StopPicker({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  /** Index into the timetable's stops. */
  readonly value: number | null;
  readonly onChange: (stop: number) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { locale } = useLocale();
  const L = useLabels();
  /** The text being typed; null while the box only shows the chosen stop. */
  const [query, setQuery] = useState<string | null>(null);

  const chosen = value === null ? undefined : timetable.stops[value];
  const matches = query === null ? [] : matchStops(timetable.stops, query);

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        ref={input}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={query !== null}
        aria-controls={`${id}-options`}
        autoComplete="off"
        placeholder={L.stopPlaceholder}
        value={query ?? (chosen ? stopName(chosen, locale) : "")}
        onFocus={() => setQuery("")}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => setQuery(null)}
        className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base"
      />
      {query !== null ? (
        <ul
          id={`${id}-options`}
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-600">{L.noStopFound}</li>
          ) : (
            matches.map((stop) => (
              <li key={stop.id} role="option" aria-selected={stop === chosen}>
                <button
                  type="button"
                  // Keeps focus in the text box, so the list is still there when the click lands.
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => {
                    const index = stopIndexOf(stop.id);
                    if (index !== null) {
                      onChange(index);
                    }
                    input.current?.blur();
                  }}
                  className="block w-full px-3 py-2 text-left text-base hover:bg-teal-50"
                >
                  {stopName(stop, locale)}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
