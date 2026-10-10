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

/** Parses the StudentPeriodSchedule page (live document or a fetched/parsed one). */
export function parseSchedule(root: ParentNode): Lesson[] {
  const table = findTable(root);
  if (!table) throw new Error("טבלת מערכת השעות לא נמצאה בעמוד");

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
    const weekday = WEEKDAYS[cell(col.day)];
    const [start, end] = cell(col.time).split("-").map((s) => s.trim());
    if (weekday === undefined || !start || !end) continue;
    const roomRaw = cell(col.room);
    lessons.push({
      weekday,
      start,
      end,
      course: cell(col.course),
      code: cell(col.code),
      semesters: parsePeriod(cell(col.period)),
      lecturer: cell(col.lecturer),
      ...parseRoom(roomRaw),
      roomRaw,
      type: cell(col.type),
    });
  }
  return lessons;
}
