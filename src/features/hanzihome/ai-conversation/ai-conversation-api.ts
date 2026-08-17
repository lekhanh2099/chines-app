import type { JsonFieldValue } from "@/types/json";

import {
 aiConversationRequestSchema,
 aiConversationResponseSchema,
 type AiConversationMessage,
 type AiConversationProfile,
 type AiConversationResponse,
} from "./ai-conversation.schemas";

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
