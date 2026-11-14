import "server-only";

import type { z } from "zod";

import type {
 AiConversationHistoryItem,
 AiConversationPersistedMessage,
 AiConversationSession,
} from "../model/ai-conversation-session.schemas";
import type {
 characterContextRowSchema,
 conversationHistoryRowSchema,
 conversationRowSchema,
 memoryPolicySchema,
 messageRowSchema,
 preferenceContextRowSchema,
 relationshipContextRowSchema,
} from "./ai-conversation-persistence-schemas.server";

export function resolveMemoryEnabled(
 policy: z.output<typeof memoryPolicySchema>,
 accountMemoryEnabled: boolean,
) {
 if (policy === "disabled") return false;
 if (policy === "enabled") return true;
 return accountMemoryEnabled;
}

export function toPersistedMessage(
 row: z.output<typeof messageRowSchema>,
): AiConversationPersistedMessage {
 return {
  id: row.id,
  seq: row.seq,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
  ...(row.metadata?.provider &&
  row.metadata.model &&
  row.metadata.apiKeyId &&
  row.metadata.taskId &&
  row.metadata.keyLabel &&
  row.metadata.resolutionSource
   ? {
      runtimeReceipt: {
       taskId: row.metadata.taskId,
       provider: row.metadata.provider,
       model: row.metadata.model,
       keyId: row.metadata.apiKeyId,
       keyLabel: row.metadata.keyLabel,
       resolutionSource: row.metadata.resolutionSource,
      },
     }
   : {}),
 };
}

function toCharacterPresentation(row: z.output<typeof characterContextRowSchema>) {
 return {
  id: row.id,
  displayName: row.display_name,
  city: row.city,
  interests: row.interests,
 };
}

export function toHistoryItem(
 row: z.output<typeof conversationHistoryRowSchema>,
): AiConversationHistoryItem {
 return {
  id: row.id,
  characterId: row.character_id,
  title: row.title,
  mode: row.mode,
  memoryPolicy: row.memory_policy,
  lastMessageAt: row.last_message_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
 };
}

export function toSession(
 conversation: z.output<typeof conversationRowSchema> | null,
 character: z.output<typeof characterContextRowSchema> | null,
 relationship: z.output<typeof relationshipContextRowSchema> | null,
 preferences: z.output<typeof preferenceContextRowSchema>,
 messages: z.output<typeof messageRowSchema>[],
): AiConversationSession {
 return {
  conversation: conversation
   ? {
      id: conversation.id,
      characterId: conversation.character_id,
      title: conversation.title,
      mode: conversation.mode,
      correctionStyle: conversation.correction_style,
      replyMode: conversation.reply_mode,
      memoryPolicy: conversation.memory_policy,
     }
   : null,
  character: character ? toCharacterPresentation(character) : null,
  relationship: relationship
   ? {
      nickname: relationship.nickname,
      familiarityScore: relationship.familiarity_score,
     }
   : null,
  learnerLevel: preferences.learner_level,
  memoryEnabled: conversation
   ? resolveMemoryEnabled(conversation.memory_policy, preferences.memory_enabled)
   : preferences.memory_enabled,
  messages: messages.map(toPersistedMessage),
 };
}
