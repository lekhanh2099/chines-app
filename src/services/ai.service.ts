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
} from "@/lib/ai-prompts";
import {
 DEFAULT_GEMINI_MODEL,
 isGeminiModelId,
 normalizeGeminiModel,
 type GeminiModelId,
} from "@/lib/gemini-models";
import { createRequestSignal, throwIfAborted } from "@/lib/request-utils";
import { logger } from "@/lib/logger";
import { DEFAULT_GROQ_MODEL } from "@/lib/groq-models";
import {
 getProviderCooldownMs,
 getProviderSkipReason,
 markProviderUnavailable,
} from "@/services/ai/provider-outage-policy";
import type { UserApiKeyCredential } from "@/services/user-api-keys.service";
import {
 aiAnalysisSchema,
 sentenceInsightSchema,
 type AiDefinitionExample,
 type AiVocabResponse,
 type AiWordRelation,
 type SentenceInsightResponse,
} from "@/types/database";

type RawProviderResult = z.infer<
 z.ZodObject<{
  content: z.ZodNullable<z.ZodString>;
  error: z.ZodNullable<z.ZodString>;
 }>
>;

type StructuredRequestResult<T> = {
 data: z.infer<z.ZodNullable<z.ZodType<T>>>;
 error: z.infer<z.ZodNullable<z.ZodString>>;
};

type NullableString = z.infer<z.ZodNullable<z.ZodString>>;
type NullableAbortSignal = Parameters<typeof throwIfAborted>[0];
type ProviderResponseMode = "json" | "text";
type Provider = z.infer<z.ZodEnum<{ Gemini: "Gemini"; DeepSeek: "DeepSeek"; OpenAI: "OpenAI" }>>;
type ManagedProvider = z.infer<
 z.ZodUnion<
  [z.ZodEnum<{ Gemini: "Gemini"; DeepSeek: "DeepSeek"; OpenAI: "OpenAI" }>, z.ZodLiteral<"Groq">]
 >
>;

type AiRequestOptions = {
 promptTemplate?: NullableString;
 geminiModel?: NullableString;
 userApiKeys?: UserApiKeyCredential[];
 abortSignal?: NullableAbortSignal;
 allowGroq?: boolean;
};

const openAiCompatibleResponseSchema = z.object({
 choices: z
  .array(
   z.object({
    message: z.object({ content: z.string().optional() }).optional(),
   }),
  )
  .optional(),
});

const geminiResponseSchema = z.object({
 candidates: z
  .array(
   z.object({
    content: z
     .object({
      parts: z.array(z.object({ text: z.string().optional() })).optional(),
     })
     .optional(),
   }),
  )
  .optional(),
});

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
   Provider: DeepSeek
   ══════════════════════════════════════════ */

async function callDeepSeekRaw(
 systemPrompt: string,
 prompt: string,
 options?: {
  apiKey?: NullableString;
  model?: NullableString;
  useOutageTracking?: boolean;
  abortSignal?: NullableAbortSignal;
  responseMode?: ProviderResponseMode;
 },
): Promise<RawProviderResult> {
 const isUserKey = !!options?.apiKey;
 const apiKey = options?.apiKey || process.env.DEEPSEEK_API_KEY;
 const model = options?.model || "deepseek-v4-flash";
 const useOutageTracking = options?.useOutageTracking ?? !isUserKey;

 // Only check outage for system key; user key gets a fresh attempt
 if (useOutageTracking) {
  const skippedReason = getProviderSkipReason("DeepSeek");
  if (skippedReason) {
   logger.warn("[AI:DeepSeek] Skipped due to recent provider outage");
   return {
    content: null,
    error: skippedReason,
   };
  }
 }

 if (!apiKey) {
  logger.warn("[AI:DeepSeek] No API key configured");
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
    max_tokens: 4096,
    ...(options?.responseMode !== "text" ? { response_format: { type: "json_object" } } : {}),
   }),
   signal: createRequestSignal(60_000, options?.abortSignal),
  });

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   logger.error(`[AI:DeepSeek] HTTP ${res.status}:`, errBody);

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

  const json = openAiCompatibleResponseSchema.parse(await res.json());
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
   return {
    content: null,
    error: "DeepSeek trả về response rỗng.",
   };
  }

  return {
   content,
   error: null,
  };
 } catch (err) {
  logger.error("[AI:DeepSeek] Error:", err);

  // Timeout → short cooldown so repeated requests do not retry an unavailable provider.
  if (useOutageTracking && err instanceof Error && err.message?.includes("timeout")) {
   markProviderUnavailable("DeepSeek", 30_000, "DeepSeek timeout");
  }

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
 apiKey?: NullableString,
 abortSignal?: NullableAbortSignal,
 responseMode: ProviderResponseMode = "json",
): Promise<RawProviderResult> {
 const isUserKey = !!apiKey;

 if (!isUserKey) {
  const skippedReason = getProviderSkipReason("Gemini", model);
  if (skippedReason) {
   logger.warn("[AI:Gemini] Skipped due to recent provider outage");
   return {
    content: null,
    error: skippedReason,
   };
  }
 }

 const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;
 if (!resolvedApiKey) {
  logger.warn("[AI:Gemini] No API key configured");
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
      maxOutputTokens: 4096,
      ...(responseMode === "json" ? { responseMimeType: "application/json" } : {}),
     },
    }),
    signal: createRequestSignal(60_000, abortSignal),
   },
  );

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   logger.error(`[AI:Gemini] HTTP ${res.status}:`, errBody);

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

  const json = geminiResponseSchema.parse(await res.json());
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
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
  logger.error("[AI:Gemini] Error:", err);
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
 model?: NullableString,
 abortSignal?: NullableAbortSignal,
 responseMode: ProviderResponseMode = "json",
): Promise<RawProviderResult> {
 const resolvedModel = model || "gpt-4.1-mini";

 try {
  throwIfAborted(abortSignal);

  const isGpt5Model = resolvedModel.startsWith("gpt-5");

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
    ...(!isGpt5Model ? { temperature: 0.3 } : {}),
    ...(isGpt5Model ? { max_completion_tokens: 4096 } : { max_tokens: 4096 }),
    ...(responseMode !== "text" ? { response_format: { type: "json_object" } } : {}),
   }),
   signal: createRequestSignal(60_000, abortSignal),
  });

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   logger.error(`[AI:OpenAI] HTTP ${res.status}:`, errBody);
   return {
    content: null,
    error: formatManagedKeyError("OpenAI", res.status, errBody),
   };
  }

  const json = openAiCompatibleResponseSchema.parse(await res.json());
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
   return {
    content: null,
    error: "OpenAI trả về response rỗng.",
   };
  }

  return { content, error: null };
 } catch (err) {
  logger.error("[AI:OpenAI] Error:", err);
  return {
   content: null,
   error: `OpenAI lỗi kết nối: ${err instanceof Error ? err.message : "unknown error"}.`,
  };
 }
}

async function callGroqRaw(
 systemPrompt: string,
 prompt: string,
 apiKey: string,
 model?: NullableString,
 abortSignal?: NullableAbortSignal,
 responseMode: ProviderResponseMode = "json",
): Promise<RawProviderResult> {
 try {
  throwIfAborted(abortSignal);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
   method: "POST",
   headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
   },
   body: JSON.stringify({
    model: model || DEFAULT_GROQ_MODEL,
    messages: [
     { role: "system", content: systemPrompt },
     { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_completion_tokens: 4096,
    ...(responseMode !== "text" ? { response_format: { type: "json_object" } } : {}),
   }),
   signal: createRequestSignal(30_000, abortSignal),
  });

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   logger.error(`[AI:Groq] HTTP ${res.status}:`, errBody);
   return { content: null, error: formatManagedKeyError("Groq", res.status, errBody) };
  }

  const json = openAiCompatibleResponseSchema.parse(await res.json());
  const content = json.choices?.[0]?.message?.content;
  return content
   ? { content, error: null }
   : { content: null, error: "Groq trả về response rỗng." };
 } catch (err) {
  logger.error("[AI:Groq] Error:", err);
  return {
   content: null,
   error: `Groq lỗi kết nối: ${err instanceof Error ? err.message : "unknown error"}.`,
  };
 }
}

function formatProviderError(provider: Provider, status: number, errorBody: string): string {
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
  if (status === 429 || body.includes("insufficient_quota") || body.includes("rate limit")) {
   return "OpenAI đã hết quota hoặc đang bị rate limit.";
  }

  if (status === 401 || status === 403) {
   return "OpenAI API key không hợp lệ hoặc bị từ chối.";
  }
 }

 return `${provider} lỗi HTTP ${status}.`;
}

function formatManagedKeyError(
 provider: ManagedProvider,
 status: number,
 errorBody: string,
): string {
 const body = errorBody.toLowerCase();

 if (provider === "Groq") {
  if (status === 401 || status === 403) return "Groq key không hợp lệ hoặc đã bị thu hồi.";
  if (status === 429) return "Groq key đang bị rate limit.";
  return `Groq key trả về HTTP ${status}.`;
 }

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

 if (status === 429 || body.includes("insufficient_quota") || body.includes("rate limit")) {
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

function normalizeWordAnalysis(hanzi: string, parsed: AiVocabResponse): AiVocabResponse {
 const normalizeExamples = (examples?: AiDefinitionExample[]) =>
  examples
   ?.map((example) => ({
    ...example,
    py: example.py || example.pinyin,
    pinyin: example.pinyin || example.py,
   }))
   .filter((example) => example.cn || example.vi || example.py || example.pinyin);

 const normalizeRelations = (relations?: AiWordRelation[]) =>
  relations
   ?.map((relation) => ({
    word: relation.word?.trim(),
    pinyin: relation.pinyin?.trim(),
    meaning: relation.meaning?.trim(),
   }))
   .filter((relation) => relation.word || relation.pinyin || relation.meaning);

 const etymology =
  typeof parsed.etymology === "string"
   ? {
      type: "Không xác định",
      origin: parsed.etymology.trim(),
      mnemonic: parsed.mnemonic_story?.trim() || "",
      explanation: parsed.etymology.trim(),
     }
   : {
      type: parsed.etymology?.type?.trim() || "Không xác định",
      origin: parsed.etymology?.origin?.trim() || parsed.etymology?.explanation?.trim() || "",
      mnemonic: parsed.etymology?.mnemonic?.trim() || parsed.mnemonic_story?.trim() || "",
      explanation: parsed.etymology?.explanation?.trim() || parsed.etymology?.origin?.trim() || "",
     };
 const relatedCompounds = normalizeRelations(parsed.related_compounds);
 const synonyms = normalizeRelations(parsed.synonyms);
 const antonyms = normalizeRelations(parsed.antonyms);
 const legacyRelatedCompounds = Array.from(
  new Set(
   [...(parsed.related_words || []), ...(parsed.collocations || [])]
    .map((word) => word.trim())
    .filter(Boolean),
  ),
 ).map((word) => ({ word }));
 const definitions = parsed.definitions?.map((definition) => ({
  ...definition,
  meanings: definition.meanings
   ?.map((item) => ({
    meaning: item.meaning?.trim(),
    examples: normalizeExamples(item.examples),
   }))
   .filter((item) => item.meaning || item.examples?.length),
  text: definition.text || definition.meaning,
  meaning:
   definition.meaning ||
   definition.text ||
   definition.meanings?.find((item) => item.meaning)?.meaning,
  examples:
   normalizeExamples(definition.examples) ||
   definition.meanings
    ?.find((item) => item.examples?.length)
    ?.examples?.map((example) => ({
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

 const resolvedSinoVietnamese = parsed.sino_vietnamese || parsed.han_viet || undefined;

 return {
  ...parsed,
  hanzi,
  ...(resolvedSinoVietnamese
   ? {
      sino_vietnamese: resolvedSinoVietnamese,
      han_viet: parsed.han_viet || resolvedSinoVietnamese,
     }
   : {}),
  etymology,
  ...(definitions ? { definitions } : {}),
  related_compounds: relatedCompounds?.length ? relatedCompounds : legacyRelatedCompounds,
  synonyms: synonyms || [],
  antonyms: antonyms || [],
  hsk_level: parsed.hsk_level?.trim() || "",
  tocfl_level: parsed.tocfl_level?.trim() || "",
  notes: parsed.notes?.trim() || "",
  mnemonic_story: parsed.mnemonic_story?.trim() || etymology.mnemonic || "",
  ...(flattenedExamples.length ? { examples: flattenedExamples } : {}),
  ...(parsed.common_mistakes || parsed.confusion || parsed.confusion_warning
   ? {
      common_mistakes: parsed.common_mistakes || parsed.confusion || parsed.confusion_warning,
      confusion: parsed.confusion || parsed.confusion_warning || parsed.common_mistakes,
      confusion_warning: parsed.confusion_warning || parsed.confusion || parsed.common_mistakes,
     }
   : {}),
 };
}

function normalizeBasicWordAnalysis(hanzi: string, parsed: AiVocabResponse): AiVocabResponse {
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
  sino_vietnamese: normalized.sino_vietnamese || normalized.han_viet || undefined,
  han_viet: normalized.han_viet || normalized.sino_vietnamese || undefined,
  meaning_summary: meaningSummary,
  ...(firstDefinition
   ? {
      definitions: [
       {
        pos: firstDefinition.pos,
        meaning: firstDefinition.meaning || firstDefinition.text || meaningSummary,
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

export const aiConversationMessageSchema = z.strictObject({
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
});

export type AiConversationMessage = z.output<typeof aiConversationMessageSchema>;

const AI_CONVERSATION_SYSTEM_PROMPT = `You are a patient Chinese tutor for Vietnamese learners.
Answer the conversation naturally and concisely.
When Chinese appears, include accurate pinyin and a Vietnamese explanation when it helps.
Stay focused on language learning, reading, pronunciation, grammar, vocabulary, translation, and practice.
Do not claim to have access to private app data that was not provided by the learner.`;

function renderConversationPrompt(messages: AiConversationMessage[]): string {
 return messages
  .map((message) => `${message.role === "user" ? "Learner" : "Tutor"}: ${message.content}`)
  .join("\n\n");
}

export async function generateAiConversationReply(
 messages: AiConversationMessage[],
 options: {
  userApiKeys: UserApiKeyCredential[];
  abortSignal?: NullableAbortSignal;
 },
): Promise<{ data: string | null; error: string | null }> {
 const parsedMessages = z.array(aiConversationMessageSchema).min(1).max(20).safeParse(messages);
 if (!parsedMessages.success) {
  return { data: null, error: "Nội dung hội thoại không hợp lệ." };
 }

 const selectedUserApiKey = options.userApiKeys[0];
 if (!selectedUserApiKey) {
  return {
   data: null,
   error: "Chưa có API key AI đang hoạt động. Hãy thêm key trong Cài đặt → AI.",
  };
 }

 const prompt = renderConversationPrompt(parsedMessages.data);
 const systemPrompt = `${BYOK_HIDDEN_SYSTEM_PROMPT}\n\n${AI_CONVERSATION_SYSTEM_PROMPT}`;
 let rawResult: RawProviderResult;

 throwIfAborted(options.abortSignal);

 if (selectedUserApiKey.provider === "deepseek") {
  rawResult = await callDeepSeekRaw(systemPrompt, prompt, {
   apiKey: selectedUserApiKey.apiKey,
   model: selectedUserApiKey.defaultModel,
   useOutageTracking: false,
   abortSignal: options.abortSignal,
   responseMode: "text",
  });
 } else if (selectedUserApiKey.provider === "gemini") {
  if (!isGeminiModelId(selectedUserApiKey.defaultModel)) {
   return {
    data: null,
    error: "Model Gemini đã lưu không còn hợp lệ. Hãy chọn lại model trong Cài đặt.",
   };
  }

  rawResult = await callGeminiRaw(
   systemPrompt,
   prompt,
   selectedUserApiKey.defaultModel,
   selectedUserApiKey.apiKey,
   options.abortSignal,
   "text",
  );
 } else if (selectedUserApiKey.provider === "openai") {
  rawResult = await callOpenAiRaw(
   systemPrompt,
   prompt,
   selectedUserApiKey.apiKey,
   selectedUserApiKey.defaultModel,
   options.abortSignal,
   "text",
  );
 } else {
  rawResult = await callGroqRaw(
   systemPrompt,
   prompt,
   selectedUserApiKey.apiKey,
   selectedUserApiKey.defaultModel,
   options.abortSignal,
   "text",
  );
 }

 if (!rawResult.content) {
  return {
   data: null,
   error: rawResult.error || `${selectedUserApiKey.label} không trả về nội dung.`,
  };
 }

 const content = rawResult.content.trim();
 return content.length > 0
  ? { data: content, error: null }
  : { data: null, error: `${selectedUserApiKey.label} trả về nội dung rỗng.` };
}
