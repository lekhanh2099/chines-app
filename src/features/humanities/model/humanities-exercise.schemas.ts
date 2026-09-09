import { z } from "zod";
import { parsedReaderExerciseItemRowSchema } from "@/features/reading/model/reading-exercise.schemas";
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

const humanitiesExerciseFields = z.strictObject({
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

export const parsedHumanitiesExerciseItemRowSchema = z.discriminatedUnion("item_type", [
 parsedReaderExerciseItemRowSchema.options[0].extend({
  payload: parsedReaderExerciseItemRowSchema.options[0].shape.payload.extend(
   humanitiesExerciseFields.shape,
  ),
 }),
 parsedReaderExerciseItemRowSchema.options[1].extend({
  payload: parsedReaderExerciseItemRowSchema.options[1].shape.payload.extend(
   humanitiesExerciseFields.shape,
  ),
 }),
 parsedReaderExerciseItemRowSchema.options[2].extend({
  payload: parsedReaderExerciseItemRowSchema.options[2].shape.payload.extend(
   humanitiesExerciseFields.shape,
  ),
 }),
 parsedReaderExerciseItemRowSchema.options[3].extend({
  payload: parsedReaderExerciseItemRowSchema.options[3].shape.payload.extend(
   humanitiesExerciseFields.shape,
  ),
 }),
 parsedReaderExerciseItemRowSchema.options[4].extend({
  payload: parsedReaderExerciseItemRowSchema.options[4].shape.payload.extend(
   humanitiesExerciseFields.shape,
  ),
 }),
 parsedReaderExerciseItemRowSchema.options[5].extend({
  payload: parsedReaderExerciseItemRowSchema.options[5].shape.payload.extend(
   humanitiesExerciseFields.shape,
  ),
 }),
 parsedReaderExerciseItemRowSchema.options[6].extend({
  payload: parsedReaderExerciseItemRowSchema.options[6].shape.payload.extend(
   humanitiesExerciseFields.shape,
  ),
 }),
]);
