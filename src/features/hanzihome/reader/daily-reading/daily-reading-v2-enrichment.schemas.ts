import { z } from "zod";

import { aiRuntimeOperationErrorCodeSchema } from "@/lib/ai-runtime-contract";

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
});

export const dailyReadingV2EnrichmentErrorCodeSchema = z.union([
 aiRuntimeOperationErrorCodeSchema,
 z.enum(["missing-ai-key", "storage-unavailable"]),
]);

export const dailyReadingV2EnrichmentArticleSchema = z.strictObject({
 id: dailyReadingV2Schema.shape.id,
 source: dailyReadingV2Schema.shape.source,
 article: dailyReadingV2Schema.shape.article,
 classification: dailyReadingV2Schema.shape.classification,
});

export const dailyReadingV2EnrichmentRequestSchema = z.strictObject({
 module: dailyReadingV2EnrichmentModuleSchema,
 reading: dailyReadingV2EnrichmentArticleSchema,
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

export type DailyReadingV2EnrichmentArticle = z.output<
 typeof dailyReadingV2EnrichmentArticleSchema
>;
export type DailyReadingV2EnrichmentResponse = z.output<
 typeof dailyReadingV2EnrichmentResponseSchema
>;
export type DailyReadingV2GeneratedBy = z.output<typeof dailyReadingV2GeneratedBySchema>;
