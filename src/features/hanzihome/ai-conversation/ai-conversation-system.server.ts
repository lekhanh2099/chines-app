import "server-only";

import { z } from "zod";

import { DEFAULT_GEMINI_QUICK_MODEL } from "@/lib/gemini-models";
import { createRequestSignal, throwIfAborted } from "@/lib/request-utils";

import type { AiConversationMessage } from "./ai-conversation.schemas";

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

const SYSTEM_PROMPT = `You are a Chinese-speaking conversation partner for Vietnamese learners.
Answer naturally and concisely while staying within Chinese language learning and Chinese culture.
When Chinese appears, include pinyin or Vietnamese explanation only when it materially helps.
Do not claim access to private app data that was not provided in the current trusted context.`;

export const SYSTEM_AI_CONVERSATION_PROVIDER = "Google Gemini";
export const SYSTEM_AI_CONVERSATION_MODEL = DEFAULT_GEMINI_QUICK_MODEL;

function renderConversationPrompt(messages: AiConversationMessage[]): string {
 return messages
  .map((message) => `${message.role === "user" ? "Learner" : "Partner"}: ${message.content}`)
  .join("\n\n");
}

export async function generateSystemAiConversationReply(
 messages: AiConversationMessage[],
 abortSignal?: AbortSignal,
 systemContext?: string,
): Promise<{ data: string | null; error: string | null }> {
 const apiKey = process.env.GEMINI_API_KEY;
 if (!apiKey) {
  return {
   data: null,
   error: "AI hệ thống chưa được cấu hình. Hãy thêm API key cá nhân trong Cài đặt → AI.",
  };
 }

 throwIfAborted(abortSignal);

 try {
  const resolvedSystemPrompt = systemContext?.trim() || SYSTEM_PROMPT;
  const response = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/${SYSTEM_AI_CONVERSATION_MODEL}:generateContent?key=${apiKey}`,
   {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     contents: [
      {
       parts: [{ text: `${resolvedSystemPrompt}\n\n${renderConversationPrompt(messages)}` }],
      },
     ],
     generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
     },
    }),
    signal: createRequestSignal(60_000, abortSignal),
   },
  );

  if (!response.ok) {
   if (response.status === 429) {
    return { data: null, error: "Gemini hệ thống đang hết quota hoặc bị rate limit." };
   }
   if (response.status === 401 || response.status === 403) {
    return { data: null, error: "Gemini hệ thống đang từ chối API key cấu hình trên server." };
   }
   return { data: null, error: `Gemini hệ thống trả về lỗi HTTP ${response.status}.` };
  }

  const parsed = geminiResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
   return { data: null, error: "Gemini hệ thống trả về response không đúng định dạng." };
  }

  const content =
   parsed.data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim() || "";

  return content
   ? { data: content, error: null }
   : { data: null, error: "Gemini hệ thống trả về nội dung rỗng." };
 } catch (error) {
  if (abortSignal?.aborted) {
   throw error;
  }
  return {
   data: null,
   error: `Gemini hệ thống lỗi kết nối: ${error instanceof Error ? error.message : "unknown error"}.`,
  };
 }
}
