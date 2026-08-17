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

export async function fetchAiConversationRuntimeHealth(
 options?: { apiKeyId?: string; signal?: AbortSignal },
): Promise<AiConversationRuntimeHealth> {
 const searchParams = new URLSearchParams();
 if (options?.apiKeyId) searchParams.set("apiKeyId", options.apiKeyId);
 const query = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
 const response = await fetch(`/api/ai/conversation/health${query}`, {
  method: "GET",
  headers: { Accept: "application/json" },
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
 const response = await fetch("/api/ai/conversation", {
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
