import type {
 ReaderContentCapability,
 ReaderDocumentModel,
 ReaderSegment,
} from "../model/reader-document.types";
import type {
 DailyReadingV2,
 DailyReadingV2CaptureRun,
 DailyReadingV2EnrichmentModule,
 DailyReadingV2EnrichmentRun,
} from "./daily-reading-v2.schemas";

export type DailyReadingActivityEntry =
 | {
    id: string;
    kind: "capture";
    attemptedAt: string;
    completedAt: string;
    status: DailyReadingV2CaptureRun["status"];
    articleId: string;
    articleTitleZh: string;
    releaseKind: DailyReadingV2CaptureRun["kind"];
    stage: DailyReadingV2CaptureRun["stage"];
    errorCode: string;
    errorDetail: string;
   }
 | {
    id: string;
    kind: "enrichment";
    attemptedAt: string;
    completedAt: string;
    status: DailyReadingV2EnrichmentRun["status"];
    articleId: string;
    articleTitleZh: string;
    module: DailyReadingV2EnrichmentModule;
    errorCode: string;
    errorDetail: string;
   };

function articleTitleById(items: readonly DailyReadingV2[]) {
 return new Map(items.map((item) => [item.id, item.article.titleZh]));
}

export function buildDailyReadingActivityEntries(input: {
 items: readonly DailyReadingV2[];
 captureRuns: readonly DailyReadingV2CaptureRun[];
 enrichmentRuns: readonly DailyReadingV2EnrichmentRun[];
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

export function getDailyReadingLearningSummary(reading: DailyReadingV2) {
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

export function buildDailyReadingReaderDocument(reading: DailyReadingV2): ReaderDocumentModel {
 const translation =
  reading.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
 const translationByParagraphId = new Map(
  translation?.paragraphs.map((paragraph) => [paragraph.paragraphId, paragraph]) ?? [],
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
 const capabilities: ReaderContentCapability[] = translation === null ? [] : ["translation"];

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
