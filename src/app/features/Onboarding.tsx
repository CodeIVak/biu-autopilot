import { useMemo, useState } from "react";
import { BookmarkPlus, Check, Copy, LogIn, MousePointerClick } from "lucide-react";
import bookmarkletSource from "@/bookmarklet/dist/bookmarklet.js?raw";
import { LOGIN_URL } from "@/core/inbar/fetchSchedule";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

/** javascript: URL of the bookmarklet, pointing back at wherever this app is served from. */
function useBookmarklet(): string {
  return useMemo(() => {
    const appUrl = location.origin + location.pathname;
    return "javascript:" + encodeURIComponent(bookmarkletSource.replace("__APP_URL__", appUrl));
  }, []);
}

const STEPS = [
  {
    icon: BookmarkPlus,
    title: "שמרו סימנייה",
    text: "העתיקו את הקוד, הוסיפו סימנייה לעמוד הזה, ערכו אותה והחליפו את הכתובת בקוד. בשם הסימנייה כתבו: אוטו-פיילוט. (הדבקה ישירה בשורת הכתובת לא עובדת.)",
  },
  { icon: LogIn, title: "התחברו ל-Inbar", text: "פתחו את Inbar והתחברו כרגיל עם המשתמש שלכם." },
  {
    icon: MousePointerClick,
    title: "הפעילו את הסימנייה",
    text: "מתוך Inbar פתחו את הסימנייה (באנדרואיד: הקלידו 'אוטו-פיילוט' בשורת הכתובת ובחרו בה). מערכת השעות תגיע לכאן.",
  },
];

export function Onboarding({ compact = false }: { compact?: boolean }) {
  const href = useBookmarklet();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{compact ? "עדכון מערכת שעות" : "בואו נתחיל"}</CardTitle>
        <CardDescription>הנתונים נשמרים רק במכשיר שלכם. שום דבר לא נשלח לשרת.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!compact && (
          <ol className="space-y-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-3">
                <span className="bg-secondary flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="font-medium">
                    {i + 1}. {title}
                  </p>
                  <p className="text-muted-foreground text-sm">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={copy} size="lg">
            {copied ? <Check /> : <Copy />}
            {copied ? "הועתק!" : "העתקת קוד הסימנייה"}
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={LOGIN_URL} target="_blank" rel="noreferrer">
              <LogIn />
              פתיחת Inbar
            </a>
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          במחשב אפשר פשוט לגרור את הכפתור הזה לסרגל הסימניות:{" "}
          {/* React 19 blocks javascript: hrefs, so the attribute is set imperatively. */}
          <a
            ref={(el) => el?.setAttribute("href", href)}
            className="text-foreground font-medium underline"
            onClick={(e) => e.preventDefault()}
          >
            ⭐ אוטו-פיילוט
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
