"use client";

import { useEffect, useState } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";

import {
 captureDailyReadingNow,
 useDailyReadingSettings,
} from "@/features/daily-reading/daily-reading.client";
import {
 enrichDailyReadingLearningSupport,
 reconcilePendingDailyReadingEnrichmentJobs,
} from "@/features/daily-reading/daily-reading-enrichment.client";
import {
 resolveDailyReadingReleaseState,
 shouldAutoCaptureDailyReading,
} from "@/features/daily-reading/daily-reading.scheduler";
import {
 hasScheduledCaptureAttemptForDate,
 hasScheduledCapturedArticleForDate,
} from "@/features/daily-reading/daily-reading-storage.client";

export function DailyReadingSchedulerAgent() {
 const { user, isResolved } = useClientSession();
 const { settings } = useDailyReadingSettings();
 const [tick, setTick] = useState(0);

 useEffect(() => {
  if (!isResolved || !user) return;

  const update = () => setTick((value) => value + 1);
  const timer = window.setInterval(update, 30_000);
  window.addEventListener("focus", update);
  document.addEventListener("visibilitychange", update);
  return () => {
   window.clearInterval(timer);
   window.removeEventListener("focus", update);
   document.removeEventListener("visibilitychange", update);
  };
 }, [isResolved, user]);

 useEffect(() => {
  if (!isResolved || !user || document.visibilityState === "hidden") return;
  void reconcilePendingDailyReadingEnrichmentJobs().catch(() => undefined);
 }, [isResolved, tick, user]);

 useEffect(() => {
  if (!isResolved || !user) return;

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
    return enrichDailyReadingLearningSupport(reading.id);
   })
   .catch(() => undefined);
 }, [
  isResolved,
  settings.autoCaptureEnabled,
  settings.autoEnrichmentEnabled,
  settings.captureTime,
  tick,
  user,
 ]);

 return null;
}
