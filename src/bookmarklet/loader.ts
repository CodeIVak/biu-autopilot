/** File name under which the app build publishes the bookmarklet code (see vite.config.ts). */
export const BOOKMARKLET_FILE = "bookmarklet.js";

/** URL of the hosted bookmarklet script for an app served at `appUrl` (origin + path). */
export function bookmarkletScriptUrl(appUrl: string): string {
  return new URL(BOOKMARKLET_FILE, appUrl).href;
}

/**
 * The short javascript: URL users save as a bookmark. It only injects the hosted script, so the
 * scraper can be fixed or updated without anyone re-saving their bookmark. The timestamp
 * bypasses caches. Inbar sends no Content-Security-Policy, so the external script is allowed.
 */
export function bookmarkletLoader(appUrl: string): string {
  const src = JSON.stringify(bookmarkletScriptUrl(appUrl));
  return `javascript:(function(){var s=document.createElement('script');s.src=${src}+'?t='+Date.now();document.body.appendChild(s)})();`;
}

/** Code for an iOS Shortcuts "Run JavaScript on Web Page" action (same loader + completion). */
export function shortcutScript(appUrl: string): string {
  const src = JSON.stringify(bookmarkletScriptUrl(appUrl));
  return `var s=document.createElement('script');s.src=${src}+'?t='+Date.now();document.body.appendChild(s);completion(true);`;
}
