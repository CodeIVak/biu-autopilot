import { addDays, fromIcsDate } from "../dates";
import type { DateRange } from "../types";

export interface AllDayEvent extends DateRange {
  summary: string;
  description: string;
}

function unescape(v: string): string {
  return v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
}

/**
 * Minimal reader for the all-day VEVENTs in BIU's academic-year feed.
 * DTEND (exclusive per RFC 5545) is converted to an inclusive end date.
 */
export function parseAllDayEvents(ics: string): AllDayEvent[] {
  // Unfold continuation lines first (RFC 5545 §3.1).
  const lines = ics.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: AllDayEvent[] = [];
  let cur: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT" && cur) {
      if (cur.DTSTART) {
        const start = fromIcsDate(cur.DTSTART);
        const end = cur.DTEND ? addDays(fromIcsDate(cur.DTEND), -1) : start;
        events.push({ start, end, summary: unescape(cur.SUMMARY ?? "").trim(), description: unescape(cur.DESCRIPTION ?? "") });
      }
      cur = null;
    } else if (cur) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const key = line.slice(0, i).split(";")[0];
      cur[key] = line.slice(i + 1);
    }
  }
  return events;
}
