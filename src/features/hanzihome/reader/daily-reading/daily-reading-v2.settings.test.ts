import { describe, expect, it } from "vitest";

import { defaultDailyReadingSourceIds } from "./daily-reading-source-catalog";
import {
 dailyReadingSettingsSchema,
 dailyReadingTopicSchema,
} from "./daily-reading.schemas";
import {
 defaultDailyReadingV2Settings,
 migrateDailyReadingV1SettingsToV2,
} from "./daily-reading-v2.settings";
import { dailyReadingV2SettingsSchema } from "./daily-reading-v2.schemas";

describe("Daily Reading V2 settings", () => {
 it("preserves current V1 behavior in the additive V2 defaults", () => {
  expect(defaultDailyReadingV2Settings.autoCaptureEnabled).toBe(true);
  expect(defaultDailyReadingV2Settings.captureTime).toEqual({ hour: 10, minute: 0 });
  expect(defaultDailyReadingV2Settings.freshnessDays).toBe(14);
  expect(defaultDailyReadingV2Settings.selectedTopics).toEqual(dailyReadingTopicSchema.options);
  expect(defaultDailyReadingV2Settings.selectedSources).toEqual(defaultDailyReadingSourceIds);
  expect(defaultDailyReadingV2Settings.preferredLength).toBe("any");
  expect(defaultDailyReadingV2Settings.preferTopicDiversity).toBe(true);
  expect(defaultDailyReadingV2Settings.avoidRecentlyRead).toBe(true);
  expect(defaultDailyReadingV2Settings.noMatchBehavior).toBe("skip-day");
  expect(defaultDailyReadingV2Settings.targetLevel).toBe("HSK5");
  expect(defaultDailyReadingV2Settings.autoEnrichmentEnabled).toBe(true);
 });

 it("migrates the two V1 preferences without inventing changed behavior", () => {
  const legacy = dailyReadingSettingsSchema.parse({
   schemaVersion: "1.0.0",
   autoGenerateEnabled: false,
   preferredLevel: "HSK6",
  });
  const migrated = migrateDailyReadingV1SettingsToV2(legacy);

  expect(migrated.autoCaptureEnabled).toBe(false);
  expect(migrated.targetLevel).toBe("HSK6");
  expect(migrated.captureTime).toEqual({ hour: 10, minute: 0 });
  expect(migrated.freshnessDays).toBe(14);
  expect(dailyReadingV2SettingsSchema.parse(migrated)).toEqual(migrated);
 });

 it("rejects empty, duplicate or invalid collection preferences", () => {
  expect(
   dailyReadingV2SettingsSchema.safeParse({
    ...defaultDailyReadingV2Settings,
    selectedTopics: [],
   }).success,
  ).toBe(false);
  expect(
   dailyReadingV2SettingsSchema.safeParse({
    ...defaultDailyReadingV2Settings,
    selectedSources: ["xinhua", "xinhua"],
   }).success,
  ).toBe(false);
  expect(
   dailyReadingV2SettingsSchema.safeParse({
    ...defaultDailyReadingV2Settings,
    captureTime: { hour: 24, minute: 0 },
   }).success,
  ).toBe(false);
 });
});
