import { z } from "zod";
import { getRun } from "workflow/api";

import {
 DailyReadingEnrichmentJobStorageError,
 listDailyReadingEnrichmentJobs,
} from "@/features/daily-reading/daily-reading-enrichment-jobs.server";
import { dailyReadingTranslationProgressStream } from "@/features/daily-reading/daily-reading-enrichment.workflow";
import { apiError, requireAuthenticatedRoute } from "@/lib/api/authenticated-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.strictObject({
 runId: z.uuid(),
 startIndex: z.string().regex(/^\d+$/u).optional(),
});

export async function GET(request: Request) {
 const auth = await requireAuthenticatedRoute();
 if (!auth.authenticated) return auth.response;

 const searchParams = new URL(request.url).searchParams;
 const parsed = querySchema.safeParse({
  runId: searchParams.get("runId"),
  startIndex: searchParams.get("startIndex") ?? undefined,
 });
 if (!parsed.success) {
  return apiError("Invalid Daily Reading translation stream request", 400, "INVALID_REQUEST");
 }

 try {
  const jobs = await listDailyReadingEnrichmentJobs({
   userId: auth.context.user.id,
   runId: parsed.data.runId,
  });
  const translationJob = jobs.find((job) => job.module === "translation");
  if (!translationJob?.workflowRunId) {
   return apiError("Daily Reading translation stream not found", 404, "STREAM_NOT_FOUND");
  }

  const run = getRun<void>(translationJob.workflowRunId);
  const stream = run.getReadable<Uint8Array>({
   namespace: dailyReadingTranslationProgressStream,
   ...(parsed.data.startIndex === undefined ? {} : { startIndex: Number(parsed.data.startIndex) }),
  });
  return new Response(stream, {
   headers: {
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "X-Accel-Buffering": "no",
   },
  });
 } catch (error) {
  if (error instanceof DailyReadingEnrichmentJobStorageError) {
   return apiError(
    "Daily Reading enrichment job storage is not ready",
    503,
    "AI_JOB_SCHEMA_UNAVAILABLE",
   );
  }
  return apiError("Unable to open Daily Reading translation stream", 500, "STREAM_UNAVAILABLE");
 }
}
