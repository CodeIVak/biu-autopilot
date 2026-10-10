import { addDays } from "../dates";
import type { AcademicYear, IsoDate, SemesterKey } from "../types";
import { parseAllDayEvents, type AllDayEvent } from "./parseIcs";

// Matched against SUMMARY of BIU's academic-year events.
const SEMESTER_START: Record<SemesterKey, RegExp> = {
  A: /^יום ראשון ללימודים$/,
  B: /יום ראשון ללימודים בסמסטר ב/,
  SUMMER: /^סמסטר קיץ/,
};
const SEMESTER_END: Record<SemesterKey, RegExp> = {
  A: /יום אחרון ללימודים בסמסטר א/,
  B: /יום אחרון ללימודים בסמסטר ב/,
  SUMMER: /^סמסטר קיץ/,
};

/** Events that cancel classes. Exam breaks are outside semesters anyway; fasts marked
 * "אין לקיים בחינות" only affect exams, so they are deliberately not matched. */
const NO_CLASSES = [/חופש(?!ת בחינות)/, /אין לימודים/, /יום הזיכרון.*יום העצמאות/];

function expand(e: AllDayEvent): IsoDate[] {
  const days: IsoDate[] = [];
  for (let d = e.start; d <= e.end; d = addDays(d, 1)) days.push(d);
  return days;
}

export function buildAcademicYear(events: AllDayEvent[]): AcademicYear {
  const find = (re: RegExp) => events.find((e) => re.test(e.summary.trim()));
  const semesters: AcademicYear["semesters"] = {};
  for (const key of Object.keys(SEMESTER_START) as SemesterKey[]) {
    const s = find(SEMESTER_START[key]);
    const e = find(SEMESTER_END[key]);
    if (s && e) semesters[key] = { start: s.start, end: e.end };
  }

  const noClassDays = new Set<IsoDate>();
  for (const e of events) {
    if (NO_CLASSES.some((re) => re.test(e.summary))) expand(e).forEach((d) => noClassDays.add(d));
  }
  return { semesters, noClassDays };
}

export function parseAcademicYear(ics: string): AcademicYear {
  return buildAcademicYear(parseAllDayEvents(ics));
}
