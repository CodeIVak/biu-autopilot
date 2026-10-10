/** 0 = Sunday ... 6 = Saturday (same as Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SemesterKey = "A" | "B" | "SUMMER";

/** A weekly recurring class session, as listed in Inbar's StudentPeriodSchedule. */
export interface Lesson {
  weekday: Weekday;
  /** "HH:MM" local Israel time. */
  start: string;
  end: string;
  course: string;
  /** Inbar course-group code, e.g. "88775-01". */
  code: string;
  semesters: SemesterKey[];
  lecturer: string;
  /** Campus area prefix from the room cell, e.g. "מ.ישראל". */
  area: string | null;
  /** Building number, e.g. "507". */
  building: string | null;
  room: string | null;
  /** Original room cell text, kept for display when parsing fails. */
  roomRaw: string;
  /** "הרצאה" / "תרגיל" ... */
  type: string;
}

/** Payload transferred from the bookmarklet to the app. */
export interface SchedulePayload {
  v: 1;
  /** Inbar academic year (cmbActiveYear), e.g. 2027 = תשפ"ז. */
  year: number;
  fetchedAt: string;
  lessons: Lesson[];
}

/** "YYYY-MM-DD". */
export type IsoDate = string;

export interface DateRange {
  start: IsoDate;
  /** Inclusive. */
  end: IsoDate;
}

export interface AcademicYear {
  semesters: Partial<Record<SemesterKey, DateRange>>;
  /** Every date with no classes (holidays, vacations), expanded day by day. */
  noClassDays: Set<IsoDate>;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type NavApp = "waze" | "gmaps";
