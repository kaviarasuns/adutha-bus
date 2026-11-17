# Adutha Bus — Product Doc

_Last updated: 2026-11-17_

## Vision
One place to find when the next bus leaves, for every public and private bus in Tamil Nadu, starting with a single corridor and built on an openly published timetable.

## Problem it solves
Outside Chennai there is no usable timetable for TNSTC buses and nothing at all for private buses. A rider at an intermediate stop cannot tell when the next bus is due.

## Users
Riders on the Coimbatore–Tiruppur corridor, on their phones. The app is free, with no ads.

## Features
### v1
The corridor is every bus between Coimbatore and Tiruppur, via Avinashi and via Palladam, with all intermediate stops, for both TNSTC and private operators.

- **Search**: pick a from-stop and a to-stop and see the next departures, each with its operator, arrival time and the date the timing was last checked.
- **Stop view**: every upcoming departure from one stop, grouped by destination.
- **Map**: the corridor's routes with each bus at its scheduled position.
- **Report a problem** on any bus: it did not come, the time is wrong, it does not stop here, or something else.

Rules for v1:

- Terminus departure times are recorded as facts and shown exactly. Times at intermediate stops are estimated from measured running times and shown as "around".
- A bus on the map follows the road when the trip has a recorded road shape, and a straight line between stops when it has none.
- Map positions are labelled "scheduled", drawn as a faded dot inside the stretch of road the bus is timetabled to cover, and explained in one line the first time the map opens. The words "live" and "tracking" are not used anywhere.
- English is the default language, with a Tamil toggle. Every stop has an English and a Tamil name, and search matches either, plus common spelling variants.
- The app works offline once loaded.
- Reports are reviewed by hand. Riders cannot edit the timetable.

v1 leaves these out: accounts, fares, favourites, notifications, journeys with a change of bus, ticket booking, and a native app.

### Next
Town buses in Coimbatore and in Tiruppur.

### Later
Other corridors and districts. Real-time positions, if the state opens a feed.

## Data
See `data-sources.md`. The timetable is kept as GTFS in `data/gtfs`, and will be published under CC BY 4.0 once it holds real data.

## Tech stack
- TypeScript, React, Vite, TanStack Router, Tailwind 4, in a single package built with pnpm and Vite+.
- MapLibre GL JS with the OpenFreeMap basemap (OpenStreetMap data, no API key). Offline, the routes draw on a plain background.
- Static: the GTFS feed is compiled into one JSON file at build time, and search and position calculation run in the browser. There is no database or API.
- Installable PWA with offline caching (vite-plugin-pwa).
- Hosting on Cloudflare Pages. A small Cloudflare Worker stores problem reports.
- Unit tests cover the feed compiler, departure search, scheduled positions and stop name search.

Conventions carried over from the team-republic repository: this doc with dated decisions, `data-sources.md`, a source for every stored figure, exact pinned versions, the same CI checks, the bilingual label pattern, URL-held search text, and the two MapLibre fixes (worker URL under Vite; an outer box that gives the map its height).

## Open questions
1. Which Tiruppur bus stand do corridor buses start from and end at: old, new, or both?
2. Does the Palladam route start at Gandhipuram or at Singanallur?
3. Where are problem reports reviewed: straight from Cloudflare KV, or forwarded somewhere easier to read?
4. Which domain will the app use?
5. Is there a third route variant via Somanur and Mangalam, and how often does it run?
6. Publish under the ODbL and keep OpenStreetMap stops and road shapes, or replace them with surveyed data and publish under CC BY 4.0 as first decided?

## Decisions
- 2026-11-17: The core product is the stop-to-stop timetable. The map is a secondary view on top of it.
- 2026-11-17: Start outside Chennai, which already has GPS tracking through Chennai One. The first area is the Coimbatore–Tiruppur intercity corridor; town buses of each city come second.
- 2026-11-17: Cover both TNSTC and private buses from the first release, and do not launch until both are in.
- 2026-11-17: Collect data by fieldwork at the bus stands first, with RTI requests to the RTOs and TNSTC Coimbatore in parallel. No scraping of government sites or apps.
- 2026-11-17: Terminus departures are recorded as facts. Intermediate times come from riding each route variant with a GPS logger at peak and off-peak hours, and are shown as approximate.
- 2026-11-17: Keep data correct through a report button on every trip with manual review, a "last verified" date per route, and a re-survey every three to four months. No open user editing in v1.
- 2026-11-17: Map positions are always labelled as scheduled, never as live, and are drawn as a stretch of road, not a precise point.
- 2026-11-17: A civic project first: free, no ads, no monetisation in v1.
- 2026-11-17: Publish the timetable as open GTFS under CC BY 4.0, and store it as GTFS internally so the app and the public dataset are the same thing.
- 2026-11-17: Build a mobile-first PWA. No native app until usage justifies one.
- 2026-11-17: English is the default language, with a Tamil toggle.
- 2026-11-17: Static architecture: timetable bundled with the site, everything computed on the phone, MapLibre with an OpenStreetMap-based basemap, and a form endpoint for reports as the only server-side piece.
- 2026-11-17: Accept the risk that the state's vehicle tracking mandate produces a real tracker. Build nothing for real-time now; a GTFS-realtime feed can replace scheduled positions later.
- 2026-11-17: Skip the rider demand check before fieldwork and go straight to building.
- 2026-11-17: v1 is four screens: search, stop view, map, report a problem.
- 2026-11-17: Build against a placeholder GTFS feed with real stop names and invented times, marked as sample data and not published as a dataset.
- 2026-11-17: Stack is React, Vite, TanStack Router, Tailwind 4 and MapLibre on Cloudflare Pages, with a Cloudflare Worker for reports.
- 2026-11-17: Carry over team-republic's docs, provenance rule, tooling, CI, map fixes and bilingual pattern. Leave its API, database, auth and mobile app behind.
- 2026-11-17: The name is Adutha Bus.
- 2026-11-17: No open timetable exists for the corridor (see `data-sources.md`). Use what open data there is: OpenStreetMap bus stops and road shapes go into the sample feed and into fieldwork checklists. This leaves the publishing licence as open question 6.
