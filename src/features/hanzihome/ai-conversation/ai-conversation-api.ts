import type { JsonFieldValue } from "@/types/json";

import {
 aiConversationSessionSchema,
 aiConversationTurnRequestSchema,
 aiConversationTurnResponseSchema,
 type AiConversationSession,
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

const legacyEndpoint = "/api/ai/conversation";
const conversationsEndpoint = "/api/ai/conversations";

function readApiError(body: JsonFieldValue, fallback: string) {
 const error =
  body && typeof body === "object" && !Array.isArray(body) && "error" in body ? body.error : null;
 return typeof error === "string" ? error : fallback;
}

export async function fetchAiConversationRuntimeHealth(options?: {
 apiKeyId?: string;
 signal?: AbortSignal;
}): Promise<AiConversationRuntimeHealth> {
 const response = await fetch(legacyEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({
   action: "health",
   ...(options?.apiKeyId ? { apiKeyId: options.apiKeyId } : {}),
  }),
  signal: options?.signal,
 });
 const body: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  throw new Error("Không thể kiểm tra AI runtime.");
 }

 return aiConversationRuntimeHealthSchema.parse(body);
}

export async function fetchAiConversationSession(options?: {
 signal?: AbortSignal;
}): Promise<AiConversationSession> {
 const response = await fetch(conversationsEndpoint, {
  method: "GET",
  headers: { Accept: "application/json" },
  signal: options?.signal,
 });
 const body: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  throw new Error(readApiError(body, "Không thể tải lịch sử hội thoại AI."));
 }

 return aiConversationSessionSchema.parse(body);
}

export async function ensureAiConversationSession(options?: {
 signal?: AbortSignal;
}): Promise<AiConversationSession> {
 const response = await fetch(conversationsEndpoint, {
  method: "POST",
  headers: { Accept: "application/json" },
  signal: options?.signal,
 });
 const body: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  throw new Error(readApiError(body, "Không thể khởi tạo hội thoại AI."));
 }

 return aiConversationSessionSchema.parse(body);
}

export async function sendPersistedAiConversationMessage(
 conversationId: string,
 input: {
  clientMessageId: string;
  content: string;
  profile: AiConversationProfile;
  apiKeyId?: string;
 },
 options?: { signal?: AbortSignal },
): Promise<AiConversationTurnResponse> {
 const payload = aiConversationTurnRequestSchema.parse(input);
 const response = await fetch(
  `${conversationsEndpoint}/${encodeURIComponent(conversationId)}/messages`,
  {
   method: "POST",
   headers: { "Content-Type": "application/json", Accept: "application/json" },
   body: JSON.stringify(payload),
   signal: options?.signal,
  },
 );
 const body: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  throw new Error(readApiError(body, "AI conversation không hoàn tất."));
 }

 return aiConversationTurnResponseSchema.parse(body);
}

/**
 * Compatibility endpoint retained until the persisted workspace cutover has been verified.
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
 const response = await fetch(legacyEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(payload),
  signal: options?.signal,
 });
 const body: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  throw new Error(readApiError(body, "AI conversation không hoàn tất."));
 }

 return aiConversationResponseSchema.parse(body);
}
