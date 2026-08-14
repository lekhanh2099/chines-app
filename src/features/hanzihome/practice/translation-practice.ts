import { z } from "zod";

import type { HanyuLesson } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { ReadingTextItemSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { calculateChineseAccuracy, calculateTranslationSimilarity } from "./text-comparison";

const translationReadingTextSchema = ReadingTextItemSchema.pick({
 id: true,
 paragraphs: true,
 text: true,
 pinyin: true,
 vi: true,
});

export const translationDirectionSchema = z.enum(["zh-vi", "vi-zh"]);
export type TranslationDirection = z.output<typeof translationDirectionSchema>;

export const translationSegmentSchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string().min(1),
});
export type TranslationSegment = z.output<typeof translationSegmentSchema>;

export const translationAttemptSchema = z.strictObject({
 segmentId: z.string().min(1),
 direction: translationDirectionSchema,
 answer: z.string(),
 score: z.number().int().min(0).max(100),
 responseMs: z.number().int().nonnegative().nullable(),
});
export type TranslationAttempt = z.output<typeof translationAttemptSchema>;

export const translationPracticeStateSchema = z.strictObject({
 activeIndex: z.number().int().nonnegative(),
 direction: translationDirectionSchema,
 drafts: z.record(z.string().min(1), z.string()),
 checked: z.record(z.string().min(1), z.boolean()),
});
export type TranslationPracticeState = z.output<typeof translationPracticeStateSchema>;

export const emptyTranslationPracticeState: TranslationPracticeState = {
 activeIndex: 0,
 direction: "zh-vi",
 drafts: {},
 checked: {},
};

export function translationAttemptKey(segmentId: string, direction: TranslationDirection): string {
 return `${segmentId}:${direction}`;
}

export function translationSourceText(
 segment: TranslationSegment,
 direction: TranslationDirection,
): string {
 return direction === "zh-vi" ? segment.zh : segment.vi;
}

export function translationReferenceText(
 segment: TranslationSegment,
 direction: TranslationDirection,
): string {
 return direction === "zh-vi" ? segment.vi : segment.zh;
}

export function scoreTranslationAttempt(
 segment: TranslationSegment,
 direction: TranslationDirection,
 answer: string,
): number {
 return direction === "zh-vi"
  ? calculateTranslationSimilarity(segment.vi, answer)
  : calculateChineseAccuracy(segment.zh, answer);
}

export function createTranslationAttempt(
 segment: TranslationSegment,
 direction: TranslationDirection,
 answer: string,
 responseMs: number | null,
): TranslationAttempt {
 return translationAttemptSchema.parse({
  segmentId: segment.id,
  direction,
  answer,
  score: scoreTranslationAttempt(segment, direction, answer),
  responseMs,
 });
}

export function clampTranslationIndex(index: number, segmentCount: number): number {
 if (segmentCount <= 0) return 0;
 return Math.min(segmentCount - 1, Math.max(0, index));
}

export function orderedTranslationSegments(
 segments: readonly TranslationSegment[],
): TranslationSegment[] {
 return [...segments].sort(
  (left, right) => left.order - right.order || left.id.localeCompare(right.id),
 );
}

export function translationSegmentsFromLesson(sourceLesson: HanyuLesson | undefined) {
 if (!sourceLesson) return [];

 const segments: TranslationSegment[] = [];
 let order = 1;

 for (const section of sourceLesson.lesson.sections) {
  if (section.type !== "reading") continue;

  const readingItems = [...section.items].sort(
   (left, right) => left.order - right.order || left.id.localeCompare(right.id),
  );
  for (const item of readingItems) {
   if (item.type !== "reading_text") continue;
   const readingText = translationReadingTextSchema.parse(item);

   const paragraphs = [...readingText.paragraphs].sort(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
   );
   for (const paragraph of paragraphs) {
    if (!paragraph.zh.trim() || !paragraph.vi.trim()) continue;
    segments.push({
     id: `${item.id}:${paragraph.id}`,
     order,
     zh: paragraph.zh,
     pinyin: paragraph.pinyin,
     vi: paragraph.vi,
    });
    order += 1;
   }

   if (paragraphs.length === 0 && readingText.text.trim() && readingText.vi.trim()) {
    segments.push({
     id: item.id,
     order,
     zh: readingText.text,
     pinyin: readingText.pinyin,
     vi: readingText.vi,
    });
    order += 1;
   }
  }
 }

 return orderedTranslationSegments(segments);
}
