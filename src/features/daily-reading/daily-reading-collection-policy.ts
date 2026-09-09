import {
 domainsForDailyReadingSources,
 type DailyReadingSourceId,
} from "@/features/daily-reading/daily-reading-source-catalog";
import { DAILY_READING_TIME_ZONE } from "@/features/daily-reading/daily-reading.scheduler";
import type { DailyReadingTopic } from "@/features/daily-reading/daily-reading.schemas";
import type {
 DailyReadingFreshnessDays,
 DailyReadingLengthPreference,
 DailyReadingNoMatchBehavior,
 DailyReadingSettings,
} from "@/features/daily-reading/daily-reading.schemas";

const maximumFreshnessDays = 14;
const recentTopicHistoryLimit = 14;
const excludedSourceUrlLimit = 120;

export type DailyReadingCollectionHistoryItem = {
 topic: DailyReadingTopic;
 sourceUrl: string;
 capturedAt: string;
};

export type ResolvedDailyReadingCollectionPolicy = {
 autoCaptureEnabled: boolean;
 schedule: {
  hour: number;
  minute: number;
  timeZone: string;
 };
 freshness: {
  primaryDays: DailyReadingFreshnessDays;
  fallbackDays: number | null;
  noMatchBehavior: DailyReadingNoMatchBehavior;
 };
 selectedTopics: readonly DailyReadingTopic[];
 selectedSources: readonly DailyReadingSourceId[];
 allowedDomains: readonly string[];
 preferredLength: DailyReadingLengthPreference;
 targetLevel: DailyReadingSettings["targetLevel"];
 preferTopicDiversity: boolean;
 avoidRecentlyRead: boolean;
 recentTopics: readonly DailyReadingTopic[];
 excludedSourceUrls: readonly string[];
 autoEnrichmentEnabled: boolean;
};

function orderedHistory(history: readonly DailyReadingCollectionHistoryItem[]) {
 return [...history].sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
}

function resolveRecentTopics(history: readonly DailyReadingCollectionHistoryItem[]) {
 const topics: DailyReadingTopic[] = [];
 for (const item of orderedHistory(history).slice(0, recentTopicHistoryLimit)) {
  if (!topics.includes(item.topic)) topics.push(item.topic);
 }
 return topics;
}

function resolveExcludedSourceUrls(history: readonly DailyReadingCollectionHistoryItem[]) {
 const urls: string[] = [];
 for (const item of orderedHistory(history)) {
  const url = item.sourceUrl.trim();
  if (url.length === 0 || urls.includes(url)) continue;
  urls.push(url);
  if (urls.length >= excludedSourceUrlLimit) break;
 }
 return urls;
}

export function resolveDailyReadingCollectionPolicy(input: {
 settings: DailyReadingSettings;
 history: readonly DailyReadingCollectionHistoryItem[];
}): ResolvedDailyReadingCollectionPolicy {
 const fallbackDays =
  input.settings.noMatchBehavior === "expand-window" &&
  input.settings.freshnessDays < maximumFreshnessDays
   ? maximumFreshnessDays
   : null;
 return {
  autoCaptureEnabled: input.settings.autoCaptureEnabled,
  schedule: {
   hour: input.settings.captureTime.hour,
   minute: input.settings.captureTime.minute,
   timeZone: DAILY_READING_TIME_ZONE,
  },
  freshness: {
   primaryDays: input.settings.freshnessDays,
   fallbackDays,
   noMatchBehavior: input.settings.noMatchBehavior,
  },
  selectedTopics: [...input.settings.selectedTopics],
  selectedSources: [...input.settings.selectedSources],
  allowedDomains: domainsForDailyReadingSources(input.settings.selectedSources),
  preferredLength: input.settings.preferredLength,
  targetLevel: input.settings.targetLevel,
  preferTopicDiversity: input.settings.preferTopicDiversity,
  avoidRecentlyRead: input.settings.avoidRecentlyRead,
  recentTopics: input.settings.preferTopicDiversity ? resolveRecentTopics(input.history) : [],
  excludedSourceUrls: input.settings.avoidRecentlyRead
   ? resolveExcludedSourceUrls(input.history)
   : [],
  autoEnrichmentEnabled: input.settings.autoEnrichmentEnabled,
 };
}
