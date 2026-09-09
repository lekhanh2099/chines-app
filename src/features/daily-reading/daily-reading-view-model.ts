import type {
 ReaderContentCapability,
 ReaderDocumentModel,
 ReaderSegment,
} from "@/features/reader/model/reader-document.types";
import type {
 DailyReading,
 DailyReadingCaptureRun,
 DailyReadingEnrichmentModule,
 DailyReadingEnrichmentRun,
} from "@/features/daily-reading/daily-reading.schemas";
import type { DailyReadingTranslationProgressEvent } from "@/features/daily-reading/daily-reading-enrichment.schemas";

export type DailyReadingActivityEntry =
 | {
    id: string;
    kind: "capture";
    attemptedAt: string;
    completedAt: string;
    status: DailyReadingCaptureRun["status"];
    articleId: string;
    articleTitleZh: string;
    releaseKind: DailyReadingCaptureRun["kind"];
    stage: DailyReadingCaptureRun["stage"];
    errorCode: string;
    errorDetail: string;
   }
 | {
    id: string;
    kind: "enrichment";
    attemptedAt: string;
    completedAt: string;
    status: DailyReadingEnrichmentRun["status"];
    articleId: string;
    articleTitleZh: string;
    module: DailyReadingEnrichmentModule;
    errorCode: string;
    errorDetail: string;
   };

function articleTitleById(items: readonly DailyReading[]) {
 return new Map(items.map((item) => [item.id, item.article.titleZh]));
}

export function buildDailyReadingActivityEntries(input: {
 items: readonly DailyReading[];
 captureRuns: readonly DailyReadingCaptureRun[];
 enrichmentRuns: readonly DailyReadingEnrichmentRun[];
}): DailyReadingActivityEntry[] {
 const titles = articleTitleById(input.items);
 const captures: DailyReadingActivityEntry[] = input.captureRuns.map((run) => ({
  id: run.id,
  kind: "capture",
  attemptedAt: run.attemptedAt,
  completedAt: run.completedAt,
  status: run.status,
  articleId: run.articleId,
  articleTitleZh: run.articleId ? (titles.get(run.articleId) ?? "") : "",
  releaseKind: run.kind,
  stage: run.stage,
  errorCode: run.errorCode,
  errorDetail: run.errorDetail,
 }));
 const enrichments: DailyReadingActivityEntry[] = input.enrichmentRuns.map((run) => ({
  id: run.id,
  kind: "enrichment",
  attemptedAt: run.attemptedAt,
  completedAt: run.completedAt,
  status: run.status,
  articleId: run.articleId,
  articleTitleZh: titles.get(run.articleId) ?? "",
  module: run.module,
  errorCode: run.errorCode,
  errorDetail: run.errorDetail,
 }));
 return [...captures, ...enrichments].sort((left, right) =>
  right.attemptedAt.localeCompare(left.attemptedAt),
 );
}

export function getDailyReadingLearningSummary(reading: DailyReading) {
 const states = Object.values(reading.enrichment);
 const ready = states.filter((state) => state.status === "ready").length;
 const running = states.some((state) => state.status === "running");
 const attention = states.some((state) => state.status === "failed" || state.status === "blocked");
 return {
  ready,
  total: states.length,
  running,
  attention,
  complete: ready === states.length,
 };
}

export function buildDailyReadingReaderDocument(
 reading: DailyReading,
 transientTranslationParagraphs: DailyReadingTranslationProgressEvent["paragraphs"],
): ReaderDocumentModel {
 const translation =
  reading.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
 const visibleTranslationParagraphs = translation?.paragraphs ?? transientTranslationParagraphs;
 const translationByParagraphId = new Map(
  visibleTranslationParagraphs.map((paragraph) => [paragraph.paragraphId, paragraph]),
 );
 const segments: ReaderSegment[] = reading.article.paragraphs.map((paragraph) => {
  const translated = translationByParagraphId.get(paragraph.id);
  return {
   id: paragraph.id,
   kind: "paragraph",
   zh: paragraph.zh,
   ...(translated?.vi ? { vi: translated.vi } : {}),
   ...(translated?.roleVi ? { role: translated.roleVi } : {}),
  };
 });
 const capabilities: ReaderContentCapability[] = ["pinyin", "translation"];

 return {
  id: reading.id,
  language: "zh-CN",
  source: {
   kind: "article",
   sourceId: reading.source.url,
   href: reading.source.url,
   label: reading.source.publisher,
  },
  title: reading.article.titleZh,
  ...(translation?.titleVi ? { titleVi: translation.titleVi } : {}),
  sections: [],
  segments,
  metadata: [],
  capabilities,
 };
}
