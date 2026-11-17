# Adutha Bus: timetable data sources

_Researched 2026-11-17 from web sources. Confidence is noted where a claim was not checked against a primary source. Not legal advice._

## Summary

| Source | What it has | Usable now |
| --- | --- | --- |
| Bus stand timing boards and time-keepers | Terminus departure times, TNSTC and private | Yes, by fieldwork |
| Ride logs (own GPS recordings) | Stop positions, route shape, running times between stops | Yes, by fieldwork |
| RTI to the Coimbatore and Tiruppur RTOs | Private bus permits and timing sheets | After a reply; format unknown |
| RTI to TNSTC Coimbatore | TNSTC schedules for the corridor | After a reply; format unknown |
| tnstc.in and other booking sites | Some departures | No: scraping is ruled out |
| OpenStreetMap | Roads, 41 bus stations and 383 bus stops in the two districts; no corridor bus routes | Yes: stops and road shapes in the sample feed, and the fieldwork checklists |

## What exists today

- **TNSTC and SETC**: no official machine-readable, stop-level timetable was found. Booking sites and unofficial blogs list departures per bus stand. (Medium confidence: tnstc.in itself was not inspected.)
- **Private stage carriages**: about 7,800 in Tamil Nadu as of January 2023, per the Transport Department's [2023-24 policy note](https://financedept.tn.gov.in/en/my-documents/2020/07/48_transport_e_pn_2023_24_0.pdf) (medium confidence). Permits and timings are set by the RTA/RTO ([tnsta.gov.in](https://tnsta.gov.in/Indexes/vehicle_permit_stagecarriage)) and are not published. A consumer group reported in March 2025 that a 2015 direction to post permit, timing and route details online was still unimplemented ([DT Next](https://www.dtnext.in/amp/story/news/tamilnadu/furnish-bus-permits-info-online-urges-tn-consumer-organisation-826052)).
- **Chennai**: MTC has GPS tracking through Chennai One (launched 22 September 2025) and a community-scraped GTFS feed ([ungalsoththu/ChennaiGTFS](https://github.com/ungalsoththu/ChennaiGTFS)). Chennai is outside this project's first area.
- **Kerala precedent**: [Kerala-Private-Bus-Timing-API](https://github.com/amith-vp/Kerala-Private-Bus-Timing-API) built its dataset from a Motor Vehicles Department RTI disclosure, converted from PDF to JSON. No Tamil Nadu RTI precedent was found.
- **Punctuality**: no schedule-adherence study was found for TNSTC or private buses. Studies of MTC show high travel-time variability ([arXiv](https://arxiv.org/pdf/1904.03444)), so scheduled positions will often be minutes off.
- **Tracking mandate**: the state has mandated tracking devices on all public service vehicles ([DT Next](https://www.dtnext.in/amp/story/news/tamilnadu/tn-govt-mandates-tracking-devices-for-all-public-service-vehicles-845157)) and sanctioned devices for 13,490 state buses ([ThePrint](https://theprint.in/india/tn-sanctions-rs-17-99-cr-for-gps-tracking-devices-panic-buttons-in-state-run-buses/3094457/)). No award of that tender was found, and nothing says the data would be open.

## Open data check for the corridor (2026-11-17)

No open timetable exists for the Coimbatore–Tiruppur corridor.

- **Mobility Database**: its catalogue lists 21 feeds for India. The only Tamil Nadu one is the community Chennai feed (`mdb-3360`). Nothing covers TNSTC Coimbatore or private buses.
- **tn.data.gov.in**: one transport timetable dataset, [SETC Bus Routes, Services and Timings](https://tn.data.gov.in/catalog/setc-bus-routes-services-and-timings), published in 2018 and last updated in 2019. SETC runs long-distance express services, not this corridor, and the contents were not inspected. Nothing was found for TNSTC or for stage carriage permits.
- **OpenCity**: district-wise vehicle counts and Chennai MTC performance figures only.
- **OpenStreetMap** (Overpass query over the two districts): 17 bus route relations, all around Mettupalayam, and none between Coimbatore and Tiruppur. It does hold 41 bus stations and 383 bus stops in the area, 308 of them named and 148 with a Tamil name. The sample feed and the fieldwork checklists now use them; see "Licence and legal" for what that means for publishing.
- **Unofficial blogs** such as tickettogetlost.com list TNSTC departures per bus stand, some several years old, and nothing for private buses on this corridor. They are not open data and are not copied. One 2021 page describes Coimbatore–Tiruppur buses via Avinashi and via Palladam roughly every 10 to 15 minutes from about 04:20 to 23:00, and mentions a third variant via Somanur and Mangalam, which the fieldwork should confirm.

## Collection plan for the corridor

0. **Start from the checklists** in `fieldwork/`: one CSV per route variant listing the OpenStreetMap stops along the road, in order, with columns to mark whether buses stop there and to correct the names. OpenStreetMap is sparse on the highway stretches, so expect to add stops such as Neelambur and Karumathampatti.
1. **Bus stands**: photograph the timing boards and ask the time-keepers at Gandhipuram and Singanallur in Coimbatore and at the Tiruppur bus stands. Record terminus departure times per operator and route variant.
2. **Rides**: ride each route variant with a GPS logger at peak and off-peak hours. This gives stop positions, the road shape (`shapes.txt`) and running times between stops.
3. **RTI requests**, filed in parallel, to the two RTOs and to TNSTC Coimbatore. Use the replies to verify and fill gaps.
4. **Re-survey** every three to four months, and review rider reports by hand in between.

## Provenance

Every trip names a source in `data/gtfs/sources.txt`:

| `kind` | Meaning |
| --- | --- |
| `board_photo` | Read from a bus stand timing board or given by a time-keeper |
| `rti_reply` | Taken from an RTI reply |
| `ride_log` | Measured on a ride |
| `sample` | Invented, for building the app |

`collected_on` is the day the source was gathered. The app shows the latest such date for a route as "Timings checked on". Photos, RTI replies and GPS logs are kept outside the repository.

## Licence and legal

- The dataset will be published under CC BY 4.0 once it holds real data. Timings gathered first-hand and from RTI replies are facts collected by this project.
- **Open decision.** The sample feed takes its stop positions, some stop names and all road shapes from OpenStreetMap, which is licensed under the ODbL (attribution and share-alike). A dataset that keeps them must be published under the ODbL, not CC BY 4.0. To publish under CC BY as decided, replace them with this project's own surveyed positions and GPS ride logs first. Each OpenStreetMap-derived stop is marked by its `osm_element` column in `stops.txt`, and every row of `shapes.txt` is OpenStreetMap-derived.
- The basemap is OpenFreeMap, built on OpenStreetMap data, and is credited on the map. It is displayed, not redistributed.
- India has no scraping statute, but Section 43 of the IT Act creates civil liability for unauthorised access, and commentary suggests it may reach scraping of public sites ([law.asia](https://law.asia/india-data-scraping-regulation/)). The Government Open Data Licence covers only data released on data.gov.in-type platforms, which these timetables are not. Scraping is therefore not used. (Secondary commentary, medium confidence.)

## The sample feed

The feed currently in `data/gtfs` has `kind=sample` as its only source.

- **Stops**: the bus stands are OpenStreetMap's. The stops between them are the named OpenStreetMap bus stops within 45 m of each route's road, with the two sides of a road merged into one. Their names are as mapped, lightly tidied, so some are informal or misspelt. Tamil names are included where OpenStreetMap has one.
- **Road shapes**: driving routes between the bus stands, computed by the public OSRM server on OpenStreetMap roads and simplified. They are the router's choice of road, not a record of where buses run.
- **Three variants**: via Avinashi, via Palladam, and via Somanur. The Somanur variant rests on one 2021 blog page and is unconfirmed.
- **Invented**: every departure time, every running time and the two private operators. First and last departures loosely follow the 04:20 to 23:00 span that blog reports.
- **Guesses** listed as open questions in `product-doc.md`: which Tiruppur bus stand the corridor buses use, and where the Palladam route starts.
