import { z } from "zod";

import { aiRuntimeOperationErrorCodeSchema } from "@/lib/ai-runtime-contract";
import { aiRuntimeReceiptSchema } from "@/lib/ai-task-contract";

import {
 dailyReadingEnrichmentBlockReasonSchema,
 dailyReadingEnrichmentModuleSchema,
 dailyReadingGrammarDataSchema,
 dailyReadingQuestionsDataSchema,
 dailyReadingSchema,
 dailyReadingTranslationDataSchema,
 dailyReadingVocabularyDataSchema,
} from "@/features/daily-reading/daily-reading.schemas";

export const dailyReadingGeneratedBySchema = z.strictObject({
 provider: z.string().trim().min(1).max(80),
 model: z.string().trim().min(1).max(160),
 receipt: aiRuntimeReceiptSchema.optional(),
});

export const dailyReadingEnrichmentErrorCodeSchema = z.union([
 aiRuntimeOperationErrorCodeSchema,
 z.enum(["missing-ai-key", "storage-unavailable", "task-disabled"]),
]);

export const dailyReadingEnrichmentArticleSchema = z.strictObject({
 id: dailyReadingSchema.shape.id,
 source: dailyReadingSchema.shape.source,
 article: dailyReadingSchema.shape.article,
 classification: dailyReadingSchema.shape.classification,
});

export const dailyReadingEnrichmentRequestSchema = z.discriminatedUnion("module", [
 z.strictObject({
  module: z.literal("translation"),
  reading: dailyReadingEnrichmentArticleSchema,
  targetCount: z.null(),
 }),
 z.strictObject({
  module: z.literal("vocabulary"),
  reading: dailyReadingEnrichmentArticleSchema,
  targetCount: z.number().int().min(1).max(24),
 }),
 z.strictObject({
  module: z.literal("grammar"),
  reading: dailyReadingEnrichmentArticleSchema,
  targetCount: z.number().int().min(1).max(10),
 }),
 z.strictObject({
  module: z.literal("questions"),
  reading: dailyReadingEnrichmentArticleSchema,
  targetCount: z.number().int().min(5).max(12),
 }),
]);

export const dailyReadingEnrichmentJobModuleRequestSchema = z.discriminatedUnion("module", [
 z.strictObject({ module: z.literal("translation"), targetCount: z.null() }),
 z.strictObject({
  module: z.literal("vocabulary"),
  targetCount: z.number().int().min(1).max(24),
 }),
 z.strictObject({
  module: z.literal("grammar"),
  targetCount: z.number().int().min(1).max(10),
 }),
 z.strictObject({
  module: z.literal("questions"),
  targetCount: z.number().int().min(5).max(12),
 }),
]);

export const dailyReadingEnrichmentJobRequestSchema = z.strictObject({
 runId: z.uuid(),
 regenerate: z.boolean(),
 reading: dailyReadingEnrichmentArticleSchema,
 modules: z
  .array(dailyReadingEnrichmentJobModuleRequestSchema)
  .min(1)
  .max(4)
  .refine((modules) => new Set(modules.map((module) => module.module)).size === modules.length),
});

const translationSuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("translation"),
 data: dailyReadingTranslationDataSchema,
 generatedBy: dailyReadingGeneratedBySchema,
});

const vocabularySuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("vocabulary"),
 data: dailyReadingVocabularyDataSchema,
 generatedBy: dailyReadingGeneratedBySchema,
});

const grammarSuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("grammar"),
 data: dailyReadingGrammarDataSchema,
 generatedBy: dailyReadingGeneratedBySchema,
});

const questionsSuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("questions"),
 data: dailyReadingQuestionsDataSchema,
 generatedBy: dailyReadingGeneratedBySchema,
});

const blockedSchema = z.strictObject({
 ok: z.literal(false),
 status: z.literal("blocked"),
 module: dailyReadingEnrichmentModuleSchema,
 reason: dailyReadingEnrichmentBlockReasonSchema,
 errorCode: dailyReadingEnrichmentErrorCodeSchema,
 errorDetail: z.string().trim().min(1).max(600),
});

const failedSchema = z.strictObject({
 ok: z.literal(false),
 status: z.literal("failed"),
 module: dailyReadingEnrichmentModuleSchema,
 errorCode: dailyReadingEnrichmentErrorCodeSchema,
 errorDetail: z.string().trim().min(1).max(600),
});

export const dailyReadingEnrichmentResponseSchema = z.union([
 translationSuccessSchema,
 vocabularySuccessSchema,
 grammarSuccessSchema,
 questionsSuccessSchema,
 blockedSchema,
 failedSchema,
]);

export const dailyReadingEnrichmentJobStatusSchema = z.enum([
 "queued",
 "running",
 "succeeded",
 "failed",
 "blocked",
]);

export const dailyReadingEnrichmentJobSchema = z.strictObject({
 id: z.uuid(),
 runId: z.uuid(),
 workflowRunId: z.string().min(1).max(200).nullable(),
 articleId: z.string().min(1).max(200),
 articleFingerprint: dailyReadingSchema.shape.article.shape.fingerprint,
 module: dailyReadingEnrichmentModuleSchema,
 taskId: aiRuntimeReceiptSchema.shape.taskId,
 status: dailyReadingEnrichmentJobStatusSchema,
 receipt: aiRuntimeReceiptSchema.nullable(),
 reused: z.boolean(),
 progress: z.strictObject({
  completed: z.number().int().nonnegative(),
  total: z.number().int().positive(),
 }),
 result: dailyReadingEnrichmentResponseSchema.nullable(),
 errorCode: dailyReadingEnrichmentErrorCodeSchema.or(z.literal("workflow-stalled")).nullable(),
 createdAt: z.iso.datetime({ offset: true }),
 startedAt: z.iso.datetime({ offset: true }).nullable(),
 completedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const dailyReadingTranslationProgressEventSchema = z.strictObject({
 jobId: z.uuid(),
 runId: z.uuid(),
 articleId: z.string().min(1).max(200),
 articleFingerprint: dailyReadingSchema.shape.article.shape.fingerprint,
 progressCompleted: z.number().int().nonnegative(),
 progressTotal: z.number().int().positive(),
 paragraphs: z.array(dailyReadingTranslationDataSchema.shape.paragraphs.element).min(1).max(80),
});

export const dailyReadingEnrichmentJobsResponseSchema = z.strictObject({
 runId: z.uuid(),
 jobs: z.array(dailyReadingEnrichmentJobSchema).min(1).max(4),
});

export const dailyReadingEnrichmentJobsQueryResponseSchema = z.strictObject({
 runId: z.uuid().nullable(),
 jobs: z.array(dailyReadingEnrichmentJobSchema).max(4),
});

export type DailyReadingEnrichmentArticle = z.output<typeof dailyReadingEnrichmentArticleSchema>;
export type DailyReadingEnrichmentResponse = z.output<typeof dailyReadingEnrichmentResponseSchema>;
export type DailyReadingGeneratedBy = z.output<typeof dailyReadingGeneratedBySchema>;
export type DailyReadingEnrichmentJobModuleRequest = z.output<
 typeof dailyReadingEnrichmentJobModuleRequestSchema
>;
export type DailyReadingEnrichmentJob = z.output<typeof dailyReadingEnrichmentJobSchema>;
export type DailyReadingTranslationProgressEvent = z.output<
 typeof dailyReadingTranslationProgressEventSchema
>;
