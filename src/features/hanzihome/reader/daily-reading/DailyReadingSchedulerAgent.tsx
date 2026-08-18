"use client";

import { useEffect, useState } from "react";

import { generateDailyReadingNow, useDailyReadingSettings } from "./daily-reading-client";
import { resolveDailyReadingReleaseState } from "./daily-reading.scheduler";
import {
 hasScheduledAttemptForDate,
 hasScheduledReadingForDate,
} from "./daily-reading-storage.client";

export function DailyReadingSchedulerAgent() {
 const { settings } = useDailyReadingSettings();
 const [tick, setTick] = useState(0);

 useEffect(() => {
  const update = () => setTick((value) => value + 1);
  const timer = window.setInterval(update, 30_000);
  window.addEventListener("focus", update);
  document.addEventListener("visibilitychange", update);
  return () => {
   window.clearInterval(timer);
   window.removeEventListener("focus", update);
   document.removeEventListener("visibilitychange", update);
  };
 }, []);

 useEffect(() => {
  if (!settings.autoGenerateEnabled || document.visibilityState === "hidden") return;
  const release = resolveDailyReadingReleaseState();
  if (!release.isDue) return;
  if (hasScheduledReadingForDate(release.dateKey)) return;
  if (hasScheduledAttemptForDate(release.dateKey)) return;
  void generateDailyReadingNow("scheduled", settings.preferredLevel).catch(() => undefined);
 }, [settings.autoGenerateEnabled, settings.preferredLevel, tick]);

 return null;
}
