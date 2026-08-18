import "server-only";

import { getApiKeyProviderLabel } from "@/lib/api-key-providers";
import { DEFAULT_GEMINI_QUICK_MODEL } from "@/lib/gemini-models";
import { createRequestSignal } from "@/lib/request-utils";
import type { UserApiKeyCredential } from "@/services/user-api-keys.service";

import type { AiConversationRuntimeHealth } from "./ai-conversation.schemas";

const HEALTH_TIMEOUT_MS = 8_000;

type RuntimeIdentity = Pick<AiConversationRuntimeHealth, "provider" | "model" | "source">;

export async function checkPersonalConversationRuntime(
 credential: UserApiKeyCredential,
 abortSignal?: AbortSignal,
): Promise<AiConversationRuntimeHealth> {
 const request = getProviderHealthRequest(credential);
 const runtimeIdentity: RuntimeIdentity = {
  provider: getApiKeyProviderLabel(credential.provider),
  model: credential.defaultModel || "provider-default",
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

export async function checkSystemConversationRuntime(
 abortSignal?: AbortSignal,
): Promise<AiConversationRuntimeHealth> {
 const provider = "Google Gemini";
 const model = DEFAULT_GEMINI_QUICK_MODEL;
 const apiKey = process.env.GEMINI_API_KEY;

 if (!apiKey) {
  return {
   ready: false,
   code: "missing-system-key",
   provider,
   model,
   source: "system",
  };
 }

 try {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
   method: "GET",
   headers: { "x-goog-api-key": apiKey },
   signal: createRequestSignal(HEALTH_TIMEOUT_MS, abortSignal),
  });

  if (response.ok) {
   return { ready: true, code: "ready", provider, model, source: "system" };
  }

  if (response.status === 400 || response.status === 401 || response.status === 403) {
   return { ready: false, code: "invalid-key", provider, model, source: "system" };
  }

  if (response.status === 429) {
   return { ready: false, code: "quota-exhausted", provider, model, source: "system" };
  }

  return { ready: false, code: "provider-unavailable", provider, model, source: "system" };
 } catch (error) {
  if (abortSignal?.aborted) throw error;
  return { ready: false, code: "network-error", provider, model, source: "system" };
 }
}

function getProviderHealthRequest(credential: UserApiKeyCredential): {
 url: string;
 headers: HeadersInit;
} {
 if (credential.provider === "gemini") {
  return {
   url: "https://generativelanguage.googleapis.com/v1beta/models",
   headers: { "x-goog-api-key": credential.apiKey },
  };
 }

 if (credential.provider === "groq") {
  return {
   url: "https://api.groq.com/openai/v1/models",
   headers: { Authorization: `Bearer ${credential.apiKey}` },
  };
 }

 if (credential.provider === "deepseek") {
  return {
   url: "https://api.deepseek.com/models",
   headers: { Authorization: `Bearer ${credential.apiKey}` },
  };
 }

 return {
  url: "https://api.openai.com/v1/models",
  headers: { Authorization: `Bearer ${credential.apiKey}` },
 };
}
