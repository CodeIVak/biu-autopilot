// Rebuilds src/core/navigation/buildings.json from OpenStreetMap: every campus building whose
// name/ref carries a BIU building number ("507 - בית מורשת ישראל...") → centroid of its outline.
// Data © OpenStreetMap contributors, ODbL. Run: npm run update:buildings
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Main campus, split in two because the OSM API caps bbox area.
const BBOXES = ["34.836,32.063,34.849,32.074", "34.849,32.063,34.856,32.077"];
const OUT = path.resolve("src/core/navigation/buildings.json");

const ENTITIES = { quot: '"', apos: "'", amp: "&", lt: "<", gt: ">" };
const decodeEntities = (s) => s.replace(/&(quot|apos|amp|lt|gt);/g, (_, e) => ENTITIES[e]);

const attrs = (s) => Object.fromEntries([...s.matchAll(/(\w[\w:]*)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

async function fetchBuildings(bbox) {
  const url = `https://api.openstreetmap.org/api/0.6/map?bbox=${bbox}`;
  const res = await fetch(url, { headers: { "User-Agent": "biu-autopilot (student project)" } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const xml = await res.text();

  const nodes = new Map();
  for (const m of xml.matchAll(/<node ([^>]*?)\/?>/g)) {
    const a = attrs(m[1]);
    nodes.set(a.id, [Number(a.lat), Number(a.lon)]);
  }

  const found = [];
  for (const m of xml.matchAll(/<way [^>]*>([\s\S]*?)<\/way>/g)) {
    const tags = Object.fromEntries(
      [...m[1].matchAll(/<tag k="([^"]*)" v="([^"]*)"/g)].map((t) => [t[1], t[2]]),
    );
    if (!tags.building) continue;
    const name = decodeEntities(tags.name ?? "");
    // Either the name starts with a BIU building number ("507 - ...", "401 הספריה"), or it is tagged
    // building=university with the number in ref/addr:housenumber. Other numbered buildings in the
    // bbox are residential houses on the surrounding streets.
    const tagged = [tags.ref, tags["addr:housenumber"]].find((v) => /^\d{3,4}$/.test(v ?? ""));
    const number =
      name.match(/^(\d{3,4})\b/)?.[1] ?? (["university", "college"].includes(tags.building) ? tagged : undefined);
    if (!number) continue;
    const pts = [...m[1].matchAll(/<nd ref="(\d+)"/g)].map((r) => nodes.get(r[1])).filter(Boolean);
    if (pts.length === 0) continue;
    const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    found.push({ number, name, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
  }
  return found;
}

const all = (await Promise.all(BBOXES.map(fetchBuildings))).flat();
const current = JSON.parse(readFileSync(OUT, "utf8"));
const buildings = { ...current.buildings };
for (const b of all.sort((a, b) => Number(a.number) - Number(b.number))) {
  // Entries marked "manual" (e.g. copied from the BIU campus app) win over OSM.
  if (buildings[b.number]?.source === "manual") continue;
  buildings[b.number] = { lat: b.lat, lng: b.lng, name: b.name, source: "osm" };
}

writeFileSync(OUT, JSON.stringify({ ...current, buildings }, null, 2) + "\n");
console.log(`Saved ${Object.keys(buildings).length} buildings to ${OUT}`);
