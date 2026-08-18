import { z } from "zod";

import {
 aiConversationProfileSchema,
 aiConversationUsageSchema,
} from "./ai-conversation.schemas";

export const aiConversationModeSchema = z.enum([
 "natural",
 "speaking-practice",
 "grammar-coach",
 "hskk-practice",
]);

export const aiConversationMemoryPolicySchema = z.enum(["inherit", "enabled", "disabled"]);

export const aiConversationPersistedMessageSchema = z.strictObject({
 id: z.uuid(),
 seq: z.number().int().positive(),
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
 createdAt: z.iso.datetime({ offset: true }),
});

export const aiConversationThreadSchema = z.strictObject({
 id: z.uuid(),
 characterId: z.uuid(),
 title: z.string(),
 mode: aiConversationModeSchema,
 correctionStyle: z.enum(["light", "balanced", "strict"]),
 replyMode: z.enum(["adaptive", "chinese", "bilingual"]),
 memoryPolicy: aiConversationMemoryPolicySchema,
});

export const aiConversationSessionSchema = z.strictObject({
 conversation: aiConversationThreadSchema.nullable(),
 messages: z.array(aiConversationPersistedMessageSchema),
});

export const aiConversationTurnRequestSchema = z.strictObject({
 clientMessageId: z.uuid(),
 content: z.string().trim().min(1).max(6000),
 profile: aiConversationProfileSchema,
 apiKeyId: z.uuid().optional(),
});

export const aiConversationTurnResponseSchema = z.strictObject({
 conversationId: z.uuid(),
 userMessage: aiConversationPersistedMessageSchema,
 assistantMessage: aiConversationPersistedMessageSchema,
 provider: z.string().trim().min(1),
 model: z.string().trim().min(1),
 apiKeyId: z.uuid().nullable(),
 usage: aiConversationUsageSchema.nullable(),
});

export type AiConversationPersistedMessage = z.output<
 typeof aiConversationPersistedMessageSchema
>;
export type AiConversationSession = z.output<typeof aiConversationSessionSchema>;
export type AiConversationTurnRequest = z.output<typeof aiConversationTurnRequestSchema>;
export type AiConversationTurnResponse = z.output<typeof aiConversationTurnResponseSchema>;
