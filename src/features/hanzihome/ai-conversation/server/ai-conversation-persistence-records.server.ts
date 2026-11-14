import "server-only";

import { z } from "zod";

import {
 AiConversationPersistenceRequestError,
 requestPostgrest,
} from "./ai-conversation-persistence-client.server";
import { toSession } from "./ai-conversation-persistence-model.server";
import {
 characterContextRowSchema,
 characterRowSchema,
 conversationRowSchema,
 DEFAULT_CHARACTER,
 DEFAULT_CONVERSATION_PREFERENCES,
 messageRowSchema,
 preferenceContextRowSchema,
 relationshipContextRowSchema,
} from "./ai-conversation-persistence-schemas.server";

export async function findLatestConversation(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema),
  params: {
   select: "id,character_id,title,mode,correction_style,reply_mode,memory_policy",
   user_id: `eq.${userId}`,
   archived_at: "is.null",
   order: "last_message_at.desc.nullslast,created_at.desc",
   limit: "1",
  },
 });
 return rows[0] ?? null;
}

export async function findOwnedConversation(userId: string, conversationId: string) {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema),
  params: {
   select: "id,character_id,title,mode,correction_style,reply_mode,memory_policy",
   user_id: `eq.${userId}`,
   id: `eq.${conversationId}`,
   archived_at: "is.null",
   limit: "1",
  },
 });
 return rows[0] ?? null;
}

export async function loadConversationPreferences(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_conversation_preferences",
  schema: z.array(preferenceContextRowSchema),
  params: {
   select: "default_mode,default_correction_style,default_reply_mode,learner_level,memory_enabled",
   user_id: `eq.${userId}`,
   limit: "1",
  },
 });
 return rows[0] ?? DEFAULT_CONVERSATION_PREFERENCES;
}

export async function findDefaultCharacterId(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_characters",
  schema: z.array(characterRowSchema),
  params: {
   select: "id",
   user_id: `eq.${userId}`,
   display_name: `eq.${DEFAULT_CHARACTER.display_name}`,
   archived_at: "is.null",
   order: "created_at.asc",
   limit: "1",
  },
 });
 return rows[0]?.id ?? null;
}

export async function loadCharacter(userId: string, characterId: string) {
 const rows = await requestPostgrest({
  resource: "ai_characters",
  schema: z.array(characterContextRowSchema),
  params: {
   select:
    "id,display_name,city,age,background,personality,speaking_style,interests,identity_notes",
   user_id: `eq.${userId}`,
   id: `eq.${characterId}`,
   archived_at: "is.null",
   limit: "1",
  },
 });
 const character = rows[0];
 if (!character) {
  throw new AiConversationPersistenceRequestError(
   409,
   "AI_CHARACTER_NOT_FOUND",
   "AI character not found",
  );
 }
 return character;
}

export async function loadRelationship(userId: string, characterId: string) {
 const rows = await requestPostgrest({
  resource: "ai_relationship_states",
  schema: z.array(relationshipContextRowSchema),
  params: {
   select: "nickname,familiarity_score,revision",
   user_id: `eq.${userId}`,
   character_id: `eq.${characterId}`,
   limit: "1",
  },
 });
 return rows[0] ?? null;
}

export async function createDefaultCharacter(userId: string) {
 const rows = await requestPostgrest({
  resource: "ai_characters",
  schema: z.array(characterRowSchema).min(1),
  method: "POST",
  body: { user_id: userId, ...DEFAULT_CHARACTER },
  prefer: "return=representation",
 });
 const character = rows[0];
 if (!character) {
  throw new Error("AI default character insert returned no row");
 }
 return character.id;
}

export async function createConversation(
 userId: string,
 characterId: string,
 preferences: z.output<typeof preferenceContextRowSchema>,
) {
 const rows = await requestPostgrest({
  resource: "ai_conversations",
  schema: z.array(conversationRowSchema).min(1),
  method: "POST",
  body: {
   user_id: userId,
   character_id: characterId,
   title: "",
   mode: preferences.default_mode,
   correction_style: preferences.default_correction_style,
   reply_mode: preferences.default_reply_mode,
   memory_policy: "inherit",
  },
  prefer: "return=representation",
 });
 const conversation = rows[0];
 if (!conversation) {
  throw new Error("AI conversation insert returned no row");
 }
 return conversation;
}

async function loadMessages(conversationId: string, userId: string, limit = 200) {
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
 return rows.reverse();
}

export async function loadSessionForConversation({
 userId,
 conversation,
 preferences,
}: {
 userId: string;
 conversation: z.output<typeof conversationRowSchema>;
 preferences?: z.output<typeof preferenceContextRowSchema>;
}) {
 const [messages, character, relationship, resolvedPreferences] = await Promise.all([
  loadMessages(conversation.id, userId),
  loadCharacter(userId, conversation.character_id),
  loadRelationship(userId, conversation.character_id),
  preferences ? Promise.resolve(preferences) : loadConversationPreferences(userId),
 ]);
 return toSession(conversation, character, relationship, resolvedPreferences, messages);
}
