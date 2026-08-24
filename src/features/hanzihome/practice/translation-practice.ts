import { z } from "zod";

import type { HanyuLesson } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { ReadingTextItemSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import { calculateChineseAccuracy, calculateTranslationSimilarity } from "./text-comparison";

const lessonPracticeReadingTextSchema = ReadingTextItemSchema.pick({
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

type LessonPracticeSegment = {
 id: string;
 order: number;
 zh: string;
 pinyin: string;
 vi: string;
};

function lessonPracticeSegmentsFromLesson(sourceLesson: HanyuLesson | undefined) {
 if (!sourceLesson) return [];

 const segments: LessonPracticeSegment[] = [];
 let order = 1;

 const appendSegment = ({
  id,
  zh,
  pinyin,
  vi,
 }: {
  id: string;
  zh: string;
  pinyin: string;
  vi: string;
 }) => {
  if (!zh.trim()) return;
  segments.push({ id, order, zh, pinyin, vi });
  order += 1;
 };

 for (const section of sourceLesson.lesson.sections.toSorted(
  (left, right) => left.order - right.order || left.id.localeCompare(right.id),
 )) {
  if (section.type === "text") {
   for (const block of section.blocks.toSorted(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
   )) {
    if (block.type === "text_narrative") {
     const paragraphs = block.paragraphs.toSorted(
      (left, right) => left.order - right.order || left.id.localeCompare(right.id),
     );
     const lines = paragraphs.length > 0 ? paragraphs : block.lines;
     for (const line of lines) {
      appendSegment({
       id: `${section.id}:${block.id}:${line.id}`,
       zh: line.zh,
       pinyin: line.pinyin,
       vi: line.vi,
      });
     }
     continue;
    }

    const scenes = block.scenes.toSorted(
     (left, right) => left.order - right.order || left.id.localeCompare(right.id),
    );
    const lines = scenes.length > 0 ? scenes.flatMap((scene) => scene.lines) : block.lines;
    for (const line of lines) {
     appendSegment({
      id: `${section.id}:${block.id}:${line.id}`,
      zh: line.zh,
      pinyin: line.pinyin,
      vi: line.vi,
     });
    }
   }
   continue;
  }

  if (section.type !== "reading") continue;

  const readingItems = section.items.toSorted(
   (left, right) => left.order - right.order || left.id.localeCompare(right.id),
  );
  for (const item of readingItems) {
   if (item.type !== "reading_text") continue;
   const readingText = lessonPracticeReadingTextSchema.parse(item);

   const paragraphs = readingText.paragraphs.toSorted(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
   );
   for (const paragraph of paragraphs) {
    appendSegment({
     id: `${section.id}:${item.id}:${paragraph.id}`,
     zh: paragraph.zh,
     pinyin: paragraph.pinyin,
     vi: paragraph.vi,
    });
   }

   if (paragraphs.length === 0) {
    appendSegment({
     id: `${section.id}:${readingText.id}`,
     zh: readingText.text,
     pinyin: readingText.pinyin,
     vi: readingText.vi,
    });
   }
  }
 }

 return segments;
}

export function translationSegmentsFromLesson(sourceLesson: HanyuLesson | undefined) {
 return lessonPracticeSegmentsFromLesson(sourceLesson)
  .filter((segment) => segment.vi.trim())
  .map((segment) => translationSegmentSchema.parse(segment));
}

export function ttsStudioTextFromLesson(sourceLesson: HanyuLesson | undefined): string {
 return lessonPracticeSegmentsFromLesson(sourceLesson)
  .map((segment) => segment.zh.trim())
  .filter(Boolean)
  .join("\n");
}
