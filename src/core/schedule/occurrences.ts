import { addDays, weekdayOf } from "../dates";
import type { AcademicYear, DateRange, IsoDate, Lesson, SemesterKey } from "../types";

/** All dates a lesson actually meets: its weekday, inside its semesters, minus no-class days. */
export function lessonDates(lesson: Lesson, year: AcademicYear): IsoDate[] {
  const dates: IsoDate[] = [];
  for (const key of lesson.semesters) {
    const range = year.semesters[key];
    if (!range) continue;
    let d = range.start;
    while (weekdayOf(d) !== lesson.weekday) d = addDays(d, 1);
    for (; d <= range.end; d = addDays(d, 7)) {
      if (!year.noClassDays.has(d)) dates.push(d);
    }
  }
  return dates.sort();
}

/** The semester in progress on `today`, else the next one to start. */
export function currentSemester(year: AcademicYear, today: IsoDate): SemesterKey | null {
  const ranges = (Object.entries(year.semesters) as [SemesterKey, DateRange][]).sort((a, b) =>
    a[1].start.localeCompare(b[1].start),
  );
  return ranges.find(([, r]) => r.end >= today)?.[0] ?? null;
}

export interface Occurrence {
  lesson: Lesson;
  date: IsoDate;
  /** Device-local start/end; the app is meant to run on a phone in Israel. */
  startsAt: Date;
  endsAt: Date;
}

function at(date: IsoDate, hhmm: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

export function occurrencesOn(date: IsoDate, lessons: Lesson[], year: AcademicYear): Occurrence[] {
  return lessons
    .filter((l) => lessonDates(l, year).includes(date))
    .map((lesson) => ({ lesson, date, startsAt: at(date, lesson.start), endsAt: at(date, lesson.end) }))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/** The current or next class (a class in progress counts until it ends). */
export function nextOccurrence(lessons: Lesson[], year: AcademicYear, now = new Date()): Occurrence | null {
  let best: Occurrence | null = null;
  for (const lesson of lessons) {
    for (const date of lessonDates(lesson, year)) {
      const o = { lesson, date, startsAt: at(date, lesson.start), endsAt: at(date, lesson.end) };
      if (o.endsAt <= now) continue;
      if (!best || o.startsAt < best.startsAt) best = o;
      break; // dates are sorted; later ones for this lesson can't be earlier
    }
  }
  return best;
}
