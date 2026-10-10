import { addDays, toIcsDate } from "../dates";
import { buildingCoordinates, navigationUrl, placeLabel } from "../navigation/links";
import { lessonDates } from "../schedule/occurrences";
import type { AcademicYear, Lesson, NavApp, SemesterKey } from "../types";

export interface IcsOptions {
  year: number;
  reminderMinutes: number;
  navApp: NavApp;
  /** For DTSTAMP; injectable for tests. */
  now?: Date;
}

export const CALENDAR_NAME = "בר-אילן – מערכת שעות";

const TZID = "Asia/Jerusalem";
// Israel DST since 2013: from the Friday before the last Sunday of March, until the last Sunday of October.
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZID}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0300",
  "TZNAME:IDT",
  "DTSTART:19700327T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=FR;BYMONTHDAY=23,24,25,26,27,28,29",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0300",
  "TZOFFSETTO:+0200",
  "TZNAME:IST",
  "DTSTART:19701025T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function escapeText(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Folds a content line to 75 octets (RFC 5545 §3.1) without splitting UTF-8 characters. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + n > limit) {
      parts.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

const hhmmss = (hhmm: string) => hhmm.replace(":", "") + "00";

function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function lessonEvent(lesson: Lesson, sem: SemesterKey, year: AcademicYear, opts: IcsOptions): string[] {
  const dates = lessonDates({ ...lesson, semesters: [sem] }, year);
  if (dates.length === 0) return [];
  const first = dates[0];
  const last = dates[dates.length - 1];
  const meets = new Set(dates);
  const skipped: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 7)) if (!meets.has(d)) skipped.push(d);

  const url = navigationUrl(lesson.building, opts.navApp);
  const coords = buildingCoordinates(lesson.building);
  const place = placeLabel(lesson);
  const description = [
    [lesson.type, lesson.lecturer].filter(Boolean).join(" · "),
    `${place}`,
    `ניווט: ${url}`,
  ].join("\n");

  const lines = [
    "BEGIN:VEVENT",
    `UID:${lesson.code}-${lesson.weekday}-${hhmmss(lesson.start)}-${sem}-${opts.year}@biu-autopilot`,
    `DTSTAMP:${utcStamp(opts.now ?? new Date())}`,
    `DTSTART;TZID=${TZID}:${toIcsDate(first)}T${hhmmss(lesson.start)}`,
    `DTEND;TZID=${TZID}:${toIcsDate(first)}T${hhmmss(lesson.end)}`,
    `RRULE:FREQ=WEEKLY;UNTIL=${toIcsDate(last)}T235959Z`,
    ...skipped.map((d) => `EXDATE;TZID=${TZID}:${toIcsDate(d)}T${hhmmss(lesson.start)}`),
    `SUMMARY:${escapeText(lesson.course)}`,
    `LOCATION:${escapeText(`${place}, אוניברסיטת בר-אילן`)}`,
    ...(coords ? [`GEO:${coords.lat};${coords.lng}`] : []),
    `URL:${url}`,
    `DESCRIPTION:${escapeText(description)}`,
    `CATEGORIES:BIU`,
  ];
  if (opts.reminderMinutes > 0) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(`${lesson.course} – ${place}`)}`,
      `TRIGGER:-PT${opts.reminderMinutes}M`,
      "END:VALARM",
    );
  }
  lines.push("END:VEVENT");
  return lines;
}

/** One weekly-recurring VEVENT per lesson per semester, with holidays as EXDATEs. */
export function buildIcs(lessons: Lesson[], year: AcademicYear, opts: IcsOptions): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//biu-autopilot//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(CALENDAR_NAME)}`,
    `X-WR-TIMEZONE:${TZID}`,
    ...VTIMEZONE,
    ...lessons.flatMap((l) => l.semesters.flatMap((s) => lessonEvent(l, s, year, opts))),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
