import type { SchedulePayload } from "../types";
import { parseSchedule } from "./parseSchedule";

export const INBAR_ORIGIN = "https://inbar.biu.ac.il";
export const SCHEDULE_URL = `${INBAR_ORIGIN}/Live/StudentPeriodSchedule.aspx`;
export const LOGIN_URL = `${INBAR_ORIGIN}/live/Login.aspx`;

const PERIOD_FILTER = "ctl00$tbMain$ctl03$ddlPeriodTypeFilter2";
const YEAR_SELECT = "ctl00$cmbActiveYear";
/** Value of "כל הסמסטרים" in the period filter. */
const ALL_SEMESTERS = "5";

export class NotLoggedInError extends Error {
  constructor() {
    super("לא מחובר ל-Inbar");
  }
}

async function getDocument(res: Response): Promise<Document> {
  if (/login\.aspx/i.test(res.url)) throw new NotLoggedInError();
  const doc = new DOMParser().parseFromString(await res.text(), "text/html");
  if (!doc.forms[0]) throw new NotLoggedInError();
  return doc;
}

/**
 * Fetches the whole-year timetable. Must run same-origin on inbar.biu.ac.il (e.g. from the
 * bookmarklet), because it relies on the logged-in session's HttpOnly cookies.
 *
 * Inbar is ASP.NET WebForms: changing the semester filter is a full-form postback, so we
 * GET the page, then re-POST its own form with the filter set to "all semesters".
 */
export async function fetchSchedule(): Promise<SchedulePayload> {
  const page = await getDocument(await fetch(SCHEDULE_URL, { credentials: "include" }));
  const form = page.forms[0];

  const body = new URLSearchParams();
  for (const el of Array.from(form.elements) as HTMLInputElement[]) {
    if (!el.name || el.disabled) continue;
    if ((el.type === "submit" || el.type === "button" || el.type === "image")) continue;
    if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
    body.append(el.name, el.value);
  }
  body.set(PERIOD_FILTER, ALL_SEMESTERS);
  body.set("__EVENTTARGET", PERIOD_FILTER);
  body.set("__EVENTARGUMENT", "");

  const full = await getDocument(
    await fetch(SCHEDULE_URL, { method: "POST", body, credentials: "include" }),
  );
  const year = Number((full.querySelector(`[name="${YEAR_SELECT}"]`) as HTMLSelectElement | null)?.value);

  return {
    v: 1,
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    fetchedAt: new Date().toISOString(),
    lessons: parseSchedule(full),
  };
}
