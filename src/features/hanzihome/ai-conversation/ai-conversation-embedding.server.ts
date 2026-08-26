import "server-only";

import { z } from "zod";

import type { AuthenticatedRouteContext } from "@/lib/api/authenticated-route";
import { createRequestSignal, throwIfAborted } from "@/lib/request-utils";
import {
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime,
} from "@/services/ai-runtime.service";

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
 | {
    available: false;
    reason: "missing-key" | "runtime-unavailable" | "provider-error" | "invalid-response";
   };

export async function generateAiConversationMemoryEmbedding({
 supabase,
 userId,
 text,
 task,
 signal,
}: {
 supabase: AuthenticatedRouteContext["supabase"];
 userId: string;
 text: string;
 task: MemoryEmbeddingTask;
 signal?: AbortSignal;
}): Promise<AiConversationMemoryEmbeddingResult> {
 const normalizedText = text.normalize("NFC").trim();
 if (!normalizedText) return { available: false, reason: "invalid-response" };

 const startedAt = performance.now();
 const resolution = await resolveUserAiTaskRuntime({
  supabase,
  userId,
  taskId: "conversation.semantic-memory",
 });
 if (!resolution.ok) {
  await recordUserAiTaskBlockedActivity({
   userId,
   taskId: "conversation.semantic-memory",
   errorCode: resolution.reason,
  });
  return {
   available: false,
   reason: resolution.status === "missing-key" ? "missing-key" : "runtime-unavailable",
  };
 }

 throwIfAborted(signal);

 try {
  const response = await fetch(
   `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONVERSATION_MEMORY_EMBEDDING_MODEL}:embedContent`,
   {
    method: "POST",
    headers: {
     "Content-Type": "application/json",
     "x-goog-api-key": resolution.runtime.apiKey,
    },
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

  if (!response.ok) {
   await recordUserAiRuntimeActivity({
    userId,
    runtime: resolution.runtime,
    status: "failure",
    errorCode: "provider-unavailable",
    latencyMs: Math.round(performance.now() - startedAt),
   });
   return { available: false, reason: "provider-error" };
  }

  const parsed = embeddingResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
   await recordUserAiRuntimeActivity({
    userId,
    runtime: resolution.runtime,
    status: "failure",
    errorCode: "invalid-response",
    latencyMs: Math.round(performance.now() - startedAt),
   });
   return { available: false, reason: "invalid-response" };
  }

  await recordUserAiRuntimeActivity({
   userId,
   runtime: resolution.runtime,
   status: "success",
   latencyMs: Math.round(performance.now() - startedAt),
  });

  return { available: true, values: parsed.data.embedding.values };
 } catch (error) {
  if (signal?.aborted) {
   await recordUserAiRuntimeActivity({
    userId,
    runtime: resolution.runtime,
    status: "cancelled",
    errorCode: "cancelled",
    latencyMs: Math.round(performance.now() - startedAt),
   });
   throw error;
  }
  await recordUserAiRuntimeActivity({
   userId,
   runtime: resolution.runtime,
   status: "failure",
   errorCode: "network-error",
   latencyMs: Math.round(performance.now() - startedAt),
  });
  return { available: false, reason: "provider-error" };
 }
}

export function serializeAiConversationMemoryEmbedding(values: number[]): string {
 return `[${values.join(",")}]`;
}
