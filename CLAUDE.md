# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The user writes in Hebrew. Answer in Hebrew unless asked otherwise. Keep code, identifiers, and commit messages in English. User-facing docs live in `docs/GUIDE.md` (Hebrew).

## What this is

"Auto-pilot to class" for Bar-Ilan University students. It is a **local-only PWA**: no backend and no cloud, and data stays in the phone's `localStorage`. A bookmarklet run on the logged-in Inbar site scrapes the student's timetable and hands it to the app through the URL fragment (`#import=<base64url JSON>`). The app shows the next class with a Waze/Google Maps deep link (navigation starts from the phone's current location) and exports a full-year `.ics`: weekly RRULE per lesson per semester, holidays as EXDATE, VALARM, and the navigation URL. The automatic trigger on the phone is the calendar alert, or iOS Shortcuts / Android Tasker reading that calendar.

This project follows on from https://github.com/CodeIVak/Moodle_Downloader_Extension. That extension uses the same idea: scrape the logged-in DOM and never store credentials.

## Commands

```bash
npm run dev                 # builds the bookmarklet first, then Vite dev server
npm test                    # Vitest (happy-dom), all tests
npx vitest run tests/calendar.test.ts      # one file
npx vitest run -t "excludes holidays"      # one test by name
npm run typecheck           # tsc -b (TypeScript 7: no baseUrl in tsconfig)
npm run build               # bookmarklet → tsc → vite build → dist/ (static, base "./")
npm run update:calendar     # re-download BIU academic calendar → src/core/academic/data/<year>.ics
npm run update:buildings    # rebuild src/core/navigation/buildings.json from OpenStreetMap
```

The app imports `src/bookmarklet/dist/bookmarklet.js?raw`, which is a build artifact (gitignored). Run `npm run build:bookmarklet` (or `dev`/`build`) before typecheck or tests touch the app.

## Architecture

- `src/core/`: pure TS with no React. All logic and all tests live here. `types.ts` holds the shared model (`Lesson`, `AcademicYear`, `SchedulePayload`).
  - `inbar/parseSchedule.ts` parses the GridView `#ContentPlaceHolder1_PeriodScheduleA_gvPeriodSchedule`. Columns are located **by header text**. Room format `מ.ישראל-507 - 102` → area/building/room.
  - `inbar/fetchSchedule.ts` runs same-origin on inbar.biu.ac.il (it needs the HttpOnly session cookies). It GETs `StudentPeriodSchedule.aspx`, then re-POSTs that page's own WebForms form with `ctl00$tbMain$ctl03$ddlPeriodTypeFilter2=5` ("all semesters") and `__EVENTTARGET` set to it. ViewState is server-side (`__PageDataKey`), so the form fields must be echoed back.
  - `academic/` parses BIU's academic-year iCal (a `data:` link on biu.ac.il/academic-year, snapshotted into `data/<inbarYear>.ics` and loaded with `import.meta.glob`). Semester ranges and no-class days are matched by Hebrew SUMMARY regexes in `academicYear.ts`. Fasts "אין לקיים בחינות" are deliberately **not** no-class days. Partial-day breaks exist only as free text and are ignored.
  - `schedule/occurrences.ts`: `lessonDates` is the single source of truth for which dates a lesson meets. Both `nextOccurrence` (UI) and `buildIcs` (EXDATE = weekly dates missing from `lessonDates`) build on it.
  - `navigation/`: `buildings.json` (BIU number → OSM centroid; entries with `"source": "manual"` survive regeneration) and the Waze/Google deep links. A building without coordinates falls back to a name search.
  - `transfer/codec.ts`: base64url payload in the URL hash.
- `src/bookmarklet/main.ts` is built by `vite.bookmarklet.config.ts` into one IIFE. The app substitutes `__APP_URL__` with its own origin+path at runtime, so the bookmarklet always points back to wherever the app is hosted. React 19 blocks `javascript:` hrefs, so the drag-to-bookmarks link sets `href` through a ref.
- `src/app/`: React UI. `components/ui/*` come from the shadcn CLI (`components.json`, aliases under `@/app/...`). `hooks/useSchedule.ts` owns all state (localStorage + hash import, then clears the hash). The features are `Onboarding`, `NextClass`, `WeekView`, `CalendarExport`.

## Facts verified against live systems (2026-10)

- Inbar year select `ctl00$cmbActiveYear`: `2027` = תשפ"ז. Semester filter values: `1` = A, `2` = B, `3` = summer, `5` = all.
- Pasting a `javascript:` URL into the address bar does not work, because browsers strip the prefix. The bookmarklet must be saved as a bookmark.
- OSM tags BIU buildings either as name "507 - ..." or as `building=university` + `addr:housenumber`. Building 505 is not in OSM.
- `data/schedule-sample.json` holds a real student's timetable. It is gitignored; never commit it or use it as a test fixture (the fixtures in `tests/fixtures/` are synthetic).
