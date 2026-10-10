import type { AcademicYear } from "../types";
import { parseAcademicYear } from "./academicYear";

// Snapshots of BIU's academic-year feed, keyed by Inbar year (2027 = תשפ"ז).
// Refresh with `npm run update:calendar`.
const feeds = import.meta.glob<string>("./data/*.ics", { query: "?raw", import: "default", eager: true });

export function availableYears(): number[] {
  return Object.keys(feeds)
    .map((p) => Number(p.match(/(\d{4})\.ics$/)?.[1]))
    .filter(Number.isFinite)
    .sort();
}

export function getAcademicYear(year: number): AcademicYear | null {
  const ics = feeds[`./data/${year}.ics`];
  return ics ? parseAcademicYear(ics) : null;
}

export { parseAcademicYear } from "./academicYear";
