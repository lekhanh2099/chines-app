import { aiRuntimeReadinessResponseSchema } from "@/lib/ai-runtime-contract";
import type { JsonFieldValue, JsonObject } from "@/types/json";

import {
 aiConversationArchiveResponseSchema,
 aiConversationHistorySchema,
 aiConversationMemoryPolicySchema,
 aiConversationMemoryPolicyStateSchema,
 aiConversationSessionSchema,
 aiConversationSettingsSchema,
 aiConversationSettingsUpdateSchema,
 aiConversationTurnRequestSchema,
 type AiConversationArchiveResponse,
 type AiConversationHistoryItem,
 type AiConversationMemoryPolicy,
 type AiConversationMemoryPolicyState,
 type AiConversationSession,
 type AiConversationSettings,
 type AiConversationSettingsUpdate,
 type AiConversationTurnResponse,
} from "./ai-conversation-session.schemas";
import {
 aiConversationRequestSchema,
 aiConversationResponseSchema,
 aiConversationRuntimeHealthSchema,
 type AiConversationMessage,
 type AiConversationProfile,
 type AiConversationResponse,
 type AiConversationRuntimeHealth,
} from "./ai-conversation.schemas";
import { streamPersistedAiConversationMessage } from "./ai-conversation-stream-api";
import {
 appendAiConversationClientStreamDelta,
 beginAiConversationClientStream,
 endAiConversationClientStream,
} from "./ai-conversation-stream.client";

const endpoint = "/api/ai/conversation";
const runtimeEndpoint = "/api/ai/runtime";

function readApiError(body: JsonFieldValue, fallback: string) {
 const error =
  body && typeof body === "object" && !Array.isArray(body) && "error" in body ? body.error : null;
 return typeof error === "string" ? error : fallback;
}

async function postConversationAction(body: JsonObject, signal?: AbortSignal) {
 const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(body),
  signal,
 });
 const payload: JsonFieldValue = await response.json().catch(() => null);
 return { response, payload };
}

export async function fetchAiConversationRuntimeHealth(options?: {
 apiKeyId?: string;
 signal?: AbortSignal;
}): Promise<AiConversationRuntimeHealth> {
 if (!options?.apiKeyId) {
  const response = await fetch(runtimeEndpoint, {
   method: "GET",
   headers: { Accept: "application/json" },
   credentials: "include",
   cache: "no-store",
   signal: options?.signal,
  });
  const payload: JsonFieldValue = await response.json().catch(() => null);
  if (!response.ok) throw new Error("Không thể kiểm tra AI runtime.");
  const readiness = aiRuntimeReadinessResponseSchema.parse(payload);
  if (readiness.status === "ready") {
   return aiConversationRuntimeHealthSchema.parse({
    ready: true,
    code: "ready",
    provider: readiness.selectedKey.providerLabel,
    model: readiness.selectedKey.model,
    source: "personal",
   });
  }
  return aiConversationRuntimeHealthSchema.parse({
   ready: false,
   code: readiness.status === "missing-key" ? "key-unavailable" : "provider-unavailable",
   provider: null,
   model: null,
   source: "personal",
  });
 }

 const { response, payload } = await postConversationAction(
  { action: "health", apiKeyId: options.apiKeyId },
  options.signal,
 );
 if (!response.ok) throw new Error("Không thể kiểm tra AI runtime.");
 return aiConversationRuntimeHealthSchema.parse(payload);
}

export async function fetchAiConversationSession(options?: {
 conversationId?: string;
 signal?: AbortSignal;
}): Promise<AiConversationSession> {
 const { response, payload } = await postConversationAction(
  {
   action: "session",
   ...(options?.conversationId ? { conversationId: options.conversationId } : {}),
  },
  options?.signal,
 );
 if (!response.ok) {
  throw new Error(readApiError(payload, "Không thể tải lịch sử hội thoại AI."));
 }
 return aiConversationSessionSchema.parse(payload);
}

export async function ensureAiConversationSession(options?: {
 signal?: AbortSignal;
}): Promise<AiConversationSession> {
 const { response, payload } = await postConversationAction(
  { action: "ensure-session" },
  options?.signal,
 );
 if (!response.ok) {
  throw new Error(readApiError(payload, "Không thể khởi tạo hội thoại AI."));
 }
 return aiConversationSessionSchema.parse(payload);
}

export async function fetchAiConversationHistory(options?: {
 signal?: AbortSignal;
}): Promise<AiConversationHistoryItem[]> {
 const { response, payload } = await postConversationAction({ action: "history" }, options?.signal);
 if (!response.ok) {
  throw new Error(readApiError(payload, "Không thể tải danh sách hội thoại AI."));
 }
 return aiConversationHistorySchema.parse(payload);
}

export async function createAiConversation(options?: {
 signal?: AbortSignal;
}): Promise<AiConversationSession> {
 const { response, payload } = await postConversationAction(
  { action: "create-conversation" },
  options?.signal,
 );
 if (!response.ok) {
  throw new Error(readApiError(payload, "Không thể tạo hội thoại AI mới."));
 }
 return aiConversationSessionSchema.parse(payload);
}

export async function archiveAiConversation(
 conversationId: string,
 options?: { signal?: AbortSignal },
): Promise<AiConversationArchiveResponse> {
 const { response, payload } = await postConversationAction(
  { action: "archive-conversation", conversationId },
  options?.signal,
 );
 if (!response.ok) {
  throw new Error(readApiError(payload, "Không thể lưu trữ hội thoại AI."));
 }
 return aiConversationArchiveResponseSchema.parse(payload);
}

export async function updateAiConversationMemoryPolicy(
 conversationId: string,
 memoryPolicy: AiConversationMemoryPolicy,
 options?: { signal?: AbortSignal },
): Promise<AiConversationMemoryPolicyState> {
 const policy = aiConversationMemoryPolicySchema.parse(memoryPolicy);
 const { response, payload } = await postConversationAction(
  { action: "update-memory-policy", conversationId, memoryPolicy: policy },
  options?.signal,
 );
 if (!response.ok) {
  throw new Error(readApiError(payload, "Không thể cập nhật bộ nhớ hội thoại."));
 }
 return aiConversationMemoryPolicyStateSchema.parse(payload);
}

export async function updateAiConversationSettings(
 conversationId: string,
 input: AiConversationSettingsUpdate,
 options?: { signal?: AbortSignal },
): Promise<AiConversationSettings> {
 const settings = aiConversationSettingsUpdateSchema.parse(input);
 const { response, payload } = await postConversationAction(
  {
   action: "update-settings",
   conversationId,
   ...settings,
  },
  options?.signal,
 );
 if (!response.ok) {
  throw new Error(readApiError(payload, "Không thể lưu thiết lập hội thoại AI."));
 }
 return aiConversationSettingsSchema.parse(payload);
}

export async function sendPersistedAiConversationMessage(
 conversationId: string,
 input: {
  clientMessageId: string;
  content: string;
  apiKeyId?: string;
 },
 options?: { signal?: AbortSignal },
): Promise<AiConversationTurnResponse> {
 const payload = aiConversationTurnRequestSchema.parse({
  clientMessageId: input.clientMessageId,
  content: input.content,
  ...(input.apiKeyId ? { apiKeyId: input.apiKeyId } : {}),
 });
 const controller = new AbortController();
 const forwardAbort = () => controller.abort();
 if (options?.signal?.aborted) controller.abort();
 else options?.signal?.addEventListener("abort", forwardAbort, { once: true });

 beginAiConversationClientStream(() => controller.abort());
 try {
  return await streamPersistedAiConversationMessage(conversationId, payload, {
   signal: controller.signal,
   onDelta: appendAiConversationClientStreamDelta,
  });
 } finally {
  options?.signal?.removeEventListener("abort", forwardAbort);
  endAiConversationClientStream();
 }
}

/**
 * Compatibility request retained until persisted conversation migration has been verified.
 * New conversation UI must use sendPersistedAiConversationMessage instead.
 */
export async function sendAiConversationMessage(
 messages: AiConversationMessage[],
 profile: AiConversationProfile,
 options?: { apiKeyId?: string; signal?: AbortSignal },
): Promise<AiConversationResponse> {
 const payload = aiConversationRequestSchema.parse({
  messages,
  profile,
  ...(options?.apiKeyId ? { apiKeyId: options.apiKeyId } : {}),
 });
 const { response, payload: responseBody } = await postConversationAction(payload, options?.signal);
 if (!response.ok) {
  throw new Error(readApiError(responseBody, "AI conversation không hoàn tất."));
 }
 return aiConversationResponseSchema.parse(responseBody);
}
