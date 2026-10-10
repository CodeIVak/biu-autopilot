import { useEffect, useMemo, useState } from "react";
import { getAcademicYear } from "@/core/academic";
import { readHashPayload } from "@/core/transfer/codec";
import type { NavApp, SchedulePayload } from "@/core/types";
import { useLocalStorage } from "./useLocalStorage";

export interface Settings {
  reminderMinutes: number;
  navApp: NavApp;
}

const DEFAULT_SETTINGS: Settings = { reminderMinutes: 30, navApp: "waze" };

/** All app state. Data lives only in this device's localStorage. */
export function useSchedule() {
  const [payload, setPayload] = useLocalStorage<SchedulePayload | null>("biu.schedule", null);
  const [settings, setSettings] = useLocalStorage<Settings>("biu.settings", DEFAULT_SETTINGS);
  const [importError, setImportError] = useState<string | null>(null);
  const [justImported, setJustImported] = useState(false);

  // The bookmarklet opens the app with the timetable in the URL fragment.
  useEffect(() => {
    try {
      const incoming = readHashPayload(location.hash);
      if (incoming) {
        setPayload(incoming);
        setJustImported(true);
      }
    } catch (e) {
      setImportError((e as Error).message);
    } finally {
      if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    }
  }, [setPayload]);

  const academicYear = useMemo(() => (payload ? getAcademicYear(payload.year) : null), [payload]);

  return {
    payload,
    lessons: payload?.lessons ?? [],
    academicYear,
    settings,
    setSettings,
    clear: () => setPayload(null),
    importError,
    justImported,
  };
}
