import type { JsonFieldValue } from "@/types/json";

import {
 aiConversationAccountPreferencesSchema,
 aiConversationManagedMemoryListSchema,
 aiConversationManagedMemorySchema,
 aiConversationMemoryForgottenResponseSchema,
 aiConversationMemoryResolvedResponseSchema,
 aiConversationSettingsOverviewSchema,
 type AiConversationAccountPreferences,
} from "./ai-conversation-settings.schema";

const endpoint = "/api/settings/ai-conversation";

function readApiError(payload: JsonFieldValue, fallback: string) {
 if (payload && typeof payload === "object" && !Array.isArray(payload) && "error" in payload) {
  const error = payload.error;
  if (typeof error === "string") return error;
 }
 return fallback;
}

async function readResponse(response: Response): Promise<JsonFieldValue> {
 return response.json().catch(() => null);
}

export async function fetchAiConversationSettingsOverview(options?: { signal?: AbortSignal }) {
 const response = await fetch(endpoint, {
  method: "GET",
  headers: { Accept: "application/json" },
  signal: options?.signal,
  cache: "no-store",
 });
 const payload = await readResponse(response);
 if (!response.ok) throw new Error(readApiError(payload, "Không thể tải thiết lập hội thoại AI."));
 return aiConversationSettingsOverviewSchema.parse(payload);
}

export async function updateAiConversationAccountPreferences(
 preferences: AiConversationAccountPreferences,
 options?: { signal?: AbortSignal },
) {
 const payload = aiConversationAccountPreferencesSchema.parse(preferences);
 const response = await fetch(endpoint, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify(payload),
  signal: options?.signal,
 });
 const responseBody = await readResponse(response);
 if (!response.ok) {
  throw new Error(readApiError(responseBody, "Không thể lưu thiết lập hội thoại AI."));
 }
 return aiConversationAccountPreferencesSchema.parse(responseBody);
}

export async function fetchAiConversationManagedMemories(options?: { signal?: AbortSignal }) {
 const response = await fetch(`${endpoint}?resource=memories`, {
  method: "GET",
  headers: { Accept: "application/json" },
  signal: options?.signal,
  cache: "no-store",
 });
 const payload = await readResponse(response);
 if (!response.ok) throw new Error(readApiError(payload, "Không thể tải bộ nhớ AI."));
 return aiConversationManagedMemoryListSchema.parse(payload);
}

export async function editAiConversationManagedMemory(
 input: { memoryId: string; content: string },
 options?: { signal?: AbortSignal },
) {
 const response = await fetch(endpoint, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ action: "edit", ...input }),
  signal: options?.signal,
 });
 const payload = await readResponse(response);
 if (!response.ok) throw new Error(readApiError(payload, "Không thể sửa bộ nhớ AI."));
 return aiConversationManagedMemorySchema.parse(payload);
}

export async function resolveAiConversationManagedOpenLoop(
 memoryId: string,
 options?: { signal?: AbortSignal },
) {
 const response = await fetch(endpoint, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ action: "resolve", memoryId }),
  signal: options?.signal,
 });
 const payload = await readResponse(response);
 if (!response.ok) throw new Error(readApiError(payload, "Không thể đánh dấu bộ nhớ đã xong."));
 return aiConversationMemoryResolvedResponseSchema.parse(payload);
}

export async function forgetAiConversationManagedMemory(
 memoryId: string,
 options?: { signal?: AbortSignal },
) {
 const response = await fetch(endpoint, {
  method: "DELETE",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ memoryId }),
  signal: options?.signal,
 });
 const payload = await readResponse(response);
 if (!response.ok) throw new Error(readApiError(payload, "Không thể quên bộ nhớ AI."));
 return aiConversationMemoryForgottenResponseSchema.parse(payload);
}
