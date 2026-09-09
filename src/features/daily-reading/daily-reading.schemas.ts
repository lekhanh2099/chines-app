import { z } from "zod";

import { aiRuntimeReceiptSchema } from "@/lib/ai-task-contract";

import { dailyReadingSourceIdSchema } from "@/features/daily-reading/daily-reading-source-catalog";
import {
 dailyReadingGenerationKindSchema,
 dailyReadingLevelSchema,
 dailyReadingSourceSchema,
 dailyReadingTopicSchema,
 legacyDailyReadingRunSchema,
} from "@/features/daily-reading/daily-reading-legacy.schemas";

export {
 dailyReadingErrorResponseSchema,
 dailyReadingGenerationKindSchema,
 dailyReadingLevelSchema,
 dailyReadingSourceCandidateSchema,
 dailyReadingSourcePreviewRequestSchema,
 dailyReadingSourcePreviewResponseSchema,
 dailyReadingSourceSchema,
 dailyReadingTopicSchema,
} from "@/features/daily-reading/daily-reading-legacy.schemas";
export type {
 DailyReadingErrorCode,
 DailyReadingGenerationKind,
 DailyReadingLevel,
 DailyReadingSourceCandidate,
 DailyReadingTopic,
} from "@/features/daily-reading/daily-reading-legacy.schemas";

const nonEmptyTextSchema = z.string().trim().min(1);
const nullableLevelSchema = dailyReadingLevelSchema.nullable();

function hasUniqueStrings(values: readonly string[]) {
 return new Set(values).size === values.length;
}

export const dailyReadingProvenanceSchema = z.enum(["source-captured", "legacy-adapted"]);
export const dailyReadingEnrichmentModuleSchema = z.enum([
 "translation",
 "vocabulary",
 "grammar",
 "questions",
]);
export const dailyReadingEnrichmentBlockReasonSchema = z.enum([
 "missing-ai-key",
 "invalid-ai-key",
 "quota-exhausted",
 "provider-unavailable",
 "task-disabled",
]);
export const dailyReadingFreshnessDaysSchema = z.union([
 z.literal(1),
 z.literal(3),
 z.literal(7),
 z.literal(14),
]);
export const dailyReadingLengthPreferenceSchema = z.enum(["any", "short", "medium", "long"]);
export const dailyReadingNoMatchBehaviorSchema = z.enum(["skip-day", "expand-window"]);

const dailyReadingAiAttributionSchema = z
 .strictObject({
  provider: nonEmptyTextSchema.max(80),
  model: nonEmptyTextSchema.max(160),
  receipt: aiRuntimeReceiptSchema.optional(),
 })
 .nullable();

const dailyReadingTopicSelectionSchema = z
 .array(dailyReadingTopicSchema)
 .min(1)
 .refine(hasUniqueStrings, { message: "Daily Reading topics must be unique." });

const dailyReadingSourceSelectionSchema = z
 .array(dailyReadingSourceIdSchema)
 .min(1)
 .refine(hasUniqueStrings, { message: "Daily Reading sources must be unique." });

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
   generatedBy: dailyReadingAiAttributionSchema,
  }),
  z.strictObject({
   status: z.literal("failed"),
   errorCode: nonEmptyTextSchema.max(120),
   updatedAt: z.iso.datetime({ offset: true }),
  }),
  z.strictObject({
   status: z.literal("blocked"),
   reason: dailyReadingEnrichmentBlockReasonSchema,
  }),
 ]);
}

export const dailyReadingArticleParagraphSchema = z.strictObject({
 id: nonEmptyTextSchema.max(80),
 order: z.number().int().positive(),
 zh: nonEmptyTextSchema.max(8_000),
});

export const dailyReadingArticleSchema = z.strictObject({
 titleZh: nonEmptyTextSchema.max(240),
 paragraphs: z.array(dailyReadingArticleParagraphSchema).min(3).max(80),
 hanCharacterCount: z.number().int().positive(),
 fingerprint: z.string().regex(/^[0-9a-f]{8}$/u),
});

export const dailyReadingTranslationDataSchema = z.strictObject({
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

export const dailyReadingVocabularyDataSchema = z.strictObject({
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

export const dailyReadingGrammarDataSchema = z.strictObject({
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

export const dailyReadingQuestionsDataSchema = z.strictObject({
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

export const dailyReadingTranslationStateSchema = createEnrichmentStateSchema(
 dailyReadingTranslationDataSchema,
);
export const dailyReadingVocabularyStateSchema = createEnrichmentStateSchema(
 dailyReadingVocabularyDataSchema,
);
export const dailyReadingGrammarStateSchema = createEnrichmentStateSchema(
 dailyReadingGrammarDataSchema,
);
export const dailyReadingQuestionsStateSchema = createEnrichmentStateSchema(
 dailyReadingQuestionsDataSchema,
);

export const dailyReadingSchema = z.strictObject({
 schemaVersion: z.literal("2.0.0"),
 id: nonEmptyTextSchema.max(160),
 publishedDate: z.iso.date(),
 capturedAt: z.iso.datetime({ offset: true }),
 releaseKind: dailyReadingGenerationKindSchema,
 provenance: dailyReadingProvenanceSchema,
 source: dailyReadingSourceSchema,
 article: dailyReadingArticleSchema,
 classification: z.strictObject({
  topic: dailyReadingTopicSchema,
  targetLevel: nullableLevelSchema,
  estimatedLevel: nullableLevelSchema,
 }),
 estimatedMinutes: z.number().int().min(1).max(60),
 enrichment: z.strictObject({
  translation: dailyReadingTranslationStateSchema,
  vocabulary: dailyReadingVocabularyStateSchema,
  grammar: dailyReadingGrammarStateSchema,
  questions: dailyReadingQuestionsStateSchema,
 }),
});

export const dailyReadingCaptureStageSchema = z.enum([
 "discovering",
 "extracting",
 "ranking",
 "saving",
 "completed",
]);

export const dailyReadingCaptureRunSchema = z.strictObject({
 id: nonEmptyTextSchema.max(160),
 date: z.iso.date(),
 kind: dailyReadingGenerationKindSchema,
 status: z.enum(["pending", "succeeded", "failed"]),
 stage: dailyReadingCaptureStageSchema,
 attemptedAt: z.iso.datetime({ offset: true }),
 completedAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]),
 errorCode: z.string().max(120),
 errorDetail: z.string().max(1_000),
 articleId: z.string().max(160),
});

export const dailyReadingLegacyEnrichmentRunSchema = z.strictObject({
 id: nonEmptyTextSchema.max(160),
 articleId: nonEmptyTextSchema.max(160),
 module: dailyReadingEnrichmentModuleSchema,
 status: z.enum(["pending", "succeeded", "failed", "blocked"]),
 attemptedAt: z.iso.datetime({ offset: true }),
 completedAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]),
 errorCode: z.string().max(120),
 errorDetail: z.string().max(1_000),
});

export const dailyReadingPreviousEnrichmentRunSchema = dailyReadingLegacyEnrichmentRunSchema.extend(
 {
  runId: z.uuid(),
  articleFingerprint: z.string().regex(/^[0-9a-f]{8}$/u),
  workflowRunId: z.string().max(200),
  progressCompleted: z.number().int().nonnegative(),
  progressTotal: z.number().int().positive(),
  receipt: aiRuntimeReceiptSchema.nullable(),
 },
);

export const dailyReadingEnrichmentRunSchema = dailyReadingPreviousEnrichmentRunSchema.extend({
 startedAt: dailyReadingCaptureRunSchema.shape.completedAt,
 reused: z.boolean(),
});

const dailyReadingSettingsBaseSchema = z.strictObject({
 autoCaptureEnabled: z.boolean(),
 captureTime: z.strictObject({
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
 }),
 freshnessDays: dailyReadingFreshnessDaysSchema,
 selectedTopics: dailyReadingTopicSelectionSchema,
 selectedSources: dailyReadingSourceSelectionSchema,
 preferredLength: dailyReadingLengthPreferenceSchema,
 preferTopicDiversity: z.boolean(),
 avoidRecentlyRead: z.boolean(),
 noMatchBehavior: dailyReadingNoMatchBehaviorSchema,
 targetLevel: dailyReadingLevelSchema,
 autoEnrichmentEnabled: z.boolean(),
});

export const dailyReadingLegacySettingsSchema = dailyReadingSettingsBaseSchema.extend({
 schemaVersion: z.literal("2.0.0"),
});

export const dailyReadingSettingsSchema = dailyReadingSettingsBaseSchema.extend({
 schemaVersion: z.literal("2.1.0"),
 translationEnabled: z.boolean(),
 vocabularyEnabled: z.boolean(),
 grammarEnabled: z.boolean(),
 questionsEnabled: z.boolean(),
 vocabularyCount: z.number().int().min(1).max(24),
 grammarCount: z.number().int().min(1).max(10),
 questionsCount: z.number().int().min(5).max(12),
});

export const dailyReadingCaptureHistoryItemSchema = z.strictObject({
 topic: dailyReadingTopicSchema,
 sourceUrl: z.url(),
 capturedAt: z.iso.datetime({ offset: true }),
});

export const dailyReadingCaptureRequestSchema = z.strictObject({
 mode: dailyReadingGenerationKindSchema,
 settings: dailyReadingSettingsSchema,
 history: z.array(dailyReadingCaptureHistoryItemSchema).max(120),
});

export const dailyReadingCaptureReportSchema = z.strictObject({
 discoveryEndpoints: z.number().int().nonnegative(),
 discoveryResponses: z.number().int().nonnegative(),
 metadataCandidates: z.number().int().nonnegative(),
 policyCandidates: z.number().int().nonnegative(),
 attemptedExtractions: z.number().int().nonnegative(),
 selectedFinalScore: z.number().nonnegative().nullable(),
 usedFreshnessDays: z.number().int().min(1).max(14).nullable(),
});

export const dailyReadingCaptureResponseSchema = z.strictObject({
 reading: dailyReadingSchema,
 report: dailyReadingCaptureReportSchema,
});

export const dailyReadingLegacyLedgerSchema = z.strictObject({
 schemaVersion: z.literal("2.0.0"),
 items: z.array(dailyReadingSchema).max(120),
 captureRuns: z.array(dailyReadingCaptureRunSchema).max(400),
 enrichmentRuns: z.array(dailyReadingLegacyEnrichmentRunSchema).max(800),
 legacyRuns: z.array(legacyDailyReadingRunSchema).max(400),
});

export const dailyReadingPreviousLedgerSchema = z.strictObject({
 schemaVersion: z.literal("2.1.0"),
 items: z.array(dailyReadingSchema).max(120),
 captureRuns: z.array(dailyReadingCaptureRunSchema).max(400),
 enrichmentRuns: z.array(dailyReadingPreviousEnrichmentRunSchema).max(800),
 legacyRuns: z.array(legacyDailyReadingRunSchema).max(400),
});

export const dailyReadingLedgerSchema = z.strictObject({
 schemaVersion: z.literal("2.2.0"),
 items: z.array(dailyReadingSchema).max(120),
 captureRuns: z.array(dailyReadingCaptureRunSchema).max(400),
 enrichmentRuns: z.array(dailyReadingEnrichmentRunSchema).max(800),
 legacyRuns: z.array(legacyDailyReadingRunSchema).max(400),
});

export type DailyReading = z.output<typeof dailyReadingSchema>;
export type DailyReadingCaptureRun = z.output<typeof dailyReadingCaptureRunSchema>;
export type DailyReadingCaptureStage = z.output<typeof dailyReadingCaptureStageSchema>;
export type DailyReadingEnrichmentRun = z.output<typeof dailyReadingEnrichmentRunSchema>;
export type DailyReadingLedger = z.output<typeof dailyReadingLedgerSchema>;
export type DailyReadingLegacyLedger = z.output<typeof dailyReadingLegacyLedgerSchema>;
export type DailyReadingPreviousLedger = z.output<typeof dailyReadingPreviousLedgerSchema>;
export type DailyReadingEnrichmentModule = z.output<typeof dailyReadingEnrichmentModuleSchema>;
export type DailyReadingFreshnessDays = z.output<typeof dailyReadingFreshnessDaysSchema>;
export type DailyReadingLengthPreference = z.output<typeof dailyReadingLengthPreferenceSchema>;
export type DailyReadingNoMatchBehavior = z.output<typeof dailyReadingNoMatchBehaviorSchema>;
export type DailyReadingSettings = z.output<typeof dailyReadingSettingsSchema>;
export type DailyReadingLegacySettings = z.output<typeof dailyReadingLegacySettingsSchema>;
export type DailyReadingCaptureResponse = z.output<typeof dailyReadingCaptureResponseSchema>;
