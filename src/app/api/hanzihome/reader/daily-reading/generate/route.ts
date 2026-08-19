import { z } from "zod";

import { privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import { resolveAiCredentialRuntime } from "@/services/ai-analysis-runtime.service";
import type { UserApiKeyCredential } from "@/services/user-api-keys.service";
import type { JsonFieldValue } from "@/types/json";
import {
 dailyReadingErrorResponseSchema,
 dailyReadingGenerateRequestSchema,
 dailyReadingGenerateResponseSchema,
 dailyReadingGenerateStreamEventSchema,
 type DailyReadingErrorCode,
 type DailyReadingGenerationStage,
 type DailyReadingGenerateStreamEvent,
} from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";
import {
 generateValidatedDailyReading,
 generateValidatedDailyReadingFromCheckpoint,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-generation.server";
import {
 discoverDailyReadingSource,
 formatDailyReadingSourceReport,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-source.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

function errorResponse(code: DailyReadingErrorCode, detail: string, status: number) {
 return privateNoStoreJson(
  dailyReadingErrorResponseSchema.parse({ code, detail: detail.slice(0, 1000) }),
  { status },
 );
}

function classifyGenerationError(error: Error): DailyReadingErrorCode {
 if (error.name === "TimeoutError" || /timeout|timed out|aborted/iu.test(error.message)) {
  return "timeout";
 }
 if (
  /schema|validation|không đúng contract|không khớp|quá ngắn|sao chép|thiếu main|ít nhất hai câu detail|đoạn không tồn tại/iu.test(
   error.message,
  )
 ) {
  return "invalid-provider-response";
 }
 return "provider-rejected";
}

function streamEventLine(event: DailyReadingGenerateStreamEvent) {
 return `${JSON.stringify(dailyReadingGenerateStreamEventSchema.parse(event))}\n`;
}

function createGenerationStream({
 request,
 input,
 credentials,
}: {
 request: Request;
 input: z.output<typeof dailyReadingGenerateRequestSchema>;
 credentials: UserApiKeyCredential[];
}) {
 const encoder = new TextEncoder();
 let active = true;
 const generationController = new AbortController();
 const abortGeneration = () => generationController.abort();
 request.signal.addEventListener("abort", abortGeneration, { once: true });
 if (request.signal.aborted) generationController.abort();

 const stream = new ReadableStream<Uint8Array>({
  start(controller) {
   let heartbeat: ReturnType<typeof setInterval> | null = null;
   let currentProgress: DailyReadingGenerateStreamEvent | null = null;

   const enqueue = (event: DailyReadingGenerateStreamEvent) => {
    if (!active) return;
    try {
     controller.enqueue(encoder.encode(streamEventLine(event)));
    } catch {
     active = false;
    }
   };
   const progress = (stage: DailyReadingGenerationStage) => {
    const event = dailyReadingGenerateStreamEventSchema.parse({ type: "progress", stage });
    currentProgress = event;
    enqueue(event);
   };
   const fail = (code: DailyReadingErrorCode, detail: string) => {
    enqueue(
     dailyReadingGenerateStreamEventSchema.parse({
      type: "error",
      payload: { code, detail: detail.slice(0, 1000) },
     }),
    );
   };

   heartbeat = setInterval(() => {
    if (currentProgress !== null) enqueue(currentProgress);
   }, 10_000);

   void (async () => {
    try {
     if (input.checkpoint) {
      const reading = await generateValidatedDailyReadingFromCheckpoint({
       checkpoint: input.checkpoint,
       mode: input.mode,
       credentials,
       signal: generationController.signal,
       onProgress: progress,
      });
      enqueue(
       dailyReadingGenerateStreamEventSchema.parse({
        type: "result",
        payload: dailyReadingGenerateResponseSchema.parse({ reading }),
       }),
      );
      return;
     }
     let discovery: Awaited<ReturnType<typeof discoverDailyReadingSource>>;
     try {
      discovery = await discoverDailyReadingSource(
       input.excludedUrls,
       input.recentTopics,
       progress,
      );
     } catch (error) {
      const detail = error instanceof Error ? error.message : "Source discovery failed.";
      fail("source-extraction-failed", detail);
      return;
     }
     if (discovery.source === null) {
      fail(
       "source-unavailable",
       `Không tìm được bài báo gần đây có thể trích xuất an toàn. ${formatDailyReadingSourceReport(discovery.report)}`,
      );
      return;
     }
     const reading = await generateValidatedDailyReading({
      source: discovery.source,
      preferredLevel: input.preferredLevel,
      mode: input.mode,
      credentials,
      signal: generationController.signal,
      onProgress: progress,
      onCheckpoint: (checkpoint) =>
       enqueue(
        dailyReadingGenerateStreamEventSchema.parse({
         type: "checkpoint",
         payload: checkpoint,
        }),
       ),
     });
     enqueue(
      dailyReadingGenerateStreamEventSchema.parse({
       type: "result",
       payload: dailyReadingGenerateResponseSchema.parse({ reading }),
      }),
     );
    } catch (error) {
     const resolved = error instanceof Error ? error : new Error("Không thể tạo Daily Reading.");
     fail(classifyGenerationError(resolved), resolved.message);
    } finally {
     if (heartbeat !== null) clearInterval(heartbeat);
     request.signal.removeEventListener("abort", abortGeneration);
     if (active) {
      active = false;
      controller.close();
     }
    }
   })();
  },
  cancel() {
   active = false;
   generationController.abort();
   request.signal.removeEventListener("abort", abortGeneration);
  },
 });

 return new Response(stream, {
  headers: {
   "Cache-Control": "private, no-store",
   "Content-Type": "application/x-ndjson; charset=utf-8",
   "X-Accel-Buffering": "no",
  },
 });
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) {
  return errorResponse("unauthorized", "Cần đăng nhập trước khi tạo Daily Reading.", 401);
 }
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = dailyReadingGenerateRequestSchema.safeParse(body);
 if (!parsed.success) {
  return errorResponse("invalid-request", "Yêu cầu tạo Daily Reading không hợp lệ.", 400);
 }
 try {
  const runtime = await resolveAiCredentialRuntime({
   supabase: auth.context.supabase,
   userId: auth.context.user.id,
   capability: "daily-reading-learning",
  });
  if (!runtime.ok) {
   return errorResponse(
    "provider-rejected",
    runtime.status === "missing-key"
     ? "Daily Reading học tập cần API key cá nhân đang hoạt động. Bài nguồn V2 vẫn có thể được tìm và đọc mà không cần AI."
     : "Kho API key an toàn phía server chưa sẵn sàng.",
    runtime.status === "missing-key" ? 409 : 503,
   );
  }
  return createGenerationStream({
   request,
   input: parsed.data,
   credentials: [runtime.credential],
  });
 } catch (error) {
  const detail =
   error instanceof z.ZodError
    ? "AI runtime trả dữ liệu không đúng contract."
    : error instanceof Error
      ? error.message
      : "Không thể khởi tạo Daily Reading.";
  return errorResponse("provider-rejected", detail, 502);
 }
}
