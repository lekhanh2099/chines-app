import { privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import type { AiTaskId } from "@/lib/ai-task-contract";
import {
 resolveUserAiTaskRuntime,
 recordUserAiRuntimeActivity,
 recordUserAiTaskBlockedActivity,
 type UserAiTaskRuntimeResolution,
} from "@/services/ai-runtime.service";
import type { JsonFieldValue } from "@/types/json";

import {
 dailyReadingEnrichmentRequestSchema,
 dailyReadingEnrichmentResponseSchema,
 type DailyReadingEnrichmentResponse,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-enrichment.schemas";
import { generateDailyReadingEnrichment } from "@/features/hanzihome/reader/daily-reading/daily-reading-enrichment.server";
import type { DailyReadingEnrichmentModule } from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 180;

function taskForModule(module: DailyReadingEnrichmentModule): AiTaskId {
 if (module === "translation") return "daily-reading.translation";
 if (module === "vocabulary") return "daily-reading.vocabulary";
 if (module === "grammar") return "daily-reading.grammar";
 return "daily-reading.questions";
}

function runtimeFailureResponse(
 module: DailyReadingEnrichmentModule,
 resolution: Extract<UserAiTaskRuntimeResolution, { ok: false }>,
) {
 if (resolution.status === "task-disabled") {
  const body: DailyReadingEnrichmentResponse = {
   ok: false,
   status: "blocked",
   module,
   reason: "task-disabled",
   errorCode: "task-disabled",
   errorDetail: "Tác vụ AI này đang tắt trong Cài đặt → AI → Tác vụ AI.",
  };
  return privateNoStoreJson(dailyReadingEnrichmentResponseSchema.parse(body), { status: 409 });
 }
 if (resolution.status === "missing-key") {
  const body: DailyReadingEnrichmentResponse = {
   ok: false,
   status: "blocked",
   module,
   reason: "missing-ai-key",
   errorCode: "missing-ai-key",
   errorDetail: "Chưa có API key AI đang hoạt động cho phần hỗ trợ học tập.",
  };
  return privateNoStoreJson(dailyReadingEnrichmentResponseSchema.parse(body), { status: 409 });
 }

 const body: DailyReadingEnrichmentResponse = {
  ok: false,
  status: "failed",
  module,
  errorCode: "storage-unavailable",
  errorDetail: "Kho API key an toàn phía server chưa sẵn sàng hoặc không đọc được key đã lưu.",
 };
 return privateNoStoreJson(dailyReadingEnrichmentResponseSchema.parse(body), { status: 503 });
}

function blockedReasonForProviderFailure(
 errorCode: Extract<DailyReadingEnrichmentResponse, { ok: false }>["errorCode"],
): "invalid-ai-key" | "quota-exhausted" | "provider-unavailable" | null {
 if (errorCode === "invalid-key") return "invalid-ai-key";
 if (errorCode === "quota-exhausted") return "quota-exhausted";
 if (errorCode === "provider-unavailable") return "provider-unavailable";
 return null;
}

function providerFailureResponse(result: Extract<DailyReadingEnrichmentResponse, { ok: false }>) {
 const reason = blockedReasonForProviderFailure(result.errorCode);
 if (reason !== null) {
  const body: DailyReadingEnrichmentResponse = {
   ...result,
   status: "blocked",
   reason,
  };
  const status =
   result.errorCode === "quota-exhausted"
    ? 429
    : result.errorCode === "provider-unavailable"
      ? 503
      : 409;
  return privateNoStoreJson(dailyReadingEnrichmentResponseSchema.parse(body), { status });
 }
 const status =
  result.errorCode === "network-error" ? 503 : result.errorCode === "cancelled" ? 408 : 502;
 return privateNoStoreJson(dailyReadingEnrichmentResponseSchema.parse(result), { status });
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) {
  return privateNoStoreJson({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
 }

 const payload: JsonFieldValue = await request.json().catch(() => null);
 const parsed = dailyReadingEnrichmentRequestSchema.safeParse(payload);
 if (!parsed.success) {
  return privateNoStoreJson(
   { error: "Yêu cầu tạo hỗ trợ Daily Reading không hợp lệ.", code: "INVALID_REQUEST" },
   { status: 400 },
  );
 }

 const taskId = taskForModule(parsed.data.module);
 const startedAt = performance.now();
 const resolution = await resolveUserAiTaskRuntime({
  supabase: auth.context.supabase,
  userId: auth.context.user.id,
  taskId,
 });
 if (!resolution.ok) {
  await recordUserAiTaskBlockedActivity({
   userId: auth.context.user.id,
   taskId,
   errorCode: resolution.reason,
   resourceType: "daily-reading",
   resourceId: parsed.data.reading.id,
  });
  return runtimeFailureResponse(parsed.data.module, resolution);
 }

 const result = await generateDailyReadingEnrichment({
  reading: parsed.data.reading,
  runtime: resolution.runtime,
  module: parsed.data.module,
  targetCount: parsed.data.targetCount,
  signal: request.signal,
 });
 await recordUserAiRuntimeActivity({
  userId: auth.context.user.id,
  runtime: resolution.runtime,
  status: result.ok ? "success" : result.errorCode === "cancelled" ? "cancelled" : "failure",
  ...(!result.ok ? { errorCode: result.errorCode } : {}),
  latencyMs: Math.round(performance.now() - startedAt),
  resourceType: "daily-reading",
  resourceId: parsed.data.reading.id,
 });
 if (!result.ok) return providerFailureResponse(result);
 return privateNoStoreJson(dailyReadingEnrichmentResponseSchema.parse(result));
}
