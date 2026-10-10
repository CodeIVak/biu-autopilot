import type { Lesson, SemesterKey, Weekday } from "../types";

export const SCHEDULE_TABLE_ID = "ContentPlaceHolder1_PeriodScheduleA_gvPeriodSchedule";

const WEEKDAYS: Record<string, Weekday> = { "א'": 0, "ב'": 1, "ג'": 2, "ד'": 3, "ה'": 4, "ו'": 5, "ש'": 6 };

// Columns are located by header text, not index, so reordering in Inbar won't break parsing.
const HEADERS = {
  day: "יום",
  time: "שעה",
  course: "שם קבוצת קורס",
  code: "קוד קבוצת קורס",
  period: "תקופה",
  lecturer: "מרצה",
  room: "חדר",
  type: "סוג מפגש",
} as const;

/** "מ.ישראל-507 - 102" → area "מ.ישראל", building "507", room "102". */
export function parseRoom(raw: string): Pick<Lesson, "area" | "building" | "room"> {
  const m = raw.trim().match(/^(.*?)-(\d+)\s*-\s*(.+)$/);
  if (!m) return { area: null, building: null, room: null };
  return { area: m[1].trim() || null, building: m[2], room: m[3].trim() };
}

export function parsePeriod(period: string): SemesterKey[] {
  if (period.includes("שנתי")) return ["A", "B"];
  if (period.includes("קיץ")) return ["SUMMER"];
  if (period.includes("ב'")) return ["B"];
  if (period.includes("א'")) return ["A"];
  return [];
}

function findTable(root: ParentNode): HTMLTableElement | null {
  const byId = root.querySelector<HTMLTableElement>(`#${SCHEDULE_TABLE_ID}`);
  if (byId) return byId;
  return (
    Array.from(root.querySelectorAll<HTMLTableElement>("table")).find((t) =>
      t.rows[0]?.textContent?.includes(HEADERS.code),
    ) ?? null
  );
}

/**
 * Parses the StudentPeriodSchedule page (live document or a fetched/parsed one). Inbar renders
 * either a GridView table or "cards" (a per-user setting that is the default on phones).
 */
export function parseSchedule(root: ParentNode): Lesson[] {
  const table = findTable(root);
  if (table) return parseTable(table);
  if (root.querySelector(CARD_SELECTOR)) return parseCards(root);
  throw new Error("מערכת השעות לא נמצאה בעמוד");
}

function lesson(fields: {
  day: string;
  time: string;
  course: string;
  code: string;
  period: string;
  lecturer: string;
  room: string;
  type: string;
}): Lesson | null {
  const weekday = WEEKDAYS[fields.day];
  const [start, end] = fields.time.split("-").map((s) => s.trim());
  if (weekday === undefined || !start || !end) return null;
  return {
    weekday,
    start,
    end,
    course: fields.course,
    code: fields.code,
    semesters: parsePeriod(fields.period),
    lecturer: fields.lecturer,
    ...parseRoom(fields.room),
    roomRaw: fields.room,
    type: fields.type,
  };
}

const CARD_SELECTOR = ".RepeaterCard";
const TIME_RANGE = /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/;

/**
 * Card view: `.RepeaterCard` > `.TitleRepeaterField .RepeaterField` (course name), then
 * `.LineRepeaterField .RepeaterField` items of `<span>label</span> value`. Cards label the time
 * "שעות" (the table uses "שעה"), so the time is taken from whichever field looks like HH:MM-HH:MM.
 */
function parseCards(root: ParentNode): Lesson[] {
  const lessons: Lesson[] = [];
  for (const card of Array.from(root.querySelectorAll(CARD_SELECTOR))) {
    const course = card.querySelector(".TitleRepeaterField > .RepeaterField")?.textContent?.trim() ?? "";
    const fields = new Map<string, string>();
    for (const field of Array.from(card.querySelectorAll(".LineRepeaterField .RepeaterField"))) {
      const label = field.querySelector("span")?.textContent?.trim() ?? "";
      const value = (field.textContent ?? "").trim().slice(label.length).trim();
      if (label) fields.set(label, value);
    }
    const time = [...fields.values()].find((v) => TIME_RANGE.test(v)) ?? "";
    const parsed = lesson({
      day: fields.get(HEADERS.day) ?? "",
      time,
      course,
      code: fields.get(HEADERS.code) ?? "",
      period: fields.get(HEADERS.period) ?? "",
      lecturer: fields.get(HEADERS.lecturer) ?? "",
      room: fields.get(HEADERS.room) ?? "",
      type: fields.get(HEADERS.type) ?? "",
    });
    if (parsed) lessons.push(parsed);
  }
  return lessons;
}

function parseTable(table: HTMLTableElement): Lesson[] {
  const header = Array.from(table.rows[0].cells).map((c) => c.textContent?.trim() ?? "");
  const col = Object.fromEntries(
    Object.entries(HEADERS).map(([key, title]) => [key, header.indexOf(title)]),
  ) as Record<keyof typeof HEADERS, number>;
  if (col.day < 0 || col.time < 0 || col.course < 0) {
    throw new Error("מבנה הטבלה ב-Inbar השתנה (עמודות חסרות)");
  }

  const lessons: Lesson[] = [];
  for (const row of Array.from(table.rows).slice(1)) {
    const cell = (i: number) => (i >= 0 ? (row.cells[i]?.textContent?.trim() ?? "") : "");
    const parsed = lesson({
      day: cell(col.day),
      time: cell(col.time),
      course: cell(col.course),
      code: cell(col.code),
      period: cell(col.period),
      lecturer: cell(col.lecturer),
      room: cell(col.room),
      type: cell(col.type),
    });
    if (parsed) lessons.push(parsed);
  }
  return lessons;
}
