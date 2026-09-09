import { describe, expect, it } from "vitest";

import {
 resolveDailyReadingCollectionPolicy,
 type DailyReadingCollectionHistoryItem,
} from "@/features/daily-reading/daily-reading-collection-policy";
import { defaultDailyReadingSettings } from "@/features/daily-reading/daily-reading.settings";
import { dailyReadingSettingsSchema } from "@/features/daily-reading/daily-reading.schemas";

const history: readonly DailyReadingCollectionHistoryItem[] = [
 {
  topic: "culture",
  sourceUrl: "https://www.chinanews.com.cn/cul/2026/08-19/a.shtml",
  capturedAt: "2026-08-19T03:00:00.000Z",
 },
 {
  topic: "science",
  sourceUrl: "https://www.news.cn/tech/2026-08/18/b.htm",
  capturedAt: "2026-08-18T03:00:00.000Z",
 },
 {
  topic: "culture",
  sourceUrl: "https://www.chinanews.com.cn/cul/2026/08-19/a.shtml",
  capturedAt: "2026-08-17T03:00:00.000Z",
 },
];

describe("Daily Reading collection policy", () => {
 it("resolves user collection choices while keeping safety bounds app-owned", () => {
  const settings = dailyReadingSettingsSchema.parse({
   ...defaultDailyReadingSettings,
   captureTime: { hour: 7, minute: 30 },
   freshnessDays: 3,
   selectedTopics: ["culture", "language"],
   selectedSources: ["xinhua"],
   preferredLength: "medium",
   noMatchBehavior: "expand-window",
   targetLevel: "HSK6",
  });
  const policy = resolveDailyReadingCollectionPolicy({ settings, history });

  expect(policy.schedule).toEqual({
   hour: 7,
   minute: 30,
   timeZone: "Asia/Ho_Chi_Minh",
  });
  expect(policy.freshness).toEqual({
   primaryDays: 3,
   fallbackDays: 14,
   noMatchBehavior: "expand-window",
  });
  expect(policy.selectedTopics).toEqual(["culture", "language"]);
  expect(policy.selectedSources).toEqual(["xinhua"]);
  expect(policy.allowedDomains).toEqual(["xinhuanet.com", "news.cn"]);
  expect(policy.preferredLength).toBe("medium");
  expect(policy.targetLevel).toBe("HSK6");
  expect(policy.recentTopics).toEqual(["culture", "science"]);
  expect(policy.excludedSourceUrls).toEqual([
   "https://www.chinanews.com.cn/cul/2026/08-19/a.shtml",
   "https://www.news.cn/tech/2026-08/18/b.htm",
  ]);
 });

 it("does not silently widen freshness or apply history penalties when disabled", () => {
  const settings = dailyReadingSettingsSchema.parse({
   ...defaultDailyReadingSettings,
   freshnessDays: 7,
   preferTopicDiversity: false,
   avoidRecentlyRead: false,
   noMatchBehavior: "skip-day",
  });
  const policy = resolveDailyReadingCollectionPolicy({ settings, history });

  expect(policy.freshness.fallbackDays).toBeNull();
  expect(policy.recentTopics).toEqual([]);
  expect(policy.excludedSourceUrls).toEqual([]);
 });

 it("keeps article acquisition and enrichment as separate preferences", () => {
  const settings = dailyReadingSettingsSchema.parse({
   ...defaultDailyReadingSettings,
   autoCaptureEnabled: true,
   autoEnrichmentEnabled: false,
  });
  const policy = resolveDailyReadingCollectionPolicy({ settings, history: [] });

  expect(policy.autoCaptureEnabled).toBe(true);
  expect(policy.autoEnrichmentEnabled).toBe(false);
 });
});
