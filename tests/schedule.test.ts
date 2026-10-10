import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAcademicYear } from "@/core/academic/academicYear";
import { currentSemester, lessonDates, nextOccurrence, occurrencesOn } from "@/core/schedule/occurrences";
import type { Lesson } from "@/core/types";

const year = parseAcademicYear(readFileSync(path.resolve("src/core/academic/data/2027.ics"), "utf8"));

const lesson = (o: Partial<Lesson>): Lesson => ({
  weekday: 0,
  start: "10:00",
  end: "12:00",
  course: "קורס",
  code: "1-01",
  semesters: ["A"],
  lecturer: "",
  area: null,
  building: "507",
  room: "102",
  roomRaw: "",
  type: "הרצאה",
  ...o,
});

describe("lessonDates", () => {
  it("runs weekly through the semester and skips holidays", () => {
    const dates = lessonDates(lesson({ weekday: 0 }), year);
    expect(dates[0]).toBe("2026-10-11");
    expect(dates.at(-1)).toBe("2027-01-17");
    expect(dates).not.toContain("2026-12-06"); // Hanukkah
    expect(dates).not.toContain("2026-12-20"); // fast
    expect(dates).toContain("2026-12-13");
  });
  it("covers both semesters for yearly courses", () => {
    const dates = lessonDates(lesson({ weekday: 3, semesters: ["A", "B"] }), year);
    expect(dates[0]).toBe("2026-10-14");
    expect(dates.at(-1)).toBe("2027-06-23");
    expect(dates.some((d) => d > "2027-01-17" && d < "2027-03-01")).toBe(false);
  });
});

describe("nextOccurrence", () => {
  const lessons = [
    lesson({ weekday: 0, start: "10:00", end: "12:00", course: "first" }),
    lesson({ weekday: 0, start: "13:00", end: "15:00", course: "second" }),
  ];
  it("returns the class in progress until it ends", () => {
    expect(nextOccurrence(lessons, year, new Date(2026, 9, 11, 11, 0))?.lesson.course).toBe("first");
  });
  it("moves on to the next class after one ends", () => {
    expect(nextOccurrence(lessons, year, new Date(2026, 9, 11, 12, 30))?.lesson.course).toBe("second");
  });
  it("jumps over holidays", () => {
    expect(nextOccurrence(lessons, year, new Date(2026, 11, 5, 9, 0))?.date).toBe("2026-12-13");
  });
  it("lists a day's classes in order", () => {
    expect(occurrencesOn("2026-10-11", [...lessons].reverse(), year).map((o) => o.lesson.course)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("currentSemester", () => {
  it("picks the running semester, else the next one", () => {
    expect(currentSemester(year, "2026-11-01")).toBe("A");
    expect(currentSemester(year, "2027-02-01")).toBe("B"); // exam break → upcoming B
    expect(currentSemester(year, "2027-07-01")).toBe("SUMMER");
    expect(currentSemester(year, "2027-10-01")).toBeNull();
  });
});
