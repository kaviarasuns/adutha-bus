import { useEffect, useState } from "react";
import { momentInIst, type Moment } from "./service-time.ts";

/** The current time in Tamil Nadu, refreshed every `everyMs`. */
export function useNow(everyMs: number): Moment {
  const [now, setNow] = useState(() => momentInIst(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setNow(momentInIst(new Date())), everyMs);
    return () => clearInterval(timer);
  }, [everyMs]);
  return now;
}
