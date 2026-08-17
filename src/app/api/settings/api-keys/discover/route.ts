import type { JsonFieldValue } from "@/types/json";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiKeyModelOptions } from "@/lib/api-key-models";
import {
 AUTO_API_KEY_PROVIDER,
 ApiKeyProviderSchema,
 getApiKeyProviderLabel,
 type ApiKeyProvider,
} from "@/lib/api-key-providers";
import { createClient } from "@/lib/supabase/server";

const DISCOVERY_TIMEOUT_MS = 10_000;
const RequestedProviderSchema = z.union([
 z.literal(AUTO_API_KEY_PROVIDER),
 ApiKeyProviderSchema,
]);
const requestSchema = z.strictObject({
 apiKey: z.string().trim().min(1).max(400),
 provider: RequestedProviderSchema.default(AUTO_API_KEY_PROVIDER),
});
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

type DiscoverySuccess = {
 provider: ApiKeyProvider;
 models: string[];
 recommendedModel: string;
};
type DiscoveryResult =
 | { ok: true; value: DiscoverySuccess }
 | { ok: false; error: string };

export async function POST(request: Request) {
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = requestSchema.safeParse(payload);
 if (!parsed.success) {
  return NextResponse.json({ error: "API key không hợp lệ." }, { status: 400 });
 }

 const candidates =
  parsed.data.provider === AUTO_API_KEY_PROVIDER
   ? getProviderCandidates(parsed.data.apiKey)
   : [parsed.data.provider];
 const errors: string[] = [];

 for (const provider of candidates) {
  const result = await discoverProviderModels(parsed.data.apiKey, provider, request.signal);
  if (result.ok) {
   return NextResponse.json({
    valid: true,
    provider: result.value.provider,
    providerLabel: getApiKeyProviderLabel(result.value.provider),
    models: result.value.models,
    recommendedModel: result.value.recommendedModel,
   });
  }
  errors.push(result.error);
 }

 return NextResponse.json(
  {
   error:
    errors[0] ||
    "Không thể xác định provider hoặc tải model cho API key này. Hãy kiểm tra key rồi thử lại.",
  },
  { status: 400 },
 );
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
 abortSignal: AbortSignal,
): Promise<DiscoveryResult> {
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
  const configuredOptions = getApiKeyModelOptions(provider);
  const supportedModels = configuredOptions
   .map((option) => option.value)
   .filter((model) => liveModels.includes(model));

  if (supportedModels.length === 0) {
   return {
    ok: false,
    error: `${getApiKeyProviderLabel(provider)} key hợp lệ nhưng hiện không có model tương thích với app.`,
   };
  }

  const recommendedModel = getRecommendedModel(provider, supportedModels);
  return {
   ok: true,
   value: { provider, models: supportedModels, recommendedModel },
  };
 } catch (error) {
  if (abortSignal.aborted) throw error;
  return {
   ok: false,
   error: `${getApiKeyProviderLabel(provider)} không phản hồi khi kiểm tra key/model.`,
  };
 }
}

function fetchProviderModels(apiKey: string, provider: ApiKeyProvider, abortSignal: AbortSignal) {
 const signal = AbortSignal.any([
  abortSignal,
  AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
 ]);

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
  gemini: [
   "models/gemini-3.5-flash",
   "models/gemini-2.5-flash",
   "models/gemini-2.5-pro",
  ],
  deepseek: ["deepseek-v4-flash", "deepseek-v4-pro"],
  openai: ["gpt-5-mini", "gpt-5-nano", "gpt-4.1-mini", "gpt-4.1-nano"],
 };
 return preferences[provider].find((model) => models.includes(model)) || models[0];
}
