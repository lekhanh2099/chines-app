import { z } from "zod";
import {
 LISTENING_CATEGORIES,
 LISTENING_ITEM_TYPES,
 LISTENING_EXERCISE_TYPES,
} from "./listening.types.ts";

const optionalTrimmedText = z.string().trim().min(1).optional();
const itemTypeSchema = z.enum(LISTENING_ITEM_TYPES);

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
