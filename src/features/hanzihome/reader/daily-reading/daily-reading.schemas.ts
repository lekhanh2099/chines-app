import { z } from "zod";

const nonEmptyTextSchema = z.string().trim().min(1);

export const dailyReadingTopicSchema = z.enum([
 "culture",
 "education",
 "history",
 "language",
 "science",
 "society",
 "travel",
 "environment",
 "health",
]);
export const dailyReadingLevelSchema = z.enum(["HSK4", "HSK5", "HSK6"]);
export const dailyReadingGenerationKindSchema = z.enum(["scheduled", "manual"]);
export const dailyReadingGenerationStageSchema = z.enum([
 "discovering",
 "extracting",
 "drafting",
 "repairing_core",
 "enriching",
 "repairing_learning",
 "validating",
 "finalizing",
 "saving",
 "completed",
]);
export const dailyReadingErrorCodeSchema = z.enum([
 "invalid-request",
 "source-unavailable",
 "source-extraction-failed",
 "provider-rejected",
 "invalid-provider-response",
 "timeout",
 "offline",
 "storage-failed",
 "generation-busy",
 "unauthorized",
]);

export const dailyReadingParagraphSchema = z.strictObject({
 id: nonEmptyTextSchema,
 order: z.number().int().positive(),
 zh: nonEmptyTextSchema.max(1600),
 pinyin: z.string().max(4000).default(""),
 vi: nonEmptyTextSchema.max(3000),
 roleVi: z.string(),
});

export const dailyReadingVocabularySchema = z.strictObject({
 id: nonEmptyTextSchema,
 order: z.number().int().positive(),
 hanzi: nonEmptyTextSchema.max(24),
 pinyin: z.string().max(160).default(""),
 meaningVi: nonEmptyTextSchema.max(320),
 meaningInContextVi: nonEmptyTextSchema.max(480),
 categoryVi: nonEmptyTextSchema.max(120),
});

export const dailyReadingGrammarSchema = z.strictObject({
 id: nonEmptyTextSchema,
 patternZh: nonEmptyTextSchema.max(120),
 explanationVi: nonEmptyTextSchema.max(1000),
 evidenceSentenceZh: nonEmptyTextSchema.max(600),
});

export const dailyReadingQuestionSchema = z.strictObject({
 id: nonEmptyTextSchema,
 type: z.enum(["main_idea", "detail", "inference", "vocabulary", "summary"]),
 promptZh: nonEmptyTextSchema.max(600),
 promptVi: nonEmptyTextSchema.max(800),
 answerZh: nonEmptyTextSchema.max(1200),
 answerVi: nonEmptyTextSchema.max(1600),
 evidenceParagraphIds: z.array(nonEmptyTextSchema).min(1).max(3),
});

export const dailyReadingSourceSchema = z.strictObject({
 titleZh: nonEmptyTextSchema.max(240),
 publisher: nonEmptyTextSchema.max(120),
 url: z.url(),
 publishedAt: z.iso.datetime({ offset: true }),
 capturedAt: z.iso.datetime({ offset: true }),
});

export const dailyReadingSchema = z.strictObject({
 schemaVersion: z.literal("1.0.0"),
 id: nonEmptyTextSchema,
 publishedDate: z.iso.date(),
 createdAt: z.iso.datetime({ offset: true }),
 releaseKind: dailyReadingGenerationKindSchema,
 titleZh: nonEmptyTextSchema.max(240),
 titlePinyin: z.string().max(800).default(""),
 titleVi: nonEmptyTextSchema.max(320),
 whyWorthReadingVi: nonEmptyTextSchema.max(2000),
 adaptationNoticeVi: nonEmptyTextSchema.max(800),
 topic: dailyReadingTopicSchema,
 level: dailyReadingLevelSchema,
 estimatedMinutes: z.number().int().min(3).max(45),
 paragraphs: z.array(dailyReadingParagraphSchema).min(4).max(8),
 vocabulary: z.array(dailyReadingVocabularySchema).min(8).max(18),
 grammarPoints: z.array(dailyReadingGrammarSchema).min(3).max(6),
 questions: z.array(dailyReadingQuestionSchema).min(5).max(8),
 sourcePhrasesZh: z.array(nonEmptyTextSchema.max(40)).max(6),
 verificationSummaryVi: nonEmptyTextSchema.max(1400),
 source: dailyReadingSourceSchema,
 generatedByProvider: nonEmptyTextSchema.max(80),
 generatedByModel: nonEmptyTextSchema.max(160),
 pinyinReviewStatus: z.literal("auto-generated").default("auto-generated"),
});

export const dailyReadingRunSchema = z.strictObject({
 id: nonEmptyTextSchema,
 date: z.iso.date(),
 kind: dailyReadingGenerationKindSchema,
 status: z.enum(["pending", "succeeded", "failed"]),
 stage: dailyReadingGenerationStageSchema,
 attemptedAt: z.iso.datetime({ offset: true }),
 completedAt: z.union([z.literal(""), z.iso.datetime({ offset: true })]),
 errorCode: z.string().max(120),
 errorDetail: z.string().max(1000),
 readingId: z.string(),
});

export const dailyReadingSettingsSchema = z.strictObject({
 schemaVersion: z.literal("1.0.0"),
 autoGenerateEnabled: z.boolean(),
 preferredLevel: dailyReadingLevelSchema,
});

export const dailyReadingLedgerSchema = z.strictObject({
 schemaVersion: z.literal("1.0.0"),
 items: z.array(dailyReadingSchema).max(120),
 runs: z.array(dailyReadingRunSchema).max(400),
});

export const dailyReadingSourceCandidateSchema = z.strictObject({
 titleZh: nonEmptyTextSchema.max(240),
 publisher: nonEmptyTextSchema.max(120),
 url: z.url(),
 publishedAt: z.iso.datetime({ offset: true }),
 topic: dailyReadingTopicSchema,
 extractedTextZh: nonEmptyTextSchema.max(16000),
});

export const dailyReadingSourcePreviewRequestSchema = z.strictObject({
 excludedUrls: z.array(z.url()).max(120),
 recentTopics: z.array(dailyReadingTopicSchema).max(14),
});
export const dailyReadingSourcePreviewResponseSchema = z.strictObject({
 source: z.strictObject({
  titleZh: nonEmptyTextSchema.max(240),
  publisher: nonEmptyTextSchema.max(120),
  url: z.url(),
  publishedAt: z.iso.datetime({ offset: true }),
  topic: dailyReadingTopicSchema,
  hanCharacters: z.number().int().min(240),
 }),
 report: z.strictObject({
  discoveryEndpoints: z.number().int().nonnegative(),
  discoveryResponses: z.number().int().nonnegative(),
  metadataCandidates: z.number().int().nonnegative(),
  attemptedExtractions: z.number().int().nonnegative(),
 }),
});

export const dailyReadingCoreDraftSchema = z.strictObject({
 titleZh: nonEmptyTextSchema.max(240),
 titleVi: nonEmptyTextSchema.max(320),
 whyWorthReadingVi: nonEmptyTextSchema.max(2000),
 topic: dailyReadingTopicSchema,
 level: dailyReadingLevelSchema,
 estimatedMinutes: z.number().int().min(3).max(20),
 paragraphs: z
  .array(
   z.strictObject({
    zh: nonEmptyTextSchema.max(1600),
    vi: nonEmptyTextSchema.max(3000),
    roleVi: z.string(),
   }),
  )
  .min(4)
  .max(8),
});

export const dailyReadingLearningDraftSchema = z.strictObject({
 vocabulary: z
  .array(
   z.strictObject({
    hanzi: nonEmptyTextSchema.max(24),
    meaningVi: nonEmptyTextSchema.max(320),
    meaningInContextVi: nonEmptyTextSchema.max(480),
    categoryVi: nonEmptyTextSchema.max(120),
   }),
  )
  .min(8)
  .max(18),
 grammarPoints: z
  .array(
   z.strictObject({
    patternZh: nonEmptyTextSchema.max(120),
    explanationVi: nonEmptyTextSchema.max(1000),
    evidenceSentenceZh: nonEmptyTextSchema.max(600),
   }),
  )
  .min(3)
  .max(6),
 questions: z
  .array(
   z.strictObject({
    type: z.enum(["main_idea", "detail", "inference", "vocabulary", "summary"]),
    promptZh: nonEmptyTextSchema.max(600),
    promptVi: nonEmptyTextSchema.max(800),
    answerZh: nonEmptyTextSchema.max(1200),
    answerVi: nonEmptyTextSchema.max(1600),
    evidenceParagraphNumbers: z.array(z.number().int().positive()).min(1).max(3),
   }),
  )
  .min(5)
  .max(8),
 sourcePhrasesZh: z.array(nonEmptyTextSchema.max(40)).max(6),
 verificationSummaryVi: nonEmptyTextSchema.max(1400),
});

export const dailyReadingGenerationCheckpointSchema = z.strictObject({
 source: dailyReadingSourceSchema,
 core: dailyReadingCoreDraftSchema,
});

export const dailyReadingCheckpointRecordSchema = z.strictObject({
 runId: nonEmptyTextSchema,
 date: z.iso.date(),
 kind: dailyReadingGenerationKindSchema,
 preferredLevel: dailyReadingLevelSchema,
 attemptedAt: z.iso.datetime({ offset: true }),
 checkpoint: dailyReadingGenerationCheckpointSchema,
});

export const dailyReadingGenerateRequestSchema = dailyReadingSourcePreviewRequestSchema.extend({
 mode: dailyReadingGenerationKindSchema,
 preferredLevel: dailyReadingLevelSchema,
 checkpoint: dailyReadingGenerationCheckpointSchema.optional(),
});
export const dailyReadingGenerateResponseSchema = z.strictObject({ reading: dailyReadingSchema });
export const dailyReadingErrorResponseSchema = z.strictObject({
 code: dailyReadingErrorCodeSchema,
 detail: z.string().min(1).max(1000),
});
export const dailyReadingGenerateStreamEventSchema = z.discriminatedUnion("type", [
 z.strictObject({
  type: z.literal("progress"),
  stage: dailyReadingGenerationStageSchema,
 }),
 z.strictObject({
  type: z.literal("checkpoint"),
  payload: dailyReadingGenerationCheckpointSchema,
 }),
 z.strictObject({
  type: z.literal("result"),
  payload: dailyReadingGenerateResponseSchema,
 }),
 z.strictObject({
  type: z.literal("error"),
  payload: dailyReadingErrorResponseSchema,
 }),
]);

export type DailyReading = z.output<typeof dailyReadingSchema>;
export type DailyReadingRun = z.output<typeof dailyReadingRunSchema>;
export type DailyReadingSettings = z.output<typeof dailyReadingSettingsSchema>;
export type DailyReadingLevel = z.output<typeof dailyReadingLevelSchema>;
export type DailyReadingTopic = z.output<typeof dailyReadingTopicSchema>;
export type DailyReadingGenerationKind = z.output<typeof dailyReadingGenerationKindSchema>;
export type DailyReadingGenerationStage = z.output<typeof dailyReadingGenerationStageSchema>;
export type DailyReadingErrorCode = z.output<typeof dailyReadingErrorCodeSchema>;
export type DailyReadingGenerateStreamEvent = z.output<
 typeof dailyReadingGenerateStreamEventSchema
>;
export type DailyReadingSourceCandidate = z.output<typeof dailyReadingSourceCandidateSchema>;
export type DailyReadingSourcePreviewResponse = z.output<
 typeof dailyReadingSourcePreviewResponseSchema
>;
export type DailyReadingCoreDraft = z.output<typeof dailyReadingCoreDraftSchema>;
export type DailyReadingLearningDraft = z.output<typeof dailyReadingLearningDraftSchema>;
export type DailyReadingGenerationCheckpoint = z.output<
 typeof dailyReadingGenerationCheckpointSchema
>;
export type DailyReadingCheckpointRecord = z.output<typeof dailyReadingCheckpointRecordSchema>;

export const defaultDailyReadingSettings: DailyReadingSettings = {
 schemaVersion: "1.0.0",
 autoGenerateEnabled: true,
 preferredLevel: "HSK5",
};
