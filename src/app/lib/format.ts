import type { Weekday } from "@/core/types";

export const DAY_NAMES: Record<Weekday, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
  5: "שישי",
  6: "שבת",
};

export const DAY_SHORT: Record<Weekday, string> = { 0: "א'", 1: "ב'", 2: "ג'", 3: "ד'", 4: "ה'", 5: "ו'", 6: "ש'" };

/** "בעוד 25 דקות" / "בעוד 3 שעות" / "עכשיו". */
export function relativeTime(target: Date, now: Date): string {
  const min = Math.round((target.getTime() - now.getTime()) / 60_000);
  if (min <= 0) return "עכשיו";
  if (min < 60) return `בעוד ${min} דק'`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `בעוד ${hours} שע'`;
  const days = Math.round(hours / 24);
  return days === 1 ? "מחר" : `בעוד ${days} ימים`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" });
}
