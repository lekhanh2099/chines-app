/**
 * AI Service — structured Chinese word/sentence analysis.
 *
 * Strategy:
 *   1. Gemini Flash 2.0 (primary)
 *   2. DeepSeek-V3 (fallback)
 *
 * This is a pure service layer — no Next.js, no DB, no auth.
 */

import { z } from "zod";
import {
 renderWordLookupBasicPrompt,
 renderSentenceLookupPrompt,
 renderWordLookupPrompt,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 normalizeGeminiModel,
 type GeminiModelId,
} from "@/lib/gemini-models";
import { createRequestSignal, throwIfAborted } from "@/lib/request-utils";
import type { UserApiKeyCredential } from "@/services/user-api-keys.service";
import {
 aiAnalysisSchema,
 sentenceInsightSchema,
 type AiVocabResponse,
 type SentenceInsightResponse,
} from "@/types/database";

type RawProviderResult = {
 content: string | null;
 error: string | null;
};

type StructuredRequestResult<T> = {
 data: T | null;
 error: string | null;
};

type ProviderName = "Gemini" | "DeepSeek" | "OpenAI";

type ProviderOutageState = {
 unavailableUntil: number;
 reason: string;
};

const providerOutages: Record<string, ProviderOutageState> = {};

type AiRequestOptions = {
 promptTemplate?: string | null;
 geminiModel?: string | null;
 userApiKeys?: UserApiKeyCredential[];
 abortSignal?: AbortSignal | null;
};

/* ══════════════════════════════════════════
   System Prompt
   ══════════════════════════════════════════ */

const WORD_SYSTEM_PROMPT = `You are a Chinese-Vietnamese lexicography engine.

Follow the user prompt exactly.
Return valid JSON only.
Do not include markdown fences or commentary.`;

const wordPrompt = (hanzi: string, promptTemplate?: string | null) =>
 renderWordLookupPrompt(hanzi, promptTemplate);

const SENTENCE_SYSTEM_PROMPT = `You are a Chinese-Vietnamese translation and grammar engine.

Follow the user prompt exactly.
Return valid JSON only.
Do not include markdown fences or commentary.`;

const sentencePrompt = (text: string, promptTemplate?: string | null) =>
 renderSentenceLookupPrompt(text, promptTemplate);

function getProviderOutageKey(
 provider: ProviderName,
 geminiModel?: GeminiModelId,
): string {
 return provider === "Gemini"
  ? `${provider}:${geminiModel || DEFAULT_GEMINI_MODEL}`
  : provider;
}

function getProviderSkipReason(
 provider: ProviderName,
 geminiModel?: GeminiModelId,
): string | null {
 const outage = providerOutages[getProviderOutageKey(provider, geminiModel)];
 if (!outage) return null;

 if (Date.now() >= outage.unavailableUntil) {
  delete providerOutages[getProviderOutageKey(provider, geminiModel)];
  return null;
 }

 return outage.reason;
}

function markProviderUnavailable(
 provider: ProviderName,
 cooldownMs: number,
 reason: string,
 geminiModel?: GeminiModelId,
) {
 providerOutages[getProviderOutageKey(provider, geminiModel)] = {
  unavailableUntil: Date.now() + cooldownMs,
  reason,
 };
}

function getProviderCooldownMs(
 provider: ProviderName,
 status: number,
 errorBody: string,
): number {
 const retryMatch = errorBody.match(/"retryDelay"\s*:\s*"([\d.]+)s"/i);
 const retrySeconds = retryMatch ? Number(retryMatch[1]) : NaN;

 if (provider === "Gemini" && status === 429) {
  if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
   return Math.ceil(retrySeconds * 1000);
  }

  return 60_000;
 }

 if (provider === "DeepSeek" && status === 402) {
  return 10 * 60_000;
 }

 if (status === 401 || status === 403) {
  return 10 * 60_000;
 }

 return 0;
}

/* ══════════════════════════════════════════
   Provider: DeepSeek
   ══════════════════════════════════════════ */

async function callDeepSeekRaw(
 systemPrompt: string,
 prompt: string,
 options?: {
  apiKey?: string | null;
  model?: string | null;
  useOutageTracking?: boolean;
  abortSignal?: AbortSignal | null;
 },
): Promise<RawProviderResult> {
 const isUserKey = !!options?.apiKey;
 const apiKey = options?.apiKey || process.env.DEEPSEEK_API_KEY;
 const model = options?.model || "deepseek-chat";
 const useOutageTracking = options?.useOutageTracking ?? !isUserKey;

 // Only check outage for system key; user key gets a fresh attempt
 if (useOutageTracking) {
  const skippedReason = getProviderSkipReason("DeepSeek");
  if (skippedReason) {
   console.warn("[AI:DeepSeek] Skipped due to recent provider outage");
   return {
    content: null,
    error: skippedReason,
   };
  }
 }

 if (!apiKey) {
  console.warn("[AI:DeepSeek] No API key configured");
  return {
   content: null,
   error: "DeepSeek chưa được cấu hình API key.",
  };
 }

 try {
  throwIfAborted(options?.abortSignal);

  const res = await fetch("https://api.deepseek.com/chat/completions", {
   method: "POST",
   headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
   },
   body: JSON.stringify({
    model,
    messages: [
     { role: "system", content: systemPrompt },
     { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
   }),
   signal: createRequestSignal(30_000, options?.abortSignal),
  });

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   console.error(`[AI:DeepSeek] HTTP ${res.status}:`, errBody);

   if (isUserKey) {
    const userError = formatManagedKeyError("DeepSeek", res.status, errBody);
    return { content: null, error: userError };
   }

   const errorMessage = formatProviderError("DeepSeek", res.status, errBody);
   const cooldownMs = getProviderCooldownMs("DeepSeek", res.status, errBody);
   if (cooldownMs > 0) {
    markProviderUnavailable("DeepSeek", cooldownMs, errorMessage);
   }
   return {
    content: null,
    error: errorMessage,
   };
  }

  const json: unknown = await res.json();
  const content = (json as Record<string, unknown[]>)?.choices?.[0] as
   | Record<string, Record<string, string>>
   | undefined;
  if (!content?.message?.content) {
   return {
    content: null,
    error: "DeepSeek trả về response rỗng.",
   };
  }

  return {
   content: content.message.content,
   error: null,
  };
 } catch (err) {
  console.error("[AI:DeepSeek] Error:", err);
  return {
   content: null,
   error: `DeepSeek lỗi kết nối: ${err instanceof Error ? err.message : "unknown error"}.`,
  };
 }
}

/* ══════════════════════════════════════════
   Provider: Gemini Flash 2.0
   ══════════════════════════════════════════ */

async function callGeminiRaw(
 systemPrompt: string,
 prompt: string,
 model: GeminiModelId,
 apiKey?: string | null,
 abortSignal?: AbortSignal | null,
): Promise<RawProviderResult> {
 const isUserKey = !!apiKey;

 if (!isUserKey) {
  const skippedReason = getProviderSkipReason("Gemini", model);
  if (skippedReason) {
   console.warn("[AI:Gemini] Skipped due to recent provider outage");
   return {
    content: null,
    error: skippedReason,
   };
  }
 }

 const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;
 if (!resolvedApiKey) {
  console.warn("[AI:Gemini] No API key configured");
  return {
   content: null,
   error: "Gemini chưa được cấu hình API key.",
  };
 }

 try {
  throwIfAborted(abortSignal);

  const res = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${resolvedApiKey}`,
   {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     contents: [
      {
       parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
      },
     ],
     generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
     },
    }),
    signal: createRequestSignal(30_000, abortSignal),
   },
  );

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   console.error(`[AI:Gemini] HTTP ${res.status}:`, errBody);

   if (isUserKey) {
    return {
     content: null,
     error: formatManagedKeyError("Gemini", res.status, errBody),
    };
   }

   const errorMessage = formatProviderError("Gemini", res.status, errBody);
   const cooldownMs = getProviderCooldownMs("Gemini", res.status, errBody);
   if (cooldownMs > 0) {
    markProviderUnavailable("Gemini", cooldownMs, errorMessage, model);
   }
   return {
    content: null,
    error: errorMessage,
   };
  }

  const json: unknown = await res.json();
  const content = (
   json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
   }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
   return {
    content: null,
    error: "Gemini trả về response rỗng.",
   };
  }

  return {
   content,
   error: null,
  };
 } catch (err) {
  console.error("[AI:Gemini] Error:", err);
  return {
   content: null,
   error: `Gemini lỗi kết nối: ${err instanceof Error ? err.message : "unknown error"}.`,
  };
 }
}

async function callOpenAiRaw(
 systemPrompt: string,
 prompt: string,
 apiKey: string,
 model?: string | null,
 abortSignal?: AbortSignal | null,
): Promise<RawProviderResult> {
 const resolvedModel = model || "gpt-4.1-mini";

 try {
  throwIfAborted(abortSignal);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
   method: "POST",
   headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
   },
   body: JSON.stringify({
    model: resolvedModel,
    messages: [
     { role: "system", content: systemPrompt },
     { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
   }),
   signal: createRequestSignal(30_000, abortSignal),
  });

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   console.error(`[AI:OpenAI] HTTP ${res.status}:`, errBody);
   return {
    content: null,
    error: formatManagedKeyError("OpenAI", res.status, errBody),
   };
  }

  const json = (await res.json()) as {
   choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
   return {
    content: null,
    error: "OpenAI trả về response rỗng.",
   };
  }

  return { content, error: null };
 } catch (err) {
  console.error("[AI:OpenAI] Error:", err);
  return {
   content: null,
   error: `OpenAI lỗi kết nối: ${err instanceof Error ? err.message : "unknown error"}.`,
  };
 }
}

function formatProviderError(
 provider: "Gemini" | "DeepSeek" | "OpenAI",
 status: number,
 errorBody: string,
): string {
 const body = errorBody.toLowerCase();

 if (provider === "Gemini") {
  if (status === 429 && body.includes("quota")) {
   return "Gemini đã hết quota hoặc đang bị rate limit.";
  }

  if (status === 401 || status === 403) {
   return "Gemini API key không hợp lệ hoặc bị từ chối.";
  }
 }

 if (provider === "DeepSeek") {
  if (status === 402 || body.includes("insufficient balance")) {
   return "DeepSeek đã hết số dư.";
  }

  if (status === 401 || status === 403) {
   return "DeepSeek API key không hợp lệ hoặc bị từ chối.";
  }
 }

 if (provider === "OpenAI") {
  if (
   status === 429 ||
   body.includes("insufficient_quota") ||
   body.includes("rate limit")
  ) {
   return "OpenAI đã hết quota hoặc đang bị rate limit.";
  }

  if (status === 401 || status === 403) {
   return "OpenAI API key không hợp lệ hoặc bị từ chối.";
  }
 }

 return `${provider} lỗi HTTP ${status}.`;
}

function formatManagedKeyError(
 provider: "Gemini" | "DeepSeek" | "OpenAI",
 status: number,
 errorBody: string,
): string {
 const body = errorBody.toLowerCase();

 if (provider === "DeepSeek") {
  if (status === 401 || status === 403) {
   return "DeepSeek key không hợp lệ hoặc đã bị thu hồi.";
  }

  if (
   status === 402 ||
   body.includes("insufficient balance") ||
   body.includes("insufficient_quota")
  ) {
   return "DeepSeek key đã hết tín dụng.";
  }

  if (status === 429) {
   return "DeepSeek key đang bị rate limit.";
  }

  return `DeepSeek key trả về HTTP ${status}.`;
 }

 if (provider === "Gemini") {
  if (status === 400 || status === 401 || status === 403) {
   return "Gemini key không hợp lệ hoặc không có quyền truy cập model hiện tại.";
  }

  if (status === 429 || body.includes("quota")) {
   return "Gemini key đã hết quota hoặc đang bị rate limit.";
  }

  return `Gemini key trả về HTTP ${status}.`;
 }

 if (status === 401 || status === 403) {
  return "OpenAI key không hợp lệ hoặc đã bị thu hồi.";
 }

 if (
  status === 429 ||
  body.includes("insufficient_quota") ||
  body.includes("rate limit")
 ) {
  return "OpenAI key đã hết quota hoặc đang bị rate limit.";
 }

 return `OpenAI key trả về HTTP ${status}.`;
}

/* ══════════════════════════════════════════
   BYOK System Prompt (hidden, always prepended)
   ══════════════════════════════════════════ */

const BYOK_HIDDEN_SYSTEM_PROMPT = `You are a helpful Chinese language tutor specializing in teaching Chinese to Vietnamese speakers. Always provide accurate pinyin, clear Vietnamese translations, and grammar explanations. Stay focused on Chinese language learning topics.`;

/* ══════════════════════════════════════════
   JSON Parser + Zod Validation
   ══════════════════════════════════════════ */

function parseAndValidate<T>(
 raw: string,
 schema: z.ZodType<T>,
 fallback: (parsed: unknown) => boolean,
): T | null {
 try {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
   cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  const parsed: unknown = JSON.parse(cleaned);

  const result = schema.safeParse(parsed);
  if (!result.success) {
   console.error("[AI] Zod validation failed:", result.error.issues);
   if (fallback(parsed)) {
    console.warn("[AI] Using unvalidated data as fallback");
    return parsed as T;
   }
   return null;
  }

  return result.data;
 } catch {
  console.error("[AI] Failed to parse JSON:", raw.slice(0, 200));
  return null;
 }
}

function normalizeWordAnalysis(
 hanzi: string,
 parsed: AiVocabResponse,
): AiVocabResponse {
 const definitions = parsed.definitions?.map((definition) => ({
  ...definition,
  text: definition.text || definition.meaning,
  meaning: definition.meaning || definition.text,
  examples: definition.examples?.map((example) => ({
   ...example,
   py: example.py || example.pinyin,
   pinyin: example.pinyin || example.py,
  })),
 }));

 const flattenedExamples = [
  ...(parsed.examples || []),
  ...((definitions || []).flatMap((definition) =>
   (definition.examples || []).map((example) => ({
    zh: example.cn || "",
    pinyin: example.pinyin || example.py || "",
    vi: example.vi || "",
   })),
  ) || []),
  ...((parsed.meanings || []).flatMap((meaning) =>
   meaning.example
    ? [
       {
        zh: meaning.example.cn || "",
        pinyin: meaning.example.pinyin || "",
        vi: meaning.example.vi || "",
       },
      ]
    : [],
  ) || []),
 ].filter((example) => example.zh || example.pinyin || example.vi);

 const resolvedSinoVietnamese =
  parsed.sino_vietnamese || parsed.han_viet || undefined;

 return {
  ...parsed,
  hanzi,
  ...(resolvedSinoVietnamese
   ? {
      sino_vietnamese: resolvedSinoVietnamese,
      han_viet: parsed.han_viet || resolvedSinoVietnamese,
     }
   : {}),
  ...(definitions ? { definitions } : {}),
  ...(flattenedExamples.length ? { examples: flattenedExamples } : {}),
  ...(parsed.common_mistakes || parsed.confusion || parsed.confusion_warning
   ? {
      common_mistakes:
       parsed.common_mistakes || parsed.confusion || parsed.confusion_warning,
      confusion:
       parsed.confusion || parsed.confusion_warning || parsed.common_mistakes,
      confusion_warning:
       parsed.confusion_warning || parsed.confusion || parsed.common_mistakes,
     }
   : {}),
 };
}

function normalizeBasicWordAnalysis(
 hanzi: string,
 parsed: AiVocabResponse,
): AiVocabResponse {
 const normalized = normalizeWordAnalysis(hanzi, parsed);
 const firstDefinition = normalized.definitions?.find(
  (definition) => definition.meaning || definition.text,
 );
 const meaningSummary =
  normalized.meaning_summary ||
  firstDefinition?.meaning ||
  firstDefinition?.text ||
  normalized.meanings?.find((item) => item.definition)?.definition ||
  "";

 return {
  hanzi,
  pinyin: normalized.pinyin || "",
  sino_vietnamese:
   normalized.sino_vietnamese || normalized.han_viet || undefined,
  han_viet: normalized.han_viet || normalized.sino_vietnamese || undefined,
  meaning_summary: meaningSummary,
  ...(firstDefinition
   ? {
      definitions: [
       {
        pos: firstDefinition.pos,
        meaning:
         firstDefinition.meaning || firstDefinition.text || meaningSummary,
        text: firstDefinition.text || firstDefinition.meaning || meaningSummary,
       },
      ],
     }
   : {}),
 };
}

function normalizeSentenceInsight(
 text: string,
 parsed: SentenceInsightResponse,
): SentenceInsightResponse {
 return {
  ...parsed,
  text,
  grammar_points: parsed.grammar_points?.map((point) => ({
   ...point,
   pattern: point.pattern || point.structure,
   structure: point.structure || point.pattern,
  })),
 };
}

async function requestStructuredJson<T>(
 systemPrompt: string,
 prompt: string,
 geminiModel: GeminiModelId,
 schema: z.ZodType<T>,
 fallback: (parsed: unknown) => boolean,
 userApiKeys?: UserApiKeyCredential[],
 abortSignal?: AbortSignal | null,
): Promise<StructuredRequestResult<T>> {
 const providerErrors: string[] = [];

 const managedSystemPrompt = `${BYOK_HIDDEN_SYSTEM_PROMPT}\n\n${systemPrompt}`;

 throwIfAborted(abortSignal);

 for (const userApiKey of userApiKeys || []) {
  throwIfAborted(abortSignal);

  let rawResult: RawProviderResult | null = null;

  if (userApiKey.provider === "deepseek") {
   rawResult = await callDeepSeekRaw(managedSystemPrompt, prompt, {
    apiKey: userApiKey.apiKey,
    model: userApiKey.defaultModel,
    useOutageTracking: false,
    abortSignal,
   });
  } else if (userApiKey.provider === "gemini") {
   rawResult = await callGeminiRaw(
    managedSystemPrompt,
    prompt,
    geminiModel,
    userApiKey.apiKey,
    abortSignal,
   );
  } else if (userApiKey.provider === "openai") {
   rawResult = await callOpenAiRaw(
    managedSystemPrompt,
    prompt,
    userApiKey.apiKey,
    userApiKey.defaultModel,
    abortSignal,
   );
  }

  if (!rawResult) {
   continue;
  }

  if (rawResult.content) {
   const managedKeyResult = parseAndValidate(
    rawResult.content,
    schema,
    fallback,
   );
   if (managedKeyResult) {
    return { data: managedKeyResult, error: null };
   }

   providerErrors.push(`${userApiKey.label} trả JSON không đúng schema.`);
   continue;
  }

  if (rawResult.error) {
   providerErrors.push(`${userApiKey.label}: ${rawResult.error}`);
  }
 }

 throwIfAborted(abortSignal);

 const geminiRaw = await callGeminiRaw(
  systemPrompt,
  prompt,
  geminiModel,
  undefined,
  abortSignal,
 );
 if (geminiRaw.content) {
  const geminiResult = parseAndValidate(geminiRaw.content, schema, fallback);
  if (geminiResult) {
   return { data: geminiResult, error: null };
  }
  providerErrors.push("Gemini trả JSON không đúng schema.");
 } else if (geminiRaw.error) {
  providerErrors.push(geminiRaw.error);
 }

 console.log("[AI] Gemini failed, trying DeepSeek...");

 throwIfAborted(abortSignal);

 const deepSeekRaw = await callDeepSeekRaw(systemPrompt, prompt, {
  useOutageTracking: true,
  abortSignal,
 });
 if (deepSeekRaw.content) {
  const deepSeekResult = parseAndValidate(
   deepSeekRaw.content,
   schema,
   fallback,
  );
  if (deepSeekResult) {
   return { data: deepSeekResult, error: null };
  }
  providerErrors.push("DeepSeek trả JSON không đúng schema.");
 } else if (deepSeekRaw.error) {
  providerErrors.push(deepSeekRaw.error);
 }

 return {
  data: null,
  error: providerErrors.join(" "),
 };
}

/* ══════════════════════════════════════════
   Public API
   ══════════════════════════════════════════ */

export async function analyzeHanzi(
 hanzi: string,
 options?: AiRequestOptions,
): Promise<AiVocabResponse | null> {
 const result = await analyzeHanziDetailed(hanzi, options);
 return result.data;
}

export async function analyzeHanziDetailed(
 hanzi: string,
 options?: AiRequestOptions,
): Promise<StructuredRequestResult<AiVocabResponse>> {
 console.log("[AI] Analyzing:", hanzi);

 const geminiModel = normalizeGeminiModel(
  options?.geminiModel || DEFAULT_GEMINI_MODEL,
 );

 const result = await requestStructuredJson(
  WORD_SYSTEM_PROMPT,
  wordPrompt(hanzi, options?.promptTemplate),
  geminiModel,
  aiAnalysisSchema,
  (parsed) => typeof parsed === "object" && parsed !== null,
  options?.userApiKeys,
  options?.abortSignal,
 );

 if (result.data) {
  return {
   data: normalizeWordAnalysis(hanzi, result.data),
   error: null,
  };
 }

 console.error("[AI] All providers failed for:", hanzi);
 return {
  data: null,
  error:
   result.error ||
   "Không thể generate nghĩa tiếng Việt lúc này vì tất cả AI provider đều thất bại.",
 };
}

export async function analyzeHanziBasicDetailed(
 hanzi: string,
 options?: AiRequestOptions,
): Promise<StructuredRequestResult<AiVocabResponse>> {
 console.log("[AI] Analyzing basic word:", hanzi);

 const geminiModel = normalizeGeminiModel(
  options?.geminiModel || DEFAULT_GEMINI_MODEL,
 );

 const result = await requestStructuredJson(
  WORD_SYSTEM_PROMPT,
  renderWordLookupBasicPrompt(hanzi),
  geminiModel,
  aiAnalysisSchema,
  (parsed) => typeof parsed === "object" && parsed !== null,
  options?.userApiKeys,
  options?.abortSignal,
 );

 if (result.data) {
  return {
   data: normalizeBasicWordAnalysis(hanzi, result.data),
   error: null,
  };
 }

 console.error("[AI] All providers failed for basic word:", hanzi);
 return {
  data: null,
  error:
   result.error ||
   "Không thể generate nghĩa cơ bản lúc này vì tất cả AI provider đều thất bại.",
 };
}

export async function analyzeSentence(
 text: string,
 options?: AiRequestOptions,
): Promise<SentenceInsightResponse | null> {
 const result = await analyzeSentenceDetailed(text, options);
 return result.data;
}

export async function analyzeSentenceDetailed(
 text: string,
 options?: AiRequestOptions,
): Promise<StructuredRequestResult<SentenceInsightResponse>> {
 console.log("[AI] Analyzing sentence:", text);

 const geminiModel = normalizeGeminiModel(
  options?.geminiModel || DEFAULT_GEMINI_MODEL,
 );

 const result = await requestStructuredJson(
  SENTENCE_SYSTEM_PROMPT,
  sentencePrompt(text, options?.promptTemplate),
  geminiModel,
  sentenceInsightSchema,
  (parsed) => typeof parsed === "object" && parsed !== null,
  options?.userApiKeys,
  options?.abortSignal,
 );

 if (result.data) {
  return {
   data: normalizeSentenceInsight(text, result.data),
   error: null,
  };
 }

 console.error("[AI] All providers failed for sentence:", text);
 return {
  data: null,
  error:
   result.error ||
   "Không thể generate bản dịch tiếng Việt lúc này vì tất cả AI provider đều thất bại.",
 };
}
