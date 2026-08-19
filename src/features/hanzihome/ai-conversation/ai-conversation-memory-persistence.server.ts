import "server-only";

import { z } from "zod";

import { publicSupabaseEnv } from "@/lib/env/public";
import { getSupabaseServerSecret } from "@/lib/env/server";
import type { JsonObject } from "@/types/json";

import {
 aiConversationMemoryKindSchema,
 type AiConversationStoredMemory,
} from "./ai-conversation-memory.schemas";

const postgrestErrorSchema = z.object({
 code: z.string().optional(),
 message: z.string().optional(),
});

const memoryRowSchema = z.object({
 id: z.uuid(),
 character_id: z.uuid().nullable(),
 kind: aiConversationMemoryKindSchema,
 memory_key: z.string().nullable(),
 content: z.string().trim().min(1),
 importance: z.number().min(0).max(1),
 confidence: z.number().min(0).max(1),
 reinforcement_count: z.number().int().positive(),
 updated_at: z.iso.datetime({ offset: true }),
 valid_until: z.iso.datetime({ offset: true }).nullable().optional(),
});

const semanticMemoryRowSchema = memoryRowSchema.extend({
 similarity: z.number().min(-1).max(1),
});

const memoryPreferenceRowSchema = z.object({ memory_enabled: z.boolean() });

const postTurnJobRowSchema = z.object({
 id: z.uuid(),
 user_id: z.uuid(),
 conversation_id: z.uuid(),
 assistant_message_id: z.uuid(),
 status: z.enum(["pending", "processing", "retry", "succeeded", "dead"]),
 attempt_count: z.number().int().nonnegative(),
 memory_applied_at: z.iso.datetime({ offset: true }).nullable(),
 relationship_applied_at: z.iso.datetime({ offset: true }).nullable(),
 summary_applied_at: z.iso.datetime({ offset: true }).nullable(),
});

const evidenceMessageRowSchema = z.object({
 id: z.uuid(),
 conversation_id: z.uuid(),
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
 reply_to_message_id: z.uuid().nullable(),
 seq: z.number().int().positive(),
});

const summaryConversationRowSchema = z.object({
 id: z.uuid(),
 character_id: z.uuid(),
 memory_policy: z.enum(["inherit", "enabled", "disabled"]),
 summary: z.string(),
 summary_until_seq: z.number().int().nonnegative(),
 summary_version: z.number().int().positive(),
 last_message_seq: z.number().int().nonnegative(),
});

const conversationMessageRowSchema = z.object({
 id: z.uuid(),
 seq: z.number().int().positive(),
 role: z.enum(["user", "assistant"]),
 content: z.string().trim().min(1).max(6000),
});

const booleanRpcSchema = z.union([
 z.boolean(),
 z.tuple([z.boolean()]).transform(([value]) => value),
]);
const integerRpcSchema = z.union([
 z.number().int().nonnegative(),
 z.tuple([z.number().int().nonnegative()]).transform(([value]) => value),
]);

export type AiConversationPostTurnJob = z.output<typeof postTurnJobRowSchema>;
export type AiConversationSummaryState = z.output<typeof summaryConversationRowSchema>;
export type AiConversationPipelineMessage = z.output<typeof conversationMessageRowSchema>;

export class AiConversationMemoryPipelineNotReadyError extends Error {
 constructor() {
  super("AI conversation memory pipeline migration is not ready");
  this.name = "AiConversationMemoryPipelineNotReadyError";
 }
}

function buildRestUrl(resource: string, params?: Readonly<Record<string, string>>) {
 const url = new URL(`${publicSupabaseEnv.url}/rest/v1/${resource}`);
 for (const [key, value] of Object.entries(params ?? {})) {
  url.searchParams.set(key, value);
 }
 return url;
}

function buildServiceHeaders(secret: string, hasBody: boolean, prefer?: string) {
 const isModernSecret = secret.startsWith("sb_secret_");
 return {
  Accept: "application/json",
  apikey: secret,
  ...(!isModernSecret ? { Authorization: `Bearer ${secret}` } : {}),
  ...(hasBody ? { "Content-Type": "application/json" } : {}),
  ...(prefer ? { Prefer: prefer } : {}),
 };
}

function isPipelineNotReady(code: string | null, message: string) {
 if (code === "42P01" || code === "42703" || code === "PGRST202" || code === "PGRST204") {
  return true;
 }
 const normalized = message.toLowerCase();
 return (
  normalized.includes("ai_match_memories") ||
  normalized.includes("ai_claim_post_turn_jobs") ||
  normalized.includes("ai_apply_memory_changes") ||
  normalized.includes("memory_applied_at") ||
  normalized.includes("embedding")
 );
}

async function requestMemoryPostgrest<T>({
 resource,
 schema,
 params,
 method = "GET",
 body,
 prefer,
}: {
 resource: string;
 schema: z.ZodType<T>;
 params?: Readonly<Record<string, string>>;
 method?: "GET" | "POST" | "PATCH";
 body?: JsonObject;
 prefer?: string;
}): Promise<T> {
 const secret = getSupabaseServerSecret();
 const response = await fetch(buildRestUrl(resource, params), {
  method,
  headers: buildServiceHeaders(secret, Boolean(body), prefer),
  ...(body ? { body: JSON.stringify(body) } : {}),
  cache: "no-store",
 });
 const payload: unknown = await response.json().catch(() => null);

 if (!response.ok) {
  const parsedError = postgrestErrorSchema.safeParse(payload);
  const code = parsedError.success ? (parsedError.data.code ?? null) : null;
  const message =
   parsedError.success && parsedError.data.message
    ? parsedError.data.message
    : "AI memory persistence request failed";
  if (isPipelineNotReady(code, message)) throw new AiConversationMemoryPipelineNotReadyError();
  throw new Error(message);
 }

 return schema.parse(payload);
}

function toStoredMemory(row: z.output<typeof memoryRowSchema>): AiConversationStoredMemory {
 return {
  id: row.id,
  characterId: row.character_id,
  kind: row.kind,
  memoryKey: row.memory_key,
  content: row.content,
  importance: row.importance,
  confidence: row.confidence,
  reinforcementCount: row.reinforcement_count,
  updatedAt: row.updated_at,
 };
}

export async function loadAiConversationMemoryEnabledPreference(userId: string): Promise<boolean> {
 const rows = await requestMemoryPostgrest({
  resource: "ai_conversation_preferences",
  schema: z.array(memoryPreferenceRowSchema),
  params: {
   select: "memory_enabled",
   user_id: `eq.${userId}`,
   limit: "1",
  },
 });
 return rows[0]?.memory_enabled ?? true;
}

export async function loadActiveAiConversationMemories({
 userId,
 characterId,
 limit = 80,
}: {
 userId: string;
 characterId: string;
 limit?: number;
}): Promise<AiConversationStoredMemory[]> {
 const rows = await requestMemoryPostgrest({
  resource: "ai_memories",
  schema: z.array(memoryRowSchema),
  params: {
   select:
    "id,character_id,kind,memory_key,content,importance,confidence,reinforcement_count,updated_at,valid_until",
   user_id: `eq.${userId}`,
   status: "eq.active",
   or: `(character_id.is.null,character_id.eq.${characterId})`,
   order: "importance.desc,updated_at.desc",
   limit: String(Math.min(Math.max(limit, 1), 200)),
  },
 });
 const now = Date.now();
 return rows
  .filter((row) => !row.valid_until || Date.parse(row.valid_until) > now)
  .map(toStoredMemory);
}

export async function matchAiConversationMemoriesExact({
 userId,
 characterId,
 queryEmbedding,
 matchCount = 12,
 minSimilarity = 0.35,
}: {
 userId: string;
 characterId: string;
 queryEmbedding: string;
 matchCount?: number;
 minSimilarity?: number;
}) {
 const rows = await requestMemoryPostgrest({
  resource: "rpc/ai_match_memories",
  schema: z.array(semanticMemoryRowSchema),
  method: "POST",
  body: {
   p_user_id: userId,
   p_character_id: characterId,
   p_query_embedding: queryEmbedding,
   p_match_count: Math.min(Math.max(matchCount, 1), 50),
   p_min_similarity: minSimilarity,
  },
 });
 return rows.map((row) => ({ ...toStoredMemory(row), similarity: row.similarity }));
}

export async function setAiConversationMemoryEmbedding({
 userId,
 memoryId,
 embedding,
 model,
 version,
}: {
 userId: string;
 memoryId: string;
 embedding: string;
 model: string;
 version: number;
}) {
 return requestMemoryPostgrest({
  resource: "rpc/ai_set_memory_embedding",
  schema: booleanRpcSchema,
  method: "POST",
  body: {
   p_user_id: userId,
   p_memory_id: memoryId,
   p_embedding: embedding,
   p_embedding_model: model,
   p_embedding_version: version,
  },
 });
}

export async function loadUnembeddedAiConversationMemories({
 userId,
 characterId,
 limit = 3,
}: {
 userId: string;
 characterId: string;
 limit?: number;
}) {
 const rows = await requestMemoryPostgrest({
  resource: "ai_memories",
  schema: z.array(memoryRowSchema),
  params: {
   select:
    "id,character_id,kind,memory_key,content,importance,confidence,reinforcement_count,updated_at,valid_until",
   user_id: `eq.${userId}`,
   status: "eq.active",
   embedding: "is.null",
   or: `(character_id.is.null,character_id.eq.${characterId})`,
   order: "importance.desc,updated_at.asc",
   limit: String(Math.min(Math.max(limit, 1), 10)),
  },
 });
 return rows.map(toStoredMemory);
}

export async function claimAiConversationPostTurnJobs({
 userId,
 conversationId,
 limit = 2,
}: {
 userId: string;
 conversationId: string;
 limit?: number;
}): Promise<AiConversationPostTurnJob[]> {
 return requestMemoryPostgrest({
  resource: "rpc/ai_claim_post_turn_jobs",
  schema: z.array(postTurnJobRowSchema),
  method: "POST",
  body: {
   p_user_id: userId,
   p_conversation_id: conversationId,
   p_limit: Math.min(Math.max(limit, 1), 5),
  },
 });
}

export async function loadAiConversationPostTurnEvidence({
 userId,
 job,
}: {
 userId: string;
 job: AiConversationPostTurnJob;
}) {
 const assistantRows = await requestMemoryPostgrest({
  resource: "ai_messages",
  schema: z.array(evidenceMessageRowSchema),
  params: {
   select: "id,conversation_id,role,content,reply_to_message_id,seq",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${job.conversation_id}`,
   id: `eq.${job.assistant_message_id}`,
   role: "eq.assistant",
   limit: "1",
  },
 });
 const assistant = assistantRows[0];
 if (!assistant?.reply_to_message_id) throw new Error("AI post-turn assistant evidence is missing");

 const [userRows, conversationRows, preferenceRows] = await Promise.all([
  requestMemoryPostgrest({
   resource: "ai_messages",
   schema: z.array(evidenceMessageRowSchema),
   params: {
    select: "id,conversation_id,role,content,reply_to_message_id,seq",
    user_id: `eq.${userId}`,
    conversation_id: `eq.${job.conversation_id}`,
    id: `eq.${assistant.reply_to_message_id}`,
    role: "eq.user",
    limit: "1",
   },
  }),
  requestMemoryPostgrest({
   resource: "ai_conversations",
   schema: z.array(summaryConversationRowSchema),
   params: {
    select:
     "id,character_id,memory_policy,summary,summary_until_seq,summary_version,last_message_seq",
    user_id: `eq.${userId}`,
    id: `eq.${job.conversation_id}`,
    limit: "1",
   },
  }),
  requestMemoryPostgrest({
   resource: "ai_conversation_preferences",
   schema: z.array(memoryPreferenceRowSchema),
   params: { select: "memory_enabled", user_id: `eq.${userId}`, limit: "1" },
  }),
 ]);

 const userMessage = userRows[0];
 const conversation = conversationRows[0];
 if (!userMessage || !conversation) throw new Error("AI post-turn evidence is incomplete");

 return {
  userMessage,
  assistantMessage: assistant,
  conversation,
  userMemoryEnabled: preferenceRows[0]?.memory_enabled ?? true,
 };
}

export async function applyAiConversationMemoryChanges({
 userId,
 jobId,
 userMessageId,
 changes,
}: {
 userId: string;
 jobId: string;
 userMessageId: string;
 changes: JsonObject[];
}) {
 return requestMemoryPostgrest({
  resource: "rpc/ai_apply_memory_changes",
  schema: integerRpcSchema,
  method: "POST",
  body: {
   p_user_id: userId,
   p_job_id: jobId,
   p_user_message_id: userMessageId,
   p_changes: changes,
  },
 });
}

export async function evolveAiConversationRelationshipForJob({
 userId,
 jobId,
 increment,
}: {
 userId: string;
 jobId: string;
 increment: number;
}) {
 return requestMemoryPostgrest({
  resource: "rpc/ai_evolve_relationship_for_job",
  schema: booleanRpcSchema,
  method: "POST",
  body: { p_user_id: userId, p_job_id: jobId, p_increment: increment },
 });
}

export async function applyAiConversationSummaryForJob({
 userId,
 jobId,
 summary,
 summaryUntilSeq,
 expectedSummaryVersion,
}: {
 userId: string;
 jobId: string;
 summary: string | null;
 summaryUntilSeq: number | null;
 expectedSummaryVersion: number | null;
}) {
 return requestMemoryPostgrest({
  resource: "rpc/ai_apply_summary_for_job",
  schema: booleanRpcSchema,
  method: "POST",
  body: {
   p_user_id: userId,
   p_job_id: jobId,
   p_summary: summary,
   p_summary_until_seq: summaryUntilSeq,
   p_expected_summary_version: expectedSummaryVersion,
  },
 });
}

export async function finishAiConversationPostTurnJob({
 userId,
 jobId,
 succeeded,
 error,
}: {
 userId: string;
 jobId: string;
 succeeded: boolean;
 error?: string;
}) {
 return requestMemoryPostgrest({
  resource: "rpc/ai_finish_post_turn_job",
  schema: booleanRpcSchema,
  method: "POST",
  body: {
   p_user_id: userId,
   p_job_id: jobId,
   p_succeeded: succeeded,
   p_error: error ?? null,
  },
 });
}

export async function loadAiConversationMessageRange({
 userId,
 conversationId,
 afterSeq,
 throughSeq,
 limit = 200,
}: {
 userId: string;
 conversationId: string;
 afterSeq: number;
 throughSeq: number;
 limit?: number;
}): Promise<AiConversationPipelineMessage[]> {
 return requestMemoryPostgrest({
  resource: "ai_messages",
  schema: z.array(conversationMessageRowSchema),
  params: {
   select: "id,seq,role,content",
   user_id: `eq.${userId}`,
   conversation_id: `eq.${conversationId}`,
   seq: `gt.${afterSeq}`,
   and: `(seq.lte.${throughSeq})`,
   order: "seq.asc",
   limit: String(Math.min(Math.max(limit, 1), 500)),
  },
 });
}
