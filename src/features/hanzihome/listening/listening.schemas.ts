import { z } from "zod";
import {
 LISTENING_CATEGORIES,
 LISTENING_ITEM_TYPES,
 type ListeningItem,
 type ListeningOption,
 LISTENING_EXERCISE_TYPES,
} from "./listening.types.ts";

type RefinementContext = {
 addIssue(issue: { code: "custom"; message: string; path: PropertyKey[] }): void;
};

const optionalTrimmedText = z.string().trim().min(1).optional();
const itemTypeSchema = z.enum(LISTENING_ITEM_TYPES);

export const listeningCourseSchema = z.object({
 id: z.string().min(1),
 slug: z.string().min(1),
 title: z.string().min(1),
 subtitle: optionalTrimmedText,
 type: z.literal("listening"),
 order: z.number().int().nonnegative(),
});

export const listeningBookSchema = z.object({
 id: z.string().min(1),
 courseId: z.string().min(1),
 title: z.string().min(1),
 shortTitle: optionalTrimmedText,
 order: z.number().int().positive(),
});

export const listeningLessonSchema = z.object({
 id: z.string().min(1),
 bookId: z.string().min(1),
 lessonNumber: z.number().int().positive(),
 order: z.number().int().positive(),
 titleZh: z.string().trim().min(1),
});

export const listeningCatalogSchema = z.object({
 course: listeningCourseSchema,
 books: z.array(listeningBookSchema).min(1),
 lessons: z.array(listeningLessonSchema).min(1),
});

export const listeningExerciseSectionSchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 category: z.enum(LISTENING_CATEGORIES),
 instructionZh: optionalTrimmedText,
 instructionVi: optionalTrimmedText,
});

export const listeningTranscriptSpeakerSchema = z.object({
 id: z.string().min(1),
 labelZh: z.string().min(1),
 labelVi: z.string().min(1),
 voice: z.enum(["male", "female", "neutral"]),
});

export const listeningTranscriptLineSchema = z.object({
 order: z.number().int().positive(),
 speakerId: z.string().min(1),
 zh: z.string().trim().min(1),
 pinyin: z.string().trim().min(1),
 vi: optionalTrimmedText,
});

export const listeningTranscriptTextSchema = z.object({
 zh: z.string().trim().min(1),
 pinyin: z.string().trim().min(1),
 vi: optionalTrimmedText,
});

export const listeningTranscriptSchema = z
 .object({
  mode: z.enum(["dialogue", "monologue"]),
  speakers: z.array(listeningTranscriptSpeakerSchema).min(1),
  lines: z.array(listeningTranscriptLineSchema).min(1),
  full: listeningTranscriptTextSchema,
 })
 .superRefine((value, ctx) => {
  const speakerIds = new Set(value.speakers.map((speaker) => speaker.id));
  value.lines.forEach((line, index) => {
   if (!speakerIds.has(line.speakerId)) {
    ctx.addIssue({
     code: "custom",
     message: "speakerId không tồn tại trong speakers",
     path: ["lines", index, "speakerId"],
    });
   }
  });
 });

export const listeningOptionSchema = z.object({
 key: z.string().trim().min(1),
 textZh: z.string().trim().min(1),
 textVi: optionalTrimmedText,
});

export const listeningAnswerSchema = z.discriminatedUnion("type", [
 z.object({ type: z.literal("choice"), value: z.string().trim().min(1) }),
 z.object({ type: z.literal("boolean"), value: z.boolean() }),
 z.object({
  type: z.literal("text"),
  accepted: z.array(z.string().trim().min(1)).min(1),
 }),
 z.object({
  type: z.literal("matching"),
  pairs: z
   .array(
    z.object({
     left: z.string().min(1),
     right: z.string().min(1),
    }),
   )
   .min(1),
 }),
]);

export const listeningItemSchema = z
 .object({
  id: z.string().min(1),
  sectionId: z.string().min(1),
  order: z.number().int().positive(),
  type: itemTypeSchema,
  transcript: listeningTranscriptSchema.optional(),
  promptZh: optionalTrimmedText,
  options: z.array(listeningOptionSchema).min(2).optional(),
  answer: listeningAnswerSchema.optional(),
  explanationVi: optionalTrimmedText,
 })
 .superRefine((item: ListeningItem, ctx: RefinementContext) => {
  if (!item.transcript && !item.promptZh && !item.options?.length) {
   ctx.addIssue({
    code: "custom",
    message: "Mỗi item phải có transcript, promptZh hoặc options",
    path: ["promptZh"],
   });
  }

  const answer = item.answer;
  if (
   answer?.type === "choice" &&
   !item.options?.some((option: ListeningOption) => option.key === answer.value)
  ) {
   ctx.addIssue({
    code: "custom",
    message: "Đáp án choice không khớp options",
    path: ["answer"],
   });
  }
 });

export const listeningVocabularyItemSchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 word: z.string().trim().min(1),
 pinyin: z.string().trim().min(1),
 meaningVi: z.string().trim().min(1),
 pos: optionalTrimmedText,
 isSeparable: z.literal(true).optional(),
});

const itemFileMapSchema = z.record(z.string(), z.string().min(1)).superRefine((value, ctx) => {
 const allowed = new Set<string>(LISTENING_ITEM_TYPES);
 for (const key of Object.keys(value)) {
  if (!allowed.has(key)) {
   ctx.addIssue({
    code: "custom",
    message: `Item type không hợp lệ: ${key}`,
    path: [key],
   });
  }
 }
});

const itemCountMapSchema = z
 .record(z.string(), z.number().int().nonnegative())
 .superRefine((value, ctx) => {
  const allowed = new Set<string>(LISTENING_ITEM_TYPES);
  for (const key of Object.keys(value)) {
   if (!allowed.has(key)) {
    ctx.addIssue({
     code: "custom",
     message: `Item count type không hợp lệ: ${key}`,
     path: [key],
    });
   }
  }
 });

export const listeningLessonCountsSchema = z.object({
 sections: z.number().int().nonnegative(),
 items: z.number().int().nonnegative(),
 vocabulary: z.number().int().nonnegative(),
 itemsByType: itemCountMapSchema,
});

export const listeningLessonManifestSchema = z.object({
 schemaVersion: z.literal("3.0.0"),
 lessonId: z.string().min(1),
 bookId: z.string().min(1),
 lessonNumber: z.number().int().positive(),
 files: z.object({
  sections: z.string().min(1),
  vocabulary: z.string().min(1),
  items: itemFileMapSchema,
 }),
 counts: listeningLessonCountsSchema,
});

export const listeningLessonShardRefSchema = z.object({
 lessonId: z.string().min(1),
 bookId: z.string().min(1),
 lessonNumber: z.number().int().positive(),
 manifest: z.string().min(1),
 counts: listeningLessonCountsSchema,
});

export const listeningDatasetManifestSchema = z.object({
 schemaVersion: z.literal("3.0.0"),
 datasetId: z.string().min(1),
 courseId: z.string().min(1),
 catalog: z.string().min(1),
 lessons: z.array(listeningLessonShardRefSchema).min(1),
 totals: z.object({
  books: z.number().int().nonnegative(),
  lessons: z.number().int().nonnegative(),
  sections: z.number().int().nonnegative(),
  items: z.number().int().nonnegative(),
  vocabulary: z.number().int().nonnegative(),
  itemsByType: itemCountMapSchema,
 }),
});

export const listeningExerciseTypeSchema = z.enum(LISTENING_EXERCISE_TYPES);

const listeningRuntimeOptionSchema = listeningOptionSchema.extend({
 stress: z.array(z.string().min(1)).optional(),
});

const listeningMatchingSideSchema = z.object({
 id: z.string().min(1),
 textZh: z.string().min(1),
 textVi: optionalTrimmedText,
});

export const listeningItemMetadataSchema = z.object({
 variant: listeningExerciseTypeSchema.optional(),
 promptVi: optionalTrimmedText,
 sampleAnswerZh: optionalTrimmedText,
 sampleAnswerVi: optionalTrimmedText,
 printedPinyin: optionalTrimmedText,
 heardZh: optionalTrimmedText,
 heardPinyin: optionalTrimmedText,
 pinyin: optionalTrimmedText,
 translationVi: optionalTrimmedText,
 groupId: optionalTrimmedText,
 groupTitleZh: optionalTrimmedText,
 groupTitleVi: optionalTrimmedText,
 promptParts: z.tuple([z.string(), z.string()]).optional(),
 acceptedAnswers: z.array(z.string().min(1)).optional(),
 answerDisplay: optionalTrimmedText,
 left: z.array(listeningMatchingSideSchema).optional(),
 right: z.array(listeningMatchingSideSchema).optional(),
});

export const listeningRuntimeItemSchema = z.object({
 id: z.string().min(1),
 sectionId: z.string().min(1),
 order: z.number().int().positive(),
 type: itemTypeSchema,
 transcript: listeningTranscriptSchema.optional(),
 promptZh: optionalTrimmedText,
 options: z.array(listeningRuntimeOptionSchema).default([]),
 answer: listeningAnswerSchema.optional(),
 explanationVi: optionalTrimmedText,
 metadata: listeningItemMetadataSchema.default({}),
 editMeta: z
  .object({
   entityType: z.literal("listening_item"),
   entityId: z.string().min(1),
   dbId: z.string().min(1),
   updatedAt: z.iso.datetime({ offset: true }),
   parentEntityType: z.string().optional(),
   parentEntityId: z.string().optional(),
   order: z.number().int().positive().optional(),
   orderField: z.string().optional(),
  })
  .optional(),
});

export const updateListeningItemChangesSchema = z
 .strictObject({
  prompt_zh: z.string().trim().min(1).nullable().optional(),
  transcript: listeningTranscriptSchema.nullable().optional(),
  options: z.array(listeningRuntimeOptionSchema).optional(),
  answer: listeningAnswerSchema.nullable().optional(),
  explanation_vi: z.string().trim().min(1).nullable().optional(),
  metadata: listeningItemMetadataSchema.optional(),
 })
 .refine((value) => Object.keys(value).length > 0, "At least one changed field is required");

export const listeningRuntimeSectionSchema = z.object({
 id: z.string().min(1),
 sourceSectionId: z.string().min(1),
 order: z.number().int().positive(),
 category: z.enum(LISTENING_CATEGORIES),
 titleZh: z.string().min(1),
 titleVi: optionalTrimmedText,
 exerciseType: listeningExerciseTypeSchema,
 transcript: listeningTranscriptSchema.optional(),
 suggestionsZh: z.array(z.string().min(1)).default([]),
});

export const listeningLessonBundleSchema = z.object({
 lesson: z.object({
  id: z.string().min(1),
  titleZh: z.string().min(1),
  titleVi: optionalTrimmedText,
 }),
 sections: z.array(listeningRuntimeSectionSchema),
 items: z.array(listeningRuntimeItemSchema),
});
