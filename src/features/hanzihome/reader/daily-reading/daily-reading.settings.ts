import { defaultDailyReadingSourceIds } from "./daily-reading-source-catalog";
import { DAILY_READING_PUBLISH_HOUR } from "./daily-reading.scheduler";
import type { LegacyDailyReadingSettings } from "./daily-reading-legacy.schemas";
import { dailyReadingTopicSchema } from "./daily-reading.schemas";
import {
 dailyReadingSettingsSchema,
 type DailyReadingLegacySettings,
 type DailyReadingSettings,
} from "./daily-reading.schemas";

export const defaultDailyReadingSettings: DailyReadingSettings = dailyReadingSettingsSchema.parse({
 schemaVersion: "2.1.0",
 autoCaptureEnabled: true,
 captureTime: {
  hour: DAILY_READING_PUBLISH_HOUR,
  minute: 0,
 },
 freshnessDays: 14,
 selectedTopics: [...dailyReadingTopicSchema.options],
 selectedSources: [...defaultDailyReadingSourceIds],
 preferredLength: "any",
 preferTopicDiversity: true,
 avoidRecentlyRead: true,
 noMatchBehavior: "skip-day",
 targetLevel: "HSK5",
 autoEnrichmentEnabled: true,
 translationEnabled: true,
 vocabularyEnabled: true,
 grammarEnabled: true,
 questionsEnabled: true,
 vocabularyCount: 12,
 grammarCount: 4,
 questionsCount: 6,
});

export function migrateDailyReadingSettings(
 settings: DailyReadingLegacySettings,
): DailyReadingSettings {
 return dailyReadingSettingsSchema.parse({
  ...defaultDailyReadingSettings,
  autoCaptureEnabled: settings.autoCaptureEnabled,
  captureTime: settings.captureTime,
  freshnessDays: settings.freshnessDays,
  selectedTopics: settings.selectedTopics,
  selectedSources: settings.selectedSources,
  preferredLength: settings.preferredLength,
  preferTopicDiversity: settings.preferTopicDiversity,
  avoidRecentlyRead: settings.avoidRecentlyRead,
  noMatchBehavior: settings.noMatchBehavior,
  targetLevel: settings.targetLevel,
  autoEnrichmentEnabled: settings.autoEnrichmentEnabled,
 });
}

export function migrateLegacyDailyReadingSettings(
 settings: LegacyDailyReadingSettings,
): DailyReadingSettings {
 return dailyReadingSettingsSchema.parse({
  ...defaultDailyReadingSettings,
  autoCaptureEnabled: settings.autoGenerateEnabled,
  targetLevel: settings.preferredLevel,
 });
}
