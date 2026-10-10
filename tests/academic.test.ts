import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseAcademicYear } from "@/core/academic/academicYear";
import { parseAllDayEvents } from "@/core/academic/parseIcs";

const ics = readFileSync(path.resolve("src/core/academic/data/2027.ics"), "utf8");

describe("academic year (BIU feed, 5787)", () => {
  it("reads all events with inclusive end dates", () => {
    const events = parseAllDayEvents(ics);
    expect(events).toHaveLength(19);
    const hanukkah = events.find((e) => e.summary.includes("חנוכה"))!;
    expect(hanukkah).toMatchObject({ start: "2026-12-04", end: "2026-12-07" });
  });

  it("derives semester ranges", () => {
    const { semesters } = parseAcademicYear(ics);
    expect(semesters.A).toEqual({ start: "2026-10-11", end: "2027-01-17" });
    expect(semesters.B).toEqual({ start: "2027-03-01", end: "2027-06-25" });
    expect(semesters.SUMMER).toEqual({ start: "2027-08-15", end: "2027-09-24" });
  });

  it("collects no-class days but not exam-only restrictions", () => {
    const { noClassDays } = parseAcademicYear(ics);
    expect(noClassDays.has("2026-10-27")).toBe(true); // election day
    expect(noClassDays.has("2026-12-06")).toBe(true); // Hanukkah (Sunday)
    expect(noClassDays.has("2026-12-20")).toBe(true); // fast of 10 Tevet
    expect(noClassDays.has("2027-04-25")).toBe(true); // Passover
    expect(noClassDays.has("2027-05-11")).toBe(true); // Memorial / Independence day
    expect(noClassDays.has("2027-07-22")).toBe(false); // fast, exams only
    expect(noClassDays.has("2027-01-20")).toBe(false); // exam break is outside semesters, not a holiday
  });
});
