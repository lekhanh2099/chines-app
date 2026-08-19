import { z } from "zod";

import { aiConversationMemoryKindSchema } from "@/features/hanzihome/ai-conversation/ai-conversation-memory.schemas";
import { aiConversationModeSchema } from "@/features/hanzihome/ai-conversation/ai-conversation-session.schemas";
import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationReplyModeSchema,
} from "@/features/hanzihome/ai-conversation/ai-conversation.schemas";

export const aiConversationAccountPreferencesSchema = z.strictObject({
 defaultMode: aiConversationModeSchema,
 defaultCorrectionStyle: aiConversationCorrectionStyleSchema,
 defaultReplyMode: aiConversationReplyModeSchema,
 learnerLevel: aiConversationLearnerLevelSchema,
 memoryEnabled: z.boolean(),
});

export const aiConversationSettingsCharacterSchema = z.strictObject({
 id: z.uuid(),
 displayName: z.string().trim().min(1),
 city: z.string(),
});

export const aiConversationSettingsRelationshipSchema = z.strictObject({
 nickname: z.string(),
 familiarityScore: z.number().min(0).max(1),
});

export const aiConversationSettingsOverviewSchema = z.strictObject({
 preferences: aiConversationAccountPreferencesSchema,
 character: aiConversationSettingsCharacterSchema.nullable(),
 relationship: aiConversationSettingsRelationshipSchema.nullable(),
});

export const aiConversationManagedMemorySchema = z.strictObject({
 id: z.uuid(),
 characterId: z.uuid().nullable(),
 characterName: z.string().trim().min(1).nullable(),
 kind: aiConversationMemoryKindSchema,
 content: z.string().trim().min(1).max(600),
 updatedAt: z.iso.datetime({ offset: true }),
});

export const aiConversationManagedMemoryListSchema = z
 .array(aiConversationManagedMemorySchema)
 .max(200);

export const aiConversationMemoryEditSchema = z.strictObject({
 memoryId: z.uuid(),
 content: z.string().trim().min(1).max(600),
});

export const aiConversationMemoryResolveSchema = z.strictObject({ memoryId: z.uuid() });
export const aiConversationMemoryForgetSchema = z.strictObject({ memoryId: z.uuid() });

export const aiConversationMemoryResolvedResponseSchema = z.strictObject({
 memoryId: z.uuid(),
 resolved: z.literal(true),
});

export const aiConversationMemoryForgottenResponseSchema = z.strictObject({
 memoryId: z.uuid(),
 forgotten: z.literal(true),
});

export type AiConversationAccountPreferences = z.output<
 typeof aiConversationAccountPreferencesSchema
>;
export type AiConversationSettingsOverview = z.output<typeof aiConversationSettingsOverviewSchema>;
export type AiConversationManagedMemory = z.output<typeof aiConversationManagedMemorySchema>;
