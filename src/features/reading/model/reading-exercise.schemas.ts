import { z } from "zod";
import { JsonObjectSchema } from "@/types/json";
import { readerDocumentRowSchema } from "./reading-resource.schemas";
const sourceSchema = readerDocumentRowSchema.shape.source;
export const readerExerciseGroupTypeSchema = z.enum([
 "notes",
 "vocabulary_review",
 "true_false",
 "multiple_choice",
 "short_answer",
 "fill_blank",
 "discussion",
 "mock_questions",
]);
export const readerExerciseItemTypeSchema = z.enum([
 "note",
 "multiple_choice",
 "true_false",
 "short_answer",
 "answer_review",
 "fill_blank",
 "discussion",
]);

export const readerExerciseGroupRowSchema = z.strictObject({
 id: z.string().min(1),
 document_id: z.string().min(1),
 source: sourceSchema,
 exercise_order: z.number().int().positive(),
 exercise_type: readerExerciseGroupTypeSchema,
 title_zh: z.string(),
 title_vi: z.string(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const readerExerciseItemRowSchema = z.strictObject({
 id: z.string().min(1),
 group_id: z.string().min(1),
 source: sourceSchema,
 item_order: z.number().int().positive(),
 item_type: readerExerciseItemTypeSchema,
 payload: JsonObjectSchema,
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

const readerExerciseOptionSchema = z.strictObject({
 key: z.string().min(1),
 textZh: z.string(),
 textVi: z.string(),
});

const readerExercisePayloadSchema = z.strictObject({
 promptZh: z.string(),
 promptVi: z.string(),
 pinyin: z.string(),
 options: z.array(readerExerciseOptionSchema),
 answer: z.string(),
 answerZh: z.string(),
 answerVi: z.string(),
 scoring: z.enum(["none", "auto", "manual", "review"]),
 answerSource: z.string().min(1),
 explanationVi: z.string(),
});

export const parsedReaderExerciseItemRowSchema = z.discriminatedUnion("item_type", [
 readerExerciseItemRowSchema.extend({
  item_type: z.literal("note"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   scoring: z.literal("none"),
  }),
 }),
 readerExerciseItemRowSchema.extend({
  item_type: z.literal("multiple_choice"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema),
   answer: z.string().min(1),
   scoring: z.literal("auto"),
  }),
 }),
 readerExerciseItemRowSchema.extend({
  item_type: z.literal("true_false"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema),
   answer: z.enum(["", "True", "False"]),
   scoring: z.enum(["auto", "manual"]),
  }),
 }),
 readerExerciseItemRowSchema.extend({
  item_type: z.literal("short_answer"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   answerZh: z.string().min(1),
   answerVi: z.string().min(1),
   scoring: z.literal("manual"),
  }),
 }),
 readerExerciseItemRowSchema.extend({
  item_type: z.literal("answer_review"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema),
   answer: z.string(),
   scoring: z.literal("review"),
  }),
 }),
 readerExerciseItemRowSchema.extend({
  item_type: z.literal("fill_blank"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   answerZh: z.string().min(1),
   scoring: z.literal("auto"),
  }),
 }),
 readerExerciseItemRowSchema.extend({
  item_type: z.literal("discussion"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   scoring: z.literal("manual"),
  }),
 }),
]);

export function parseReaderExerciseItemRow(value: z.input<typeof readerExerciseItemRowSchema>) {
 return parsedReaderExerciseItemRowSchema.parse(value);
}

export type ReaderExerciseGroupRow = z.output<typeof readerExerciseGroupRowSchema>;
export type ReaderExerciseItemRow = z.output<typeof readerExerciseItemRowSchema>;
