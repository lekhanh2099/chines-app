import type { HumanitiesDocumentResource } from "@/features/humanities/model/humanities-resource.schemas";
import type { HumanitiesPracticeTrack } from "@/features/humanities/humanities-practice-content";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { PracticeAttemptPayload } from "@/features/hanzihome/practice/practice-attempt-api";
import {
 createTranslationAttempt,
 type TranslationDirection,
 type TranslationSegment,
} from "@/features/hanzihome/practice/translation-practice";
import { evaluateHumanitiesAnswer } from "@/features/humanities/humanities-evaluator";

type Evaluation = HumanitiesDocumentResource["exerciseItems"][number]["payload"]["evaluation"];

export function translationSourceKind(resource: HumanitiesDocumentResource["document"]): string {
 const value = resource.source_metadata.source_kind;
 return typeof value === "string" ? value : "humanities";
}

export function translationCourseModuleOrder(
 track: HumanitiesPracticeTrack,
 lessonIndex: number,
): number {
 if (track === "translation") {
  if (lessonIndex === 1) return 1;
  if (lessonIndex <= 6) return 6;
  if (lessonIndex <= 10) return 7;
  if (lessonIndex <= 15) return 8;
  return 9;
 }
 if (lessonIndex === 1) return 1;
 if (lessonIndex <= 3) return 10;
 if (lessonIndex <= 5) return 11;
 return 12;
}

export function translationTrackDocuments(
 documents: readonly ReaderDocumentRow[],
 track: HumanitiesPracticeTrack,
) {
 return documents.filter((document) => translationSourceKind(document) === track);
}

export function translationResourceSegments(
 resource: HumanitiesDocumentResource,
): TranslationSegment[] {
 return resource.paragraphs.map((paragraph) => ({
  id: paragraph.id,
  order: paragraph.paragraph_order,
  sourceLabel: "Bài đọc Humanities",
  zh: paragraph.zh,
  pinyin: paragraph.pinyin,
  vi: paragraph.vi,
 }));
}

export function createTranslationSubmission(
 segment: TranslationSegment,
 direction: TranslationDirection,
 answer: string,
 responseMs: PracticeAttemptPayload["responseMs"],
 evaluation: Evaluation,
) {
 const attempt = createTranslationAttempt(segment, direction, answer, responseMs);
 const evaluationResult =
  evaluation === undefined ? null : evaluateHumanitiesAnswer(answer, evaluation);
 const payload: PracticeAttemptPayload = {
  surface: "translation",
  contentId: segment.id,
  direction,
  answer: {
   answer: attempt.answer,
   reference: evaluation?.references[0]?.text ?? (direction === "zh-vi" ? segment.vi : segment.zh),
   missingUnitIds: evaluationResult?.missingRequiredUnitIds ?? [],
  },
  scorePercent: evaluationResult?.score ?? attempt.score,
  responseMs: attempt.responseMs,
 };
 return { payload, evaluationResult };
}
