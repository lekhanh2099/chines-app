import "server-only";

import { getApiKeyModelOptions } from "@/lib/api-key-models";
import {
 AUTO_API_KEY_PROVIDER,
 getApiKeyProviderLabel,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import { createRequestSignal } from "@/lib/request-utils";
import { z } from "zod";

const DISCOVERY_TIMEOUT_MS = 10_000;
const openAiCompatibleModelsSchema = z.object({
 data: z.array(z.object({ id: z.string() })).optional(),
});
const geminiModelsSchema = z.object({
 models: z
  .array(
   z.object({
    name: z.string().optional(),
    supportedGenerationMethods: z.array(z.string()).optional(),
   }),
  )
  .optional(),
});
const openAiCompatibleGenerationSchema = z.object({
 choices: z
  .array(
   z.object({
    message: z.object({ content: z.string().min(1) }),
   }),
  )
  .min(1),
});
const geminiGenerationSchema = z.object({
 candidates: z
  .array(
   z.object({
    content: z.object({
     parts: z.array(z.object({ text: z.string().min(1) })).min(1),
    }),
   }),
  )
  .min(1),
});

export type ApiKeyProviderSelection = typeof AUTO_API_KEY_PROVIDER | ApiKeyProvider;

export type ApiKeyDiscoveryResult =
 | {
    ok: true;
    value: {
     provider: ApiKeyProvider;
     providerLabel: string;
     models: string[];
     recommendedModel: string;
    };
   }
 | { ok: false; error: string };

export async function discoverApiKeyModels(
 apiKey: string,
 providerSelection: ApiKeyProviderSelection,
 abortSignal?: AbortSignal,
): Promise<ApiKeyDiscoveryResult> {
 const candidates =
  providerSelection === AUTO_API_KEY_PROVIDER ? getProviderCandidates(apiKey) : [providerSelection];
 const errors: string[] = [];

 for (const provider of candidates) {
  const result = await discoverProviderModels(apiKey, provider, abortSignal);
  if (result.ok) return result;
  errors.push(result.error);
 }

 return {
  ok: false,
  error:
   errors[0] ||
   "Không thể xác định provider hoặc tải model cho API key này. Hãy kiểm tra key rồi thử lại.",
 };
}

export async function probeApiKeyModel(
 apiKey: string,
 provider: ApiKeyProvider,
 model: string,
 abortSignal?: AbortSignal,
): Promise<{ ok: boolean }> {
 try {
  const signal = createRequestSignal(DISCOVERY_TIMEOUT_MS, abortSignal);
  const response =
   provider === "gemini"
    ? await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`, {
       method: "POST",
       headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
       body: JSON.stringify({
        contents: [{ parts: [{ text: 'Return exactly one JSON object: {"ok":true}' }] }],
        generationConfig: {
         maxOutputTokens: 64,
         responseMimeType: "application/json",
        },
       }),
       signal,
      })
    : await fetch(
       provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : provider === "deepseek"
          ? "https://api.deepseek.com/chat/completions"
          : "https://api.openai.com/v1/chat/completions",
       {
        method: "POST",
        headers: {
         Authorization: `Bearer ${apiKey}`,
         "Content-Type": "application/json",
        },
        body: JSON.stringify({
         model,
         messages: [{ role: "user", content: 'Return exactly one JSON object: {"ok":true}' }],
         ...(provider === "groq" || (provider === "openai" && model.startsWith("gpt-5"))
          ? { max_completion_tokens: 64 }
          : { max_tokens: 64 }),
         response_format: { type: "json_object" },
        }),
        signal,
       },
      );
  if (!response.ok) return { ok: false };
  const payload = await response.json();
  return {
   ok:
    provider === "gemini"
     ? geminiGenerationSchema.safeParse(payload).success
     : openAiCompatibleGenerationSchema.safeParse(payload).success,
  };
 } catch (error) {
  if (abortSignal?.aborted) throw error;
  return { ok: false };
 }
}

function getProviderCandidates(apiKey: string): ApiKeyProvider[] {
 const trimmed = apiKey.trim();
 if (trimmed.startsWith("gsk_")) return ["groq"];
 if (trimmed.startsWith("AIza")) return ["gemini"];
 if (trimmed.startsWith("sk-proj-")) return ["openai", "deepseek"];
 if (trimmed.startsWith("sk-")) return ["deepseek", "openai"];
 return ["groq", "gemini", "deepseek", "openai"];
}

async function discoverProviderModels(
 apiKey: string,
 provider: ApiKeyProvider,
 abortSignal?: AbortSignal,
): Promise<ApiKeyDiscoveryResult> {
 try {
  const response = await fetchProviderModels(apiKey, provider, abortSignal);
  if (response.status === 400 || response.status === 401 || response.status === 403) {
   return { ok: false, error: `${getApiKeyProviderLabel(provider)} từ chối API key này.` };
  }
  if (response.status === 402 || response.status === 429) {
   return {
    ok: false,
    error: `${getApiKeyProviderLabel(provider)} nhận key nhưng quota/số dư hiện không khả dụng.`,
   };
  }
  if (!response.ok) {
   return {
    ok: false,
    error: `${getApiKeyProviderLabel(provider)} trả về lỗi HTTP ${response.status}.`,
   };
  }

  const liveModels = await parseLiveModels(response, provider);
  const supportedModels = getApiKeyModelOptions(provider)
   .map((option) => option.value)
   .filter((model) => liveModels.includes(model));

  if (supportedModels.length === 0) {
   return {
    ok: false,
    error: `${getApiKeyProviderLabel(provider)} key hợp lệ nhưng hiện không có model tương thích với app.`,
   };
  }

  return {
   ok: true,
   value: {
    provider,
    providerLabel: getApiKeyProviderLabel(provider),
    models: supportedModels,
    recommendedModel: getRecommendedModel(provider, supportedModels),
   },
  };
 } catch (error) {
  if (abortSignal?.aborted) throw error;
  return {
   ok: false,
   error: `${getApiKeyProviderLabel(provider)} không phản hồi khi kiểm tra key/model.`,
  };
 }
}

function fetchProviderModels(apiKey: string, provider: ApiKeyProvider, abortSignal?: AbortSignal) {
 const signal = createRequestSignal(DISCOVERY_TIMEOUT_MS, abortSignal);

 if (provider === "gemini") {
  return fetch("https://generativelanguage.googleapis.com/v1beta/models", {
   headers: { "x-goog-api-key": apiKey },
   signal,
  });
 }

 const url =
  provider === "groq"
   ? "https://api.groq.com/openai/v1/models"
   : provider === "deepseek"
     ? "https://api.deepseek.com/models"
     : "https://api.openai.com/v1/models";
 return fetch(url, {
  headers: { Authorization: `Bearer ${apiKey}` },
  signal,
 });
}

async function parseLiveModels(response: Response, provider: ApiKeyProvider): Promise<string[]> {
 if (provider === "gemini") {
  const parsed = geminiModelsSchema.parse(await response.json());
  return (parsed.models || [])
   .filter((model) => (model.supportedGenerationMethods || []).includes("generateContent"))
   .map((model) => model.name || "")
   .filter(Boolean);
 }

 const parsed = openAiCompatibleModelsSchema.parse(await response.json());
 return (parsed.data || []).map((model) => model.id);
}

function getRecommendedModel(provider: ApiKeyProvider, models: string[]): string {
 const preferences: Record<ApiKeyProvider, readonly string[]> = {
  groq: ["qwen/qwen3.6-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"],
  gemini: ["models/gemini-3.5-flash", "models/gemini-2.5-flash", "models/gemini-2.5-pro"],
  deepseek: ["deepseek-v4-flash", "deepseek-v4-pro"],
  openai: ["gpt-5-mini", "gpt-5-nano", "gpt-4.1-mini", "gpt-4.1-nano"],
 };
 return preferences[provider].find((model) => models.includes(model)) || models[0];
}
