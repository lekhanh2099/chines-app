import type { DailyReading, DailyReadingRun } from "./daily-reading.schemas";
import {
 dailyReadingV2LedgerSchema,
 dailyReadingV2Schema,
 type DailyReadingV2,
 type DailyReadingV2Ledger,
} from "./daily-reading-v2.schemas";

const hanPattern = /\p{Script=Han}/gu;

export function createDailyReadingV2Fingerprint(input: {
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

function legacyAiAttribution(reading: DailyReading) {
 return {
  provider: reading.generatedByProvider,
  model: reading.generatedByModel,
 };
}

export function migrateDailyReadingV1ItemToV2(reading: DailyReading): DailyReadingV2 {
 const paragraphsZh = reading.paragraphs.map((paragraph) => paragraph.zh);
 const generatedBy = legacyAiAttribution(reading);
 return dailyReadingV2Schema.parse({
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
   fingerprint: createDailyReadingV2Fingerprint({
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

export function migrateDailyReadingV1LedgerToV2(input: {
 items: readonly DailyReading[];
 runs: readonly DailyReadingRun[];
}): DailyReadingV2Ledger {
 return dailyReadingV2LedgerSchema.parse({
  schemaVersion: "2.0.0",
  items: input.items.map(migrateDailyReadingV1ItemToV2),
  captureRuns: [],
  enrichmentRuns: [],
  legacyRuns: input.runs,
 });
}
