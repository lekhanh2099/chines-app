import { z } from "zod";

import { JsonObjectSchema } from "@/types/json";

const sourceSchema = z.enum(["seed", "custom"]);
const publicationStatusSchema = z.enum(["draft", "published", "archived"]);
const readerKindSchema = z.enum(["core", "mock", "reinforcement"]);
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

const readerAnalysisSchema = z.strictObject({
 mainIdeaVi: z.string(),
 paragraphStructureVi: z.array(z.string()),
 logicChainVi: z.array(z.string()),
 trapsVi: z.array(z.string()),
 keywordsZh: z.array(z.string()),
});

const readerSummarySchema = z.strictObject({
 modelZh: z.string(),
 rubricVi: z.array(z.string()),
});

const readerAnswerStateSchema = z.strictObject({
 answer: z.string(),
 score: z.number().min(0).max(1).nullable(),
 completed: z.boolean(),
 responseMs: z.number().int().nonnegative().nullable(),
});
const readerAnswersSchema = z.record(z.string().min(1), readerAnswerStateSchema);

export const readerDocumentRowSchema = z.strictObject({
 id: z.string().min(1),
 lesson_id: z.string().min(1),
 owner_id: z.uuid().nullable(),
 source: sourceSchema,
 publication_status: publicationStatusSchema,
 kind: readerKindSchema,
 slug: z.string().min(1),
 unit_id: z.string().nullable(),
 reading_number: z.number().int().positive().nullable(),
 title_zh: z.string().min(1),
 title_pinyin: z.string(),
 title_vi: z.string(),
 genre_vi: z.string(),
 objectives_vi: z.array(z.string()),
 analysis: readerAnalysisSchema,
 summary: readerSummarySchema,
 source_metadata: JsonObjectSchema,
 schema_version: z.string().min(1),
 imported_at: z.iso.datetime({ offset: true }).nullable(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
 deleted_at: z.iso.datetime({ offset: true }).nullable(),
});

export const readerParagraphRowSchema = z.strictObject({
 id: z.string().min(1),
 document_id: z.string().min(1),
 source: sourceSchema,
 paragraph_order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
 role_vi: z.string(),
 source_version: z.number().int().positive(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const readerVocabularyLinkRowSchema = z.strictObject({
 id: z.string().min(1),
 document_id: z.string().min(1),
 vocab_item_id: z.string().min(1),
 source: sourceSchema,
 item_order: z.number().int().positive(),
 meaning_in_context_vi: z.string(),
 source_ref: z.string(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

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

const readerExerciseItemContractSchema = z.discriminatedUnion("item_type", [
 z.strictObject({
  item_type: z.literal("note"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   scoring: z.literal("none"),
  }),
 }),
 z.strictObject({
  item_type: z.literal("multiple_choice"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).min(2),
   answer: z.string().min(1),
   scoring: z.literal("auto"),
  }),
 }),
 z.strictObject({
  item_type: z.literal("true_false"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   answer: z.enum(["", "True", "False"]),
   scoring: z.enum(["auto", "manual"]),
  }),
 }),
 z.strictObject({
  item_type: z.literal("short_answer"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   answerZh: z.string().min(1),
   answerVi: z.string().min(1),
   scoring: z.literal("manual"),
  }),
 }),
 z.strictObject({
  item_type: z.literal("answer_review"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   answer: z.string(),
   scoring: z.literal("review"),
  }),
 }),
 z.strictObject({
  item_type: z.literal("fill_blank"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   answerZh: z.string().min(1),
   scoring: z.literal("auto"),
  }),
 }),
 z.strictObject({
  item_type: z.literal("discussion"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema).length(0),
   scoring: z.literal("manual"),
  }),
 }),
]);

export function parseReaderExerciseItemRow(value: z.input<typeof readerExerciseItemRowSchema>) {
 const row = readerExerciseItemRowSchema.parse(value);
 const contract = readerExerciseItemContractSchema.parse({
  item_type: row.item_type,
  payload: row.payload,
 });
 return { ...row, item_type: contract.item_type, payload: contract.payload };
}

export const readerProgressRowSchema = z.strictObject({
 user_id: z.uuid(),
 document_id: z.string().min(1),
 show_pinyin: z.boolean(),
 show_meaning: z.boolean(),
 completed: z.boolean(),
 summary_text: z.string(),
 answers: readerAnswersSchema,
 revision: z.number().int().nonnegative(),
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

export const readerAnnotationRowSchema = z
 .strictObject({
  id: z.uuid(),
  user_id: z.uuid(),
  document_id: z.string().min(1),
  paragraph_id: z.string().min(1).nullable(),
  asset_id: z.string().min(1).nullable(),
  annotation_type: z.enum(["highlight", "underline", "note", "ink"]),
  page_number: z.number().int().positive().nullable(),
  start_offset: z.number().int().nonnegative().nullable(),
  end_offset: z.number().int().positive().nullable(),
  selected_text: z.string(),
  note_text: z.string(),
  color: z.enum(["yellow", "green", "blue", "pink"]),
  payload: JsonObjectSchema,
  revision: z.number().int().nonnegative(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
  deleted_at: z.iso.datetime({ offset: true }).nullable(),
 })
 .superRefine((value, context) => {
  if (value.paragraph_id === null && value.asset_id === null) {
   context.addIssue({
    code: "custom",
    path: ["paragraph_id"],
    message: "Annotation target is required.",
   });
  }
  if ((value.start_offset === null) !== (value.end_offset === null)) {
   context.addIssue({
    code: "custom",
    path: ["start_offset"],
    message: "Annotation range must be complete.",
   });
  }
  if (
   value.start_offset !== null &&
   value.end_offset !== null &&
   value.end_offset <= value.start_offset
  ) {
   context.addIssue({
    code: "custom",
    path: ["end_offset"],
    message: "Annotation range must be ordered.",
   });
  }
 });

export type ReaderDocumentRow = z.output<typeof readerDocumentRowSchema>;
export type ReaderParagraphRow = z.output<typeof readerParagraphRowSchema>;
export type ReaderVocabularyLinkRow = z.output<typeof readerVocabularyLinkRowSchema>;
export type ReaderExerciseGroupRow = z.output<typeof readerExerciseGroupRowSchema>;
export type ReaderExerciseItemRow = z.output<typeof readerExerciseItemRowSchema>;
export type ReaderProgressRow = z.output<typeof readerProgressRowSchema>;
export type ReaderAnnotationRow = z.output<typeof readerAnnotationRowSchema>;
