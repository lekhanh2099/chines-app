import { z } from "zod";

import {
 arrayValue,
 asRecord,
 stringValue,
} from "@/features/hanzihome/components/lesson-overview/utils";
import { fillQuestionBlank } from "@/features/hanzihome/components/lesson-overview/exercise-section/exercise-utils";
import { buildExerciseQuestionViewModel } from "@/features/hanzihome/components/lesson-overview/exercise-section/question-view-model";
import type { HanyuLesson } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { ReadingTextItemSchema } from "@/features/hanzihome/schemas/hanyu-lesson.schema";
import {
 splitDialogueTurn,
 stripLeadingEmoji,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { containsHanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import {
 analyzeContextualPronunciation,
 formatContextualReadingPinyin,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
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
 sourceLabel: z.string().min(1),
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
 sourceKey: string;
 sourceLabel: string;
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
  sourceKey,
  sourceLabel,
  zh,
  pinyin,
  vi,
 }: {
  id: string;
  sourceKey: string;
  sourceLabel: string;
  zh: string;
  pinyin: string;
  vi: string;
 }) => {
  if (!zh.trim()) return;
  segments.push({ id, order, sourceKey, sourceLabel, zh, pinyin, vi });
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
       sourceKey: section.id,
       sourceLabel: "Bài khóa",
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
      sourceKey: section.id,
      sourceLabel: "Bài khóa",
      zh: line.zh,
      pinyin: line.pinyin,
      vi: line.vi,
     });
    }
   }
   continue;
  }

  if (section.type === "reading") {
   const readingItems = section.items.toSorted(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
   );
   for (const item of readingItems) {
    if (item.type !== "reading_text") continue;
    const readingText = lessonPracticeReadingTextSchema.parse(item);
    const sourceLabel = `Bài đọc thêm · ${readingText.title}`;

    const paragraphs = readingText.paragraphs.toSorted(
     (left, right) => left.order - right.order || left.id.localeCompare(right.id),
    );
    for (const paragraph of paragraphs) {
     appendSegment({
      id: `${section.id}:${item.id}:${paragraph.id}`,
      sourceKey: `${section.id}:${item.id}`,
      sourceLabel,
      zh: paragraph.zh,
      pinyin: paragraph.pinyin,
      vi: paragraph.vi,
     });
    }

    if (paragraphs.length === 0) {
     appendSegment({
      id: `${section.id}:${readingText.id}`,
      sourceKey: `${section.id}:${item.id}`,
      sourceLabel,
      zh: readingText.text,
      pinyin: readingText.pinyin,
      vi: readingText.vi,
     });
    }
   }
   continue;
  }

  if (section.type !== "exercises") continue;

  for (const exercise of section.items.toSorted(
   (left, right) => left.order - right.order || left.id.localeCompare(right.id),
  )) {
   const exerciseRecord = asRecord(exercise);
   const sourceLabel = `Bài tập ${exercise.order} · ${exercise.title}`;
   const answerKey = arrayValue(exerciseRecord, "answer_key");
   const questions = arrayValue(exerciseRecord, "questions");

   for (const [index, question] of questions.entries()) {
    const model = buildExerciseQuestionViewModel({
     exerciseType: exercise.type,
     value: question,
     index,
     answerOverride: answerKey[index],
    });
    const selectedChoice = model.choices
     .map(asRecord)
     .find((choice) => stringValue(choice, "id") === model.answer);
    const selectedChoiceText = selectedChoice ? stringValue(selectedChoice, "text") : "";
    const resolvedAnswer =
     fillQuestionBlank(model.title, model.answer) || selectedChoiceText || model.answer;

    appendSegment({
     id: `${section.id}:${exercise.id}:${model.id || index + 1}`,
     sourceKey: `${section.id}:${exercise.id}`,
     sourceLabel,
     zh: resolvedAnswer,
     pinyin: "",
     vi: model.meaning,
    });
   }

   const model = asRecord(exerciseRecord.model);
   const modelAnswer = stringValue(model, "answer");
   if (modelAnswer) {
    appendSegment({
     id: `${section.id}:${exercise.id}:model`,
     sourceKey: `${section.id}:${exercise.id}`,
     sourceLabel,
     zh: modelAnswer,
     pinyin: "",
     vi: "",
    });
   }

   for (const [index, item] of arrayValue(exerciseRecord, "items").entries()) {
    const itemRecord = asRecord(item);
    for (const [lineIndex, line] of arrayValue(itemRecord, "expected_dialogue").entries()) {
     if (typeof line !== "string") continue;
     appendSegment({
      id: `${section.id}:${exercise.id}:item-${index + 1}:line-${lineIndex + 1}`,
      sourceKey: `${section.id}:${exercise.id}`,
      sourceLabel,
      zh: line,
      pinyin: "",
      vi: "",
     });
    }
   }

   for (const [index, part] of arrayValue(exerciseRecord, "parts").entries()) {
    const partRecord = asRecord(part);
    for (const [lineIndex, item] of arrayValue(partRecord, "items").entries()) {
     const itemRecord = asRecord(item);
     const text =
      stringValue(itemRecord, "text") ||
      [stringValue(itemRecord, "left"), stringValue(itemRecord, "right")]
       .filter(Boolean)
       .join("，");
     if (!text) continue;
     appendSegment({
      id: `${section.id}:${exercise.id}:part-${index + 1}:item-${lineIndex + 1}`,
      sourceKey: `${section.id}:${exercise.id}`,
      sourceLabel,
      zh: text,
      pinyin: stringValue(itemRecord, "pinyin"),
      vi: "",
     });
    }
   }

   for (const [index, dialogue] of arrayValue(exerciseRecord, "dialogues").entries()) {
    const dialogueRecord = asRecord(dialogue);
    const answersByBlankId = new Map(
     arrayValue(dialogueRecord, "sample_answers").map((answer) => {
      const answerRecord = asRecord(answer);
      return [stringValue(answerRecord, "blank_id"), stringValue(answerRecord, "answer")];
     }),
    );
    for (const [lineIndex, line] of arrayValue(dialogueRecord, "lines").entries()) {
     const lineRecord = asRecord(line);
     const answer = answersByBlankId.get(stringValue(lineRecord, "blank_id")) ?? "";
     const text = fillQuestionBlank(stringValue(lineRecord, "text"), answer) || answer;
     if (!text) continue;
     appendSegment({
      id: `${section.id}:${exercise.id}:dialogue-${index + 1}:line-${lineIndex + 1}`,
      sourceKey: `${section.id}:${exercise.id}`,
      sourceLabel,
      zh: text,
      pinyin: "",
      vi: "",
     });
    }
   }

   for (const [index, line] of arrayValue(exerciseRecord, "dialogue").entries()) {
    const lineRecord = asRecord(line);
    const text = stringValue(lineRecord, "text");
    if (!text) continue;
    appendSegment({
     id: `${section.id}:${exercise.id}:communication-${index + 1}`,
     sourceKey: `${section.id}:${exercise.id}`,
     sourceLabel,
     zh: text,
     pinyin: "",
     vi: "",
    });
   }

   for (const [index, task] of arrayValue(exerciseRecord, "practice_tasks").entries()) {
    const taskRecord = asRecord(task);
    for (const [answerIndex, answer] of arrayValue(taskRecord, "sample_answer").entries()) {
     if (typeof answer !== "string") continue;
     appendSegment({
      id: `${section.id}:${exercise.id}:task-${index + 1}:answer-${answerIndex + 1}`,
      sourceKey: `${section.id}:${exercise.id}`,
      sourceLabel,
      zh: answer,
      pinyin: "",
      vi: "",
     });
    }
   }
  }
 }

 return segments;
}

export function translationSegmentsFromLesson(sourceLesson: HanyuLesson | undefined) {
 return lessonPracticeSegmentsFromLesson(sourceLesson)
  .filter((segment) => segment.vi.trim())
  .map(({ id, order, sourceLabel, zh, pinyin, vi }) =>
   translationSegmentSchema.parse({
    id,
    order,
    sourceLabel,
    zh,
    pinyin,
    vi,
   }),
  );
}

export type DictationSource = {
 id: string;
 label: string;
 entries: Array<{ id: string; zh: string; pinyin: string; vi: string }>;
};

export function splitChineseSentences(text: string): string[] {
 const sentences: string[] = [];
 let current = "";
 for (const char of text) {
  current += char;
  if (char === "。" || char === "！" || char === "？" || char === "\n") {
   const trimmed = current.trim();
   if (trimmed) sentences.push(trimmed);
   current = "";
  }
 }
 const remaining = current.trim();
 if (remaining) sentences.push(remaining);
 return sentences.length > 0 ? sentences : [text.trim()];
}

export function dictationSourcesFromLesson(
 sourceLesson: HanyuLesson | undefined,
): DictationSource[] {
 const sources = new Map<string, DictationSource>();

 for (const segment of lessonPracticeSegmentsFromLesson(sourceLesson)) {
  const source = sources.get(segment.sourceKey) ?? {
   id: segment.sourceKey,
   label: segment.sourceLabel,
   entries: [],
  };
  source.entries.push({
   id: segment.id,
   zh: segment.zh,
   pinyin: segment.pinyin,
   vi: segment.vi,
  });
  sources.set(source.id, source);
 }

 return [...sources.values()];
}

export function dictationSourcesFromTextbook(
 lesson: TextbookLesson | null | undefined,
): DictationSource[] {
 if (!lesson) return [];
 const sources: DictationSource[] = [];

 const pairedTranslations = new Map<string, string>();
 const translationIndex = lesson.sections.findIndex((s) => s.title.includes("DỊCH BÀI KHÓA"));
 const sourceSection = translationIndex > 0 ? lesson.sections[translationIndex - 1] : undefined;
 const translationSection = translationIndex >= 0 ? lesson.sections[translationIndex] : undefined;
 if (sourceSection && translationSection) {
  sourceSection.blocks.forEach((block, index) => {
   const trans = translationSection.blocks[index];
   if (trans?.text) pairedTranslations.set(block.id, trans.text);
  });
 }

 for (const section of lesson.sections) {
  if (section.title.includes("DỊCH BÀI KHÓA")) continue;
  const label = stripLeadingEmoji(section.title) || section.title || "Bài khóa";
  const entries: Array<{ id: string; zh: string; pinyin: string; vi: string }> = [];

  for (const block of section.blocks) {
   if (block.type === "table") continue;
   const rawZh = block.text?.trim() ?? "";
   if (!rawZh) continue;

   const zhTurn = splitDialogueTurn(rawZh);
   const cleanZh = zhTurn.content || rawZh;
   if (!cleanZh.trim() || !containsHanziText(cleanZh)) continue;

   const rawVi = (block.translation ?? pairedTranslations.get(block.id) ?? "").trim();
   const viTurn = splitDialogueTurn(rawVi);
   const cleanVi = viTurn.content || rawVi;

   const sentences = splitChineseSentences(cleanZh);
   if (sentences.length <= 1) {
    const pinyin = formatContextualReadingPinyin(
     analyzeContextualPronunciation({ text: cleanZh, sourcePinyin: null }),
    );
    entries.push({
     id: block.id,
     zh: cleanZh,
     pinyin,
     vi: cleanVi,
    });
   } else {
    for (const [index, sentence] of sentences.entries()) {
     const trimmed = sentence.trim();
     if (!trimmed) continue;
     const pinyin = formatContextualReadingPinyin(
      analyzeContextualPronunciation({ text: trimmed, sourcePinyin: null }),
     );
     entries.push({
      id: `${block.id}:sentence-${index + 1}`,
      zh: trimmed,
      pinyin,
      vi: index === 0 ? cleanVi : "",
     });
    }
   }
  }

  if (entries.length > 0) {
   sources.push({
    id: section.id,
    label,
    entries,
   });
  }
 }

 return sources;
}

export function translationSegmentsFromTextbook(
 lesson: TextbookLesson | null | undefined,
): TranslationSegment[] {
 if (!lesson) return [];
 const segments: TranslationSegment[] = [];
 let order = 1;

 const pairedTranslations = new Map<string, string>();
 const translationIndex = lesson.sections.findIndex((s) => s.title.includes("DỊCH BÀI KHÓA"));
 const sourceSection = translationIndex > 0 ? lesson.sections[translationIndex - 1] : undefined;
 const translationSection = translationIndex >= 0 ? lesson.sections[translationIndex] : undefined;
 if (sourceSection && translationSection) {
  sourceSection.blocks.forEach((block, index) => {
   const trans = translationSection.blocks[index];
   if (trans?.text) pairedTranslations.set(block.id, trans.text);
  });
 }

 for (const section of lesson.sections) {
  if (section.title.includes("DỊCH BÀI KHÓA")) continue;
  const label = stripLeadingEmoji(section.title) || "Bài khóa";

  for (const block of section.blocks) {
   if (block.type === "table") continue;
   const rawZh = block.text?.trim() ?? "";
   const rawVi = (block.translation ?? pairedTranslations.get(block.id) ?? "").trim();
   if (!rawZh || !rawVi) continue;

   const zhTurn = splitDialogueTurn(rawZh);
   const viTurn = splitDialogueTurn(rawVi);
   const cleanZh = zhTurn.content || rawZh;
   const cleanVi = viTurn.content || rawVi;
   if (!cleanZh.trim() || !cleanVi.trim()) continue;

   const segmentPinyin = formatContextualReadingPinyin(
    analyzeContextualPronunciation({ text: cleanZh, sourcePinyin: null }),
   );

   segments.push(
    translationSegmentSchema.parse({
     id: block.id,
     order: order++,
     sourceLabel: label,
     zh: cleanZh,
     pinyin: segmentPinyin,
     vi: cleanVi,
    }),
   );
  }
 }

 return segments;
}
