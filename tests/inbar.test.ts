import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePeriod, parseRoom, parseSchedule } from "@/core/inbar/parseSchedule";

const html = readFileSync(path.resolve("tests/fixtures/student-period-schedule.html"), "utf8");
const doc = () => new DOMParser().parseFromString(html, "text/html");

describe("parseRoom", () => {
  it("splits area, building and room", () => {
    expect(parseRoom("מ.ישראל-507 - 102")).toEqual({ area: "מ.ישראל", building: "507", room: "102" });
    expect(parseRoom("יהדות-403 - 67")).toEqual({ area: "יהדות", building: "403", room: "67" });
  });
  it("returns nulls for unstructured rooms", () => {
    expect(parseRoom("מקוון")).toEqual({ area: null, building: null, room: null });
  });
});

describe("parsePeriod", () => {
  it("maps Inbar periods to semesters", () => {
    expect(parsePeriod("סמסטר א'")).toEqual(["A"]);
    expect(parsePeriod("סמסטר ב'")).toEqual(["B"]);
    expect(parsePeriod("סמסטר קיץ")).toEqual(["SUMMER"]);
    expect(parsePeriod("שנתי")).toEqual(["A", "B"]);
  });
});

describe("parseSchedule", () => {
  it("parses every row of the GridView", () => {
    const lessons = parseSchedule(doc());
    expect(lessons).toHaveLength(3);
    expect(lessons[0]).toMatchObject({
      weekday: 0,
      start: "10:00",
      end: "12:00",
      course: "מבוא לדוגמה",
      code: "11111-01",
      semesters: ["A"],
      building: "507",
      room: "102",
      type: "הרצאה",
      lecturer: 'ד"ר ישראלי',
    });
    expect(lessons[1]).toMatchObject({ weekday: 1, building: "404", semesters: ["B"] });
    expect(lessons[2]).toMatchObject({ weekday: 3, building: null, roomRaw: "מקוון", semesters: ["A", "B"] });
  });
  it("parses the card view that Inbar shows on phones", () => {
    const cards = readFileSync(path.resolve("tests/fixtures/student-period-schedule-cards.html"), "utf8");
    const lessons = parseSchedule(new DOMParser().parseFromString(cards, "text/html"));
    expect(lessons).toEqual([
      {
        weekday: 0,
        start: "10:00",
        end: "12:00",
        course: "מבוא לדוגמה",
        code: "11111-01",
        semesters: ["A"],
        lecturer: 'ד"ר ישראלי',
        area: "יהדות",
        building: "404",
        room: "102",
        roomRaw: "יהדות-404 - 102",
        type: "",
      },
      expect.objectContaining({ weekday: 5, start: "08:00", course: "עיבוד, ניתוח והצגת נתונים לדוגמה", semesters: ["B"], building: "507" }),
    ]);
  });
  it("throws when the table is missing", () => {
    expect(() => parseSchedule(new DOMParser().parseFromString("<p>login</p>", "text/html"))).toThrow();
  });
});
