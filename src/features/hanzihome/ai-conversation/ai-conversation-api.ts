import type { JsonFieldValue, JsonObject } from "@/types/json";

import {
 aiConversationSessionSchema,
 aiConversationSettingsSchema,
 aiConversationSettingsUpdateSchema,
 aiConversationTurnRequestSchema,
 aiConversationTurnResponseSchema,
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

const endpoint = "/api/ai/conversation";

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
 const { response, payload } = await postConversationAction(
  {
   action: "health",
   ...(options?.apiKeyId ? { apiKeyId: options.apiKeyId } : {}),
  },
  options?.signal,
 );

 if (!response.ok) {
  throw new Error("Không thể kiểm tra AI runtime.");
 }

 return aiConversationRuntimeHealthSchema.parse(payload);
}

export async function fetchAiConversationSession(options?: {
 signal?: AbortSignal;
}): Promise<AiConversationSession> {
 const { response, payload } = await postConversationAction({ action: "session" }, options?.signal);

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
 const { response, payload: responseBody } = await postConversationAction(
  {
   action: "message",
   conversationId,
   ...payload,
  },
  options?.signal,
 );

 if (!response.ok) {
  throw new Error(readApiError(responseBody, "AI conversation không hoàn tất."));
 }

 return aiConversationTurnResponseSchema.parse(responseBody);
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
