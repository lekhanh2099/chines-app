import { z } from "zod";
import type { GeminiModelId } from "@/lib/ai/gemini-models";
import { createRequestSignal, throwIfAborted } from "@/lib/api/request-utils";
import { logger } from "@/lib/logger";
import { DEFAULT_GROQ_MODEL } from "@/lib/ai/groq-models";
import {
 formatManagedKeyError,
 formatProviderError,
} from "@/services/ai/ai-provider-errors.service";
import {
 getProviderCooldownMs,
 getProviderSkipReason,
 markProviderUnavailable,
} from "@/services/ai/provider-outage-policy";

export type RawProviderResult = z.infer<
 z.ZodObject<{
  content: z.ZodNullable<z.ZodString>;
  error: z.ZodNullable<z.ZodString>;
 }>
>;

export type NullableString = z.infer<z.ZodNullable<z.ZodString>>;
export type NullableAbortSignal = Parameters<typeof throwIfAborted>[0];

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
   Provider: DeepSeek
   ══════════════════════════════════════════ */

export async function callDeepSeekRaw(
 systemPrompt: string,
 prompt: string,
 options?: {
  apiKey?: NullableString;
  model?: NullableString;
  useOutageTracking?: boolean;
  abortSignal?: NullableAbortSignal;
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
    response_format: { type: "json_object" },
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

export async function callGeminiRaw(
 systemPrompt: string,
 prompt: string,
 model: GeminiModelId,
 apiKey?: NullableString,
 abortSignal?: NullableAbortSignal,
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
   `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`,
   {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
     "x-goog-api-key": resolvedApiKey,
    },
    body: JSON.stringify({
     systemInstruction: {
      parts: [{ text: systemPrompt }],
     },
     contents: [
      {
       role: "user",
       parts: [{ text: prompt }],
      },
     ],
     generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
     },
    }),
    signal: createRequestSignal(60_000, abortSignal),
   },
  );

  if (!res.ok) {
   const errBody = await res.text().catch(() => "");
   logger.error(`[AI:Gemini] HTTP ${res.status}`);

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

export async function callOpenAiRaw(
 systemPrompt: string,
 prompt: string,
 apiKey: string,
 model?: NullableString,
 abortSignal?: NullableAbortSignal,
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
    response_format: { type: "json_object" },
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

export async function callGroqRaw(
 systemPrompt: string,
 prompt: string,
 apiKey: string,
 model?: NullableString,
 abortSignal?: NullableAbortSignal,
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
    response_format: { type: "json_object" },
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
