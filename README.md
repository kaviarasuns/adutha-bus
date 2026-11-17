# Adutha Bus

Bus timings between Coimbatore and Tiruppur, for TNSTC and private buses, as a mobile-first web app that works offline. "Adutha bus" is Tamil for "next bus".

> The timetable in this repository is **sample data**. The stops and road shapes come from OpenStreetMap, and every departure and running time is invented. The app shows a banner saying so until real data replaces it.

- `product-doc.md`: what the app is, what v1 contains, and the dated decisions behind it (source of truth)
- `data-sources.md`: where timetable data can come from, how it is collected, and the licence

## What it does

| Screen | Path | What |
| --- | --- | --- |
| Search | `/` | Next buses from one stop to another |
| Stops | `/stops`, `/stops/<id>` | Every bus leaving a stop, grouped by where it is going |
| Map | `/map` | The routes, with each bus drawn where the timetable says it should be |
| Report | on every bus | A form to say a timing is wrong |

Positions on the map are computed from the timetable. No bus carries a tracker, and the app never calls a position "live".

## Run locally

Requires Node 24.22.1 (`.node-version`; `fnm use` picks it up) and pnpm via corepack.

```sh
corepack enable
pnpm install
pnpm dev        # compiles data/gtfs, then serves the app
```

Checks: `pnpm exec vp fmt --check`, `pnpm exec vp lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Layout

| Path | What |
| --- | --- |
| `data/gtfs/` | The timetable as GTFS text files. This is the only place timings are edited |
| `fieldwork/` | Stop checklists for each route variant, pre-filled from OpenStreetMap, to verify on the ground |
| `scripts/build-timetable.ts` | Checks the feed and compiles it to `src/generated/timetable.json` (`pnpm data`) |
| `src/lib/` | Feed compiler, departure search, scheduled positions, stop name search, labels |
| `src/routes/`, `src/components/` | The screens (React, TanStack Router, Tailwind 4, MapLibre) |
| `worker/` | Cloudflare Worker that receives problem reports. Not deployed yet |
| `test/` | Unit tests for everything in `src/lib/` |

## Data rules

- Every trip in `trips.txt` names a `source_id` from `sources.txt`: a bus stand board photo, an RTI reply, a ride log, or sample data. The build fails for a trip without one.
- A route's "Timings checked on" date is the latest collection date among its trips' sources.
- A stop time with `timepoint=0` was estimated from measured running times, and the app shows it as "around".
- A trip with a `shape_id` is drawn along that road shape, and each of its stop times needs a `shape_dist_traveled`. A trip without one is drawn straight from stop to stop.
- `sources.txt`, `stop_aliases.txt`, the `source_id` column of `trips.txt` and the `osm_element` column of `stops.txt` are additions to GTFS. Other GTFS readers ignore them.
- Stops and shapes in the sample feed are © OpenStreetMap contributors, under the [ODbL](https://opendatacommons.org/licenses/odbl/). See `data-sources.md` for what that means for publishing.

## Not done yet

- Real timetable data (fieldwork and RTI requests; see `data-sources.md`).
- Deployment to Cloudflare Pages.
- The report worker: it needs a KV namespace and the site's origin in `worker/wrangler.toml`, then `VITE_REPORT_URL` set at build time. Until then the report form says reports cannot be sent.
