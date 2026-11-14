/**
 * AI Service — structured Chinese word/sentence analysis.
 *
 * Strategy: use the selected BYOK key/model, or the configured system Gemini model when no
 * eligible BYOK key exists. Provider/model fallback is intentionally disabled.
 *
 * This is a pure service layer — no Next.js, no DB, no auth.
 */

import { z } from "zod";
import {
 renderWordLookupBasicPrompt,
 renderSentenceLookupPrompt,
 renderWordLookupPrompt,
} from "@/lib/ai/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 isGeminiModelId,
 normalizeGeminiModel,
 type GeminiModelId,
} from "@/lib/ai/gemini-models";
import { throwIfAborted } from "@/lib/api/request-utils";
import { logger } from "@/lib/logger";
import {
 normalizeBasicWordAnalysis,
 normalizeSentenceInsight,
 normalizeWordAnalysis,
} from "@/services/ai/ai-analysis-normalizers.service";
import {
 callDeepSeekRaw,
 callGeminiRaw,
 callGroqRaw,
 callOpenAiRaw,
 type NullableAbortSignal,
 type NullableString,
 type RawProviderResult,
} from "@/services/ai/ai-provider-clients.service";
import type { UserApiKeyCredential } from "@/services/ai/user-api-keys.service";
import {
 aiAnalysisSchema,
 sentenceInsightSchema,
 type AiVocabResponse,
 type SentenceInsightResponse,
} from "@/types/database";

type StructuredRequestResult<T> = {
 data: z.infer<z.ZodNullable<z.ZodType<T>>>;
 error: z.infer<z.ZodNullable<z.ZodString>>;
};

type AiRequestOptions = {
 promptTemplate?: NullableString;
 geminiModel?: NullableString;
 userApiKeys?: UserApiKeyCredential[];
 abortSignal?: NullableAbortSignal;
 allowGroq?: boolean;
};

/* ══════════════════════════════════════════
   System Prompt
   ══════════════════════════════════════════ */

const WORD_SYSTEM_PROMPT = `You are a Chinese-Vietnamese lexicography engine.

Follow the user prompt exactly.
Return valid JSON only.
Do not include markdown fences or commentary.`;

const wordPrompt = (hanzi: string, promptTemplate?: NullableString) =>
 renderWordLookupPrompt(hanzi, promptTemplate);

const SENTENCE_SYSTEM_PROMPT = `You are a Chinese-Vietnamese translation and grammar engine.

Follow the user prompt exactly.
Return valid JSON only.
Do not include markdown fences or commentary.`;

const sentencePrompt = (text: string, promptTemplate?: NullableString) =>
 renderSentenceLookupPrompt(text, promptTemplate);

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
): z.infer<z.ZodNullable<z.ZodType<T>>> {
 try {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
   cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  const parsed = z.json().parse(JSON.parse(cleaned));

  const result = schema.safeParse(parsed);
  if (!result.success) {
   logger.error("[AI] Zod validation failed:", result.error.issues);
   return null;
  }

  return result.data;
 } catch {
  logger.error("[AI] Failed to parse JSON:", raw.slice(0, 200));
  return null;
 }
}

async function requestStructuredJson<T>(
 systemPrompt: string,
 prompt: string,
 geminiModel: GeminiModelId,
 schema: z.ZodType<T>,
 userApiKeys?: UserApiKeyCredential[],
 abortSignal?: NullableAbortSignal,
 allowGroq = false,
): Promise<StructuredRequestResult<T>> {
 const providerErrors: string[] = [];

 const managedSystemPrompt = `${BYOK_HIDDEN_SYSTEM_PROMPT}\n\n${systemPrompt}`;
 const selectedUserApiKey = (userApiKeys || []).find((key) => key.provider !== "groq" || allowGroq);

 throwIfAborted(abortSignal);

 for (const userApiKey of selectedUserApiKey ? [selectedUserApiKey] : []) {
  throwIfAborted(abortSignal);

  let rawResult: z.infer<z.ZodNullable<z.ZodType<RawProviderResult>>> = null;

  if (userApiKey.provider === "deepseek") {
   rawResult = await callDeepSeekRaw(managedSystemPrompt, prompt, {
    apiKey: userApiKey.apiKey,
    model: userApiKey.defaultModel,
    useOutageTracking: false,
    abortSignal,
   });
  } else if (userApiKey.provider === "gemini") {
   rawResult = isGeminiModelId(userApiKey.defaultModel)
    ? await callGeminiRaw(
       managedSystemPrompt,
       prompt,
       userApiKey.defaultModel,
       userApiKey.apiKey,
       abortSignal,
      )
    : {
       content: null,
       error: "Model Gemini đã lưu không còn hợp lệ. Hãy chọn lại model trong Cài đặt.",
      };
  } else if (userApiKey.provider === "openai") {
   rawResult = await callOpenAiRaw(
    managedSystemPrompt,
    prompt,
    userApiKey.apiKey,
    userApiKey.defaultModel,
    abortSignal,
   );
  } else if (userApiKey.provider === "groq" && allowGroq) {
   rawResult = await callGroqRaw(
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
   const managedKeyResult = parseAndValidate(rawResult.content, schema);
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

 if (selectedUserApiKey) {
  return {
   data: null,
   error: providerErrors.join(" ") || `${selectedUserApiKey.label} không thể xử lý request.`,
  };
 }

 throwIfAborted(abortSignal);

 const geminiRaw = await callGeminiRaw(systemPrompt, prompt, geminiModel, undefined, abortSignal);
 if (geminiRaw.content) {
  const geminiResult = parseAndValidate(geminiRaw.content, schema);
  if (geminiResult) {
   return { data: geminiResult, error: null };
  }
  providerErrors.push("Gemini trả JSON không đúng schema.");
 } else if (geminiRaw.error) {
  providerErrors.push(geminiRaw.error);
 }

 return {
  data: null,
  error: providerErrors.join(" "),
 };
}

export async function analyzeHanziDetailed(
 hanzi: string,
 options?: AiRequestOptions,
): Promise<StructuredRequestResult<AiVocabResponse>> {
 logger.info("[AI] Analyzing:", hanzi);

 const geminiModel = normalizeGeminiModel(options?.geminiModel || DEFAULT_GEMINI_MODEL);

 const result = await requestStructuredJson(
  WORD_SYSTEM_PROMPT,
  wordPrompt(hanzi, options?.promptTemplate),
  geminiModel,
  aiAnalysisSchema,
  options?.userApiKeys,
  options?.abortSignal,
  options?.allowGroq,
 );

 if (result.data) {
  return {
   data: normalizeWordAnalysis(hanzi, result.data),
   error: null,
  };
 }

 logger.error("[AI] All providers failed for:", hanzi);
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
 logger.info("[AI] Analyzing basic word:", hanzi);

 const geminiModel = normalizeGeminiModel(options?.geminiModel || DEFAULT_GEMINI_MODEL);

 const result = await requestStructuredJson(
  WORD_SYSTEM_PROMPT,
  renderWordLookupBasicPrompt(hanzi),
  geminiModel,
  aiAnalysisSchema,
  options?.userApiKeys,
  options?.abortSignal,
  options?.allowGroq,
 );

 if (result.data) {
  return {
   data: normalizeBasicWordAnalysis(hanzi, result.data),
   error: null,
  };
 }

 logger.error("[AI] All providers failed for basic word:", hanzi);
 return {
  data: null,
  error:
   result.error || "Không thể generate nghĩa cơ bản lúc này vì tất cả AI provider đều thất bại.",
 };
}

export async function analyzeSentenceDetailed(
 text: string,
 options?: AiRequestOptions,
): Promise<StructuredRequestResult<SentenceInsightResponse>> {
 logger.info("[AI] Analyzing sentence:", text);

 const geminiModel = normalizeGeminiModel(options?.geminiModel || DEFAULT_GEMINI_MODEL);

 const result = await requestStructuredJson(
  SENTENCE_SYSTEM_PROMPT,
  sentencePrompt(text, options?.promptTemplate),
  geminiModel,
  sentenceInsightSchema,
  options?.userApiKeys,
  options?.abortSignal,
  options?.allowGroq,
 );

 if (result.data) {
  return {
   data: normalizeSentenceInsight(text, result.data),
   error: null,
  };
 }

 logger.error("[AI] All providers failed for sentence:", text);
 return {
  data: null,
  error:
   result.error ||
   "Không thể generate bản dịch tiếng Việt lúc này vì tất cả AI provider đều thất bại.",
 };
}
