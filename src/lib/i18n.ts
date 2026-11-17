import type { ReportKind } from "./report.ts";
import type { Stop } from "./timetable.ts";

export type Locale = "en" | "ta";

const en = {
  appName: "Adutha Bus",
  /** Shown on the toggle, so it names the other language. */
  language: "தமிழ்",
  navSearch: "Search",
  navStops: "Stops",
  navMap: "Map",
  sampleBanner: "Sample data. These times are invented, so do not use them to catch a bus.",
  from: "From",
  to: "To",
  swap: "Swap from and to",
  stopPlaceholder: "Type a stop name",
  noStopFound: "No stop matches that name.",
  chooseStops: "Choose where you are and where you are going to see the next buses.",
  sameStop: "From and to are the same stop.",
  noBuses: "No more buses today.",
  nextBuses: "Next buses",
  around: "around",
  arrives: "Arrives",
  towards: "Towards",
  inMinutes: (minutes: number) => (minutes < 1 ? "now" : `in ${minutes} min`),
  verifiedOn: "Timings checked on",
  report: "Report a problem",
  reportTitle: "What is wrong with this bus?",
  reportKinds: {
    did_not_come: "The bus did not come",
    wrong_time: "The time is wrong",
    wrong_stop: "It does not stop here",
    other: "Something else",
  } satisfies Record<ReportKind, string>,
  reportNote: "Details (optional)",
  reportSend: "Send report",
  reportSending: "Sending…",
  reportSent: "Thank you. We check every report by hand before changing the timetable.",
  reportFailed: "The report could not be sent. Please try again later.",
  reportNotConnected: "Reports cannot be sent yet. The reporting service is not connected.",
  close: "Close",
  allStops: "All stops",
  departuresFrom: "Buses leaving",
  mapLabel: "Map of the Coimbatore to Tiruppur bus routes",
  mapNote:
    "Bus positions are worked out from the timetable, not from GPS. A late or cancelled bus still appears on time.",
  gotIt: "Got it",
  scheduledPosition: "Scheduled position",
  scheduledLegend: "Scheduled position, from the timetable",
  busesNow: (count: number) =>
    count === 1 ? "1 bus scheduled on the road now" : `${count} buses scheduled on the road now`,
  nextStop: "Next stop",
  tapBus: "Tap a bus to see where it is going.",
};

export type Labels = typeof en;

const ta: Labels = {
  appName: "அடுத்த பஸ்",
  language: "English",
  navSearch: "தேடல்",
  navStops: "நிறுத்தங்கள்",
  navMap: "வரைபடம்",
  sampleBanner: "மாதிரித் தரவு. இந்த நேரங்கள் கற்பனையானவை; இவற்றை நம்பி பஸ் பிடிக்க வேண்டாம்.",
  from: "புறப்படும் இடம்",
  to: "சேரும் இடம்",
  swap: "இடங்களை மாற்று",
  stopPlaceholder: "நிறுத்தத்தின் பெயரை எழுதவும்",
  noStopFound: "அந்தப் பெயரில் நிறுத்தம் இல்லை.",
  chooseStops: "அடுத்த பஸ்களைப் பார்க்க, புறப்படும் இடத்தையும் சேரும் இடத்தையும் தேர்வு செய்யவும்.",
  sameStop: "புறப்படும் இடமும் சேரும் இடமும் ஒன்றே.",
  noBuses: "இன்று இனி பஸ் இல்லை.",
  nextBuses: "அடுத்த பஸ்கள்",
  around: "சுமார்",
  arrives: "சேரும் நேரம்",
  towards: "செல்லும் இடம்",
  inMinutes: (minutes: number) => (minutes < 1 ? "இப்போது" : `${minutes} நிமிடத்தில்`),
  verifiedOn: "நேரம் சரிபார்த்த தேதி",
  report: "பிழையைத் தெரிவிக்க",
  reportTitle: "இந்த பஸ்ஸில் என்ன தவறு?",
  reportKinds: {
    did_not_come: "பஸ் வரவில்லை",
    wrong_time: "நேரம் தவறு",
    wrong_stop: "இங்கே நிற்பதில்லை",
    other: "வேறு ஏதாவது",
  },
  reportNote: "விவரம் (விருப்பம்)",
  reportSend: "அனுப்பு",
  reportSending: "அனுப்புகிறது…",
  reportSent: "நன்றி. ஒவ்வொரு தகவலையும் நாங்கள் சரிபார்த்த பிறகே நேர அட்டவணையை மாற்றுவோம்.",
  reportFailed: "தகவலை அனுப்ப முடியவில்லை. பிறகு மீண்டும் முயலவும்.",
  reportNotConnected: "தகவல் அனுப்பும் வசதி இன்னும் இணைக்கப்படவில்லை.",
  close: "மூடு",
  allStops: "எல்லா நிறுத்தங்களும்",
  departuresFrom: "புறப்படும் பஸ்கள்",
  mapLabel: "கோயம்புத்தூர் – திருப்பூர் பஸ் வழித்தட வரைபடம்",
  mapNote:
    "பஸ்ஸின் இடம் நேர அட்டவணையை வைத்துக் கணக்கிடப்படுகிறது; GPS அல்ல. தாமதமான அல்லது ரத்தான பஸ்ஸும் சரியான நேரத்தில் வருவது போலவே தெரியும்.",
  gotIt: "சரி",
  scheduledPosition: "அட்டவணைப்படி இருக்கும் இடம்",
  scheduledLegend: "நேர அட்டவணைப்படி இருக்கும் இடம்",
  busesNow: (count: number) => `அட்டவணைப்படி இப்போது சாலையில் ${count} பஸ்கள்`,
  nextStop: "அடுத்த நிறுத்தம்",
  tapBus: "பஸ் எங்கே செல்கிறது என்று பார்க்க அதைத் தொடவும்.",
};

export const labels: Record<Locale, Labels> = { en, ta };

/** The stop's name in `locale`, or its English name when no Tamil name is stored. */
export function stopName(stop: Stop, locale: Locale): string {
  return locale === "ta" && stop.name.ta ? stop.name.ta : stop.name.en;
}
