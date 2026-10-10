import type { IsoDate, Weekday } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Date-only helpers. Everything is computed in UTC so DST never shifts a day. */
export function parseIso(d: IsoDate): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function toIso(d: Date): IsoDate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(d: IsoDate, n: number): IsoDate {
  const date = parseIso(d);
  date.setUTCDate(date.getUTCDate() + n);
  return toIso(date);
}

export function weekdayOf(d: IsoDate): Weekday {
  return parseIso(d).getUTCDay() as Weekday;
}

/** "20261011" → "2026-10-11". */
export function fromIcsDate(v: string): IsoDate {
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

/** "2026-10-11" → "20261011". */
export function toIcsDate(d: IsoDate): string {
  return d.replaceAll("-", "");
}

/** Local (device) calendar date, for "today" in the UI. */
export function localToday(now = new Date()): IsoDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
