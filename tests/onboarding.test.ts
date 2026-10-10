import { describe, expect, it } from "vitest";
import { bookmarkletLoader, bookmarkletScriptUrl, shortcutScript } from "@/bookmarklet/loader";
import { detectPlatform } from "@/app/lib/platform";

const APP = "https://biu-autopilot.example.dev/";

describe("bookmarklet loader", () => {
  it("is a short javascript: URL that injects the hosted script", () => {
    const loader = bookmarkletLoader(APP);
    expect(loader.startsWith("javascript:")).toBe(true);
    expect(loader).toContain('"https://biu-autopilot.example.dev/bookmarklet.js"');
    expect(loader.length).toBeLessThan(200);
  });
  it("resolves the script next to the app, including sub-paths", () => {
    expect(bookmarkletScriptUrl("https://host/app/")).toBe("https://host/app/bookmarklet.js");
    expect(bookmarkletScriptUrl("https://host/app/index.html")).toBe("https://host/app/bookmarklet.js");
  });
  it("runs in the page and injects the script", () => {
    const loader = bookmarkletLoader(APP);
    new Function(decodeURIComponent(loader.slice("javascript:".length)))();
    const script = document.querySelector<HTMLScriptElement>('script[src^="https://biu-autopilot.example.dev/bookmarklet.js?t="]');
    expect(script).not.toBeNull();
  });
  it("gives iOS Shortcuts the same loader plus completion()", () => {
    expect(shortcutScript(APP)).toMatch(/bookmarklet\.js.*completion\(true\);$/);
  });
});

describe("detectPlatform", () => {
  const nav = (userAgent: string, maxTouchPoints = 0) => ({ userAgent, maxTouchPoints });
  it("detects iPhone, iPadOS, Android and desktop", () => {
    expect(detectPlatform(nav("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"))).toBe("ios");
    expect(detectPlatform(nav("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5))).toBe("ios");
    expect(detectPlatform(nav("Mozilla/5.0 (Linux; Android 15; Pixel 9)"))).toBe("android");
    expect(detectPlatform(nav("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"))).toBe("desktop");
    expect(detectPlatform(nav("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0))).toBe("desktop");
  });
});
