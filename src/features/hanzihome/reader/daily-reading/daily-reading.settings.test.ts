import { describe, expect, it } from "vitest";

import { defaultDailyReadingSourceIds } from "./daily-reading-source-catalog";
import { legacyDailyReadingSettingsSchema } from "./daily-reading-legacy.schemas";
import { dailyReadingSettingsSchema, dailyReadingTopicSchema } from "./daily-reading.schemas";
import {
 defaultDailyReadingSettings,
 migrateLegacyDailyReadingSettings,
} from "./daily-reading.settings";

describe("Daily Reading settings", () => {
 it("preserves legacy behavior in the current defaults", () => {
  expect(defaultDailyReadingSettings.autoCaptureEnabled).toBe(true);
  expect(defaultDailyReadingSettings.captureTime).toEqual({ hour: 10, minute: 0 });
  expect(defaultDailyReadingSettings.freshnessDays).toBe(14);
  expect(defaultDailyReadingSettings.selectedTopics).toEqual(dailyReadingTopicSchema.options);
  expect(defaultDailyReadingSettings.selectedSources).toEqual(defaultDailyReadingSourceIds);
  expect(defaultDailyReadingSettings.preferredLength).toBe("any");
  expect(defaultDailyReadingSettings.preferTopicDiversity).toBe(true);
  expect(defaultDailyReadingSettings.avoidRecentlyRead).toBe(true);
  expect(defaultDailyReadingSettings.noMatchBehavior).toBe("skip-day");
  expect(defaultDailyReadingSettings.targetLevel).toBe("HSK5");
  expect(defaultDailyReadingSettings.autoEnrichmentEnabled).toBe(true);
 });

 it("migrates the two legacy preferences without inventing changed behavior", () => {
  const legacy = legacyDailyReadingSettingsSchema.parse({
   schemaVersion: "1.0.0",
   autoGenerateEnabled: false,
   preferredLevel: "HSK6",
  });
  const migrated = migrateLegacyDailyReadingSettings(legacy);

  expect(migrated.autoCaptureEnabled).toBe(false);
  expect(migrated.targetLevel).toBe("HSK6");
  expect(migrated.captureTime).toEqual({ hour: 10, minute: 0 });
  expect(migrated.freshnessDays).toBe(14);
  expect(dailyReadingSettingsSchema.parse(migrated)).toEqual(migrated);
 });

 it("rejects empty, duplicate or invalid collection preferences", () => {
  expect(
   dailyReadingSettingsSchema.safeParse({
    ...defaultDailyReadingSettings,
    selectedTopics: [],
   }).success,
  ).toBe(false);
  expect(
   dailyReadingSettingsSchema.safeParse({
    ...defaultDailyReadingSettings,
    selectedSources: ["xinhua", "xinhua"],
   }).success,
  ).toBe(false);
  expect(
   dailyReadingSettingsSchema.safeParse({
    ...defaultDailyReadingSettings,
    captureTime: { hour: 24, minute: 0 },
   }).success,
  ).toBe(false);
 });
});
