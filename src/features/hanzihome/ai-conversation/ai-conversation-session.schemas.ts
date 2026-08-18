import { z } from "zod";

import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationReplyModeSchema,
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
 correctionStyle: aiConversationCorrectionStyleSchema,
 replyMode: aiConversationReplyModeSchema,
 memoryPolicy: aiConversationMemoryPolicySchema,
});

export const aiConversationCharacterPresentationSchema = z.strictObject({
 id: z.uuid(),
 displayName: z.string().trim().min(1),
 city: z.string(),
 interests: z.array(z.string()),
});

export const aiConversationRelationshipPresentationSchema = z.strictObject({
 nickname: z.string(),
 familiarityScore: z.number().min(0).max(1),
});

export const aiConversationSessionSchema = z.strictObject({
 conversation: aiConversationThreadSchema.nullable(),
 character: aiConversationCharacterPresentationSchema.nullable(),
 relationship: aiConversationRelationshipPresentationSchema.nullable(),
 learnerLevel: aiConversationLearnerLevelSchema,
 memoryEnabled: z.boolean(),
 messages: z.array(aiConversationPersistedMessageSchema),
});

export const aiConversationHistoryItemSchema = z.strictObject({
 id: z.uuid(),
 characterId: z.uuid(),
 title: z.string(),
 mode: aiConversationModeSchema,
 memoryPolicy: aiConversationMemoryPolicySchema,
 lastMessageAt: z.iso.datetime({ offset: true }).nullable(),
 createdAt: z.iso.datetime({ offset: true }),
 updatedAt: z.iso.datetime({ offset: true }),
});

export const aiConversationHistorySchema = z.array(aiConversationHistoryItemSchema).max(50);

export const aiConversationSettingsUpdateSchema = z.strictObject({
 mode: aiConversationModeSchema,
 correctionStyle: aiConversationCorrectionStyleSchema,
 replyMode: aiConversationReplyModeSchema,
 learnerLevel: aiConversationLearnerLevelSchema,
});

export const aiConversationSettingsSchema = aiConversationSettingsUpdateSchema.extend({
 conversationId: z.uuid(),
 characterId: z.uuid(),
});

export const aiConversationMemoryPolicyStateSchema = z.strictObject({
 conversationId: z.uuid(),
 memoryPolicy: aiConversationMemoryPolicySchema,
 memoryEnabled: z.boolean(),
});

export const aiConversationArchiveResponseSchema = z.strictObject({
 conversationId: z.uuid(),
 archived: z.literal(true),
});

export const aiConversationPostTurnProcessResponseSchema = z.strictObject({
 processed: z.number().int().nonnegative(),
 ready: z.boolean(),
});

export const aiConversationTurnRequestSchema = z.strictObject({
 clientMessageId: z.uuid(),
 content: z.string().trim().min(1).max(6000),
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

export type AiConversationMode = z.output<typeof aiConversationModeSchema>;
export type AiConversationMemoryPolicy = z.output<typeof aiConversationMemoryPolicySchema>;
export type AiConversationPersistedMessage = z.output<
 typeof aiConversationPersistedMessageSchema
>;
export type AiConversationSession = z.output<typeof aiConversationSessionSchema>;
export type AiConversationHistoryItem = z.output<typeof aiConversationHistoryItemSchema>;
export type AiConversationSettings = z.output<typeof aiConversationSettingsSchema>;
export type AiConversationSettingsUpdate = z.output<typeof aiConversationSettingsUpdateSchema>;
export type AiConversationMemoryPolicyState = z.output<
 typeof aiConversationMemoryPolicyStateSchema
>;
export type AiConversationArchiveResponse = z.output<typeof aiConversationArchiveResponseSchema>;
export type AiConversationPostTurnProcessResponse = z.output<
 typeof aiConversationPostTurnProcessResponseSchema
>;
export type AiConversationTurnRequest = z.output<typeof aiConversationTurnRequestSchema>;
export type AiConversationTurnResponse = z.output<typeof aiConversationTurnResponseSchema>;
