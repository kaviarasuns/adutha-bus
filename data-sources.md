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
| OpenStreetMap | Roads; little bus data outside Chennai | Basemap only |

## What exists today

- **TNSTC and SETC**: no official machine-readable, stop-level timetable was found. Booking sites and unofficial blogs list departures per bus stand. (Medium confidence: tnstc.in itself was not inspected.)
- **Private stage carriages**: about 7,800 in Tamil Nadu as of January 2023, per the Transport Department's [2023-24 policy note](https://financedept.tn.gov.in/en/my-documents/2020/07/48_transport_e_pn_2023_24_0.pdf) (medium confidence). Permits and timings are set by the RTA/RTO ([tnsta.gov.in](https://tnsta.gov.in/Indexes/vehicle_permit_stagecarriage)) and are not published. A consumer group reported in March 2025 that a 2015 direction to post permit, timing and route details online was still unimplemented ([DT Next](https://www.dtnext.in/amp/story/news/tamilnadu/furnish-bus-permits-info-online-urges-tn-consumer-organisation-826052)).
- **Chennai**: MTC has GPS tracking through Chennai One (launched 22 September 2025) and a community-scraped GTFS feed ([ungalsoththu/ChennaiGTFS](https://github.com/ungalsoththu/ChennaiGTFS)). Chennai is outside this project's first area.
- **Kerala precedent**: [Kerala-Private-Bus-Timing-API](https://github.com/amith-vp/Kerala-Private-Bus-Timing-API) built its dataset from a Motor Vehicles Department RTI disclosure, converted from PDF to JSON. No Tamil Nadu RTI precedent was found.
- **Punctuality**: no schedule-adherence study was found for TNSTC or private buses. Studies of MTC show high travel-time variability ([arXiv](https://arxiv.org/pdf/1904.03444)), so scheduled positions will often be minutes off.
- **Tracking mandate**: the state has mandated tracking devices on all public service vehicles ([DT Next](https://www.dtnext.in/amp/story/news/tamilnadu/tn-govt-mandates-tracking-devices-for-all-public-service-vehicles-845157)) and sanctioned devices for 13,490 state buses ([ThePrint](https://theprint.in/india/tn-sanctions-rs-17-99-cr-for-gps-tracking-devices-panic-buttons-in-state-run-buses/3094457/)). No award of that tender was found, and nothing says the data would be open.

## Collection plan for the corridor

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
- Route shapes must come from this project's own GPS logs. Shapes traced from OpenStreetMap would fall under the ODbL and could not be released as CC BY.
- The basemap is OpenFreeMap, built on OpenStreetMap data, and is credited on the map. It is displayed, not redistributed.
- India has no scraping statute, but Section 43 of the IT Act creates civil liability for unauthorised access, and commentary suggests it may reach scraping of public sites ([law.asia](https://law.asia/india-data-scraping-regulation/)). The Government Open Data Licence covers only data released on data.gov.in-type platforms, which these timetables are not. Scraping is therefore not used. (Secondary commentary, medium confidence.)

## The sample feed

The feed currently in `data/gtfs` has `kind=sample` as its only source. Stop names are real. Stop positions were placed approximately, not surveyed. Departure times, running times and the two private operators are invented. Which Tiruppur bus stand the corridor buses use, and where the Palladam route starts, are guesses listed as open questions in `product-doc.md`.
