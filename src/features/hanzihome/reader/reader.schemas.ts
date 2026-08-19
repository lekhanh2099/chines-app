import { z } from "zod";

import { JsonObjectSchema } from "@/types/json";

const sourceSchema = z.enum(["seed", "custom"]);
const publicationStatusSchema = z.enum(["draft", "published", "archived"]);
export const readerKindSchema = z.enum([
 "core",
 "mock",
 "reinforcement",
 "hsk",
 "daily",
 "personal",
 "humanities",
]);
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

export const readerHumanitiesEvaluationSchema = z.strictObject({
 mode: z.enum(["translation", "interpreting"]),
 direction: z.enum(["zh-vi", "vi-zh"]),
 informationUnits: z
  .array(
   z.strictObject({
    id: z.string().min(1),
    type: z.string().min(1),
    canonicalMeaningVi: z.string().min(1),
    required: z.boolean(),
    weight: z.number().positive(),
    acceptedRealizations: z.array(z.string().min(1)).min(1),
   }),
  )
  .min(1),
 rubric: z
  .array(
   z.strictObject({
    id: z.string().min(1),
    labelVi: z.string().min(1),
    weight: z.number().positive(),
    deterministic: z.boolean(),
   }),
  )
  .min(1),
 references: z.array(z.strictObject({ id: z.string().min(1), text: z.string().min(1) })).min(1),
 preparationSeconds: z.number().int().nonnegative().nullable(),
 maxRecordingSeconds: z.number().int().positive().nullable(),
 replayPolicy: z.string().min(1).nullable(),
 replayLimit: z.number().int().nonnegative().nullable(),
 noteTakingAllowed: z.boolean().nullable(),
});
export type ReaderHumanitiesEvaluation = z.output<typeof readerHumanitiesEvaluationSchema>;

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

export const readerAnswerStateSchema = z.strictObject({
 answer: z.string(),
 score: z.number().min(0).max(1).nullable(),
 completed: z.boolean(),
 responseMs: z.number().int().nonnegative().nullable(),
});
export const readerAnswersSchema = z.record(z.string().min(1), readerAnswerStateSchema);
export type ReaderAnswerState = z.output<typeof readerAnswerStateSchema>;

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

export const readerVocabularyRowSchema = z.strictObject({
 id: z.string().min(1),
 word: z.string().min(1),
 pinyin: z.string(),
 meaning: z.string(),
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

export const readerAssetRowSchema = z.strictObject({
 id: z.string().min(1),
 document_id: z.string().min(1).nullable(),
 source: sourceSchema,
 asset_type: z.enum(["pdf", "audio", "image", "other"]),
 source_path: z.string().min(1),
 sha256: z.string().regex(/^[0-9a-f]{64}$/u),
 storage_bucket: z.string().min(1).nullable(),
 storage_path: z.string().min(1).nullable(),
 external_url: z
  .string()
  .regex(/^(?:https?:\/\/|\/)/u)
  .nullable(),
 mime_type: z.string().min(1).nullable(),
 rights_status: z.enum(["public-domain", "original", "licensed", "unknown", "blocked"]),
 redistribution_allowed: z.boolean(),
 metadata: JsonObjectSchema,
 created_at: z.iso.datetime({ offset: true }),
 updated_at: z.iso.datetime({ offset: true }),
});

const readerExerciseOptionSchema = z.strictObject({
 key: z.string().min(1),
 textZh: z.string(),
 textVi: z.string(),
});

const readerHumanitiesInformationUnitSchema = z.strictObject({
 id: z.string().min(1),
 segmentId: z.string().min(1).optional(),
 type: z.string().min(1),
 canonicalMeaningVi: z.string().min(1),
 required: z.boolean(),
 weight: z.number().positive(),
 acceptedRealizations: z.array(z.string().min(1)).min(1),
 evidenceSpanIds: z.array(z.string().min(1)).optional(),
});

const readerHumanitiesPracticeMetadataSchema = z.strictObject({
 direction: z.enum(["zh-vi", "vi-zh"]),
 sourceText: z.string().min(1).optional(),
 informationUnits: z.array(readerHumanitiesInformationUnitSchema).min(1),
 rubric: z.strictObject({
  dimensions: z.array(
   z.strictObject({
    id: z.string().min(1),
    labelVi: z.string().min(1),
    weight: z.number().positive(),
    deterministic: z.boolean(),
   }),
  ),
 }),
 references: z.array(z.strictObject({ id: z.string().min(1), text: z.string().min(1) })).min(1),
});

const readerHumanitiesGlossaryEntrySchema = z.strictObject({
 id: z.string().min(1),
 headword: z.string().min(1),
 pinyin: z.string().nullable(),
 meaningVi: z.string().min(1),
 noteVi: z.string().min(1),
 segmentIds: z.array(z.string().min(1)),
});

const readerHumanitiesPersonSchema = z.strictObject({
 id: z.string().min(1),
 nameZh: z.string().min(1),
 nameVi: z.string().min(1),
 roleVi: z.string().min(1),
});

export const readerHumanitiesAnnotationSchema = z.strictObject({
 id: z.string().min(1),
 segmentId: z.string().min(1),
 type: z.enum(["grammar", "allusion", "imagery", "prosody", "context", "translation-choice"]),
 titleVi: z.string().min(1),
 bodyVi: z.string().min(1),
 sourceIds: z.array(z.string()),
});

export const readerHumanitiesSourceSchema = z.strictObject({
 sourceId: z.string().min(1),
 sourceType: z.string().min(1),
 title: z.string().min(1),
 authorOrEditor: z.string().nullable(),
 publisherOrInstitution: z.string().nullable(),
 edition: z.string().nullable(),
 publicationYear: z.number().int().nullable(),
 pageOrSection: z.string().nullable(),
 stableLocator: z.string().nullable(),
 accessedAt: z.string().nullable(),
 language: z.string().min(1),
 notes: z.string(),
});

const readerHumanitiesClaimEvidenceSchema = z.strictObject({
 sourceId: z.string().min(1),
 locator: z.string().min(1),
 excerpt: z.string().nullable(),
 relation: z.enum(["supports", "contradicts", "contextualizes"]),
 note: z.string(),
});

export const readerHumanitiesClaimSchema = z.strictObject({
 id: z.string().min(1),
 type: z.enum(["fact", "interpretation", "contested-interpretation", "translation-choice"]),
 statementVi: z.string().min(1),
 statementZh: z.string().optional(),
 confidence: z.enum(["high", "medium", "low", "unresolved"]),
 evidence: z.array(readerHumanitiesClaimEvidenceSchema),
 alternatives: z.array(z.string()),
 reviewStatus: z.enum(["verified", "reviewed-opinion", "contested", "unresolved"]),
});

export const readerHumanitiesPoetrySchema = z.strictObject({
 form: z.string().min(1),
 dynastyOrPeriod: z.string().nullable(),
 author: readerHumanitiesPersonSchema.nullable(),
 lines: z
  .array(
   z.strictObject({
    segmentId: z.string().min(1),
    rhymeLabel: z.string().nullable(),
    caesura: z.array(z.number().int().positive()),
   }),
  )
  .min(1),
 rhyme: z.strictObject({ summaryVi: z.string().min(1), reviewed: z.literal(true) }).nullable(),
 parallelism: z.array(
  z.strictObject({
   leftSegmentId: z.string().min(1),
   rightSegmentId: z.string().min(1),
   noteVi: z.string().min(1),
  }),
 ),
 imagery: z.array(
  z.strictObject({
   id: z.string().min(1),
   segmentIds: z.array(z.string()).min(1),
   imageVi: z.string().min(1),
   functionVi: z.string().min(1),
  }),
 ),
 allusions: z.array(
  z.strictObject({
   id: z.string().min(1),
   segmentIds: z.array(z.string()).min(1),
   explanationVi: z.string().min(1),
   sourceIds: z.array(z.string()),
  }),
 ),
 interpretations: z
  .array(
   z.strictObject({
    id: z.string().min(1),
    labelVi: z.string().min(1),
    statementVi: z.string().min(1),
    evidenceIds: z.array(z.string()).min(1),
    confidence: z.enum(["high", "medium", "low", "unresolved"]),
   }),
  )
  .min(1),
});

export const readerHumanitiesHistorySchema = z.strictObject({
 periodVi: z.string().min(1),
 timeline: z
  .array(
   z.strictObject({
    id: z.string().min(1),
    dateLabel: z.string().min(1),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    titleVi: z.string().min(1),
    descriptionVi: z.string().min(1),
    actors: z.array(z.string()),
    places: z.array(z.string()),
    claimIds: z.array(z.string()),
    sourceIds: z.array(z.string()),
   }),
  )
  .min(1),
 actors: z.array(
  z.strictObject({
   id: z.string().min(1),
   nameVi: z.string().min(1),
   roleVi: z.string().min(1),
   perspectiveVi: z.string().min(1),
   confidence: z.enum(["high", "medium", "low", "unresolved"]),
   sourceIds: z.array(z.string()),
  }),
 ),
 perspectives: z
  .array(
   z.strictObject({
    id: z.string().min(1),
    labelVi: z.string().min(1),
    summaryVi: z.string().min(1),
    claimIds: z.array(z.string()),
   }),
  )
  .min(1),
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
 source: readerHumanitiesSourceSchema.optional(),
 glossary: z.array(readerHumanitiesGlossaryEntrySchema).optional(),
 annotations: z.array(readerHumanitiesAnnotationSchema).optional(),
 claims: z.array(readerHumanitiesClaimSchema).optional(),
 poetry: readerHumanitiesPoetrySchema.optional(),
 history: readerHumanitiesHistorySchema.optional(),
 translation: readerHumanitiesPracticeMetadataSchema.optional(),
 interpreting: readerHumanitiesPracticeMetadataSchema
  .extend({
   preparationSeconds: z.number().int().nonnegative(),
   maxRecordingSeconds: z.number().int().positive(),
   replayPolicy: z.string().min(1),
   replayLimit: z.number().int().nonnegative().nullable(),
   noteTakingAllowed: z.boolean(),
  })
  .optional(),
 evaluation: readerHumanitiesEvaluationSchema.optional(),
});

export const readerExerciseItemContractSchema = z.discriminatedUnion("item_type", [
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
   options: z.array(readerExerciseOptionSchema),
   answer: z.string().min(1),
   scoring: z.literal("auto"),
  }),
 }),
 z.strictObject({
  item_type: z.literal("true_false"),
  payload: readerExercisePayloadSchema.extend({
   options: z.array(readerExerciseOptionSchema),
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
   options: z.array(readerExerciseOptionSchema),
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

export const parsedReaderExerciseItemRowSchema = z.intersection(
 readerExerciseItemRowSchema,
 readerExerciseItemContractSchema,
);

export function parseReaderExerciseItemRow(value: z.input<typeof readerExerciseItemRowSchema>) {
 return parsedReaderExerciseItemRowSchema.parse(value);
}

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

export const readerPronunciationOverrideRowSchema = z
 .strictObject({
  id: z.uuid(),
  user_id: z.uuid(),
  document_id: z.string().min(1),
  paragraph_id: z.string().min(1),
  text: z.string().min(1),
  readings: z.array(z.string().regex(/^[a-zv]+[1-5]$/u)).min(1),
  scope: z.enum(["character-global", "phrase", "sentence-instance"]),
  sentence_text: z.string().nullable(),
  start_offset: z.number().int().nonnegative().nullable(),
  end_offset: z.number().int().positive().nullable(),
  revision: z.number().int().nonnegative(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
 })
 .superRefine((value, context) => {
  if (
   value.scope === "sentence-instance" &&
   (value.sentence_text === null || value.start_offset === null || value.end_offset === null)
  ) {
   context.addIssue({
    code: "custom",
    path: ["sentence_text"],
    message: "Sentence-instance override coordinates are required.",
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
    message: "Override range must be ordered.",
   });
  }
 });

export type ReaderDocumentRow = z.output<typeof readerDocumentRowSchema>;
export type ReaderParagraphRow = z.output<typeof readerParagraphRowSchema>;
export type ReaderVocabularyLinkRow = z.output<typeof readerVocabularyLinkRowSchema>;
export type ReaderExerciseGroupRow = z.output<typeof readerExerciseGroupRowSchema>;
export type ReaderExerciseItemRow = z.output<typeof readerExerciseItemRowSchema>;
export type ReaderAssetRow = z.output<typeof readerAssetRowSchema>;

export type ReaderPdfAsset = {
 id: string;
 title: string;
 resourceFile: string;
 pdfPage: number;
 printedPage: number;
 imageSrc: string;
};
export type ReaderAnnotationRow = z.output<typeof readerAnnotationRowSchema>;
export type ReaderPronunciationOverrideRow = z.output<typeof readerPronunciationOverrideRowSchema>;
