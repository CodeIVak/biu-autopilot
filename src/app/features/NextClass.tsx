import { Clock, MapPin, Navigation } from "lucide-react";
import { navigationUrl, placeLabel } from "@/core/navigation/links";
import type { Occurrence } from "@/core/schedule/occurrences";
import type { NavApp } from "@/core/types";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { formatDate, relativeTime } from "@/app/lib/format";

const APP_LABEL: Record<NavApp, string> = { waze: "Waze", gmaps: "Google Maps" };

export function NextClass({ next, now, navApp }: { next: Occurrence | null; now: Date; navApp: NavApp }) {
  if (!next) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-center">אין שיעורים קרובים בסמסטר הזה 🎉</CardContent>
      </Card>
    );
  }

  const { lesson, startsAt } = next;
  const inProgress = startsAt <= now;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{inProgress ? "מתקיים עכשיו" : "השיעור הבא"}</span>
          <Badge variant={inProgress ? "default" : "secondary"}>{relativeTime(startsAt, now)}</Badge>
        </div>
        <CardTitle className="text-2xl leading-tight">{lesson.course}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-muted-foreground space-y-1.5 text-sm">
          <p className="flex items-center gap-2">
            <Clock className="size-4" />
            {formatDate(startsAt)} · {lesson.start}–{lesson.end}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            {placeLabel(lesson)} · {lesson.type}
          </p>
        </div>
        <Button asChild size="lg" className="bg-waze text-waze-foreground hover:bg-waze/90 h-14 w-full text-lg">
          <a href={navigationUrl(lesson.building, navApp)} target="_blank" rel="noreferrer">
            <Navigation className="size-5" />
            ניווט ב-{APP_LABEL[navApp]}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
