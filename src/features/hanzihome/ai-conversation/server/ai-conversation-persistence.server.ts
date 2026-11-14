import "server-only";

import { z } from "zod";

import type { JsonObject } from "@/types/json";

import type { AiConversationContextState } from "./ai-conversation-context.server";
import {
 AiConversationPersistenceRequestError,
 requestPostgrest,
} from "./ai-conversation-persistence-client.server";
import {
 resolveMemoryEnabled,
 toHistoryItem,
 toPersistedMessage,
 toSession,
} from "./ai-conversation-persistence-model.server";
import {
 createConversation,
 createDefaultCharacter,
 findDefaultCharacterId,
 findLatestConversation,
 findOwnedConversation,
 loadCharacter,
 loadConversationPreferences,
 loadRelationship,
 loadSessionForConversation,
} from "./ai-conversation-persistence-records.server";
import {
 assistantReplyRowSchema,
 conversationContextRowSchema,
 conversationHistoryRowSchema,
 conversationRowSchema,
 messageRowSchema,
 messageRpcResultSchema,
 preferenceContextRowSchema,
} from "./ai-conversation-persistence-schemas.server";
import type {
 AiConversationHistoryItem,
 AiConversationMemoryPolicy,
 AiConversationMemoryPolicyState,
 AiConversationPersistedMessage,
 AiConversationSession,
 AiConversationSettings,
 AiConversationSettingsUpdate,
} from "../model/ai-conversation-session.schemas";

export {
 AiConversationPersistenceConfigurationError,
 AiConversationPersistenceNotReadyError,
 AiConversationPersistenceRequestError,
} from "./ai-conversation-persistence-client.server";

export async function loadLatestAiConversationSession(
 userId: string,
): Promise<AiConversationSession> {
 const [conversation, preferences] = await Promise.all([
  findLatestConversation(userId),
  loadConversationPreferences(userId),
 ]);
 if (!conversation) return toSession(null, null, null, preferences, []);

 return loadSessionForConversation({ userId, conversation, preferences });
}

export async function loadAiConversationSession({
 userId,
 conversationId,
}: {
 userId: string;
 conversationId: string;
}): Promise<AiConversationSession> {
 const [conversation, preferences] = await Promise.all([
  findOwnedConversation(userId, conversationId),
  loadConversationPreferences(userId),
 ]);
 if (!conversation) {
  throw new AiConversationPersistenceRequestError(
   404,
   "AI_CONVERSATION_NOT_FOUND",
   "AI conversation not found",
  );
 }
 return loadSessionForConversation({ userId, conversation, preferences });
}

export async function ensureAiConversationSession(userId: string): Promise<AiConversationSession> {
 const [existing, preferences] = await Promise.all([
  findLatestConversation(userId),
  loadConversationPreferences(userId),
 ]);
 if (existing) {
  return loadSessionForConversation({ userId, conversation: existing, preferences });
 }

 const characterId =
  (await findDefaultCharacterId(userId)) ?? (await createDefaultCharacter(userId));
 const conversation = await createConversation(userId, characterId, preferences);
 return loadSessionForConversation({ userId, conversation, preferences });
}

export async function createAiConversationSession(userId: string): Promise<AiConversationSession> {
 const preferences = await loadConversationPreferences(userId);
 const characterId =
  (await findDefaultCharacterId(userId)) ?? (await createDefaultCharacter(userId));
 const conversation = await createConversation(userId, characterId, preferences);
 return loadSessionForConversation({ userId, conversation, preferences });
}

export async function listAiConversationHistory(
 userId: string,
 limit = 30,
): Promise<AiConversationHistoryItem[]> {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationHistoryRowSchema),
  params: {
   select:
    "id,character_id,title,mode,correction_style,reply_mode,memory_policy,last_message_at,created_at,updated_at",
   user_id: `eq.${userId}`,
   archived_at: "is.null",
   order: "last_message_at.desc.nullslast,created_at.desc",
   limit: String(Math.min(Math.max(limit, 1), 50)),
  },
 });
 return rows.map(toHistoryItem);
}

export async function updateAiConversationSettings({
 userId,
 conversationId,
 settings,
}: {
 userId: string;
 conversationId: string;
 settings: AiConversationSettingsUpdate;
}): Promise<AiConversationSettings> {
 const conversations = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema),
  method: "PATCH",
  params: {
   select: "id,character_id,title,mode,correction_style,reply_mode,memory_policy",
   user_id: `eq.${userId}`,
   id: `eq.${conversationId}`,
   archived_at: "is.null",
  },
  body: {
   mode: settings.mode,
   correction_style: settings.correctionStyle,
   reply_mode: settings.replyMode,
   updated_at: new Date().toISOString(),
  },
  prefer: "return=representation",
 });
 const conversation = conversations[0];
 if (!conversation) {
  throw new AiConversationPersistenceRequestError(
   404,
   "AI_CONVERSATION_NOT_FOUND",
   "AI conversation not found",
  );
 }

 const preferences = await requestPostgrest({
  resource: "ai_conversation_preferences",
  schema: z.array(preferenceContextRowSchema).min(1),
  method: "POST",
  params: {
   select: "default_mode,default_correction_style,default_reply_mode,learner_level,memory_enabled",
   on_conflict: "user_id",
  },
  body: {
   user_id: userId,
   learner_level: settings.learnerLevel,
   updated_at: new Date().toISOString(),
  },
  prefer: "resolution=merge-duplicates,return=representation",
 });
 const preference = preferences[0];
 if (!preference) {
  throw new Error("AI conversation preference upsert returned no row");
 }

 return {
  conversationId: conversation.id,
  characterId: conversation.character_id,
  mode: conversation.mode,
  correctionStyle: conversation.correction_style,
  replyMode: conversation.reply_mode,
  learnerLevel: preference.learner_level,
 };
}

export async function updateAiConversationMemoryPolicy({
 userId,
 conversationId,
 memoryPolicy,
}: {
 userId: string;
 conversationId: string;
 memoryPolicy: AiConversationMemoryPolicy;
}): Promise<AiConversationMemoryPolicyState> {
 const conversations = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema),
  method: "PATCH",
  params: {
   select: "id,character_id,title,mode,correction_style,reply_mode,memory_policy",
   user_id: `eq.${userId}`,
   id: `eq.${conversationId}`,
   archived_at: "is.null",
  },
  body: {
   memory_policy: memoryPolicy,
   updated_at: new Date().toISOString(),
  },
  prefer: "return=representation",
 });
 const conversation = conversations[0];
 if (!conversation) {
  throw new AiConversationPersistenceRequestError(
   404,
   "AI_CONVERSATION_NOT_FOUND",
   "AI conversation not found",
  );
 }
 const preferences = await loadConversationPreferences(userId);
 return {
  conversationId: conversation.id,
  memoryPolicy: conversation.memory_policy,
  memoryEnabled: resolveMemoryEnabled(conversation.memory_policy, preferences.memory_enabled),
 };
}

export async function archiveAiConversation({
 userId,
 conversationId,
}: {
 userId: string;
 conversationId: string;
}): Promise<{ conversationId: string; archived: true }> {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(z.object({ id: z.uuid() })),
  method: "PATCH",
  params: {
   select: "id",
   user_id: `eq.${userId}`,
   id: `eq.${conversationId}`,
   archived_at: "is.null",
  },
  body: {
   archived_at: new Date().toISOString(),
   updated_at: new Date().toISOString(),
  },
  prefer: "return=representation",
 });
 const row = rows[0];
 if (!row) {
  throw new AiConversationPersistenceRequestError(
   404,
   "AI_CONVERSATION_NOT_FOUND",
   "AI conversation not found",
  );
 }
 return { conversationId: row.id, archived: true };
}

export async function loadAiConversationContextState({
 userId,
 conversationId,
}: {
 userId: string;
 conversationId: string;
}): Promise<AiConversationContextState> {
 const conversations = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationContextRowSchema),
  params: {
   select:
    "id,character_id,title,mode,correction_style,reply_mode,memory_policy,summary,summary_until_seq",
   user_id: `eq.${userId}`,
   id: `eq.${conversationId}`,
   archived_at: "is.null",
   limit: "1",
  },
 });
 const conversation = conversations[0];
 if (!conversation) {
  throw new AiConversationPersistenceRequestError(
   404,
   "AI_CONVERSATION_NOT_FOUND",
   "AI conversation not found",
  );
 }

 const [character, relationship, preferences] = await Promise.all([
  loadCharacter(userId, conversation.character_id),
  loadRelationship(userId, conversation.character_id),
  loadConversationPreferences(userId),
 ]);

 return {
  conversation: {
   id: conversation.id,
   characterId: conversation.character_id,
   mode: conversation.mode,
   correctionStyle: conversation.correction_style,
   replyMode: conversation.reply_mode,
   memoryPolicy: conversation.memory_policy,
   summary: conversation.summary,
   summaryUntilSeq: conversation.summary_until_seq,
  },
  character: {
   id: character.id,
   displayName: character.display_name,
   city: character.city,
   age: character.age,
   background: character.background,
   personality: character.personality,
   speakingStyle: character.speaking_style,
   interests: character.interests,
   identityNotes: character.identity_notes,
  },
  relationship: relationship
   ? {
      nickname: relationship.nickname,
      familiarityScore: relationship.familiarity_score,
      revision: relationship.revision,
     }
   : null,
  learnerLevel: preferences.learner_level,
 };
}

export async function appendAiConversationMessage({
 userId,
 conversationId,
 role,
 content,
 clientMessageId,
 replyToMessageId,
 metadata,
}: {
 userId: string;
 conversationId: string;
 role: "user" | "assistant";
 content: string;
 clientMessageId?: string;
 replyToMessageId?: string;
 metadata?: JsonObject;
}): Promise<AiConversationPersistedMessage> {
 const row = await requestPostgrest({
  resource: "rpc/ai_append_message",
  schema: messageRpcResultSchema,
  method: "POST",
  body: {
   p_user_id: userId,
   p_conversation_id: conversationId,
   p_role: role,
   p_content: content,
   p_client_message_id: clientMessageId ?? null,
   p_reply_to_message_id: replyToMessageId ?? null,
   p_metadata: metadata ?? {},
  },
 });
 return toPersistedMessage(row);
}

export async function findAssistantReplyForUserMessage({
 userId,
 conversationId,
 userMessageId,
}: {
 userId: string;
 conversationId: string;
 userMessageId: string;
}): Promise<{
 message: AiConversationPersistedMessage;
 provider: string;
 model: string;
 apiKeyId: string | null;
 runtimeReceipt: AiConversationPersistedMessage["runtimeReceipt"] | null;
} | null> {
 const rows = await requestPostgrest({
  resource: "ai_messages",
  schema: z.array(assistantReplyRowSchema),
  params: {
   select: "id,seq,role,content,created_at,metadata",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   role: "eq.assistant",
   reply_to_message_id: `eq.${userMessageId}`,
   limit: "1",
  },
 });
 const row = rows[0];
 if (!row) return null;
 return {
  message: toPersistedMessage(row),
  provider: row.metadata.provider,
  model: row.metadata.model,
  apiKeyId: row.metadata.apiKeyId,
  runtimeReceipt:
   row.metadata.apiKeyId &&
   row.metadata.taskId &&
   row.metadata.keyLabel &&
   row.metadata.resolutionSource
    ? {
       taskId: row.metadata.taskId,
       provider: row.metadata.provider,
       model: row.metadata.model,
       keyId: row.metadata.apiKeyId,
       keyLabel: row.metadata.keyLabel,
       resolutionSource: row.metadata.resolutionSource,
      }
    : null,
 };
}

export async function loadRecentAiConversationMessages({
 userId,
 conversationId,
 limit,
}: {
 userId: string;
 conversationId: string;
 limit: number;
}): Promise<AiConversationPersistedMessage[]> {
 const rows = await requestPostgrest({
  resource: "ai_messages",
  schema: z.array(messageRowSchema),
  params: {
   select: "id,seq,role,content,created_at,metadata",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   order: "seq.desc",
   limit: String(limit),
  },
 });
 return rows.reverse().map(toPersistedMessage);
}
