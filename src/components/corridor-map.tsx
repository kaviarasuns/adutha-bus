import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  type GeoJSONSource,
  type GeoJSONSourceSpecification,
  Map as MapLibreMap,
  type MapMouseEvent,
  NavigationControl,
  setWorkerUrl,
  type StyleSpecification,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useEffect, useRef, useState } from "react";
import type { LonLat, ScheduledBus } from "../lib/position.ts";
import type { Timetable } from "../lib/timetable.ts";

// MapLibre looks for its worker next to its own module file. Vite moves that
// module (dev pre-bundling, production chunks), so the worker 404s and no map
// draws. Hand MapLibre the worker's real URL instead.
setWorkerUrl(workerUrl);

const BASEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/** Used when the basemap cannot be fetched (offline): routes and buses on a plain surface. */
const PLAIN_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "surface", type: "background", paint: { "background-color": "#f5f5f4" } }],
};

const ROUTE_COLOR = "#57534e";
const BUS_COLOR = "#0f766e";
const BUS_LAYER = "buses";

type GeoJSON = Exclude<GeoJSONSourceSpecification["data"], string>;

type Feature = {
  type: "Feature";
  properties: Record<string, string | boolean>;
  geometry: { type: "LineString"; coordinates: LonLat[] } | { type: "Point"; coordinates: LonLat };
};

const collection = (features: Feature[]) =>
  ({ type: "FeatureCollection", features }) as unknown as GeoJSON;

async function loadStyle(): Promise<StyleSpecification | string> {
  try {
    const response = await fetch(BASEMAP_STYLE_URL);
    return response.ok ? ((await response.json()) as StyleSpecification) : PLAIN_STYLE;
  } catch {
    return PLAIN_STYLE;
  }
}

/** One line per distinct run of stops; a route and its return run share a line. */
function routeLines(timetable: Timetable): Feature[] {
  const lines = new Map<string, Feature>();
  for (const trip of timetable.trips) {
    const stops = trip.calls.map((call) => call.stop);
    const key = (stops[0] ?? 0) <= (stops.at(-1) ?? 0) ? stops.join() : stops.toReversed().join();
    if (lines.has(key)) {
      continue;
    }
    lines.set(key, {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: stops.flatMap((stop): LonLat[] => {
          const at = timetable.stops[stop];
          return at ? [[at.lon, at.lat]] : [];
        }),
      },
    });
  }
  return [...lines.values()];
}

/**
 * The corridor's routes and stops, with each scheduled bus drawn as a faded
 * dot inside the stretch of road it is timetabled to cover around now.
 */
export function CorridorMap({
  timetable,
  buses,
  selected,
  onSelect,
  label,
}: {
  readonly timetable: Timetable;
  readonly buses: readonly ScheduledBus[];
  /** Trip id of the highlighted bus. */
  readonly selected: string | null;
  readonly onSelect: (tripId: string | null) => void;
  /** Accessible name of the map region. */
  readonly label: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    const element = container.current;
    if (element === null) return;
    let map: MapLibreMap | null = null;
    let cancelled = false;

    void loadStyle().then((style) => {
      if (cancelled) return;
      const lons = timetable.stops.map((stop) => stop.lon);
      const lats = timetable.stops.map((stop) => stop.lat);
      const created = new MapLibreMap({
        container: element,
        style,
        bounds: [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        // Room for the legend above and the info panel below.
        fitBoundsOptions: { padding: { top: 120, bottom: 130, left: 32, right: 32 } },
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
      map = created;
      created.touchZoomRotate.disableRotation();
      created.addControl(new NavigationControl({ showCompass: false }), "top-right");
      created.addControl(new AttributionControl({ compact: true }));

      // On the style, not on "load": routes and buses must not wait for basemap tiles on a slow connection.
      created.once("style.load", () => {
        created.addSource("routes", { type: "geojson", data: collection(routeLines(timetable)) });
        created.addSource("stops", {
          type: "geojson",
          data: collection(
            timetable.stops.map((stop) => ({
              type: "Feature",
              properties: {},
              geometry: { type: "Point", coordinates: [stop.lon, stop.lat] },
            })),
          ),
        });
        created.addSource("spans", { type: "geojson", data: collection([]) });
        created.addSource(BUS_LAYER, { type: "geojson", data: collection([]) });

        created.addLayer({
          id: "routes",
          type: "line",
          source: "routes",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": ROUTE_COLOR, "line-width": 2.5, "line-opacity": 0.7 },
        });
        created.addLayer({
          id: "spans",
          type: "line",
          source: "spans",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": BUS_COLOR,
            "line-width": ["case", ["get", "selected"], 16, 12],
            "line-opacity": ["case", ["get", "selected"], 0.4, 0.22],
          },
        });
        created.addLayer({
          id: "stops",
          type: "circle",
          source: "stops",
          paint: {
            "circle-radius": 3.5,
            "circle-color": "#ffffff",
            "circle-stroke-color": ROUTE_COLOR,
            "circle-stroke-width": 1.5,
          },
        });
        created.addLayer({
          id: BUS_LAYER,
          type: "circle",
          source: BUS_LAYER,
          paint: {
            "circle-radius": ["case", ["get", "selected"], 8, 6],
            "circle-color": BUS_COLOR,
            "circle-opacity": ["case", ["get", "selected"], 0.9, 0.55],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 1.5,
          },
        });
        mapRef.current = created;
        setReady(true);
      });

      created.on("click", (event: MapMouseEvent) => {
        const reach = 10;
        const hit = created.queryRenderedFeatures(
          [
            [event.point.x - reach, event.point.y - reach],
            [event.point.x + reach, event.point.y + reach],
          ],
          { layers: [BUS_LAYER] },
        )[0];
        const tripId: unknown = hit?.properties.tripId;
        select.current(typeof tripId === "string" ? tripId : null);
      });
      created.on("mouseenter", BUS_LAYER, () => {
        created.getCanvas().style.cursor = "pointer";
      });
      created.on("mouseleave", BUS_LAYER, () => {
        created.getCanvas().style.cursor = "";
      });
    });

    return () => {
      cancelled = true;
      mapRef.current = null;
      setReady(false);
      map?.remove();
    };
  }, [timetable]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || map === null) return;
    const properties = (bus: ScheduledBus) => ({
      tripId: bus.trip.id,
      selected: bus.trip.id === selected,
    });
    map.getSource<GeoJSONSource>("spans")?.setData(
      collection(
        buses.map((bus) => ({
          type: "Feature",
          properties: properties(bus),
          geometry: { type: "LineString", coordinates: [...bus.span] },
        })),
      ),
    );
    map.getSource<GeoJSONSource>(BUS_LAYER)?.setData(
      collection(
        buses.map((bus) => ({
          type: "Feature",
          properties: properties(bus),
          geometry: { type: "Point", coordinates: bus.at },
        })),
      ),
    );
  }, [ready, buses, selected]);

  // MapLibre's stylesheet sets `position: relative` on the element it draws
  // into, which would cancel `absolute inset-0` and leave it 0px tall. The
  // outer box does the positioning; the map element just fills it.
  return (
    <div className="absolute inset-0">
      <div ref={container} role="region" aria-label={label} className="h-full w-full" />
    </div>
  );
}
