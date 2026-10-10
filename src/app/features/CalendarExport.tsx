import { CalendarPlus } from "lucide-react";
import { buildIcs } from "@/core/calendar/buildIcs";
import type { AcademicYear, Lesson, NavApp } from "@/core/types";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import type { Settings } from "@/app/hooks/useSchedule";

const REMINDERS = [15, 30, 45, 60];

function download(ics: string, filename: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

interface Props {
  lessons: Lesson[];
  academicYear: AcademicYear;
  year: number;
  settings: Settings;
  onSettings: (s: Settings) => void;
}

export function CalendarExport({ lessons, academicYear, year, settings, onSettings }: Props) {
  const exportIcs = () =>
    download(
      buildIcs(lessons, academicYear, { year, reminderMinutes: settings.reminderMinutes, navApp: settings.navApp }),
      `biu-schedule-${year}.ics`,
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>הוספה ליומן</CardTitle>
        <CardDescription>כל השיעורים לכל השנה, בלי חגים וחופשות, עם תזכורת וקישור ניווט.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-sm">
            <span className="text-muted-foreground">תזכורת</span>
            <Select
              dir="rtl"
              value={String(settings.reminderMinutes)}
              onValueChange={(v) => onSettings({ ...settings, reminderMinutes: Number(v) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDERS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} דק' לפני
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="text-muted-foreground">אפליקציית ניווט</span>
            <Select
              dir="rtl"
              value={settings.navApp}
              onValueChange={(v) => onSettings({ ...settings, navApp: v as NavApp })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waze">Waze</SelectItem>
                <SelectItem value="gmaps">Google Maps</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <Button onClick={exportIcs} size="lg" variant="secondary" className="w-full">
          <CalendarPlus />
          הורדת קובץ יומן (.ics)
        </Button>
      </CardContent>
    </Card>
  );
}
