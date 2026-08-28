import type { JsonFieldValue } from "@/types/json";

import { z } from "zod";

import { generateAiConversationMemoryEmbedding } from "@/features/hanzihome/ai-conversation/ai-conversation-embedding.server";
import { probeApiKeyModel } from "@/features/settings/api-key-discovery.server";
import { aiTaskRuntimeCheckResponseSchema } from "@/features/settings/ai-task-settings.schema";
import {
 apiError,
 privateNoStoreJson,
 requireAuthenticatedRoute,
} from "@/lib/api/authenticated-route";
import { aiTaskIdSchema } from "@/lib/ai-task-contract";
import {
 getAiRuntimeReceipt,
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 resolveUserAiTaskRuntime,
} from "@/services/ai-runtime.service";

const requestSchema = z.strictObject({ taskId: aiTaskIdSchema });

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = requestSchema.safeParse(payload);
 if (!parsed.success) return apiError("Invalid AI runtime check request", 400, "INVALID_REQUEST");

 const startedAt = performance.now();
 const resolution = await resolveUserAiTaskRuntime({
  supabase: auth.context.supabase,
  userId: auth.context.user.id,
  taskId: parsed.data.taskId,
 });
 if (!resolution.ok) {
  await recordUserAiTaskBlockedActivity({
   userId: auth.context.user.id,
   taskId: parsed.data.taskId,
   errorCode: resolution.reason,
   resourceType: "ai-runtime-check",
  });
  return privateNoStoreJson(
   aiTaskRuntimeCheckResponseSchema.parse({
    taskId: parsed.data.taskId,
    ok: false,
    receipt: null,
    latencyMs: Math.round(performance.now() - startedAt),
    errorCode: resolution.reason,
   }),
  );
 }

 if (parsed.data.taskId === "conversation.semantic-memory") {
  const result = await generateAiConversationMemoryEmbedding({
   supabase: auth.context.supabase,
   userId: auth.context.user.id,
   text: "HanziHome runtime check",
   task: "RETRIEVAL_QUERY",
   resourceType: "ai-runtime-check",
   runtime: resolution.runtime,
  });
  return privateNoStoreJson(
   aiTaskRuntimeCheckResponseSchema.parse({
    taskId: parsed.data.taskId,
    ok: result.available,
    receipt: getAiRuntimeReceipt(resolution.runtime),
    latencyMs: Math.round(performance.now() - startedAt),
    errorCode: result.available ? null : result.reason,
   }),
  );
 }

 const probe = await probeApiKeyModel(
  resolution.runtime.apiKey,
  resolution.runtime.provider,
  resolution.runtime.model,
 );
 const latencyMs = Math.round(performance.now() - startedAt);
 await recordUserAiRuntimeActivity({
  userId: auth.context.user.id,
  runtime: resolution.runtime,
  status: probe.ok ? "success" : "failure",
  ...(probe.ok ? {} : { errorCode: "provider-unavailable" }),
  latencyMs,
  resourceType: "ai-runtime-check",
 });
 return privateNoStoreJson(
  aiTaskRuntimeCheckResponseSchema.parse({
   taskId: parsed.data.taskId,
   ok: probe.ok,
   receipt: getAiRuntimeReceipt(resolution.runtime),
   latencyMs,
   errorCode: probe.ok ? null : "provider-unavailable",
  }),
 );
}
