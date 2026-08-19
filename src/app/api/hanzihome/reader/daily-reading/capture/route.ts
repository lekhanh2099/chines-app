import { z } from "zod";

import { privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import type { JsonFieldValue } from "@/types/json";
import {
 dailyReadingErrorResponseSchema,
 type DailyReadingErrorCode,
} from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";
import { captureDailyReadingArticle } from "@/features/hanzihome/reader/daily-reading/daily-reading-capture.server";
import { formatDailyReadingSourceReport } from "@/features/hanzihome/reader/daily-reading/daily-reading-source.server";
import {
 dailyReadingV2CaptureRequestSchema,
 dailyReadingV2CaptureResponseSchema,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-v2.schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 180;

function errorResponse(code: DailyReadingErrorCode, detail: string, status: number) {
 return privateNoStoreJson(
  dailyReadingErrorResponseSchema.parse({ code, detail: detail.slice(0, 1000) }),
  { status },
 );
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) {
  return errorResponse("unauthorized", "Cần đăng nhập trước khi tìm bài Daily Reading.", 401);
 }
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = dailyReadingV2CaptureRequestSchema.safeParse(body);
 if (!parsed.success) {
  return errorResponse("invalid-request", "Yêu cầu tìm bài Daily Reading không hợp lệ.", 400);
 }

 try {
  const capture = await captureDailyReadingArticle(parsed.data);
  if (capture.reading === null) {
   return errorResponse(
    "source-unavailable",
    `Không tìm được bài báo phù hợp với tiêu chí hiện tại. ${formatDailyReadingSourceReport(capture.report)}`,
    503,
   );
  }
  return privateNoStoreJson(
   dailyReadingV2CaptureResponseSchema.parse({
    reading: capture.reading,
    report: {
     discoveryEndpoints: capture.report.discoveryEndpoints,
     discoveryResponses: capture.report.discoveryResponses,
     metadataCandidates: capture.report.metadataCandidates,
     policyCandidates: capture.report.policyCandidates,
     attemptedExtractions: capture.report.attemptedExtractions,
     selectedFinalScore: capture.report.selectedFinalScore,
     usedFreshnessDays: capture.report.usedFreshnessDays,
    },
   }),
  );
 } catch (error) {
  const detail =
   error instanceof z.ZodError
    ? "Bài nguồn không đúng contract Daily Reading V2."
    : error instanceof Error
      ? error.message
      : "Không thể lưu bài nguồn Daily Reading.";
  return errorResponse("source-extraction-failed", detail, 500);
 }
}
