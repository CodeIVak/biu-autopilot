export type Platform = "ios" | "android" | "desktop";

export function detectPlatform(nav: Pick<Navigator, "userAgent" | "maxTouchPoints"> = navigator): Platform {
  const ua = nav.userAgent;
  // iPadOS reports a Mac user agent; touch support gives it away.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}
