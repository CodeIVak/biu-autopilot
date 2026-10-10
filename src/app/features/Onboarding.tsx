import { useMemo, useState } from "react";
import { Check, Copy, LogIn, TriangleAlert, Zap } from "lucide-react";
import bookmarkletSource from "@/bookmarklet/dist/bookmarklet.js?raw";
import { bookmarkletLoader } from "@/bookmarklet/loader";
import { LOGIN_URL } from "@/core/inbar/fetchSchedule";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { IOS_SHORTCUT_URL } from "@/app/config";
import { detectPlatform, type Platform } from "@/app/lib/platform";

/**
 * The bookmark to save. Over https it is a short loader that pulls the hosted script (so fixes
 * reach users without re-saving); on local http dev Inbar would block mixed content, so the
 * whole script is inlined instead.
 */
function useBookmarklet(): string {
  return useMemo(() => {
    const appUrl = location.origin + location.pathname;
    if (location.protocol === "https:") return bookmarkletLoader(appUrl);
    return "javascript:" + encodeURIComponent(bookmarkletSource.replace("__APP_URL__", appUrl));
  }, []);
}

type Step = { title: string; text: string };

const STEPS: Record<Platform, Step[]> = {
  ios: [
    { title: "מעתיקים את הקוד", text: "לוחצים על הכפתור למטה." },
    { title: "שומרים סימנייה", text: "ב-Safari: כפתור השיתוף ← \"הוספת סימנייה\" ← שמירה." },
    {
      title: "עורכים אותה",
      text: "סמל הספר ← \"עריכה\" ← בוחרים את הסימנייה החדשה. בשם כותבים אוטו-פיילוט, ובכתובת מוחקים הכל ומדביקים את הקוד.",
    },
    { title: "מפעילים מתוך Inbar", text: "מתחברים ל-Inbar ← סמל הספר ← אוטו-פיילוט. מערכת השעות תגיע לכאן." },
  ],
  android: [
    { title: "מעתיקים את הקוד", text: "לוחצים על הכפתור למטה." },
    { title: "שומרים סימנייה", text: "ב-Chrome: תפריט ⋮ ← סמל הכוכב ← \"עריכה\" בהודעה שמופיעה למטה." },
    { title: "עורכים אותה", text: "בשם כותבים אוטו-פיילוט, ובכתובת מוחקים הכל ומדביקים את הקוד." },
    {
      title: "מפעילים מתוך Inbar",
      text: "מתחברים ל-Inbar, מקלידים אוטו-פיילוט בשורת הכתובת ובוחרים בשורה עם סמל הכוכב (לא בהצעת החיפוש).",
    },
  ],
  desktop: [
    {
      title: "גוררים את הכפתור לסרגל הסימניות",
      text: "את הכפתור \"אוטו-פיילוט\" שלמטה גוררים לסרגל הסימניות. אם הסרגל לא מוצג: Ctrl+Shift+B (או Cmd+Shift+B במק).",
    },
    { title: "מפעילים מתוך Inbar", text: "מתחברים ל-Inbar ולוחצים על הסימנייה. מערכת השעות תגיע לכאן." },
  ],
};

const LABEL: Record<Platform, string> = { ios: "אייפון", android: "אנדרואיד", desktop: "מחשב" };

export function Onboarding({ compact = false }: { compact?: boolean }) {
  const href = useBookmarklet();
  const detected = useMemo(() => detectPlatform(), []);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const copyButton = (
    <Button onClick={copy} size="lg" className="w-full">
      {copied ? <Check /> : <Copy />}
      {copied ? "הקוד הועתק" : "העתקת קוד הסימנייה"}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{compact ? "עדכון מערכת שעות" : "הגדרה ראשונית"}</CardTitle>
        <CardDescription>פעם אחת בלבד. הנתונים נשמרים רק במכשיר שלך, ושום דבר לא נשלח לשרת.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue={detected} dir="rtl">
          <TabsList className="w-full">
            {(Object.keys(STEPS) as Platform[]).map((p) => (
              <TabsTrigger key={p} value={p}>
                {LABEL[p]}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(STEPS) as Platform[]).map((p) => (
            <TabsContent key={p} value={p} className="mt-4 space-y-4">
              {p === "ios" && IOS_SHORTCUT_URL && (
                <div className="bg-secondary space-y-2 rounded-lg p-3">
                  <p className="text-sm font-medium">הדרך המהירה: קיצור לאייפון</p>
                  <Button asChild size="lg" className="w-full">
                    <a href={IOS_SHORTCUT_URL} target="_blank" rel="noreferrer">
                      <Zap />
                      התקנת הקיצור
                    </a>
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    אחרי ההתקנה: מתחברים ל-Inbar ← כפתור השיתוף ← אוטו-פיילוט. או ממשיכים עם הסימנייה שלמטה.
                  </p>
                </div>
              )}

              <ol className="space-y-3">
                {STEPS[p].map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-muted-foreground text-sm">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {p === "desktop" ? (
                <div className="flex justify-center">
                  {/* React 19 blocks javascript: hrefs, so the attribute is set imperatively. */}
                  <a
                    ref={(el) => el?.setAttribute("href", href)}
                    onClick={(e) => e.preventDefault()}
                    className="bg-primary text-primary-foreground cursor-grab rounded-md px-5 py-2.5 text-sm font-medium shadow"
                    title="גוררים אותי לסרגל הסימניות"
                  >
                    אוטו-פיילוט
                  </a>
                </div>
              ) : (
                <>
                  {copyButton}
                  <input
                    readOnly
                    dir="ltr"
                    value={href}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label="קוד הסימנייה"
                    className="bg-muted text-muted-foreground w-full truncate rounded-md border px-3 py-2 font-mono text-xs"
                  />
                  <p className="text-muted-foreground flex items-start gap-2 text-xs">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                    לא מדביקים את הקוד בשורת הכתובת: הדפדפן יחפש אותו בגוגל. מדביקים אותו רק בשדה הכתובת של הסימנייה.
                  </p>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <Button asChild variant="outline" size="lg" className="w-full">
          <a href={LOGIN_URL} target="_blank" rel="noreferrer">
            <LogIn />
            פתיחת Inbar
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
