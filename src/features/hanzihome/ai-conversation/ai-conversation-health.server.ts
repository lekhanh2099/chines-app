import "server-only";

import { createRequestSignal } from "@/lib/request-utils";
import type { ResolvedUserAiRuntime } from "@/services/ai-runtime.service";

import type { AiConversationRuntimeHealth } from "./ai-conversation.schemas";

const HEALTH_TIMEOUT_MS = 8_000;

type RuntimeIdentity = Pick<AiConversationRuntimeHealth, "provider" | "model" | "source">;

export async function checkPersonalConversationRuntime(
 runtime: ResolvedUserAiRuntime,
 abortSignal?: AbortSignal,
): Promise<AiConversationRuntimeHealth> {
 const request = getProviderHealthRequest(runtime);
 const runtimeIdentity: RuntimeIdentity = {
  provider: runtime.providerLabel,
  model: runtime.model || "provider-default",
  source: "personal",
 };

 try {
  const response = await fetch(request.url, {
   method: "GET",
   headers: request.headers,
   signal: createRequestSignal(HEALTH_TIMEOUT_MS, abortSignal),
  });

  if (response.ok) {
   return { ready: true, code: "ready", ...runtimeIdentity };
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
   return { ready: false, code: "invalid-key", ...runtimeIdentity };
  }

  if (response.status === 402 || response.status === 429) {
   return { ready: false, code: "quota-exhausted", ...runtimeIdentity };
  }

  return { ready: false, code: "provider-unavailable", ...runtimeIdentity };
 } catch (error) {
  if (abortSignal?.aborted) throw error;
  return { ready: false, code: "network-error", ...runtimeIdentity };
 }
}

function getProviderHealthRequest(runtime: ResolvedUserAiRuntime): {
 url: string;
 headers: HeadersInit;
} {
 if (runtime.provider === "gemini") {
  return {
   url: "https://generativelanguage.googleapis.com/v1beta/models",
   headers: { "x-goog-api-key": runtime.apiKey },
  };
 }

 if (runtime.provider === "groq") {
  return {
   url: "https://api.groq.com/openai/v1/models",
   headers: { Authorization: `Bearer ${runtime.apiKey}` },
  };
 }

 if (runtime.provider === "deepseek") {
  return {
   url: "https://api.deepseek.com/models",
   headers: { Authorization: `Bearer ${runtime.apiKey}` },
  };
 }

 return {
  url: "https://api.openai.com/v1/models",
  headers: { Authorization: `Bearer ${runtime.apiKey}` },
 };
}
