import { defaultDailyReadingSourceIds } from "./daily-reading-source-catalog";
import { DAILY_READING_PUBLISH_HOUR } from "./daily-reading.scheduler";
import { dailyReadingTopicSchema, type DailyReadingSettings } from "./daily-reading.schemas";
import {
 dailyReadingV2SettingsSchema,
 type DailyReadingV2LegacySettings,
 type DailyReadingV2Settings,
} from "./daily-reading-v2.schemas";

export const defaultDailyReadingV2Settings: DailyReadingV2Settings =
 dailyReadingV2SettingsSchema.parse({
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

export function migrateDailyReadingV2Settings(
 settings: DailyReadingV2LegacySettings,
): DailyReadingV2Settings {
 return dailyReadingV2SettingsSchema.parse({
  ...defaultDailyReadingV2Settings,
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

export function migrateDailyReadingV1SettingsToV2(
 settings: DailyReadingSettings,
): DailyReadingV2Settings {
 return dailyReadingV2SettingsSchema.parse({
  ...defaultDailyReadingV2Settings,
  autoCaptureEnabled: settings.autoGenerateEnabled,
  targetLevel: settings.preferredLevel,
 });
}
