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
 renderSentenceLookupPrompt,
 renderWordLookupPrompt,
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 normalizeGeminiModel,
 type GeminiModelId,
} from "@/lib/gemini-models";
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

type ProviderName = "Gemini" | "DeepSeek";

type ProviderOutageState = {
 unavailableUntil: number;
 reason: string;
};

const providerOutages: Record<string, ProviderOutageState> = {};

type AiRequestOptions = {
 promptTemplate?: string | null;
 geminiModel?: string | null;
 /** BYOK: user's own decrypted DeepSeek key */
 userDeepSeekKey?: string | null;
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
 userApiKey?: string | null,
): Promise<RawProviderResult> {
 const isUserKey = !!userApiKey;
 const apiKey = userApiKey || process.env.DEEPSEEK_API_KEY;

 // Only check outage for system key; user key gets a fresh attempt
 if (!isUserKey) {
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
  const res = await fetch("https://api.deepseek.com/chat/completions", {
   method: "POST",
   headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
   },
   body: JSON.stringify({
    model: "deepseek-chat",
    messages: [
     { role: "system", content: systemPrompt },
     { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
   }),
   signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   console.error(`[AI:DeepSeek] HTTP ${res.status}:`, errBody);

   if (isUserKey) {
    // BYOK: return user-specific error, do NOT mark system provider outage
    const userError = formatByokError(res.status, errBody);
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
): Promise<RawProviderResult> {
 const skippedReason = getProviderSkipReason("Gemini", model);
 if (skippedReason) {
  console.warn("[AI:Gemini] Skipped due to recent provider outage");
  return {
   content: null,
   error: skippedReason,
  };
 }

 const apiKey = process.env.GEMINI_API_KEY;
 if (!apiKey) {
  console.warn("[AI:Gemini] No API key configured");
  return {
   content: null,
   error: "Gemini chưa được cấu hình API key.",
  };
 }

 try {
  const res = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
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
    signal: AbortSignal.timeout(30_000),
   },
  );

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   console.error(`[AI:Gemini] HTTP ${res.status}:`, errBody);
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

function formatProviderError(
 provider: "Gemini" | "DeepSeek",
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

 return `${provider} lỗi HTTP ${status}.`;
}

/**
 * BYOK-specific error messages — always shown to user, never triggers
 * system-level provider cooldown.
 */
function formatByokError(status: number, errorBody: string): string {
 const body = errorBody.toLowerCase();

 if (status === 401 || status === 403) {
  return "Lỗi API cá nhân: Key không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra lại key trên platform.deepseek.com.";
 }

 if (
  status === 402 ||
  body.includes("insufficient balance") ||
  body.includes("insufficient_quota")
 ) {
  return "Lỗi API cá nhân: Tài khoản DeepSeek của bạn đã hết tín dụng. Vui lòng nạp thêm hoặc tắt chế độ Key cá nhân để dùng mặc định.";
 }

 if (status === 429) {
  return "Lỗi API cá nhân: Vượt quá giới hạn request. Vui lòng đợi một lát rồi thử lại.";
 }

 return `Lỗi API cá nhân: DeepSeek trả về HTTP ${status}. Vui lòng kiểm tra số dư hoặc tắt chế độ Key cá nhân để dùng mặc định.`;
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
 userDeepSeekKey?: string | null,
): Promise<StructuredRequestResult<T>> {
 const providerErrors: string[] = [];

 // If user has BYOK key, try user's DeepSeek FIRST (they're paying for it)
 if (userDeepSeekKey) {
  const byokSystemPrompt = `${BYOK_HIDDEN_SYSTEM_PROMPT}\n\n${systemPrompt}`;
  const deepSeekRaw = await callDeepSeekRaw(
   byokSystemPrompt,
   prompt,
   userDeepSeekKey,
  );
  if (deepSeekRaw.content) {
   const deepSeekResult = parseAndValidate(
    deepSeekRaw.content,
    schema,
    fallback,
   );
   if (deepSeekResult) {
    return { data: deepSeekResult, error: null };
   }
   providerErrors.push("DeepSeek (BYOK) trả JSON không đúng schema.");
  } else if (deepSeekRaw.error) {
   // BYOK errors are returned immediately — no fallback to system key
   return { data: null, error: deepSeekRaw.error };
  }
 }

 const geminiRaw = await callGeminiRaw(systemPrompt, prompt, geminiModel);
 if (geminiRaw.content) {
  const geminiResult = parseAndValidate(geminiRaw.content, schema, fallback);
  if (geminiResult) {
   return { data: geminiResult, error: null };
  }
  providerErrors.push("Gemini trả JSON không đúng schema.");
 } else if (geminiRaw.error) {
  providerErrors.push(geminiRaw.error);
 }

 // Only fallback to system DeepSeek if no BYOK key
 if (!userDeepSeekKey) {
  console.log("[AI] Gemini failed, trying DeepSeek...");

  const deepSeekRaw = await callDeepSeekRaw(systemPrompt, prompt);
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
  options?.userDeepSeekKey,
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
  options?.userDeepSeekKey,
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
