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

export const interpretingMarks: readonly ["kept", "partial", "missed", "unsure"] = [
 "kept",
 "partial",
 "missed",
 "unsure",
];
export type HumanitiesUnitMark = (typeof interpretingMarks)[number];

export function createTranslationRecordingSubmission(
 context: { contentId: TranslationSegment["id"]; direction: TranslationDirection },
 answer: {
  transcript: string;
  notes: string;
  unitMarks: Record<NonNullable<Evaluation>["informationUnits"][number]["id"], HumanitiesUnitMark>;
  durationSeconds: number;
 },
): PracticeAttemptPayload {
 return {
  surface: "translation",
  contentId: context.contentId,
  direction: context.direction,
  answer: { kind: "interpreting-recording", ...answer },
  scorePercent: null,
  responseMs: answer.durationSeconds * 1_000,
 };
}

export function createTranslationRevisionSubmission(
 context: Parameters<typeof createTranslationRecordingSubmission>[0],
 answer: string,
): PracticeAttemptPayload {
 return {
  surface: "translation",
  contentId: context.contentId,
  direction: context.direction,
  answer: { answer, reference: null, missingUnitIds: [] },
  scorePercent: null,
  responseMs: null,
 };
}

export function createTranslationSelfMarkSubmission(
 context: Parameters<typeof createTranslationRecordingSubmission>[0],
 unitMarks: Parameters<typeof createTranslationRecordingSubmission>[1]["unitMarks"],
): PracticeAttemptPayload {
 return {
  surface: "translation",
  contentId: context.contentId,
  direction: context.direction,
  answer: { kind: "interpreting-self-mark", unitMarks },
  scorePercent: null,
  responseMs: null,
 };
}

export function translationPreparationRemaining(
 state: { key: string; remaining: number },
 key: string,
 limit: number,
): number {
 return state.key === key ? state.remaining : limit;
}

export function advanceTranslationPreparation(
 state: Parameters<typeof translationPreparationRemaining>[0],
 key: string,
 limit: number,
) {
 return { key, remaining: Math.max(0, translationPreparationRemaining(state, key, limit) - 1) };
}

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
