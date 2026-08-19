import { defaultDailyReadingSourceIds } from "./daily-reading-source-catalog";
import { DAILY_READING_PUBLISH_HOUR } from "./daily-reading.scheduler";
import {
 dailyReadingTopicSchema,
 type DailyReadingSettings,
} from "./daily-reading.schemas";
import {
 dailyReadingV2SettingsSchema,
 type DailyReadingV2Settings,
} from "./daily-reading-v2.schemas";

export const defaultDailyReadingV2Settings: DailyReadingV2Settings =
 dailyReadingV2SettingsSchema.parse({
  schemaVersion: "2.0.0",
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
 });

export function migrateDailyReadingV1SettingsToV2(
 settings: DailyReadingSettings,
): DailyReadingV2Settings {
 return dailyReadingV2SettingsSchema.parse({
  ...defaultDailyReadingV2Settings,
  autoCaptureEnabled: settings.autoGenerateEnabled,
  targetLevel: settings.preferredLevel,
 });
}
