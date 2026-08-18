import { z } from "zod";

import { requireAuthenticatedRoute, apiError, privateNoStoreJson } from "@/lib/api/authenticated-route";
import {
 dailyReadingSourcePreviewRequestSchema,
 dailyReadingSourcePreviewResponseSchema,
} from "@/features/hanzihome/reader/daily-reading/daily-reading.schemas";
import {
 discoverDailyReadingSource,
 formatDailyReadingSourceReport,
} from "@/features/hanzihome/reader/daily-reading/daily-reading-source.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const body: unknown = await request.json().catch(() => null);
 const parsed = dailyReadingSourcePreviewRequestSchema.safeParse(body);
 if (!parsed.success) return apiError("Yêu cầu kiểm tra nguồn không hợp lệ.", 400, "DAILY_READING_INVALID_REQUEST");
 try {
  const discovery = await discoverDailyReadingSource(
   parsed.data.excludedUrls,
   parsed.data.recentTopics,
  );
  if (discovery.source === null) {
   return apiError(
    `Không tìm được bài báo gần đây có thể trích xuất an toàn. ${formatDailyReadingSourceReport(discovery.report)}`,
    503,
    "DAILY_READING_SOURCE_UNAVAILABLE",
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
  const detail = error instanceof z.ZodError ? "Nguồn bài báo không đúng contract." : error instanceof Error ? error.message : "Không thể kiểm tra nguồn.";
  return apiError(detail, 500, "DAILY_READING_SOURCE_FAILED");
 }
}
