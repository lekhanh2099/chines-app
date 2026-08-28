import "server-only";

import {
 resolveDailyReadingCollectionPolicy,
 type DailyReadingCollectionHistoryItem,
} from "./daily-reading-collection-policy";
import {
 discoverDailyReadingSourceWithPolicy,
 type DailyReadingSelectedSource,
 type DailyReadingSourceDiscoveryReport,
} from "./daily-reading-source.server";
import { vietnamDailyReadingDateKey } from "./daily-reading.scheduler";
import type { DailyReadingGenerationKind } from "./daily-reading.schemas";
import { createDailyReadingFingerprint } from "./daily-reading.migration";
import {
 dailyReadingSchema,
 type DailyReading,
 type DailyReadingCaptureStage,
 type DailyReadingSettings,
} from "./daily-reading.schemas";

const hanPattern = /[\u3400-\u9fff]/gu;
const estimatedReadingSpeedHanPerMinute = 300;

function countHanCharacters(paragraphsZh: readonly string[]) {
 return paragraphsZh.reduce(
  (total, paragraph) => total + (paragraph.match(hanPattern)?.length ?? 0),
  0,
 );
}

function estimatedMinutesForHanCount(hanCharacters: number) {
 return Math.min(60, Math.max(1, Math.ceil(hanCharacters / estimatedReadingSpeedHanPerMinute)));
}

export function buildCapturedDailyReading(input: {
 selection: DailyReadingSelectedSource;
 settings: DailyReadingSettings;
 mode: DailyReadingGenerationKind;
 now?: Date;
}): DailyReading {
 const now = input.now ?? new Date();
 const capturedAt = now.toISOString();
 const publishedDate = vietnamDailyReadingDateKey(now);
 const paragraphsZh = input.selection.paragraphsZh;
 const hanCharacterCount = countHanCharacters(paragraphsZh);
 const fingerprint = createDailyReadingFingerprint({
  sourceUrl: input.selection.source.url,
  titleZh: input.selection.source.titleZh,
  paragraphsZh,
 });

 return dailyReadingSchema.parse({
  schemaVersion: "2.0.0",
  id: `daily:${publishedDate}:${fingerprint}`,
  publishedDate,
  capturedAt,
  releaseKind: input.mode,
  provenance: "source-captured",
  source: {
   titleZh: input.selection.source.titleZh,
   publisher: input.selection.source.publisher,
   url: input.selection.source.url,
   publishedAt: input.selection.source.publishedAt,
   capturedAt,
  },
  article: {
   titleZh: input.selection.source.titleZh,
   paragraphs: paragraphsZh.map((zh, index) => ({
    id: `source-p${index + 1}`,
    order: index + 1,
    zh,
   })),
   hanCharacterCount,
   fingerprint,
  },
  classification: {
   topic: input.selection.source.topic,
   targetLevel: input.settings.targetLevel,
   estimatedLevel: null,
  },
  estimatedMinutes: estimatedMinutesForHanCount(hanCharacterCount),
  enrichment: {
   translation: { status: "idle" },
   vocabulary: { status: "idle" },
   grammar: { status: "idle" },
   questions: { status: "idle" },
  },
 });
}

export async function captureDailyReadingArticle(input: {
 mode: DailyReadingGenerationKind;
 settings: DailyReadingSettings;
 history: readonly DailyReadingCollectionHistoryItem[];
 onProgress?: (stage: DailyReadingCaptureStage) => void;
}): Promise<{
 reading: DailyReading | null;
 report: DailyReadingSourceDiscoveryReport;
}> {
 const policy = resolveDailyReadingCollectionPolicy({
  settings: input.settings,
  history: input.history,
 });
 const discovery = await discoverDailyReadingSourceWithPolicy(policy, (stage) => {
  input.onProgress?.(stage);
 });
 input.onProgress?.("ranking");
 if (discovery.selection === null) return { reading: null, report: discovery.report };

 return {
  reading: buildCapturedDailyReading({
   selection: discovery.selection,
   settings: input.settings,
   mode: input.mode,
  }),
  report: discovery.report,
 };
}
