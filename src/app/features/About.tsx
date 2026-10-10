import { Coffee, Mail, MessageSquare, UserPlus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { DEVELOPER, DONATE_URL, FEEDBACK_FORM_URL, feedbackMailto } from "@/app/config";

/** Feedback call-to-action, developer credit and optional donation link. */
export function About() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>משוב והצעות לשיפור</CardTitle>
        <CardDescription>
          הכלי נמצא בפיתוח מתמשך. נשמח לקבל משוב על חוויית השימוש, דיווח על תקלות והצעות לפיצ'רים חדשים.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button asChild size="lg" className="w-full">
          <a href={FEEDBACK_FORM_URL || feedbackMailto} target="_blank" rel="noreferrer">
            <MessageSquare />
            {FEEDBACK_FORM_URL ? "מילוי סקר משוב (כ-2 דקות)" : "שליחת משוב"}
          </a>
        </Button>
        {DEVELOPER.linkedin && (
          <Button asChild size="lg" variant="outline" className="w-full">
            <a href={DEVELOPER.linkedin} target="_blank" rel="noreferrer">
              <UserPlus />
              ליצירת קשר ב-LinkedIn
            </a>
          </Button>
        )}
        {DONATE_URL && (
          <Button asChild size="lg" variant="ghost" className="w-full">
            <a href={DONATE_URL} target="_blank" rel="noreferrer">
              <Coffee />
              תמיכה בפרויקט
            </a>
          </Button>
        )}
        <p className="text-muted-foreground pt-1 text-center text-xs">
          פיתוח: {DEVELOPER.nameHe} ({DEVELOPER.name}) ·{" "}
          <a href={`mailto:${DEVELOPER.email}`} className="inline-flex items-center gap-1 underline">
            <Mail className="size-3" />
            {DEVELOPER.email}
          </a>
          <br />
          פרויקט עצמאי, ללא קשר רשמי לאוניברסיטת בר-אילן · נתוני מפה © OpenStreetMap
        </p>
      </CardContent>
    </Card>
  );
}
