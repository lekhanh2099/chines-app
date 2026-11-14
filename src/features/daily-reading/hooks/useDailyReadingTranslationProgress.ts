"use client";

import { useEffect, useState } from "react";

import type { JsonFieldValue } from "@/types/json";
import { reconcilePendingDailyReadingEnrichmentJobs } from "@/features/daily-reading/enrichment/daily-reading-enrichment.client";
import {
 dailyReadingTranslationProgressEventSchema,
 type DailyReadingTranslationProgressEvent,
} from "@/features/daily-reading/enrichment/daily-reading-enrichment.schemas";

type DailyReadingTranslationProgressInput = {
 translationRunId: string;
 translationWorkflowRunId: string;
 streamArticleId: string;
 streamArticleFingerprint: string;
};

/**
 * Streams transient translation progress for the active translation run and
 * owns the progress events received for that run.
 */
export function useDailyReadingTranslationProgress({
 translationRunId,
 translationWorkflowRunId,
 streamArticleId,
 streamArticleFingerprint,
}: DailyReadingTranslationProgressInput): DailyReadingTranslationProgressEvent[] {
 const [translationProgressState, setTranslationProgressState] = useState<{
  runId: string;
  events: DailyReadingTranslationProgressEvent[];
 }>({ runId: "", events: [] });

 useEffect(() => {
  if (
   translationWorkflowRunId.length === 0 ||
   translationRunId.length === 0 ||
   streamArticleId.length === 0 ||
   streamArticleFingerprint.length === 0
  ) {
   return;
  }

  const controller = new AbortController();
  void (async () => {
   let startIndex = 0;
   while (!controller.signal.aborted) {
    try {
     const query = new URLSearchParams({ runId: translationRunId });
     if (startIndex > 0) query.set("startIndex", String(startIndex));
     const response = await fetch(`/api/daily-reading/enrichment-jobs/stream?${query.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
     });
     if (!response.ok || response.body === null) return;

     const reader = response.body.getReader();
     const decoder = new TextDecoder();
     let buffer = "";
     while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
       void reconcilePendingDailyReadingEnrichmentJobs().catch(() => undefined);
       return;
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
       if (line.trim().length === 0) continue;
       startIndex += 1;
       const payload: JsonFieldValue = JSON.parse(line);
       const parsed = dailyReadingTranslationProgressEventSchema.safeParse(payload);
       if (
        !parsed.success ||
        parsed.data.runId !== translationRunId ||
        parsed.data.articleId !== streamArticleId ||
        parsed.data.articleFingerprint !== streamArticleFingerprint
       ) {
        continue;
       }
       setTranslationProgressState((current) => {
        const events = current.runId === translationRunId ? current.events : [];
        const currentParagraphIds = new Set(
         events.flatMap((event) => event.paragraphs.map((paragraph) => paragraph.paragraphId)),
        );
        const paragraphs = parsed.data.paragraphs.filter(
         (paragraph) => !currentParagraphIds.has(paragraph.paragraphId),
        );
        return paragraphs.length === 0
         ? { runId: translationRunId, events }
         : { runId: translationRunId, events: [...events, { ...parsed.data, paragraphs }] };
       });
      }
     }
    } catch {
     if (controller.signal.aborted) return;
     await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
   }
  })();
  return () => controller.abort();
 }, [streamArticleFingerprint, streamArticleId, translationRunId, translationWorkflowRunId]);

 return translationProgressState.runId === translationRunId ? translationProgressState.events : [];
}
