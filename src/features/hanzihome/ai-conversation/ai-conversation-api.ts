import type { JsonFieldValue } from "@/types/json";

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

export async function fetchAiConversationRuntimeHealth(
 options?: { apiKeyId?: string; signal?: AbortSignal },
): Promise<AiConversationRuntimeHealth> {
 const response = await fetch(endpoint, {
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
 const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(payload),
  signal: options?.signal,
 });
 const body: JsonFieldValue = await response.json().catch(() => null);

 if (!response.ok) {
  const error =
   body && typeof body === "object" && !Array.isArray(body) && "error" in body ? body.error : null;
  throw new Error(typeof error === "string" ? error : "AI conversation không hoàn tất.");
 }

 return aiConversationResponseSchema.parse(body);
}
