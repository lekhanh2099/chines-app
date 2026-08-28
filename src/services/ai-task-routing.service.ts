import "server-only";

import { z } from "zod";

import { getSupabaseServerSecret } from "@/lib/env/server";
import {
 aiActivityCursorSchema,
 aiActivityEventSchema,
 aiActivitySummaryGroupSchema,
 aiActivityStatusSchema,
 aiTaskAssignmentSchema,
 aiTaskIdSchema,
 aiTaskResolutionSourceSchema,
 type AiActivityCursor,
 type AiActivityEvent,
 type AiTaskAssignment,
 type AiTaskId,
} from "@/lib/ai-task-contract";
import { ApiKeyProviderSchema } from "@/lib/api-key-providers";

const assignmentRowSchema = z.strictObject({
 task_id: aiTaskIdSchema,
 mode: z.enum(["auto", "assigned", "disabled"]),
 api_key_id: z.uuid().nullable(),
 model: z.string().nullable(),
});

const activityRowSchema = z.strictObject({
 id: z.uuid(),
 task_id: aiTaskIdSchema,
 provider: ApiKeyProviderSchema.nullable(),
 model: z.string().nullable(),
 api_key_id: z.uuid().nullable(),
 key_label: z.string().nullable(),
 resolution_source: aiTaskResolutionSourceSchema.nullable(),
 status: aiActivityStatusSchema,
 error_code: z.string().nullable(),
 latency_ms: z.number().int().nonnegative().nullable(),
 input_tokens: z.number().int().nonnegative().nullable(),
 output_tokens: z.number().int().nonnegative().nullable(),
 resource_type: z.string().nullable(),
 resource_id: z.string().nullable(),
 created_at: z.string(),
});

const assignmentRowsSchema = z.array(assignmentRowSchema);
const activityRowsSchema = z.array(activityRowSchema);
const activitySummaryRowSchema = z.strictObject({
 task_id: aiTaskIdSchema,
 provider: ApiKeyProviderSchema,
 model: z.string(),
 attempts: z.number().int().nonnegative(),
 successes: z.number().int().nonnegative(),
 success_rate: z.number().nonnegative(),
 average_latency_ms: z.number().int().nonnegative().nullable(),
 input_tokens: z.number().int().nonnegative(),
 output_tokens: z.number().int().nonnegative(),
});
const activitySummaryRowsSchema = z.array(activitySummaryRowSchema);
const postgrestErrorSchema = z.object({ code: z.string().nullable().optional() });

export const createAiActivityEventSchema = aiActivityEventSchema.omit({
 id: true,
 createdAt: true,
});

export type CreateAiActivityEvent = z.output<typeof createAiActivityEventSchema>;

export class AiTaskStorageNotReadyError extends Error {
 constructor() {
  super("AI task storage is not ready");
  this.name = "AiTaskStorageNotReadyError";
 }
}

function buildRestUrl(resource: string) {
 return new URL(`/rest/v1/${resource}`, z.url().parse(process.env.NEXT_PUBLIC_SUPABASE_URL));
}

function serviceHeaders(hasBody: boolean, prefer?: string) {
 const secret = getSupabaseServerSecret();
 return {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  ...(hasBody ? { "Content-Type": "application/json" } : {}),
  ...(prefer ? { Prefer: prefer } : {}),
 };
}

async function requestTaskStorage<T>(input: {
 url: URL;
 schema: z.ZodType<T>;
 method?: "GET" | "POST" | "DELETE";
 body?: object;
 prefer?: string;
}): Promise<T> {
 const response = await fetch(input.url, {
  method: input.method ?? "GET",
  headers: serviceHeaders(Boolean(input.body), input.prefer),
  ...(input.body ? { body: JSON.stringify(input.body) } : {}),
  cache: "no-store",
 });
 const payload = await response.json().catch(() => null);

 if (!response.ok) {
  const parsedError = postgrestErrorSchema.safeParse(payload);
  const code = parsedError.success ? parsedError.data.code : null;
  if (response.status === 404 || code === "42P01" || code === "PGRST202" || code === "PGRST205") {
   throw new AiTaskStorageNotReadyError();
  }
  throw new Error(`AI task storage request failed with status ${response.status}`);
 }

 return input.schema.parse(payload);
}

function assignmentFromRow(row: z.output<typeof assignmentRowSchema>): AiTaskAssignment {
 return aiTaskAssignmentSchema.parse({
  taskId: row.task_id,
  mode: row.mode,
  keyId: row.api_key_id,
  model: row.model,
 });
}

function activityFromRow(row: z.output<typeof activityRowSchema>): AiActivityEvent {
 return aiActivityEventSchema.parse({
  id: row.id,
  taskId: row.task_id,
  provider: row.provider,
  model: row.model,
  keyId: row.api_key_id,
  keyLabel: row.key_label,
  resolutionSource: row.resolution_source,
  status: row.status,
  errorCode: row.error_code,
  latencyMs: row.latency_ms,
  inputTokens: row.input_tokens,
  outputTokens: row.output_tokens,
  resourceType: row.resource_type,
  resourceId: row.resource_id,
  createdAt: row.created_at,
 });
}

export async function listUserAiTaskAssignments(userId: string) {
 const url = buildRestUrl("user_ai_task_assignments");
 url.searchParams.set("select", "task_id,mode,api_key_id,model");
 url.searchParams.set("user_id", `eq.${userId}`);
 url.searchParams.set("order", "task_id.asc");
 const rows = await requestTaskStorage({ url, schema: assignmentRowsSchema });
 return rows.map(assignmentFromRow);
}

export async function getUserAiTaskAssignment(userId: string, taskId: AiTaskId) {
 const assignments = await listUserAiTaskAssignments(userId);
 return assignments.find((assignment) => assignment.taskId === taskId) ?? null;
}

export async function upsertUserAiTaskAssignment(userId: string, assignment: AiTaskAssignment) {
 const url = buildRestUrl("user_ai_task_assignments");
 url.searchParams.set("on_conflict", "user_id,task_id");
 url.searchParams.set("select", "task_id,mode,api_key_id,model");
 const rows = await requestTaskStorage({
  url,
  schema: assignmentRowsSchema,
  method: "POST",
  prefer: "resolution=merge-duplicates,return=representation",
  body: {
   user_id: userId,
   task_id: assignment.taskId,
   mode: assignment.mode,
   api_key_id: assignment.keyId,
   model: assignment.model,
  },
 });
 const row = rows[0];
 if (!row) throw new Error("AI task assignment upsert returned no row");
 return assignmentFromRow(row);
}

export async function listAssignedTasksForKey(userId: string, keyId: string) {
 const assignments = await listUserAiTaskAssignments(userId);
 return assignments
  .filter((assignment) => assignment.mode === "assigned" && assignment.keyId === keyId)
  .map((assignment) => assignment.taskId);
}

export async function recordUserAiActivityEvent(userId: string, input: CreateAiActivityEvent) {
 const event = createAiActivityEventSchema.parse(input);
 const url = buildRestUrl("user_ai_activity_events");
 await requestTaskStorage({
  url,
  schema: activityRowsSchema,
  method: "POST",
  prefer: "return=representation",
  body: {
   user_id: userId,
   task_id: event.taskId,
   provider: event.provider,
   model: event.model,
   api_key_id: event.keyId,
   key_label: event.keyLabel,
   resolution_source: event.resolutionSource,
   status: event.status,
   error_code: event.errorCode,
   latency_ms: event.latencyMs,
   input_tokens: event.inputTokens,
   output_tokens: event.outputTokens,
   resource_type: event.resourceType,
   resource_id: event.resourceId,
  },
 });
}

export async function listUserAiActivityEvents(input: {
 userId: string;
 taskId?: AiTaskId;
 provider?: z.output<typeof ApiKeyProviderSchema>;
 status?: z.output<typeof aiActivityStatusSchema>;
 cursor?: AiActivityCursor;
}) {
 const url = buildRestUrl("user_ai_activity_events");
 url.searchParams.set(
  "select",
  "id,task_id,provider,model,api_key_id,key_label,resolution_source,status,error_code,latency_ms,input_tokens,output_tokens,resource_type,resource_id,created_at",
 );
 url.searchParams.set("user_id", `eq.${input.userId}`);
 url.searchParams.set("order", "created_at.desc,id.desc");
 url.searchParams.set("limit", "51");
 if (input.taskId) url.searchParams.set("task_id", `eq.${input.taskId}`);
 if (input.provider) url.searchParams.set("provider", `eq.${input.provider}`);
 if (input.status) url.searchParams.set("status", `eq.${input.status}`);
 if (input.cursor) {
  const cursor = aiActivityCursorSchema.parse(input.cursor);
  url.searchParams.set(
   "or",
   `(created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id}))`,
  );
 }

 const rows = await requestTaskStorage({ url, schema: activityRowsSchema });
 const events = rows.slice(0, 50).map(activityFromRow);
 const lastEvent = events[events.length - 1];
 return {
  events,
  nextCursor:
   rows.length > 50 && lastEvent
    ? aiActivityCursorSchema.parse({ createdAt: lastEvent.createdAt, id: lastEvent.id })
    : null,
 };
}

export async function listUserAiActivitySummary(input: {
 userId: string;
 taskId?: AiTaskId;
 provider?: z.output<typeof ApiKeyProviderSchema>;
}) {
 const url = buildRestUrl("rpc/user_ai_activity_summary");
 const rows = await requestTaskStorage({
  url,
  schema: activitySummaryRowsSchema,
  method: "POST",
  body: {
   p_user_id: input.userId,
   p_task_id: input.taskId ?? null,
   p_provider: input.provider ?? null,
  },
 });
 return rows.map((row) =>
  aiActivitySummaryGroupSchema.parse({
   taskId: row.task_id,
   provider: row.provider,
   model: row.model,
   attempts: row.attempts,
   successes: row.successes,
   successRate: row.success_rate,
   averageLatencyMs: row.average_latency_ms,
   inputTokens: row.input_tokens,
   outputTokens: row.output_tokens,
  }),
 );
}

export async function clearUserAiActivityEvents(userId: string) {
 const url = buildRestUrl("user_ai_activity_events");
 url.searchParams.set("user_id", `eq.${userId}`);
 await requestTaskStorage({
  url,
  schema: z.null(),
  method: "DELETE",
  prefer: "return=minimal",
 });
}
