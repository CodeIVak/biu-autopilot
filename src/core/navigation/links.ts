import type { Coordinates, Lesson, NavApp } from "../types";
import data from "./buildings.json";

const BUILDINGS: Record<string, Coordinates> = data.buildings;

export function buildingCoordinates(building: string | null): Coordinates | null {
  return (building && BUILDINGS[building]) || null;
}

export function placeLabel(lesson: Pick<Lesson, "building" | "room" | "roomRaw">): string {
  if (!lesson.building) return lesson.roomRaw || "אוניברסיטת בר-אילן";
  return `בניין ${lesson.building}${lesson.room ? `, חדר ${lesson.room}` : ""}`;
}

/** Text query used when a building has no known coordinates. */
export function searchQuery(building: string | null): string {
  return building ? `אוניברסיטת בר-אילן בניין ${building}` : "אוניברסיטת בר-אילן";
}

export function navigationUrl(building: string | null, app: NavApp): string {
  const c = buildingCoordinates(building);
  if (app === "waze") {
    return c
      ? `https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(searchQuery(building))}&navigate=yes`;
  }
  const dest = c ? `${c.lat},${c.lng}` : encodeURIComponent(searchQuery(building));
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}
