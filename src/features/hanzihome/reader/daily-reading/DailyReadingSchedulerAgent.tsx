"use client";

import { useEffect, useState } from "react";

import { captureDailyReadingNow, useDailyReadingV2Settings } from "./daily-reading-v2-client";
import { enrichDailyReadingV2LearningSupport } from "./daily-reading-v2-enrichment.client";
import {
 resolveDailyReadingReleaseState,
 shouldAutoCaptureDailyReading,
} from "./daily-reading.scheduler";
import {
 hasScheduledCaptureAttemptForDate,
 hasScheduledCapturedArticleForDate,
} from "./daily-reading-v2-storage.client";

export function DailyReadingSchedulerAgent() {
 const { settings } = useDailyReadingV2Settings();
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
  const release = resolveDailyReadingReleaseState(new Date(), settings.captureTime);
  const shouldCapture = shouldAutoCaptureDailyReading({
   autoCaptureEnabled: settings.autoCaptureEnabled,
   isVisible: document.visibilityState !== "hidden",
   releaseIsDue: release.isDue,
   hasScheduledArticle: hasScheduledCapturedArticleForDate(release.dateKey),
   hasBlockingAttempt: hasScheduledCaptureAttemptForDate(release.dateKey),
  });
  if (!shouldCapture) return;

  void captureDailyReadingNow("scheduled")
   .then((reading) => {
    if (!settings.autoEnrichmentEnabled) return;
    return enrichDailyReadingV2LearningSupport(reading.id);
   })
   .catch(() => undefined);
 }, [settings.autoCaptureEnabled, settings.autoEnrichmentEnabled, settings.captureTime, tick]);

 return null;
}
