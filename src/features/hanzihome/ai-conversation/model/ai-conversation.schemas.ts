import { z } from "zod";

import { aiRuntimeReceiptSchema } from "@/lib/ai/ai-task-contract";

const aiConversationMessageSchema = z.strictObject({
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
});

const aiConversationPersonaSchema = z.enum(["tutor", "friend", "hsk-examiner", "grammar-coach"]);
export const aiConversationLearnerLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export const aiConversationCorrectionStyleSchema = z.enum(["light", "balanced", "strict"]);
export const aiConversationReplyModeSchema = z.enum(["adaptive", "chinese", "bilingual"]);

const aiConversationProfileSchema = z.strictObject({
 persona: aiConversationPersonaSchema,
 displayName: z.string().trim().min(1).max(40),
 learnerLevel: aiConversationLearnerLevelSchema,
 correctionStyle: aiConversationCorrectionStyleSchema,
 replyMode: aiConversationReplyModeSchema,
 interests: z.string().trim().max(300),
 characterNotes: z.string().trim().max(600),
 memoryNotes: z.string().trim().max(1200),
});

export const aiConversationRequestSchema = z.strictObject({
 messages: z.array(aiConversationMessageSchema).min(1).max(24),
 profile: aiConversationProfileSchema,
 apiKeyId: z.uuid().optional(),
 model: z.string().trim().min(1).max(200).optional(),
});

export const aiConversationUsageSchema = z.strictObject({
 inputTokens: z.number().int().nonnegative(),
 outputTokens: z.number().int().nonnegative(),
 totalTokens: z.number().int().nonnegative(),
});

export const aiConversationResponseSchema = z.strictObject({
 message: z.string().trim().min(1),
 provider: z.string().trim().min(1),
 model: z.string().trim().min(1),
 apiKeyId: z.uuid().nullable(),
 runtimeReceipt: aiRuntimeReceiptSchema,
 usage: aiConversationUsageSchema.nullable(),
});

const aiConversationRuntimeHealthCodeSchema = z.enum([
 "ready",
 "key-unavailable",
 "missing-system-key",
 "invalid-key",
 "quota-exhausted",
 "provider-unavailable",
 "network-error",
]);

export const aiConversationRuntimeHealthSchema = z.strictObject({
 ready: z.boolean(),
 code: aiConversationRuntimeHealthCodeSchema,
 provider: z.string().trim().min(1).nullable(),
 model: z.string().trim().min(1).nullable(),
 source: z.enum(["personal", "system"]).nullable(),
});

export type AiConversationMessage = z.output<typeof aiConversationMessageSchema>;
export type AiConversationProfile = z.output<typeof aiConversationProfileSchema>;
export type AiConversationRuntimeHealth = z.output<typeof aiConversationRuntimeHealthSchema>;
