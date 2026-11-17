import { parseReport } from "../src/lib/report.ts";

interface Env {
  /** KV namespace the reports are stored in, one entry per report. */
  readonly REPORTS: { put(key: string, value: string): Promise<void> };
  /** The site's origin, e.g. `https://adutha-bus.pages.dev`. Only it may post reports. */
  readonly ALLOWED_ORIGIN: string;
}

/**
 * Receives the app's problem reports and stores them for manual review.
 * Nothing here changes the timetable.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }
    if (request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403, headers });
    }

    const report = parseReport(await request.json().catch(() => null));
    if (!report) {
      return new Response("Not a valid report", { status: 400, headers });
    }
    const receivedAt = new Date().toISOString();
    await env.REPORTS.put(
      `${receivedAt}-${crypto.randomUUID()}`,
      JSON.stringify({ ...report, receivedAt }),
    );
    return new Response(null, { status: 204, headers });
  },
};
