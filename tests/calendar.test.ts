import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAcademicYear } from "@/core/academic/academicYear";
import { buildIcs, foldLine } from "@/core/calendar/buildIcs";
import type { Lesson } from "@/core/types";

const year = parseAcademicYear(readFileSync(path.resolve("src/core/academic/data/2027.ics"), "utf8"));
const lesson: Lesson = {
  weekday: 0,
  start: "10:00",
  end: "12:00",
  course: "מבוא, לדוגמה",
  code: "11111-01",
  semesters: ["A"],
  lecturer: 'ד"ר ישראלי',
  area: "מ.ישראל",
  building: "507",
  room: "102",
  roomRaw: "",
  type: "הרצאה",
};
const ics = buildIcs([lesson], year, {
  year: 2027,
  reminderMinutes: 30,
  navApp: "waze",
  now: new Date(Date.UTC(2026, 9, 10)),
});
const unfolded = ics.replace(/\r\n /g, "");

describe("buildIcs", () => {
  it("creates a weekly series bounded by the semester", () => {
    expect(unfolded).toContain("DTSTART;TZID=Asia/Jerusalem:20261011T100000");
    expect(unfolded).toContain("DTEND;TZID=Asia/Jerusalem:20261011T120000");
    expect(unfolded).toContain("RRULE:FREQ=WEEKLY;UNTIL=20270117T235959Z");
  });
  it("excludes holidays", () => {
    expect(unfolded).toContain("EXDATE;TZID=Asia/Jerusalem:20261206T100000");
    expect(unfolded).toContain("EXDATE;TZID=Asia/Jerusalem:20261220T100000");
    expect(unfolded).not.toContain("EXDATE;TZID=Asia/Jerusalem:20261213T100000");
  });
  it("adds location, navigation link and reminder", () => {
    expect(unfolded).toContain("SUMMARY:מבוא\\, לדוגמה");
    expect(unfolded).toContain("LOCATION:בניין 507\\, חדר 102\\, אוניברסיטת בר-אילן");
    expect(unfolded).toMatch(/URL:https:\/\/waze\.com\/ul\?/);
    expect(unfolded).toContain("TRIGGER:-PT30M");
  });
  it("uses CRLF and folds lines at 75 octets", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it("never splits a multi-byte character when folding", () => {
    const line = "SUMMARY:" + "א".repeat(100);
    expect(foldLine(line).replace(/\r\n /g, "")).toBe(line);
  });
});
