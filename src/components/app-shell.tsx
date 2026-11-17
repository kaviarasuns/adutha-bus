import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { timetable } from "../lib/data.ts";
import { useLabels, useLocale } from "../lib/locale.tsx";

const navLink =
  "rounded-md px-2 py-1 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900";
const navLinkActive = "rounded-md bg-teal-50 px-2 py-1 text-sm font-medium text-teal-900";

/**
 * Page frame. `fullWidth` gives the page the whole viewport below the header
 * (the map); other pages sit in a centred reading column.
 */
export function AppShell({
  children,
  fullWidth = false,
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  const { locale, toggleLocale } = useLocale();
  const L = useLabels();

  return (
    <div className={fullWidth ? "flex h-dvh flex-col" : "flex min-h-dvh flex-col"}>
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-(--app-header-height) max-w-3xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link to="/" className="truncate text-lg font-semibold text-teal-800">
              {L.appName}
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                activeOptions={{ exact: true, includeSearch: false }}
                className={navLink}
                activeProps={{ className: navLinkActive }}
              >
                {L.navSearch}
              </Link>
              <Link to="/stops" className={navLink} activeProps={{ className: navLinkActive }}>
                {L.navStops}
              </Link>
              <Link to="/map" className={navLink} activeProps={{ className: navLinkActive }}>
                {L.navMap}
              </Link>
            </nav>
          </div>
          <button
            type="button"
            onClick={toggleLocale}
            className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            lang={locale === "en" ? "ta" : "en"}
          >
            {L.language}
          </button>
        </div>
      </header>
      {timetable.sample ? (
        <p role="status" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
          {L.sampleBanner}
        </p>
      ) : null}
      {fullWidth ? (
        <main className="relative min-h-0 flex-1">{children}</main>
      ) : (
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      )}
    </div>
  );
}
