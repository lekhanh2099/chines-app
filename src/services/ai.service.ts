/**
 * AI Service — Vocab Generator
 *
 * Strategy:
 *   1. Gemini Flash 2.0 (primary) — free tier
 *   2. DeepSeek-V3 (fallback) — cheap, excellent Chinese linguistics
 *
 * Both use the same "Linguist" system prompt.
 * This is a pure service layer — no Next.js, no DB, no auth.
 */

import { aiAnalysisSchema, type AiVocabResponse } from "@/types/database";

/* ══════════════════════════════════════════
   System Prompt
   ══════════════════════════════════════════ */

const SYSTEM_PROMPT = `You are a specialized Chinese Etymology and Grammar expert acting as a backend engine for a learning app.

Your task: Analyze the provided Chinese word/character strictly according to the output schema. Use Vietnamese for ALL explanations and definitions.

Requirements:
- Explain "Etymology" (Chiết tự) simply, using clear visual logic (e.g., "Hình ảnh người phụ nữ dưới mái nhà = Bình an").
- Examples must be HSK-appropriate (Modern, daily life context).
- Highlight subtle nuances or "Traps" for Vietnamese learners (common_mistakes).
- If the input is a single character, include radical and stroke_count info.
- If the input is a multi-character word, focus on word-level analysis.
- Always provide at least 2 meanings with examples.
- related_words should contain 4-8 commonly paired words/collocations.

RESPOND WITH JSON ONLY. No markdown, no explanation outside JSON.`;

const userPrompt = (hanzi: string) =>
 `Analyze this Chinese word: "${hanzi}"

Return JSON matching this exact schema:
{
  "hanzi": "${hanzi}",
  "pinyin": "string",
  "han_viet": "string (Hán-Việt reading, UPPERCASE)",
  "stroke_count": number | null,
  "radical": "string (VD: Bộ Nữ 女) | null",
  "word_type": "string (Động từ/Danh từ/Tính từ/...)",
  "etymology": {
    "type": "string (Hội ý/Hình thanh/Chỉ sự/Tượng hình/...)",
    "explanation": "string (Giải thích ngắn gọn nguồn gốc chữ bằng tiếng Việt)"
  },
  "meanings": [
    {
      "part_of_speech": "string (Động từ/Danh từ/...)",
      "definition": "string (Nghĩa bằng tiếng Việt)",
      "example": {
        "cn": "string (Câu ví dụ tiếng Trung)",
        "pinyin": "string",
        "vi": "string (Dịch tiếng Việt)"
      }
    }
  ],
  "related_words": ["string", "string", ...],
  "usage_logic": ["string (Tư duy cốt lõi khi dùng từ này)"],
  "common_mistakes": "string | null (Lưu ý cho người Việt khi dùng từ này)",
  "vn_trap": "string | null (Bẫy tiếng Việt - từ Hán Việt nhưng nghĩa khác)"
}`;

/* ══════════════════════════════════════════
   Provider: DeepSeek
   ══════════════════════════════════════════ */

async function callDeepSeek(hanzi: string): Promise<AiVocabResponse | null> {
 const apiKey = process.env.DEEPSEEK_API_KEY;
 if (!apiKey) {
  console.warn("[AI:DeepSeek] No API key configured");
  return null;
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
     { role: "system", content: SYSTEM_PROMPT },
     { role: "user", content: userPrompt(hanzi) },
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
   return null;
  }

  const json: unknown = await res.json();
  const content = (json as Record<string, unknown[]>)?.choices?.[0] as
   | Record<string, Record<string, string>>
   | undefined;
  if (!content?.message?.content) return null;

  return parseAndValidate(content.message.content);
 } catch (err) {
  console.error("[AI:DeepSeek] Error:", err);
  return null;
 }
}

/* ══════════════════════════════════════════
   Provider: Gemini Flash 2.0
   ══════════════════════════════════════════ */

async function callGemini(hanzi: string): Promise<AiVocabResponse | null> {
 const apiKey = process.env.GEMINI_API_KEY;
 if (!apiKey) {
  console.warn("[AI:Gemini] No API key configured");
  return null;
 }

 try {
  const res = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
   {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     contents: [
      {
       parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt(hanzi)}` }],
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
   return null;
  }

  const json: unknown = await res.json();
  const content = (
   json as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
   }
  )?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) return null;

  return parseAndValidate(content);
 } catch (err) {
  console.error("[AI:Gemini] Error:", err);
  return null;
 }
}

/* ══════════════════════════════════════════
   JSON Parser + Zod Validation
   ══════════════════════════════════════════ */

function parseAndValidate(raw: string): AiVocabResponse | null {
 try {
  let cleaned = raw.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
   cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  const parsed: unknown = JSON.parse(cleaned);

  // Validate with Zod
  const result = aiAnalysisSchema.safeParse(parsed);
  if (!result.success) {
   console.error("[AI] Zod validation failed:", result.error.issues);
   // Attempt lenient fallback — if `hanzi` exists, use the raw parsed data
   if (
    typeof parsed === "object" &&
    parsed !== null &&
    "hanzi" in parsed &&
    typeof (parsed as Record<string, unknown>).hanzi === "string"
   ) {
    console.warn("[AI] Using unvalidated data as fallback");
    return parsed as AiVocabResponse;
   }
   return null;
  }

  return result.data;
 } catch {
  console.error("[AI] Failed to parse JSON:", raw.slice(0, 200));
  return null;
 }
}

/* ══════════════════════════════════════════
   Public API
   ══════════════════════════════════════════ */

/**
 * Analyze a Chinese word using AI providers.
 * Tries Gemini first (free tier), then DeepSeek as fallback.
 * Returns null if all providers fail.
 */
export async function analyzeHanzi(
 hanzi: string,
): Promise<AiVocabResponse | null> {
 console.log("[AI] Analyzing:", hanzi);

 // Try Gemini first (free tier available)
 const geminiResult = await callGemini(hanzi);
 if (geminiResult) return geminiResult;

 // Fallback to DeepSeek
 console.log("[AI] Gemini failed, trying DeepSeek...");
 const deepseekResult = await callDeepSeek(hanzi);
 if (deepseekResult) return deepseekResult;

 console.error("[AI] All providers failed for:", hanzi);
 return null;
}
