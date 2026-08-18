import { z } from "zod";

import { privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import type { JsonFieldValue } from "@/types/json";
import {
 dailyReadingErrorResponseSchema,
 dailyReadingSourcePreviewRequestSchema,
 dailyReadingSourcePreviewResponseSchema,
 type DailyReadingErrorCode,
} from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";
import {
 discoverDailyReadingSource,
 formatDailyReadingSourceReport,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-source.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function errorResponse(code: DailyReadingErrorCode, detail: string, status: number) {
 return privateNoStoreJson(
  dailyReadingErrorResponseSchema.parse({ code, detail: detail.slice(0, 1000) }),
  { status },
 );
}

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) {
  return errorResponse("unauthorized", "Cần đăng nhập trước khi kiểm tra nguồn Daily Reading.", 401);
 }
 const body: JsonFieldValue = await request.json().catch(() => null);
 const parsed = dailyReadingSourcePreviewRequestSchema.safeParse(body);
 if (!parsed.success) {
  return errorResponse("invalid-request", "Yêu cầu kiểm tra nguồn không hợp lệ.", 400);
 }
 try {
  const discovery = await discoverDailyReadingSource(
   parsed.data.excludedUrls,
   parsed.data.recentTopics,
  );
  if (discovery.source === null) {
   return errorResponse(
    "source-unavailable",
    `Không tìm được bài báo gần đây có thể trích xuất an toàn. ${formatDailyReadingSourceReport(discovery.report)}`,
    503,
   );
  }
  const response = dailyReadingSourcePreviewResponseSchema.parse({
   source: {
    titleZh: discovery.source.titleZh,
    publisher: discovery.source.publisher,
    url: discovery.source.url,
    publishedAt: discovery.source.publishedAt,
    topic: discovery.source.topic,
    hanCharacters: discovery.source.extractedTextZh.match(/[\u3400-\u9fff]/gu)?.length ?? 0,
   },
   report: {
    discoveryEndpoints: discovery.report.discoveryEndpoints,
    discoveryResponses: discovery.report.discoveryResponses,
    metadataCandidates: discovery.report.metadataCandidates,
    attemptedExtractions: discovery.report.attemptedExtractions,
   },
  });
  return privateNoStoreJson(response);
 } catch (error) {
  const detail =
   error instanceof z.ZodError
    ? "Nguồn bài báo không đúng contract."
    : error instanceof Error
      ? error.message
      : "Không thể kiểm tra nguồn.";
  return errorResponse("source-extraction-failed", detail, 500);
 }
}
