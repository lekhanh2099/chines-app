import { z } from "zod";

export const aiConversationMessageSchema = z.strictObject({
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
});

export const aiConversationPersonaSchema = z.enum([
 "tutor",
 "friend",
 "hsk-examiner",
 "grammar-coach",
]);
export const aiConversationLearnerLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export const aiConversationCorrectionStyleSchema = z.enum(["light", "balanced", "strict"]);
export const aiConversationReplyModeSchema = z.enum(["adaptive", "chinese", "bilingual"]);

export const aiConversationProfileSchema = z.strictObject({
 persona: aiConversationPersonaSchema,
 displayName: z.string().trim().min(1).max(40),
 learnerLevel: aiConversationLearnerLevelSchema,
 correctionStyle: aiConversationCorrectionStyleSchema,
 replyMode: aiConversationReplyModeSchema,
 interests: z.string().trim().max(300),
 characterNotes: z.string().trim().max(600),
 memoryNotes: z.string().trim().max(1200),
});

export const DEFAULT_AI_CONVERSATION_PROFILE: AiConversationProfile = {
 persona: "friend",
 displayName: "小林",
 learnerLevel: "intermediate",
 correctionStyle: "balanced",
 replyMode: "adaptive",
 interests: "đời sống Trung Quốc, phim ảnh, văn hóa, giao tiếp tự nhiên",
 characterNotes:
  "Nói tự nhiên như một người bạn Trung Quốc kiên nhẫn, không nói kiểu trợ lý máy móc.",
 memoryNotes: "",
};

export const aiConversationRequestSchema = z.strictObject({
 messages: z.array(aiConversationMessageSchema).min(1).max(24),
 profile: aiConversationProfileSchema,
 apiKeyId: z.uuid().optional(),
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
 usage: aiConversationUsageSchema.nullable(),
});

export const aiConversationRuntimeHealthCodeSchema = z.enum([
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
export type AiConversationUsage = z.output<typeof aiConversationUsageSchema>;
export type AiConversationResponse = z.output<typeof aiConversationResponseSchema>;
export type AiConversationRuntimeHealth = z.output<typeof aiConversationRuntimeHealthSchema>;
