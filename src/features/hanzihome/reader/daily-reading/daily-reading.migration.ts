import type { LegacyDailyReading, LegacyDailyReadingRun } from "./daily-reading-legacy.schemas";
import {
 dailyReadingLedgerSchema,
 dailyReadingSchema,
 type DailyReading,
 type DailyReadingLedger,
 type DailyReadingLegacyLedger,
 type DailyReadingPreviousLedger,
} from "./daily-reading.schemas";

const hanPattern = /\p{Script=Han}/gu;

export function createDailyReadingFingerprint(input: {
 sourceUrl: string;
 titleZh: string;
 paragraphsZh: readonly string[];
}) {
 const normalized = [input.sourceUrl, input.titleZh, ...input.paragraphsZh]
  .join("|")
  .normalize("NFC")
  .replace(/\s+/gu, "");
 let hash = 2_166_136_261;
 for (const character of normalized) {
  hash ^= character.codePointAt(0) ?? 0;
  hash = Math.imul(hash, 16_777_619);
 }
 return (hash >>> 0).toString(16).padStart(8, "0");
}

function countHanCharacters(paragraphsZh: readonly string[]) {
 return paragraphsZh.reduce(
  (total, paragraph) => total + (paragraph.match(hanPattern)?.length ?? 0),
  0,
 );
}

function legacyAiAttribution(reading: LegacyDailyReading) {
 return {
  provider: reading.generatedByProvider,
  model: reading.generatedByModel,
 };
}

export function migrateLegacyDailyReadingItem(reading: LegacyDailyReading): DailyReading {
 const paragraphsZh = reading.paragraphs.map((paragraph) => paragraph.zh);
 const generatedBy = legacyAiAttribution(reading);
 return dailyReadingSchema.parse({
  schemaVersion: "2.0.0",
  id: reading.id,
  publishedDate: reading.publishedDate,
  capturedAt: reading.source.capturedAt,
  releaseKind: reading.releaseKind,
  provenance: "legacy-adapted",
  source: reading.source,
  article: {
   titleZh: reading.titleZh,
   paragraphs: reading.paragraphs.map((paragraph) => ({
    id: paragraph.id,
    order: paragraph.order,
    zh: paragraph.zh,
   })),
   hanCharacterCount: countHanCharacters(paragraphsZh),
   fingerprint: createDailyReadingFingerprint({
    sourceUrl: reading.source.url,
    titleZh: reading.titleZh,
    paragraphsZh,
   }),
  },
  classification: {
   topic: reading.topic,
   targetLevel: reading.level,
   estimatedLevel: null,
  },
  estimatedMinutes: reading.estimatedMinutes,
  enrichment: {
   translation: {
    status: "ready",
    updatedAt: reading.createdAt,
    generatedBy,
    data: {
     titleVi: reading.titleVi,
     whyWorthReadingVi: reading.whyWorthReadingVi,
     adaptationNoticeVi: reading.adaptationNoticeVi,
     paragraphs: reading.paragraphs.map((paragraph) => ({
      paragraphId: paragraph.id,
      vi: paragraph.vi,
      roleVi: paragraph.roleVi,
     })),
    },
   },
   vocabulary: {
    status: "ready",
    updatedAt: reading.createdAt,
    generatedBy,
    data: {
     items: reading.vocabulary.map((item) => ({
      id: item.id,
      order: item.order,
      hanzi: item.hanzi,
      meaningVi: item.meaningVi,
      meaningInContextVi: item.meaningInContextVi,
      categoryVi: item.categoryVi,
     })),
    },
   },
   grammar: {
    status: "ready",
    updatedAt: reading.createdAt,
    generatedBy,
    data: {
     items: reading.grammarPoints.map((item) => ({
      id: item.id,
      patternZh: item.patternZh,
      explanationVi: item.explanationVi,
      evidenceSentenceZh: item.evidenceSentenceZh,
     })),
    },
   },
   questions: {
    status: "ready",
    updatedAt: reading.createdAt,
    generatedBy,
    data: {
     items: reading.questions.map((item) => ({
      id: item.id,
      type: item.type,
      promptZh: item.promptZh,
      promptVi: item.promptVi,
      answerZh: item.answerZh,
      answerVi: item.answerVi,
      evidenceParagraphIds: item.evidenceParagraphIds,
     })),
     sourcePhrasesZh: reading.sourcePhrasesZh,
     verificationSummaryVi: reading.verificationSummaryVi,
    },
   },
  },
 });
}

export function migrateLegacyDailyReadingLedger(input: {
 items: readonly LegacyDailyReading[];
 runs: readonly LegacyDailyReadingRun[];
}): DailyReadingLedger {
 return dailyReadingLedgerSchema.parse({
  schemaVersion: "2.2.0",
  items: input.items.map(migrateLegacyDailyReadingItem),
  captureRuns: [],
  enrichmentRuns: [],
  legacyRuns: input.runs,
 });
}

export function migrateDailyReadingLedger(input: DailyReadingLegacyLedger) {
 return dailyReadingLedgerSchema.parse({
  schemaVersion: "2.2.0",
  items: input.items,
  captureRuns: input.captureRuns,
  enrichmentRuns: [],
  legacyRuns: input.legacyRuns,
 });
}

export function migrateDailyReadingPreviousLedger(input: DailyReadingPreviousLedger) {
 return dailyReadingLedgerSchema.parse({
  schemaVersion: "2.2.0",
  items: input.items,
  captureRuns: input.captureRuns,
  enrichmentRuns: input.enrichmentRuns.map((run) => ({
   ...run,
   startedAt: run.status === "pending" ? "" : run.attemptedAt,
   reused: false,
  })),
  legacyRuns: input.legacyRuns,
 });
}
