import "server-only";

import { sanitizeAiConversationReply } from "@/features/hanzihome/ai-conversation/ai-conversation-output";
import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import type { AiRuntimeReceipt, AiTaskId, AiTaskResolutionSource } from "@/lib/ai-task-contract";
import { logger } from "@/lib/logger";
import {
 resolveUserAiTaskRuntime,
 getAiRuntimeReceipt,
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 type ResolvedUserAiRuntime,
} from "@/services/ai-runtime.service";

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
import {
 AiConversationProviderStreamError,
 streamAiConversationProviderReply,
} from "./ai-conversation-stream-provider.server";
import type { AiConversationMessage } from "./ai-conversation.schemas";

export type PersistedTurnGenerationResult =
 | {
    ok: true;
    message: string;
    provider: string;
    model: string;
    apiKeyId: string;
    runtimeReceipt: AiRuntimeReceipt;
   }
 | {
    ok: false;
    status: number;
    code: string;
    message: string;
   };

export type PreparedPersistedAiConversationTurn =
 | {
    ok: true;
    runtime: ResolvedUserAiRuntime & {
     taskId: AiTaskId;
     resolutionSource: AiTaskResolutionSource;
    };
    conversationMessages: AiConversationMessage[];
    systemPrompt: string;
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

function runtimeResolutionFailure(input: {
 status: "missing-key" | "storage-unavailable" | "task-disabled";
 reason: string;
}): PreparedPersistedAiConversationTurn {
 if (input.status === "task-disabled") {
  return {
   ok: false,
   status: 409,
   code: "AI_TASK_DISABLED",
   message: "Tác vụ trả lời hội thoại đang tắt trong Cài đặt → AI → Tác vụ AI.",
  };
 }
 if (input.status === "missing-key") {
  return {
   ok: false,
   status: 409,
   code:
    input.reason === "selected-key-unavailable" ? "AI_API_KEY_UNAVAILABLE" : "AI_API_KEY_REQUIRED",
   message:
    input.reason === "selected-key-unavailable"
     ? "API key đã chọn không còn hoạt động. Hãy chọn key khác hoặc dùng chế độ tự động."
     : "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI.",
  };
 }

 return {
  ok: false,
  status: 503,
  code: "AI_RUNTIME_STORAGE_UNAVAILABLE",
  message: "Kho API key an toàn phía server chưa sẵn sàng. Hãy kiểm tra lại cấu hình AI.",
 };
}

export async function preparePersistedAiConversationTurn({
 supabase,
 userId,
 recentMessages,
 contextState,
 apiKeyId,
 model,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 recentMessages: AiConversationPersistedMessage[];
 contextState: AiConversationContextState;
 apiKeyId?: string;
 model?: string;
 signal?: AbortSignal;
}): Promise<PreparedPersistedAiConversationTurn> {
 const runtimeResolution = await resolveUserAiTaskRuntime({
  supabase,
  userId,
  taskId: "conversation.reply",
  ...(apiKeyId && model ? { sessionOverride: { keyId: apiKeyId, model } } : {}),
 });
 if (!runtimeResolution.ok) {
  await recordUserAiTaskBlockedActivity({
   userId,
   taskId: "conversation.reply",
   errorCode: runtimeResolution.reason,
   resourceType: "conversation",
   resourceId: contextState.conversation.id,
  });
  return runtimeResolutionFailure(runtimeResolution);
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
      supabase,
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

 return {
  ok: true,
  runtime: runtimeResolution.runtime,
  conversationMessages,
  systemPrompt: providerContext.systemPrompt,
 };
}

export async function generatePersistedAiConversationTurn(input: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 recentMessages: AiConversationPersistedMessage[];
 contextState: AiConversationContextState;
 apiKeyId?: string;
 model?: string;
 signal?: AbortSignal;
}): Promise<PersistedTurnGenerationResult> {
 const prepared = await preparePersistedAiConversationTurn(input);
 if (!prepared.ok) return prepared;

 const startedAt = performance.now();
 let raw = "";
 try {
  for await (const delta of streamAiConversationProviderReply({
   runtime: prepared.runtime,
   messages: prepared.conversationMessages,
   systemPrompt: prepared.systemPrompt,
   signal: input.signal,
  })) {
   raw += delta;
  }
 } catch (error) {
  if (error instanceof AiConversationProviderStreamError) {
   await recordUserAiRuntimeActivity({
    userId: input.userId,
    runtime: prepared.runtime,
    status: error.code === "cancelled" ? "cancelled" : "failure",
    errorCode: error.code,
    latencyMs: Math.round(performance.now() - startedAt),
    resourceType: "conversation",
    resourceId: input.contextState.conversation.id,
   });
   return {
    ok: false,
    status: error.status,
    code: `AI_${error.code.replaceAll("-", "_").toUpperCase()}`,
    message: error.message,
   };
  }
  await recordUserAiRuntimeActivity({
   userId: input.userId,
   runtime: prepared.runtime,
   status: "failure",
   errorCode: "provider-unavailable",
   latencyMs: Math.round(performance.now() - startedAt),
   resourceType: "conversation",
   resourceId: input.contextState.conversation.id,
  });
  return {
   ok: false,
   status: 503,
   code: "AI_UNAVAILABLE",
   message: "AI provider không hoàn tất lượt trả lời.",
  };
 }

 const message = sanitizeAiConversationReply(raw);
 if (!message) {
  await recordUserAiRuntimeActivity({
   userId: input.userId,
   runtime: prepared.runtime,
   status: "failure",
   errorCode: "invalid-response",
   latencyMs: Math.round(performance.now() - startedAt),
   resourceType: "conversation",
   resourceId: input.contextState.conversation.id,
  });
  return {
   ok: false,
   status: 502,
   code: "INVALID_PROVIDER_RESPONSE",
   message: "AI provider không trả về nội dung an toàn để hiển thị.",
  };
 }

 await recordUserAiRuntimeActivity({
  userId: input.userId,
  runtime: prepared.runtime,
  status: "success",
  latencyMs: Math.round(performance.now() - startedAt),
  resourceType: "conversation",
  resourceId: input.contextState.conversation.id,
 });

 return {
  ok: true,
  message,
  provider: prepared.runtime.providerLabel,
  model: prepared.runtime.model,
  apiKeyId: prepared.runtime.keyId,
  runtimeReceipt: getAiRuntimeReceipt(prepared.runtime),
 };
}
