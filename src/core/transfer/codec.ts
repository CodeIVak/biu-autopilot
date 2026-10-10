import type { SchedulePayload } from "../types";

/** The bookmarklet hands data to the app in the URL fragment: it never reaches any server. */
export const HASH_KEY = "import";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodePayload(p: SchedulePayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(p)));
}

export function decodePayload(s: string): SchedulePayload {
  const p = JSON.parse(new TextDecoder().decode(fromBase64Url(s)));
  if (p?.v !== 1 || !Array.isArray(p.lessons)) throw new Error("קישור ייבוא לא תקין");
  return p;
}

export function readHashPayload(hash: string): SchedulePayload | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get(HASH_KEY);
  return value ? decodePayload(value) : null;
}
