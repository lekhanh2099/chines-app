import "server-only";

import { z } from "zod";

import { createRequestSignal, throwIfAborted } from "@/lib/request-utils";

export const AI_CONVERSATION_MEMORY_EMBEDDING_MODEL = "gemini-embedding-001";
export const AI_CONVERSATION_MEMORY_EMBEDDING_VERSION = 1;
export const AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS = 768;

const embeddingResponseSchema = z.strictObject({
 embedding: z.strictObject({
  values: z.array(z.number()).length(AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS),
  shape: z.array(z.number().int()).optional(),
 }),
 usageMetadata: z.object({}).optional(),
});

type MemoryEmbeddingTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export type AiConversationMemoryEmbeddingResult =
 | { available: true; values: number[] }
 | { available: false; reason: "missing-key" | "provider-error" | "invalid-response" };

export async function generateAiConversationMemoryEmbedding({
 text,
 task,
 signal,
}: {
 text: string;
 task: MemoryEmbeddingTask;
 signal?: AbortSignal;
}): Promise<AiConversationMemoryEmbeddingResult> {
 const apiKey = process.env.GEMINI_API_KEY;
 if (!apiKey) return { available: false, reason: "missing-key" };

 const normalizedText = text.normalize("NFC").trim();
 if (!normalizedText) return { available: false, reason: "invalid-response" };

 throwIfAborted(signal);

 try {
  const response = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONVERSATION_MEMORY_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
   {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
     model: `models/${AI_CONVERSATION_MEMORY_EMBEDDING_MODEL}`,
     content: { parts: [{ text: normalizedText }] },
     embedContentConfig: {
      taskType: task,
      outputDimensionality: AI_CONVERSATION_MEMORY_EMBEDDING_DIMENSIONS,
      autoTruncate: true,
     },
    }),
    signal: createRequestSignal(20_000, signal),
   },
  );

  if (!response.ok) return { available: false, reason: "provider-error" };

  const parsed = embeddingResponseSchema.safeParse(await response.json());
  if (!parsed.success) return { available: false, reason: "invalid-response" };

  return { available: true, values: parsed.data.embedding.values };
 } catch (error) {
  if (signal?.aborted) throw error;
  return { available: false, reason: "provider-error" };
 }
}

export function serializeAiConversationMemoryEmbedding(values: number[]): string {
 return `[${values.join(",")}]`;
}
