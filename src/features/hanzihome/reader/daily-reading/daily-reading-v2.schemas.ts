import { z } from "zod";

import {
 dailyReadingGenerationKindSchema,
 dailyReadingLevelSchema,
 dailyReadingRunSchema,
 dailyReadingSourceSchema,
 dailyReadingTopicSchema,
} from "./daily-reading.schemas";

const nonEmptyTextSchema = z.string().trim().min(1);
const nullableLevelSchema = dailyReadingLevelSchema.nullable();

export const dailyReadingV2ProvenanceSchema = z.enum(["source-captured", "legacy-adapted"]);
export const dailyReadingV2EnrichmentModuleSchema = z.enum([
 "translation",
 "vocabulary",
 "grammar",
 "questions",
]);
export const dailyReadingV2EnrichmentBlockReasonSchema = z.enum([
 "missing-ai-key",
 "invalid-ai-key",
 "quota-exhausted",
 "provider-unavailable",
]);

const dailyReadingV2AiAttributionSchema = z
 .strictObject({
  provider: nonEmptyTextSchema.max(80),
  model: nonEmptyTextSchema.max(160),
 })
 .nullable();

function createEnrichmentStateSchema<DataSchema extends z.ZodType>(dataSchema: DataSchema) {
 return z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("idle") }),
  z.strictObject({
   status: z.literal("running"),
   startedAt: z.iso.datetime({ offset: true }),
  }),
  z.strictObject({
   status: z.literal("ready"),
   data: dataSchema,
   updatedAt: z.iso.datetime({ offset: true }),
   generatedBy: dailyReadingV2AiAttributionSchema,
  }),
  z.strictObject({
   status: z.literal("failed"),
   errorCode: nonEmptyTextSchema.max(120),
   updatedAt: z.iso.datetime({ offset: true }),
  }),
  z.strictObject({
   status: z.literal("blocked"),
   reason: dailyReadingV2EnrichmentBlockReasonSchema,
  }),
 ]);
}

export const dailyReadingV2ArticleParagraphSchema = z.strictObject({
 id: nonEmptyTextSchema.max(80),
 order: z.number().int().positive(),
 zh: nonEmptyTextSchema.max(8_000),
});

export const dailyReadingV2ArticleSchema = z.strictObject({
 titleZh: nonEmptyTextSchema.max(240),
 paragraphs: z.array(dailyReadingV2ArticleParagraphSchema).min(3).max(80),
 hanCharacterCount: z.number().int().positive(),
 fingerprint: z.string().regex(/^[0-9a-f]{8}$/u),
});

export const dailyReadingV2TranslationDataSchema = z.strictObject({
 titleVi: nonEmptyTextSchema.max(320),
 whyWorthReadingVi: z.string().max(2_000),
 adaptationNoticeVi: z.string().max(800),
 paragraphs: z
  .array(
   z.strictObject({
    paragraphId: nonEmptyTextSchema.max(80),
    vi: nonEmptyTextSchema.max(5_000),
    roleVi: z.string().max(500),
   }),
  )
  .min(3)
  .max(80),
});

export const dailyReadingV2VocabularyDataSchema = z.strictObject({
 items: z
  .array(
   z.strictObject({
    id: nonEmptyTextSchema.max(80),
    order: z.number().int().positive(),
    hanzi: nonEmptyTextSchema.max(24),
    meaningVi: nonEmptyTextSchema.max(320),
    meaningInContextVi: nonEmptyTextSchema.max(480),
    categoryVi: nonEmptyTextSchema.max(120),
   }),
  )
  .min(1)
  .max(24),
});

export const dailyReadingV2GrammarDataSchema = z.strictObject({
 items: z
  .array(
   z.strictObject({
    id: nonEmptyTextSchema.max(80),
    patternZh: nonEmptyTextSchema.max(120),
    explanationVi: nonEmptyTextSchema.max(1_000),
    evidenceSentenceZh: nonEmptyTextSchema.max(600),
   }),
  )
  .min(1)
  .max(10),
});

export const dailyReadingV2QuestionsDataSchema = z.strictObject({
 items: z
  .array(
   z.strictObject({
    id: nonEmptyTextSchema.max(80),
    type: z.enum(["main_idea", "detail", "inference", "vocabulary", "summary"]),
    promptZh: nonEmptyTextSchema.max(600),
    promptVi: nonEmptyTextSchema.max(800),
    answerZh: nonEmptyTextSchema.max(1_200),
    answerVi: nonEmptyTextSchema.max(1_600),
    evidenceParagraphIds: z.array(nonEmptyTextSchema.max(80)).min(1).max(3),
   }),
  )
  .min(1)
  .max(12),
 sourcePhrasesZh: z.array(nonEmptyTextSchema.max(40)).max(6),
 verificationSummaryVi: z.string().max(1_400),
});

export const dailyReadingV2TranslationStateSchema = createEnrichmentStateSchema(
 dailyReadingV2TranslationDataSchema,
);
export const dailyReadingV2VocabularyStateSchema = createEnrichmentStateSchema(
 dailyReadingV2VocabularyDataSchema,
);
export const dailyReadingV2GrammarStateSchema = createEnrichmentStateSchema(
 dailyReadingV2GrammarDataSchema,
);
export const dailyReadingV2QuestionsStateSchema = createEnrichmentStateSchema(
 dailyReadingV2QuestionsDataSchema,
);

export const dailyReadingV2Schema = z.strictObject({
 schemaVersion: z.literal("2.0.0"),
 id: nonEmptyTextSchema.max(160),
 publishedDate: z.iso.date(),
 capturedAt: z.iso.datetime({ offset: true }),
 releaseKind: dailyReadingGenerationKindSchema,
 provenance: dailyReadingV2ProvenanceSchema,
 source: dailyReadingSourceSchema,
 article: dailyReadingV2ArticleSchema,
 classification: z.strictObject({
  topic: dailyReadingTopicSchema,
  targetLevel: nullableLevelSchema,
  estimatedLevel: nullableLevelSchema,
 }),
 estimatedMinutes: z.number().int().min(1).max(60),
 enrichment: z.strictObject({
  translation: dailyReadingV2TranslationStateSchema,
  vocabulary: dailyReadingV2VocabularyStateSchema,
  grammar: dailyReadingV2GrammarStateSchema,
  questions: dailyReadingV2QuestionsStateSchema,
 }),
});

export const dailyReadingV2CaptureStageSchema = z.enum([
 "discovering",
 "extracting",
 "ranking",
 "saving",
 "completed",
]);

export const dailyReadingV2CaptureRunSchema = z.strictObject({
 id: nonEmptyTextSchema.max(160),
 date: z.iso.date(),
 kind: dailyReadingGenerationKindSchema,
 status: z.enum(["pending", "succeeded", "failed"]),
 stage: dailyReadingV2CaptureStageSchema,
 attemptedAt: z.iso.datetime({ offset: true }),
 completedAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]),
 errorCode: z.string().max(120),
 errorDetail: z.string().max(1_000),
 articleId: z.string().max(160),
});

export const dailyReadingV2EnrichmentRunSchema = z.strictObject({
 id: nonEmptyTextSchema.max(160),
 articleId: nonEmptyTextSchema.max(160),
 module: dailyReadingV2EnrichmentModuleSchema,
 status: z.enum(["pending", "succeeded", "failed", "blocked"]),
 attemptedAt: z.iso.datetime({ offset: true }),
 completedAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]),
 errorCode: z.string().max(120),
 errorDetail: z.string().max(1_000),
});

export const dailyReadingV2LedgerSchema = z.strictObject({
 schemaVersion: z.literal("2.0.0"),
 items: z.array(dailyReadingV2Schema).max(120),
 captureRuns: z.array(dailyReadingV2CaptureRunSchema).max(400),
 enrichmentRuns: z.array(dailyReadingV2EnrichmentRunSchema).max(800),
 legacyRuns: z.array(dailyReadingRunSchema).max(400),
});

export type DailyReadingV2 = z.output<typeof dailyReadingV2Schema>;
export type DailyReadingV2CaptureRun = z.output<typeof dailyReadingV2CaptureRunSchema>;
export type DailyReadingV2EnrichmentRun = z.output<typeof dailyReadingV2EnrichmentRunSchema>;
export type DailyReadingV2Ledger = z.output<typeof dailyReadingV2LedgerSchema>;
export type DailyReadingV2EnrichmentModule = z.output<
 typeof dailyReadingV2EnrichmentModuleSchema
>;
