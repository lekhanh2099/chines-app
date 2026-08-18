import "server-only";

import { sanitizeAiConversationReply } from "@/features/hanzihome/ai-conversation/ai-conversation-output";
import {
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_MODEL,
 SYSTEM_AI_CONVERSATION_PROVIDER,
} from "@/features/hanzihome/ai-conversation/ai-conversation-system.server";
import { getApiKeyProviderLabel } from "@/lib/api-key-providers";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { logger } from "@/lib/logger";
import { generateAiConversationReply } from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";

import {
 buildAiConversationProviderContext,
 type AiConversationContextState,
} from "./ai-conversation-context.server";
import { resolveExplicitAiConversationForget } from "./ai-conversation-memory-extraction.server";
import { loadAiConversationMemoryEnabledPreference } from "./ai-conversation-memory-persistence.server";
import {
 isAiConversationLongTermMemoryEnabled,
 isExplicitAiConversationForgetIntent,
 retrieveRelevantAiConversationMemories,
} from "./ai-conversation-memory.server";
import { loadAiConversationContextState } from "./ai-conversation-persistence.server";
import { processDueAiConversationPostTurnJobs } from "./ai-conversation-post-turn.server";
import type { AiConversationPersistedMessage } from "./ai-conversation-session.schemas";
import type { AiConversationMessage } from "./ai-conversation.schemas";

export type PersistedTurnGenerationResult =
 | {
    ok: true;
    message: string;
    provider: string;
    model: string;
    apiKeyId: string | null;
   }
 | {
    ok: false;
    status: number;
    code: string;
    message: string;
   };

function latestLearnerMessage(messages: AiConversationPersistedMessage[]) {
 for (let index = messages.length - 1; index >= 0; index -= 1) {
  const message = messages[index];
  if (message?.role === "user") return message;
 }
 return null;
}

export async function generatePersistedAiConversationTurn({
 supabase,
 userId,
 recentMessages,
 contextState,
 apiKeyId,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 recentMessages: AiConversationPersistedMessage[];
 contextState: AiConversationContextState;
 apiKeyId?: string;
 signal?: AbortSignal;
}): Promise<PersistedTurnGenerationResult> {
 const userApiKeys = await getActiveUserApiKeyCredentials(supabase, userId);
 const selectedKey = apiKeyId ? userApiKeys.find((key) => key.id === apiKeyId) : userApiKeys[0];

 if (apiKeyId && !selectedKey) {
  return {
   ok: false,
   status: 409,
   code: "AI_API_KEY_UNAVAILABLE",
   message: "API key đã chọn không còn hoạt động. Hãy chọn key khác hoặc dùng chế độ tự động.",
  };
 }

 const postTurnResult = await processDueAiConversationPostTurnJobs({
  supabase,
  userId,
  conversationId: contextState.conversation.id,
  signal,
  limit: 1,
 });
 const resolvedContextState =
  postTurnResult.processed > 0
   ? await loadAiConversationContextState({
      userId,
      conversationId: contextState.conversation.id,
     })
   : contextState;

 const userMemoryPreference = await loadAiConversationMemoryEnabledPreference(userId);
 const memoryEnabled = isAiConversationLongTermMemoryEnabled({
  conversationPolicy: resolvedContextState.conversation.memoryPolicy,
  userPreference: userMemoryPreference,
 });
 const learnerMessage = latestLearnerMessage(recentMessages);
 const explicitForget = Boolean(
  learnerMessage && isExplicitAiConversationForgetIntent(learnerMessage.content),
 );

 if (learnerMessage && explicitForget && memoryEnabled) {
  try {
   await resolveExplicitAiConversationForget({
    supabase,
    userId,
    conversationId: resolvedContextState.conversation.id,
    characterId: resolvedContextState.character.id,
    userMessage: learnerMessage.content,
    signal,
   });
  } catch (error) {
   logger.warn(
    "[AI Conversation] explicit forget target could not be persisted; memory recall remains suppressed for this turn",
    error,
   );
  }
 }

 const recalledMemories =
  learnerMessage && memoryEnabled && !explicitForget
   ? await retrieveRelevantAiConversationMemories({
      userId,
      characterId: resolvedContextState.character.id,
      query: learnerMessage.content,
      enabled: true,
      suppressForForget: false,
      signal,
     })
   : [];
 const providerContext = buildAiConversationProviderContext({
  state: resolvedContextState,
  recentMessages,
  memories: recalledMemories,
 });
 const conversationMessages: AiConversationMessage[] = providerContext.messages.map((message) => ({
  role: message.role,
  content: message.content,
 }));

 const result = selectedKey
  ? await generateAiConversationReply(conversationMessages, {
     userApiKeys: [selectedKey],
     abortSignal: signal,
     systemContext: providerContext.systemPrompt,
    })
  : await generateSystemAiConversationReply(
     conversationMessages,
     signal,
     providerContext.systemPrompt,
    );

 if (!result.data) {
  return {
   ok: false,
   status: 503,
   code: "AI_UNAVAILABLE",
   message: result.error || "AI provider không trả về nội dung.",
  };
 }

 const message = sanitizeAiConversationReply(result.data);
 if (!message) {
  return {
   ok: false,
   status: 502,
   code: "INVALID_PROVIDER_RESPONSE",
   message: "AI provider không trả về nội dung an toàn để hiển thị.",
  };
 }

 return {
  ok: true,
  message,
  provider: selectedKey
   ? getApiKeyProviderLabel(selectedKey.provider)
   : SYSTEM_AI_CONVERSATION_PROVIDER,
  model: selectedKey?.defaultModel || SYSTEM_AI_CONVERSATION_MODEL,
  apiKeyId: selectedKey?.id || null,
 };
}
