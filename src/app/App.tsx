import { useMemo } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { availableYears } from "@/core/academic";
import { LOGIN_URL } from "@/core/inbar/fetchSchedule";
import { localToday } from "@/core/dates";
import { currentSemester, nextOccurrence } from "@/core/schedule/occurrences";
import type { Weekday } from "@/core/types";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { CalendarExport } from "@/app/features/CalendarExport";
import { NextClass } from "@/app/features/NextClass";
import { Onboarding } from "@/app/features/Onboarding";
import { WeekView } from "@/app/features/WeekView";
import { useNow } from "@/app/hooks/useNow";
import { useSchedule } from "@/app/hooks/useSchedule";

function Notice({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "error" }) {
  return (
    <Card className={tone === "error" ? "border-destructive/50" : ""}>
      <CardContent className={`text-sm ${tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>
        {children}
      </CardContent>
    </Card>
  );
}

export default function App() {
  const { payload, lessons, academicYear, settings, setSettings, clear, importError, justImported } = useSchedule();
  const now = useNow();
  const next = useMemo(
    () => (academicYear ? nextOccurrence(lessons, academicYear, now) : null),
    [lessons, academicYear, now],
  );
  const semester = academicYear ? currentSemester(academicYear, localToday(now)) : null;
  const semesterLessons = lessons.filter((l) => semester && l.semesters.includes(semester));

  return (
    <main className="mx-auto min-h-dvh max-w-md space-y-4 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">אוטו-פיילוט · בר-אילן</h1>
        {payload && <span className="text-muted-foreground text-xs">{lessons.length} שיעורים</span>}
      </header>

      {importError && <Notice tone="error">{importError}</Notice>}
      {justImported && <Notice>✓ מערכת השעות עודכנה מ-Inbar</Notice>}

      {!payload ? (
        <Onboarding />
      ) : !academicYear ? (
        <Notice tone="error">
          אין לוח שנה אקדמי לשנת {payload.year} (קיימים: {availableYears().join(", ")}). צריך לעדכן את האפליקציה.
        </Notice>
      ) : (
        <>
          <NextClass next={next} now={now} navApp={settings.navApp} />
          <WeekView lessons={semesterLessons} today={now.getDay() as Weekday} navApp={settings.navApp} />
          <CalendarExport
            lessons={lessons}
            academicYear={academicYear}
            year={payload.year}
            settings={settings}
            onSettings={setSettings}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <a href={LOGIN_URL} target="_blank" rel="noreferrer">
                <RefreshCw />
                רענון מ-Inbar
              </a>
            </Button>
            <Button variant="ghost" className="text-destructive" onClick={() => confirm("למחוק את הנתונים מהמכשיר?") && clear()}>
              <Trash2 />
              מחיקת נתונים
            </Button>
          </div>
          <details className="text-muted-foreground text-sm">
            <summary className="cursor-pointer">קוד הסימנייה</summary>
            <div className="mt-3">
              <Onboarding compact />
            </div>
          </details>
        </>
      )}
    </main>
  );
}
