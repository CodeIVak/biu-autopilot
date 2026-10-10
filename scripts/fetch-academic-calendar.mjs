// Downloads BIU's academic-year calendar (the "הורידו ליומן" link on biu.ac.il/academic-year)
// and stores it as src/core/academic/data/<inbar-year>.ics. Run once a year: npm run update:calendar
import { writeFileSync } from "node:fs";
import path from "node:path";

const PAGE = "https://www.biu.ac.il/academic-year";

const html = await (await fetch(PAGE, { headers: { "User-Agent": "biu-autopilot" } })).text();
const links = [...html.matchAll(/href="data:text\/calendar;charset=utf8;base64,([^"]+)"/g)];
if (links.length === 0) throw new Error(`No calendar link found on ${PAGE}`);

for (const [, b64] of links) {
  const ics = Buffer.from(decodeURIComponent(b64), "base64").toString("utf8");
  // Inbar names a year by the calendar year it ends in: the last day of semester B.
  const end = ics.match(/SUMMARY:יום אחרון ללימודים בסמסטר ב'[\s\S]*?DTSTART;VALUE=DATE:(\d{4})/)
    ?? ics.match(/DTSTART;VALUE=DATE:(\d{4})\d{4}(?![\s\S]*DTSTART)/);
  if (!end) throw new Error("Could not determine the academic year from the feed");
  const file = path.resolve("src/core/academic/data", `${end[1]}.ics`);
  writeFileSync(file, ics);
  console.log(`Saved ${file} (${(ics.match(/BEGIN:VEVENT/g) ?? []).length} events)`);
}
