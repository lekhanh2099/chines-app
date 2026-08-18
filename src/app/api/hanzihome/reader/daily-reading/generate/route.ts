import { z } from "zod";

import { privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 dailyReadingErrorResponseSchema,
 dailyReadingGenerateRequestSchema,
 dailyReadingGenerateResponseSchema,
 dailyReadingGenerateStreamEventSchema,
 type DailyReadingErrorCode,
 type DailyReadingGenerationStage,
 type DailyReadingGenerateStreamEvent,
} from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";
import { generateValidatedDailyReading } from "@/features/hanzihome/reader/daily-reading/daily-reading-generation.server";
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
 credentials: Awaited<ReturnType<typeof getActiveUserApiKeyCredentials>>;
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
     let discovery: Awaited<ReturnType<typeof discoverDailyReadingSource>>;
     try {
      discovery = await discoverDailyReadingSource(input.excludedUrls, input.recentTopics, progress);
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
     });
     progress("completed");
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
 const body: unknown = await request.json().catch(() => null);
 const parsed = dailyReadingGenerateRequestSchema.safeParse(body);
 if (!parsed.success) {
  return errorResponse("invalid-request", "Yêu cầu tạo Daily Reading không hợp lệ.", 400);
 }
 try {
  const credentials = await getActiveUserApiKeyCredentials(
   auth.context.supabase,
   auth.context.user.id,
  );
  return createGenerationStream({ request, input: parsed.data, credentials });
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
