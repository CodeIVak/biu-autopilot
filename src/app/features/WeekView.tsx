import { Navigation } from "lucide-react";
import { navigationUrl, placeLabel } from "@/core/navigation/links";
import type { Lesson, NavApp, Weekday } from "@/core/types";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { DAY_NAMES, DAY_SHORT } from "@/app/lib/format";

const WEEK: Weekday[] = [0, 1, 2, 3, 4, 5];

/** Weekly timetable for the current semester, one tab per weekday. */
export function WeekView({ lessons, today, navApp }: { lessons: Lesson[]; today: Weekday; navApp: NavApp }) {
  const days = WEEK.filter((d) => lessons.some((l) => l.weekday === d));
  if (days.length === 0) return null;
  const initial = days.includes(today) ? today : days[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>מערכת שבועית</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={String(initial)} dir="rtl">
          <TabsList className="w-full">
            {days.map((d) => (
              <TabsTrigger key={d} value={String(d)}>
                {DAY_SHORT[d]}
              </TabsTrigger>
            ))}
          </TabsList>
          {days.map((d) => (
            <TabsContent key={d} value={String(d)} className="mt-3 space-y-2">
              <p className="text-muted-foreground text-sm">יום {DAY_NAMES[d]}</p>
              {lessons
                .filter((l) => l.weekday === d)
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((l) => (
                  <div key={`${l.code}-${l.start}`} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="w-12 shrink-0 text-center text-sm tabular-nums">
                      <div className="font-semibold">{l.start}</div>
                      <div className="text-muted-foreground">{l.end}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.course}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {[placeLabel(l), l.type].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Button asChild size="icon" variant="ghost" aria-label="ניווט">
                      <a href={navigationUrl(l.building, navApp)} target="_blank" rel="noreferrer">
                        <Navigation />
                      </a>
                    </Button>
                  </div>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
