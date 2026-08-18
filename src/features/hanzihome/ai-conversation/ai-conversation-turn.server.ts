import "server-only";

import {
 sanitizeAiConversationReply,
} from "@/features/hanzihome/ai-conversation/ai-conversation-output";
import {
 generateSystemAiConversationReply,
 SYSTEM_AI_CONVERSATION_MODEL,
 SYSTEM_AI_CONVERSATION_PROVIDER,
} from "@/features/hanzihome/ai-conversation/ai-conversation-system.server";
import { getApiKeyProviderLabel } from "@/lib/api-key-providers";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { generateAiConversationReply } from "@/services/ai.service";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";

import {
 buildAiConversationProviderContext,
 type AiConversationContextState,
} from "./ai-conversation-context.server";
import type { AiConversationPersistedMessage } from "./ai-conversation-session.schemas";
import type { AiConversationMessage, AiConversationProfile } from "./ai-conversation.schemas";

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

export async function generatePersistedAiConversationTurn({
 supabase,
 userId,
 recentMessages,
 contextState,
 learnerLevel,
 apiKeyId,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 recentMessages: AiConversationPersistedMessage[];
 contextState: AiConversationContextState;
 learnerLevel: AiConversationProfile["learnerLevel"];
 apiKeyId?: string;
 signal?: AbortSignal;
}): Promise<PersistedTurnGenerationResult> {
 const userApiKeys = await getActiveUserApiKeyCredentials(supabase, userId);
 const selectedKey = apiKeyId
  ? userApiKeys.find((key) => key.id === apiKeyId)
  : userApiKeys[0];

 if (apiKeyId && !selectedKey) {
  return {
   ok: false,
   status: 409,
   code: "AI_API_KEY_UNAVAILABLE",
   message: "API key đã chọn không còn hoạt động. Hãy chọn key khác hoặc dùng chế độ tự động.",
  };
 }

 const providerContext = buildAiConversationProviderContext({
  state: contextState,
  learnerLevel,
  recentMessages,
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
