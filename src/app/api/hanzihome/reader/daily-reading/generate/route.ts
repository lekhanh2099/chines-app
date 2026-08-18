import { z } from "zod";

import { apiError, privateNoStoreJson, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import { getActiveUserApiKeyCredentials } from "@/services/user-api-keys.service";
import {
 dailyReadingGenerateRequestSchema,
 dailyReadingGenerateResponseSchema,
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

export async function POST(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;
 const body: unknown = await request.json().catch(() => null);
 const parsed = dailyReadingGenerateRequestSchema.safeParse(body);
 if (!parsed.success) {
  return apiError("Yêu cầu tạo Daily Reading không hợp lệ.", 400, "DAILY_READING_INVALID_REQUEST");
 }
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
  const credentials = await getActiveUserApiKeyCredentials(
   auth.context.supabase,
   auth.context.user.id,
  );
  const reading = await generateValidatedDailyReading({
   source: discovery.source,
   preferredLevel: parsed.data.preferredLevel,
   mode: parsed.data.mode,
   credentials,
   signal: request.signal,
  });
  return privateNoStoreJson(dailyReadingGenerateResponseSchema.parse({ reading }));
 } catch (error) {
  const detail =
   error instanceof z.ZodError
    ? "AI trả Daily Reading không đúng contract."
    : error instanceof Error
      ? error.message
      : "Không thể tạo Daily Reading.";
  return apiError(detail.slice(0, 1000), 502, "DAILY_READING_GENERATION_FAILED");
 }
}
