import { z } from "zod";

import { aiRuntimeOperationErrorCodeSchema } from "@/lib/ai-runtime-contract";
import { aiRuntimeReceiptSchema } from "@/lib/ai-task-contract";

import {
 dailyReadingV2EnrichmentBlockReasonSchema,
 dailyReadingV2EnrichmentModuleSchema,
 dailyReadingV2GrammarDataSchema,
 dailyReadingV2QuestionsDataSchema,
 dailyReadingV2Schema,
 dailyReadingV2TranslationDataSchema,
 dailyReadingV2VocabularyDataSchema,
} from "./daily-reading-v2.schemas";

export const dailyReadingV2GeneratedBySchema = z.strictObject({
 provider: z.string().trim().min(1).max(80),
 model: z.string().trim().min(1).max(160),
 receipt: aiRuntimeReceiptSchema.optional(),
});

export const dailyReadingV2EnrichmentErrorCodeSchema = z.union([
 aiRuntimeOperationErrorCodeSchema,
 z.enum(["missing-ai-key", "storage-unavailable", "task-disabled"]),
]);

export const dailyReadingV2EnrichmentArticleSchema = z.strictObject({
 id: dailyReadingV2Schema.shape.id,
 source: dailyReadingV2Schema.shape.source,
 article: dailyReadingV2Schema.shape.article,
 classification: dailyReadingV2Schema.shape.classification,
});

export const dailyReadingV2EnrichmentRequestSchema = z.discriminatedUnion("module", [
 z.strictObject({
  module: z.literal("translation"),
  reading: dailyReadingV2EnrichmentArticleSchema,
  targetCount: z.null(),
 }),
 z.strictObject({
  module: z.literal("vocabulary"),
  reading: dailyReadingV2EnrichmentArticleSchema,
  targetCount: z.number().int().min(1).max(24),
 }),
 z.strictObject({
  module: z.literal("grammar"),
  reading: dailyReadingV2EnrichmentArticleSchema,
  targetCount: z.number().int().min(1).max(10),
 }),
 z.strictObject({
  module: z.literal("questions"),
  reading: dailyReadingV2EnrichmentArticleSchema,
  targetCount: z.number().int().min(5).max(12),
 }),
]);

export const dailyReadingV2EnrichmentJobModuleRequestSchema = z.discriminatedUnion("module", [
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

export const dailyReadingV2EnrichmentJobRequestSchema = z.strictObject({
 runId: z.uuid(),
 reading: dailyReadingV2EnrichmentArticleSchema,
 modules: z
  .array(dailyReadingV2EnrichmentJobModuleRequestSchema)
  .min(1)
  .max(4)
  .refine((modules) => new Set(modules.map((module) => module.module)).size === modules.length),
});

const translationSuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("translation"),
 data: dailyReadingV2TranslationDataSchema,
 generatedBy: dailyReadingV2GeneratedBySchema,
});

const vocabularySuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("vocabulary"),
 data: dailyReadingV2VocabularyDataSchema,
 generatedBy: dailyReadingV2GeneratedBySchema,
});

const grammarSuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("grammar"),
 data: dailyReadingV2GrammarDataSchema,
 generatedBy: dailyReadingV2GeneratedBySchema,
});

const questionsSuccessSchema = z.strictObject({
 ok: z.literal(true),
 module: z.literal("questions"),
 data: dailyReadingV2QuestionsDataSchema,
 generatedBy: dailyReadingV2GeneratedBySchema,
});

const blockedSchema = z.strictObject({
 ok: z.literal(false),
 status: z.literal("blocked"),
 module: dailyReadingV2EnrichmentModuleSchema,
 reason: dailyReadingV2EnrichmentBlockReasonSchema,
 errorCode: dailyReadingV2EnrichmentErrorCodeSchema,
 errorDetail: z.string().trim().min(1).max(600),
});

const failedSchema = z.strictObject({
 ok: z.literal(false),
 status: z.literal("failed"),
 module: dailyReadingV2EnrichmentModuleSchema,
 errorCode: dailyReadingV2EnrichmentErrorCodeSchema,
 errorDetail: z.string().trim().min(1).max(600),
});

export const dailyReadingV2EnrichmentResponseSchema = z.union([
 translationSuccessSchema,
 vocabularySuccessSchema,
 grammarSuccessSchema,
 questionsSuccessSchema,
 blockedSchema,
 failedSchema,
]);

export const dailyReadingV2EnrichmentJobStatusSchema = z.enum([
 "queued",
 "running",
 "succeeded",
 "failed",
 "blocked",
]);

export const dailyReadingV2EnrichmentJobSchema = z.strictObject({
 id: z.uuid(),
 runId: z.uuid(),
 workflowRunId: z.string().min(1).max(200).nullable(),
 articleId: z.string().min(1).max(200),
 articleFingerprint: dailyReadingV2Schema.shape.article.shape.fingerprint,
 module: dailyReadingV2EnrichmentModuleSchema,
 taskId: aiRuntimeReceiptSchema.shape.taskId,
 status: dailyReadingV2EnrichmentJobStatusSchema,
 receipt: aiRuntimeReceiptSchema.nullable(),
 progress: z.strictObject({
  completed: z.number().int().nonnegative(),
  total: z.number().int().positive(),
 }),
 result: dailyReadingV2EnrichmentResponseSchema.nullable(),
 errorCode: dailyReadingV2EnrichmentErrorCodeSchema.or(z.literal("workflow-stalled")).nullable(),
 createdAt: z.iso.datetime({ offset: true }),
 startedAt: z.iso.datetime({ offset: true }).nullable(),
 completedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const dailyReadingV2EnrichmentJobsResponseSchema = z.strictObject({
 runId: z.uuid(),
 jobs: z.array(dailyReadingV2EnrichmentJobSchema).min(1).max(4),
});

export const dailyReadingV2EnrichmentJobsQueryResponseSchema = z.strictObject({
 runId: z.uuid().nullable(),
 jobs: z.array(dailyReadingV2EnrichmentJobSchema).max(4),
});

export type DailyReadingV2EnrichmentArticle = z.output<
 typeof dailyReadingV2EnrichmentArticleSchema
>;
export type DailyReadingV2EnrichmentResponse = z.output<
 typeof dailyReadingV2EnrichmentResponseSchema
>;
export type DailyReadingV2GeneratedBy = z.output<typeof dailyReadingV2GeneratedBySchema>;
export type DailyReadingV2EnrichmentJobModuleRequest = z.output<
 typeof dailyReadingV2EnrichmentJobModuleRequestSchema
>;
export type DailyReadingV2EnrichmentJob = z.output<typeof dailyReadingV2EnrichmentJobSchema>;
