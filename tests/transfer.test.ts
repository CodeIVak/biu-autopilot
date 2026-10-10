import { describe, expect, it } from "vitest";
import { buildingCoordinates, navigationUrl } from "@/core/navigation/links";
import { encodePayload, readHashPayload } from "@/core/transfer/codec";
import type { SchedulePayload } from "@/core/types";

describe("transfer codec", () => {
  it("round-trips payloads through the URL hash", () => {
    const p: SchedulePayload = {
      v: 1,
      year: 2027,
      fetchedAt: "2026-10-10T00:00:00Z",
      lessons: [],
    };
    const hash = `#import=${encodePayload(p)}`;
    expect(hash).not.toMatch(/[+/=]$/);
    expect(readHashPayload(hash)).toEqual(p);
    expect(readHashPayload("#other=1")).toBeNull();
  });
});

describe("navigationUrl", () => {
  it("navigates from the current location to known building coordinates", () => {
    const c = buildingCoordinates("507")!;
    expect(c.lat).toBeCloseTo(32.071, 2); // Bar-Ilan campus
    expect(c.lng).toBeCloseTo(34.844, 2);
    expect(navigationUrl("507", "waze")).toBe(`https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`);
    expect(navigationUrl("507", "gmaps")).toBe(`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`);
  });
  it("has every building on campus", () => {
    for (const b of ["403", "404", "507", "604"]) {
      const c = buildingCoordinates(b)!;
      expect(c.lat).toBeGreaterThan(32.06);
      expect(c.lat).toBeLessThan(32.08);
      expect(c.lng).toBeGreaterThan(34.83);
      expect(c.lng).toBeLessThan(34.86);
    }
  });
  it("falls back to a name search when coordinates are unknown", () => {
    expect(navigationUrl("999", "waze")).toBe(
      `https://waze.com/ul?q=${encodeURIComponent("אוניברסיטת בר-אילן בניין 999")}&navigate=yes`,
    );
    expect(navigationUrl("999", "gmaps")).toContain("https://www.google.com/maps/dir/?api=1&destination=");
  });
});
