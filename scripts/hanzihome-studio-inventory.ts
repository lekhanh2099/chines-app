import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

import { analyzeContextualPronunciation } from "../src/features/hanzihome/pronunciation/contextual-pronunciation.ts";

const jsonValueSchema = z.json();
type JsonValue = z.output<typeof jsonValueSchema>;

const paragraphSchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
 roleVi: z.string(),
});

const vocabularySchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 hanzi: z.string().min(1),
 pinyin: z.string(),
 meaningVi: z.string(),
 meaningInContextVi: z.string(),
 category: z.string(),
 categoryVi: z.string(),
 level: z.string(),
});

const exerciseOptionSchema = z.strictObject({
 key: z.string().min(1),
 textZh: z.string(),
 textVi: z.string(),
});

const exerciseItemSchema = z
 .strictObject({
  id: z.string().min(1),
  type: z.enum([
   "note",
   "multiple_choice",
   "true_false",
   "short_answer",
   "answer_review",
   "fill_blank",
   "discussion",
  ]),
  promptZh: z.string(),
  promptVi: z.string(),
  pinyin: z.string(),
  options: z.array(exerciseOptionSchema),
  answer: z.string(),
  answerZh: z.string(),
  answerVi: z.string(),
  scoring: z.enum(["none", "auto", "manual", "review"]),
  answerSource: z.string().min(1),
  explanationVi: z.string(),
 })
 .superRefine((item, context) => {
  if (item.type === "multiple_choice" && (item.options.length < 2 || item.answer.length === 0)) {
   context.addIssue({
    code: "custom",
    path: ["options"],
    message: "Multiple-choice items need options and an answer.",
   });
  }
  if (
   item.type === "true_false" &&
   item.answer !== "" &&
   item.answer !== "True" &&
   item.answer !== "False"
  ) {
   context.addIssue({
    code: "custom",
    path: ["answer"],
    message: "True/false items need a True or False answer.",
   });
  }
  if (item.type === "short_answer" && (item.answerZh.length === 0 || item.answerVi.length === 0)) {
   context.addIssue({
    code: "custom",
    path: ["answerZh"],
    message: "Short-answer items need Chinese and Vietnamese references.",
   });
  }
  if (item.type === "fill_blank" && item.answerZh.length === 0) {
   context.addIssue({
    code: "custom",
    path: ["answerZh"],
    message: "Fill-blank items need a Chinese answer.",
   });
  }
  const expectedScoring = {
   note: "none",
   multiple_choice: "auto",
   true_false: item.answer.length === 0 ? "manual" : "auto",
   short_answer: "manual",
   answer_review: "review",
   fill_blank: "auto",
   discussion: "manual",
  }[item.type];
  if (item.scoring !== expectedScoring) {
   context.addIssue({
    code: "custom",
    path: ["scoring"],
    message: `Unexpected scoring mode for ${item.type}.`,
   });
  }
 });

const exerciseGroupSchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 type: z.enum([
  "notes",
  "vocabulary_review",
  "true_false",
  "multiple_choice",
  "short_answer",
  "fill_blank",
  "discussion",
  "mock_questions",
 ]),
 titleZh: z.string(),
 titleVi: z.string(),
 items: z.array(exerciseItemSchema).min(1),
});

const readingAnalysisSchema = z.strictObject({
 mainIdeaVi: z.string(),
 paragraphStructureVi: z.array(z.string()),
 logicChainVi: z.array(z.string()),
 trapsVi: z.array(z.string()),
 keywordsZh: z.array(z.string()),
});

const readingSummarySchema = z.strictObject({
 modelZh: z.string(),
 rubricVi: z.array(z.string()),
});

const readingSentenceLabSchema = z.strictObject({
 id: z.string().min(1),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
 analysisVi: z.string().default(""),
});

const readingLessonSchema = z.object({
 id: z.string().min(1),
 slug: z.string().min(1),
 unitId: z.string().min(1).optional(),
 unitNumber: z.number().int().positive().optional(),
 readingNumber: z.number().int().nonnegative().optional(),
 readingLabelVi: z.string().default(""),
 kind: z.enum(["core", "mock"]).optional(),
 titleZh: z.string().min(1),
 titlePinyin: z.string().default(""),
 titleVi: z.string().default(""),
 genreVi: z.string().default(""),
 displayLabelVi: z.string().default(""),
 objectivesVi: z.array(z.string()).default([]),
 preReadingQuestionsVi: z.array(z.string()).default([]),
 paragraphs: z.array(paragraphSchema).min(1),
 vocabulary: z.array(vocabularySchema),
 exerciseGroups: z.array(exerciseGroupSchema),
 analysis: readingAnalysisSchema.default({
  mainIdeaVi: "",
  paragraphStructureVi: [],
  logicChainVi: [],
  trapsVi: [],
  keywordsZh: [],
 }),
 summary: readingSummarySchema.default({ modelZh: "", rubricVi: [] }),
 sentenceLab: z.array(readingSentenceLabSchema).default([]),
 sourceLabelVi: z.string().default(""),
 counts: z
  .strictObject({
   paragraphs: z.number().int().nonnegative(),
   vocabulary: z.number().int().nonnegative(),
   exercises: z.number().int().nonnegative(),
  })
  .default({ paragraphs: 0, vocabulary: 0, exercises: 0 }),
 difficultyVi: z.string().default(""),
 estimatedMinutes: z.number().int().positive().optional(),
});

const reinforcementLessonSchema = z.object({
 id: z.string().min(1),
 slug: z.string().min(1),
 kind: z.literal("reinforcement").default("reinforcement"),
 unitId: z.string().min(1).optional(),
 titleZh: z.string().min(1),
 titleVi: z.string().min(1),
 themeTitleZh: z.string().min(1),
 themeTitleVi: z.string().min(1),
 sourceBookTitleZh: z.string().min(1),
 sourceUnit: z.number().int().positive(),
 sourceReading: z.number().int().positive(),
 printedPage: z.number().int().positive(),
 pdfPage: z.number().int().positive(),
 resourceFile: z.string().min(1),
 skillFocusZh: z.array(z.string()).min(1),
 difficultyVi: z.string().min(1),
 estimatedMinutes: z.number().int().positive(),
 studyTasksVi: z.array(z.string()).min(1),
 noticeVi: z.string().min(1),
});

export const readingCourseSchema = z.object({
 units: z.array(
  z.strictObject({
   id: z.string().min(1),
   number: z.number().int().positive(),
   code: z.string().min(1),
   titleZh: z.string().min(1),
   titleVi: z.string().min(1),
   displayTitleVi: z.string().min(1),
   focusVi: z.string().min(1),
   shortVi: z.string().min(1),
  }),
 ),
 coreLessons: z.array(readingLessonSchema),
 mockLessons: z.array(readingLessonSchema),
 reinforcementLessons: z.array(reinforcementLessonSchema),
});

const hskReadingParagraphSchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 pinyin: z.string(),
 roleVi: z.string(),
 vi: z.string(),
 zh: z.string().min(1),
});

const hskReadingPassageSchema = z.strictObject({
 id: z.string().min(1),
 lessonNumber: z.number().int().positive(),
 lessonTitleVi: z.string().min(1),
 lessonTitleZh: z.string().min(1),
 level: z.union([z.literal(3), z.literal(4)]),
 paragraphs: z.array(hskReadingParagraphSchema).min(1),
 pinyinReviewStatus: z.enum(["pending-context-review", "context-reviewed"]),
 slug: z.string().min(1),
 sourceId: z.string().min(1),
 textNumber: z.number().int().positive(),
 titleVi: z.string().min(1),
 titleZh: z.string().min(1),
 volumeId: z.enum(["hsk3-independent-passages", "hsk4-upper", "hsk4-lower"]),
 volumeLabelVi: z.string().min(1),
 volumeLabelZh: z.string().min(1),
});

const hskReadingSourceSchema = z.strictObject({
 fileName: z.string().min(1),
 id: z.string().min(1),
 passageCount: z.number().int().positive(),
 pinyinReviewStatus: z.enum(["pending-context-review", "context-reviewed"]),
 sha256: z.string().regex(/^[a-f0-9]{64}$/u),
});

export const hskReadingSchema = z.strictObject({
 importedAt: z.string().min(1),
 passages: z.array(hskReadingPassageSchema).min(1),
 schemaVersion: z.literal("1.1.0"),
 sources: z.array(hskReadingSourceSchema).min(1),
 titleVi: z.string().min(1),
 titleZh: z.string().min(1),
});
export type StudioHskReading = z.output<typeof hskReadingSchema>;

const grammarExampleSchema = z.strictObject({
 zh: z.string(),
 pinyin: z.string(),
 vi: z.string(),
 note_vi: z.string(),
 origin: z.string(),
});

const grammarContrastSchema = z.strictObject({
 with: z.string().nullable(),
 summary_vi: z.string(),
});

const grammarCommonErrorSchema = z.strictObject({
 wrong: z.string(),
 right: z.string(),
 explanation_vi: z.string(),
});

const grammarSourceRefSchema = z.strictObject({
 primary: z.string(),
 pdf_page: z.number().int().positive(),
 grammar_no: z.number().int().positive(),
});

const grammarVerificationSchema = z.strictObject({
 status: z.string(),
 source_preserved: z.boolean(),
 source_examples_normalized: z.boolean(),
 notes: z.string(),
});

export const grammarItemSchema = z.strictObject({
 id: z.string().min(1),
 type: z.literal("grammar_point"),
 order: z.number().int().positive(),
 source_no: z.number().int().positive(),
 title: z.string().min(1),
 title_vi: z.string(),
 focus: z.array(z.string()),
 level: z.string().min(1),
 categories: z.array(z.string()),
 core: z.string(),
 structures: z.array(z.string()),
 usage_notes: z.array(z.string()),
 constraints: z.array(z.string()),
 contrasts: z.array(grammarContrastSchema),
 common_errors: z.array(grammarCommonErrorSchema),
 examples: z.record(z.string().min(1), z.array(grammarExampleSchema)),
 source_ref: grammarSourceRefSchema,
 verification: grammarVerificationSchema,
});

export const grammarDatasetSchema = z.object({
 schema_version: z.literal("hsk_grammar_v1.0.0"),
 dataset_id: z.string().min(1),
 level: z.string().regex(/^HSK[1-6]$/u),
 language: z.literal("zh-CN"),
 ui_language: z.literal("vi-VN"),
 item_count: z.number().int().positive(),
 items: z.array(grammarItemSchema).min(1),
});
export type StudioGrammarDataset = z.output<typeof grammarDatasetSchema>;

const dailyParagraphSchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
 roleVi: z.string(),
});

const dailyVocabularySchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 hanzi: z.string().min(1),
 pinyin: z.string(),
 meaningVi: z.string(),
 meaningInContextVi: z.string(),
 categoryVi: z.string(),
});

const dailyGrammarPointSchema = z.object({
 id: z.string().min(1),
 patternZh: z.string().min(1),
 explanationVi: z.string().min(1),
 evidenceSentenceZh: z.string().min(1),
});

const dailyQuestionSchema = z.object({
 id: z.string().min(1),
 type: z.string().min(1),
 promptZh: z.string().min(1),
 promptVi: z.string().min(1),
 answerZh: z.string().min(1),
 answerVi: z.string().min(1),
 evidenceParagraphIds: z.array(z.string().min(1)).min(1),
});

export const dailyReadingSchema = z.object({
 schemaVersion: z.string().min(1),
 id: z.string().min(1),
 publishedDate: z.iso.date(),
 createdAt: z.iso.datetime({ offset: true }),
 origin: z.string().min(1),
 releaseKind: z.string().min(1),
 titleZh: z.string().min(1),
 titlePinyin: z.string(),
 titleVi: z.string().min(1),
 whyWorthReadingVi: z.string().min(1),
 adaptationNoticeVi: z.string().min(1),
 topic: z.string().min(1),
 level: z.string().min(1),
 estimatedMinutes: z.number().int().positive(),
 paragraphs: z.array(dailyParagraphSchema).min(1),
 vocabulary: z.array(dailyVocabularySchema),
 grammarPoints: z.array(dailyGrammarPointSchema),
 questions: z.array(dailyQuestionSchema),
});
export type StudioDailyReading = z.output<typeof dailyReadingSchema>;
export const dictationSegmentSchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 pinyin: z.string(),
 vi: z.string(),
 zh: z.string().min(1),
});
export const dictationCourseSchema = z.strictObject({
 books: z.array(
  z.strictObject({
   id: z.string().min(1),
   level: z.number().int().positive(),
   titleVi: z.string().min(1),
   titleZh: z.string().min(1),
   volumes: z.array(
    z.strictObject({
     id: z.string().min(1),
     titleVi: z.string().min(1),
     titleZh: z.string().min(1),
     volume: z.number().int().positive(),
     lessons: z.array(
      z.strictObject({
       id: z.string().min(1),
       number: z.number().int().positive(),
       passageTranslationVi: z.string().nullable(),
       segments: z.array(dictationSegmentSchema).min(1),
       sourceId: z.string().min(1),
       titleVi: z.string().min(1),
       titleZh: z.string().min(1),
       translationScope: z.string().min(1),
      }),
     ),
    }),
   ),
  }),
 ),
 importedAt: z.iso.date(),
 schemaVersion: z.string().min(1),
 sources: z.array(z.json()).min(1),
});
export type StudioDictationCourse = z.output<typeof dictationCourseSchema>;

const humanitiesCourseSchema = z.object({ id: z.string().min(1), version: z.string().min(1) });
const humanitiesSegmentSchema = z.strictObject({
 id: z.string().min(1),
 order: z.number().int().positive(),
 textZh: z.string().min(1),
 pinyin: z.string().nullable(),
 lexicalGlossVi: z.string().nullable(),
 literalTranslationVi: z.string().nullable(),
 naturalTranslationVi: z.string().nullable(),
 alignmentStatus: z.string().min(1),
});
const humanitiesExerciseSchema = z.strictObject({
 id: z.string().min(1),
 type: z.string().min(1),
 promptVi: z.string().min(1),
 evidenceIds: z.array(z.string()),
 sampleAnswers: z.array(z.string()),
});
const humanitiesInformationUnitSchema = z.object({
 id: z.string().min(1),
 type: z.string().min(1),
 canonicalMeaningVi: z.string().min(1),
 required: z.boolean(),
 weight: z.number().positive(),
 acceptedRealizations: z.array(z.string().min(1)).min(1),
});
export const humanitiesPracticeSchema = z.object({
 direction: z.enum(["zh-vi", "vi-zh"]),
 sourceText: z.string().min(1).optional(),
 informationUnits: z.array(humanitiesInformationUnitSchema).min(1),
 rubric: z.object({
  dimensions: z.array(
   z.object({
    id: z.string().min(1),
    labelVi: z.string().min(1),
    weight: z.number().positive(),
    deterministic: z.boolean(),
   }),
  ),
 }),
 references: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(1),
});
export const humanitiesInterpretingSchema = humanitiesPracticeSchema.extend({
 preparationSeconds: z.number().int().nonnegative(),
 maxRecordingSeconds: z.number().int().positive(),
 replayPolicy: z.string().min(1),
 replayLimit: z.number().int().nonnegative().nullable(),
 noteTakingAllowed: z.boolean(),
});
export const humanitiesItemSchema = z.strictObject({
 id: z.string().min(1),
 slug: z.string().min(1),
 version: z.string().min(1),
 kind: z.string().min(1),
 status: z.string().min(1),
 titleZh: z.string().min(1),
 titleVi: z.string().min(1),
 subtitleZh: z.string().optional(),
 subtitleVi: z.string().optional(),
 difficulty: z.string().min(1),
 estimatedMinutes: z.number().int().positive(),
 tags: z.array(z.string()),
 source: z.json(),
 rights: z.object({
  redistributionAllowed: z.boolean(),
 }),
 review: z.json(),
 text: z.strictObject({
  script: z.string().min(1),
  originalText: z.string().min(1),
  normalizedText: z.string().min(1),
  segments: z.array(humanitiesSegmentSchema),
  variants: z.array(z.json()),
 }),
 glossary: z.array(z.json()),
 annotations: z.array(z.json()),
 claims: z.array(z.json()),
 exercises: z.array(humanitiesExerciseSchema),
 history: z.json().optional(),
 poetry: z.json().optional(),
 translation: z.union([humanitiesPracticeSchema, z.strictObject({})]).optional(),
 interpreting: humanitiesInterpretingSchema.optional(),
});

const personalPartExampleSchema = z.object({
 zh: z.string().min(1),
 vi: z.string().min(1),
});
export const personalPartSchema = z.object({
 id: z.string().min(1),
 formZh: z.string().min(1),
 labelVi: z.string().min(1).optional(),
 roleVi: z.string().min(1).optional(),
 coreMeaningVi: z.string().min(1),
 whyVi: z.string().min(1).optional(),
 recognitionVi: z.array(z.string().min(1)).optional(),
 boundariesVi: z.array(z.string().min(1)).optional(),
 examples: z.array(personalPartExampleSchema).default([]),
});
const personalLessonSchema = z.strictObject({
 id: z.string().min(1),
 knowledgeNodeId: z.string().min(1),
 order: z.number().int().positive(),
 titleVi: z.string().min(1),
 titleZh: z.string().min(1),
 levelVi: z.string().min(1),
 estimatedMinutes: z.number().int().positive(),
 reviewStatus: z.string().min(1),
 confidence: z.string().min(1),
 essentialQuestionVi: z.string().min(1),
 learningObjectivesVi: z.array(z.string().min(1)),
 keyIdeaVi: z.string().min(1),
 originNote: z.json(),
 decisionTreeVi: z.array(z.json()),
 concepts: z.array(z.json()),
 masteryChecklistVi: z.array(z.string().min(1)),
 sourceIds: z.array(z.string().min(1)),
 parts: z.array(z.json()),
 formulaFlows: z.array(z.json()),
});

export const personalCurriculumSchema = z.object({
 schemaVersion: z.number().int(),
 lessons: z.array(personalLessonSchema),
});
const personalExerciseOptionSchema = z.strictObject({
 id: z.string().min(1),
 text: z.string(),
});

const personalExerciseSchema = z.strictObject({
 id: z.string().min(1),
 knowledgeNodeId: z.string().min(1),
 lessonId: z.string().min(1),
 exerciseType: z.string().min(1),
 difficulty: z.number().int().positive(),
 order: z.number().int().positive(),
 promptVi: z.string().min(1),
 contextVi: z.string(),
 stimulusZh: z.string().min(1),
 options: z.array(personalExerciseOptionSchema),
 correctOptionIds: z.array(z.string()),
 acceptedAnswersZh: z.array(z.string()),
 explanationVi: z.string().min(1),
 distractorNotesVi: z.array(z.string()),
 tags: z.array(z.string()),
 sourceIds: z.array(z.string()),
 reviewStatus: z.string().min(1),
 confidence: z.number().min(0).max(1),
 origin: z.string().min(1),
 createdAt: z.iso.datetime({ offset: true }),
 updatedAt: z.iso.datetime({ offset: true }),
});

export const exerciseBankSchema = z.object({
 schemaVersion: z.number().int(),
 knowledgeNodeId: z.string().min(1),
 exercises: z.array(personalExerciseSchema),
});
export type StudioPersonalCurriculum = z.output<typeof personalCurriculumSchema>;
const pronunciationPhraseSchema = z.strictObject({
 text: z.string().min(1),
 pinyin: z.string().min(1),
 meaningVi: z.string().min(1),
});

const pronunciationCaseSchema = z.strictObject({
 id: z.string().min(1),
 text: z.string().min(1),
 phrases: z.array(pronunciationPhraseSchema).min(1),
});

const pronunciationCorpusSchema = z.strictObject({
 schemaVersion: z.string().min(1),
 source: z.string().min(1),
 cases: z.array(pronunciationCaseSchema).min(1),
});

export const studioLessonMappingSchema = z.record(z.string().min(1), z.string().min(1));
export type StudioLessonMapping = z.output<typeof studioLessonMappingSchema>;

export const studioCanonicalCourseId = "hanzihome-studio-reading";

export function canonicalStudioLessonId(sourceId: string): string {
 return `${studioCanonicalCourseId}:${sourceId}`;
}

export type ReadingInventory = {
 coreLessons: number;
 mockLessons: number;
 reinforcementLessons: number;
 paragraphs: number;
 vocabulary: number;
 exerciseGroups: number;
 exerciseItems: number;
 pinyinSourceRejected: number;
 pinyinUnresolved: number;
};

export type StudioInventory = {
 root: string;
 reading: ReadingInventory;
 hskReadingPassages: number;
 hskGrammarItems: number;
 dictationBooks: number;
 dictationLessons: number;
 dictationSegments: number;
 humanitiesItems: number;
 personalLessons: number;
 personalExercises: number;
 dailyReading: {
  paragraphs: number;
  vocabulary: number;
  grammarPoints: number;
  questions: number;
 };
 pronunciationRegressionCases: number;
 assets: Array<{ path: string; sha256: string; bytes: number }>;
 previewAssets: Array<{ path: string; sha256: string; bytes: number }>;
};

export const studioInventoryBaseline = {
 reading: {
  coreLessons: 12,
  mockLessons: 12,
  reinforcementLessons: 24,
  paragraphs: 101,
  vocabulary: 343,
  exerciseGroups: 69,
  exerciseItems: 291,
  pinyinSourceRejected: 28,
  pinyinUnresolved: 0,
 },
 hskReadingPassages: 50,
 hskGrammarItems: 577,
 dictationBooks: 2,
 dictationLessons: 76,
 dictationSegments: 497,
 humanitiesItems: 45,
 personalLessons: 26,
 personalExercises: 400,
 dailyReading: { paragraphs: 5, vocabulary: 11, grammarPoints: 4, questions: 5 },
 pronunciationRegressionCases: 2,
} satisfies Omit<StudioInventory, "root" | "assets" | "previewAssets">;

export function assertStudioInventoryBaseline(inventory: StudioInventory) {
 const expected = JSON.stringify(studioInventoryBaseline);
 const actual = JSON.stringify({
  reading: inventory.reading,
  hskReadingPassages: inventory.hskReadingPassages,
  hskGrammarItems: inventory.hskGrammarItems,
  dictationBooks: inventory.dictationBooks,
  dictationLessons: inventory.dictationLessons,
  dictationSegments: inventory.dictationSegments,
  humanitiesItems: inventory.humanitiesItems,
  personalLessons: inventory.personalLessons,
  personalExercises: inventory.personalExercises,
  dailyReading: inventory.dailyReading,
  pronunciationRegressionCases: inventory.pronunciationRegressionCases,
 });
 if (actual !== expected) {
  throw new Error(`Studio inventory baseline changed. Expected ${expected}, received ${actual}.`);
 }
 const expectedAssets = [
  {
   path: "hanyu-series-reading-book-1.pdf",
   sha256: "4ca2efb91e3b4da59b248d729cb8f85d58547852502a231c2d25d16dd393889e",
   bytes: 9_245_871,
  },
  {
   path: "hanyu-series-reading-book-2.pdf",
   sha256: "3969233c53ba1c15903aacdc3bf9feebdaa9acaec6572f0c788a4803b8472bef",
   bytes: 23_275_655,
  },
 ];
 const actualAssets = inventory.assets.map((asset) => ({
  path: asset.path.split("/").at(-1),
  sha256: asset.sha256,
  bytes: asset.bytes,
 }));
 if (JSON.stringify(actualAssets) !== JSON.stringify(expectedAssets)) {
  throw new Error(
   `Studio PDF asset baseline changed. Expected ${JSON.stringify(expectedAssets)}, received ${JSON.stringify(actualAssets)}.`,
  );
 }
 if (inventory.previewAssets.length !== 24) {
  throw new Error(
   `Studio PDF preview asset baseline changed. Expected 24 files, received ${inventory.previewAssets.length}.`,
  );
 }
}

export type StudioImportPreview = {
 sourceRoot: string;
 sourceChecksum: string;
 datasets: Array<{
  key: string;
  recordCount: number;
  sourceFiles: string[];
 }>;
 documents: Array<{
  sourceId: string;
  lessonId: string | null;
  slug: string;
  kind: "core" | "mock" | "reinforcement" | "hsk" | "daily" | "personal";
  paragraphIds: string[];
  vocabularyIds: string[];
  exerciseGroupIds: string[];
  unresolvedReferences: string[];
 }>;
 inventory: StudioInventory;
 excludedDatasets: ["dictionary", "radicals", "polyphonic"];
};

async function readJson(path: string): Promise<JsonValue> {
 return jsonValueSchema.parse(JSON.parse(await readFile(path, "utf8")));
}

export function summarizeReadingCourse(
 course: z.output<typeof readingCourseSchema>,
): ReadingInventory {
 const studyLessons = [...course.coreLessons, ...course.mockLessons];
 const pinyinAnalyses = studyLessons.flatMap((lesson) =>
  lesson.paragraphs.map((paragraph) =>
   analyzeContextualPronunciation({ text: paragraph.zh, sourcePinyin: paragraph.pinyin }),
  ),
 );
 return {
  coreLessons: course.coreLessons.length,
  mockLessons: course.mockLessons.length,
  reinforcementLessons: course.reinforcementLessons.length,
  paragraphs: studyLessons.reduce((total, lesson) => total + lesson.paragraphs.length, 0),
  vocabulary: studyLessons.reduce((total, lesson) => total + lesson.vocabulary.length, 0),
  exerciseGroups: studyLessons.reduce((total, lesson) => total + lesson.exerciseGroups.length, 0),
  exerciseItems: studyLessons.reduce(
   (total, lesson) =>
    total + lesson.exerciseGroups.reduce((groupTotal, group) => groupTotal + group.items.length, 0),
   0,
  ),
  pinyinSourceRejected: pinyinAnalyses.filter(
   (analysis) => analysis.sourcePinyinStatus === "rejected",
  ).length,
  pinyinUnresolved: pinyinAnalyses.reduce(
   (total, analysis) => total + analysis.unresolved.length,
   0,
  ),
 };
}

async function sha256File(path: string) {
 const content = await readFile(path);
 return {
  path,
  sha256: createHash("sha256").update(content).digest("hex"),
  bytes: content.byteLength,
 };
}

function uniqueIds(ids: string[], label: string) {
 const unique = new Set(ids);
 if (unique.size !== ids.length) {
  throw new Error(`${label} contains duplicate stable IDs.`);
 }
}

function validatePositiveOrdering(values: number[], label: string) {
 const expected = values.map((_, index) => index + 1);
 if (values.some((value, index) => value !== expected[index])) {
  throw new Error(`${label} must use contiguous one-based ordering.`);
 }
}

function validateOrderedIds(records: ReadonlyArray<{ id: string; order: number }>, label: string) {
 uniqueIds(
  records.map((record) => record.id),
  label,
 );
 validatePositiveOrdering(
  records.map((record) => record.order),
  `${label} order`,
 );
}

export function validateReadingReferences(course: z.output<typeof readingCourseSchema>) {
 const unitIds = new Set(course.units.map((unit) => unit.id));
 const lessons = [...course.coreLessons, ...course.mockLessons];
 const globalContentIds = new Set<string>();
 for (const lesson of lessons) {
  const documentIds = new Set<string>();
  const registerDocumentIds = (ids: string[], label: string) => {
   for (const id of ids) {
    if (documentIds.has(id) || globalContentIds.has(id)) {
     throw new Error(`${label} reuses stable ID ${id}.`);
    }
    documentIds.add(id);
    globalContentIds.add(id);
   }
  };
  if (lesson.unitId !== undefined && !unitIds.has(lesson.unitId)) {
   throw new Error(`Reading lesson ${lesson.id} references a missing unit ${lesson.unitId}.`);
  }
  validatePositiveOrdering(
   lesson.paragraphs.map((paragraph) => paragraph.order),
   `${lesson.id} paragraphs`,
  );
  validatePositiveOrdering(
   lesson.vocabulary.map((item) => item.order),
   `${lesson.id} vocabulary`,
  );
  validatePositiveOrdering(
   lesson.exerciseGroups.map((group) => group.order),
   `${lesson.id} exercise groups`,
  );
  uniqueIds(
   lesson.paragraphs.map((paragraph) => paragraph.id),
   `${lesson.id} paragraphs`,
  );
  uniqueIds(
   lesson.vocabulary.map((item) => item.id),
   `${lesson.id} vocabulary`,
  );
  uniqueIds(
   lesson.exerciseGroups.map((group) => group.id),
   `${lesson.id} exercise groups`,
  );
  registerDocumentIds(
   lesson.paragraphs.map((paragraph) => paragraph.id),
   `${lesson.id} paragraphs`,
  );
  registerDocumentIds(
   lesson.vocabulary.map((item) => item.id),
   `${lesson.id} vocabulary`,
  );
  registerDocumentIds(
   lesson.exerciseGroups.map((group) => group.id),
   `${lesson.id} exercise groups`,
  );
  for (const group of lesson.exerciseGroups) {
   uniqueIds(
    group.items.map((item) => item.id),
    `${group.id} exercise items`,
   );
   registerDocumentIds(
    group.items.map((item) => item.id),
    `${group.id} exercise items`,
   );
  }
 }
}

export function validateStudioLessonMappings(
 course: z.output<typeof readingCourseSchema>,
 mappings: StudioLessonMapping,
) {
 const sourceIds = new Set([
  ...course.coreLessons.map((lesson) => lesson.id),
  ...course.mockLessons.map((lesson) => lesson.id),
  ...course.reinforcementLessons.map((lesson) => lesson.id),
 ]);
 const unknownSourceId = Object.keys(mappings).find((sourceId) => !sourceIds.has(sourceId));
 if (unknownSourceId) {
  throw new Error(`Lesson mapping contains an unknown Studio lesson ${unknownSourceId}.`);
 }
 const mappedIds = Object.values(mappings);
 const duplicateTarget = mappedIds.find((lessonId, index) => mappedIds.indexOf(lessonId) !== index);
 if (duplicateTarget) {
  throw new Error(`Lesson mapping reuses canonical HanziHome lesson ${duplicateTarget}.`);
 }
}

async function validateHumanitiesFile(path: string): Promise<string[]> {
 const value = await readJson(path);
 if (Array.isArray(value)) {
  const items = humanitiesItemSchema.array().parse(value);
  uniqueIds(
   items.map((item) => item.id),
   path,
  );
  if (items.some((item) => !item.rights.redistributionAllowed)) {
   throw new Error(`${path} contains an item that is not marked for redistribution.`);
  }
  return items.map((item) => item.id);
 }
 humanitiesCourseSchema.parse(value);
 return [];
}

export async function loadStudioInventory(studioRoot: string): Promise<StudioInventory> {
 const readingCourse = readingCourseSchema.parse(
  await readJson(join(studioRoot, "src/features/reading/data/reading-course.json")),
 );
 const hskReading = hskReadingSchema.parse(
  await readJson(join(studioRoot, "src/features/reading/hsk/data/hsk-reading-passages.json")),
 );
 const dailyReading = dailyReadingSchema.parse(
  await readJson(join(studioRoot, "src/features/daily-reading/data/daily-reading-seed.json")),
 );
 const personalCurriculum = personalCurriculumSchema.parse(
  await readJson(
   join(studioRoot, "src/features/personal-learning/data/deep-knowledge-curriculum.json"),
  ),
 );
 const reading = summarizeReadingCourse(readingCourse);
 validateReadingReferences(readingCourse);
 uniqueIds(
  [
   ...readingCourse.coreLessons,
   ...readingCourse.mockLessons,
   ...readingCourse.reinforcementLessons,
  ].map((lesson) => lesson.id),
  "reading lessons",
 );

 uniqueIds(
  hskReading.passages.map((passage) => passage.id),
  "HSK reading passages",
 );
 uniqueIds(
  hskReading.sources.map((source) => source.id),
  "HSK reading sources",
 );
 const hskSourceIds = new Set(hskReading.sources.map((source) => source.id));
 const passageCountsBySource = new Map<string, number>();
 for (const passage of hskReading.passages) {
  if (!hskSourceIds.has(passage.sourceId)) {
   throw new Error(
    `HSK reading passage ${passage.id} references missing source ${passage.sourceId}.`,
   );
  }
  passageCountsBySource.set(
   passage.sourceId,
   (passageCountsBySource.get(passage.sourceId) ?? 0) + 1,
  );
 }
 for (const source of hskReading.sources) {
  if (passageCountsBySource.get(source.id) !== source.passageCount) {
   throw new Error(`HSK reading source ${source.id} count does not match its passages.`);
  }
 }
 for (const passage of hskReading.passages) {
  validateOrderedIds(passage.paragraphs, `HSK passage ${passage.id} paragraphs`);
 }

 let hskGrammarItems = 0;
 for (const level of [1, 2, 3, 4, 5, 6]) {
  const dataset = grammarDatasetSchema.parse(
   await readJson(join(studioRoot, `src/features/reading/grammar/data/hsk${level}.json`)),
  );
  uniqueIds(
   dataset.items.map((item) => item.id),
   `HSK ${level} grammar items`,
  );
  if (dataset.item_count !== dataset.items.length) {
   throw new Error(`HSK ${level} grammar item_count does not match the item count.`);
  }
  validatePositiveOrdering(
   dataset.items.map((item) => item.order),
   `HSK ${level} grammar items`,
  );
  hskGrammarItems += dataset.items.length;
 }

 const dictation = dictationCourseSchema.parse(
  await readJson(
   join(studioRoot, "src/features/practice-lab/dictation/data/hsk-dictation-course.json"),
  ),
 );
 uniqueIds(
  dictation.books.map((book) => book.id),
  "dictation books",
 );
 uniqueIds(
  dictation.books.flatMap((book) => book.volumes.map((volume) => volume.id)),
  "dictation volumes",
 );
 const dictationLessons = dictation.books.flatMap((book) =>
  book.volumes.flatMap((volume) => volume.lessons),
 );
 uniqueIds(
  dictationLessons.map((lesson) => lesson.id),
  "dictation lessons",
 );
 for (const book of dictation.books) {
  for (const volume of book.volumes) {
   for (const lesson of volume.lessons) {
    validateOrderedIds(lesson.segments, `dictation lesson ${lesson.id} segments`);
   }
  }
 }
 uniqueIds(
  dictationLessons.flatMap((lesson) => lesson.segments.map((segment) => segment.id)),
  "dictation segments",
 );

 validateOrderedIds(dailyReading.paragraphs, "daily reading paragraphs");
 validateOrderedIds(dailyReading.vocabulary, "daily reading vocabulary");
 uniqueIds(
  dailyReading.grammarPoints.map((point) => point.id),
  "daily reading grammar points",
 );
 uniqueIds(
  dailyReading.questions.map((question) => question.id),
  "daily reading questions",
 );
 const dailyParagraphIds = new Set(dailyReading.paragraphs.map((paragraph) => paragraph.id));
 for (const question of dailyReading.questions) {
  for (const paragraphId of question.evidenceParagraphIds) {
   if (!dailyParagraphIds.has(paragraphId)) {
    throw new Error(
     `Daily reading question ${question.id} references missing paragraph ${paragraphId}.`,
    );
   }
  }
 }
 const pronunciationCorpus = pronunciationCorpusSchema.parse(
  await readJson(
   join(studioRoot, "src/features/contextual-pronunciation/data/curated-regression-corpus.json"),
  ),
 );
 uniqueIds(
  pronunciationCorpus.cases.map((item) => item.id),
  "contextual pronunciation regression cases",
 );
 for (const item of pronunciationCorpus.cases) {
  let searchFrom = 0;
  for (const phrase of item.phrases) {
   const phraseStart = item.text.indexOf(phrase.text, searchFrom);
   if (phraseStart < 0) {
    throw new Error(
     `Pronunciation regression case ${item.id} has a phrase that does not align to its source text.`,
    );
   }
   searchFrom = phraseStart + phrase.text.length;
  }
 }
 uniqueIds(
  personalCurriculum.lessons.map((lesson) => lesson.id),
  "personal learning lessons",
 );
 const personalLessonKnowledgeNodes = new Map(
  personalCurriculum.lessons.map((lesson) => [lesson.id, lesson.knowledgeNodeId]),
 );
 const personalLessonsByNode = new Map<string, number[]>();
 for (const lesson of personalCurriculum.lessons) {
  personalLessonsByNode.set(lesson.knowledgeNodeId, [
   ...(personalLessonsByNode.get(lesson.knowledgeNodeId) ?? []),
   lesson.order,
  ]);
 }
 for (const [knowledgeNodeId, orders] of personalLessonsByNode) {
  validatePositiveOrdering(orders, `personal learning lessons ${knowledgeNodeId}`);
 }

 let personalExercises = 0;
 for (const file of await readdir(
  join(studioRoot, "src/features/personal-learning/data/exercise-banks"),
 )) {
  if (!file.endsWith(".json")) continue;
  const bank = exerciseBankSchema.parse(
   await readJson(join(studioRoot, "src/features/personal-learning/data/exercise-banks", file)),
  );
  uniqueIds(
   bank.exercises.map((exercise) => exercise.id),
   `personal exercise bank ${file}`,
  );
  if (bank.exercises.some((exercise) => exercise.knowledgeNodeId !== bank.knowledgeNodeId)) {
   throw new Error(`Personal exercise bank ${file} contains a mismatched knowledge node.`);
  }
  for (const exercise of bank.exercises) {
   const lessonKnowledgeNode = personalLessonKnowledgeNodes.get(exercise.lessonId);
   if (lessonKnowledgeNode === undefined) {
    throw new Error(
     `Personal exercise ${exercise.id} references missing lesson ${exercise.lessonId}.`,
    );
   }
   if (lessonKnowledgeNode !== exercise.knowledgeNodeId) {
    throw new Error(`Personal exercise ${exercise.id} references a mismatched lesson node.`);
   }
  }
  validatePositiveOrdering(
   bank.exercises.map((exercise) => exercise.order),
   `personal exercise bank ${file}`,
  );
  personalExercises += bank.exercises.length;
 }

 const humanitiesFiles = ["history", "interpreting", "poetry", "translation"];
 const humanitiesIds = (
  await Promise.all(
   humanitiesFiles.map((file) =>
    validateHumanitiesFile(join(studioRoot, `src/features/humanities/data/${file}.json`)),
   ),
  )
 ).flat();
 uniqueIds(humanitiesIds, "humanities items");
 const humanitiesItems = humanitiesIds.length;
 humanitiesCourseSchema.parse(
  await readJson(join(studioRoot, "src/features/humanities/data/course.json")),
 );

 const resourceDirectory = join(studioRoot, "public/resources");
 const assets = await Promise.all(
  (await readdir(resourceDirectory))
   .filter((file) => file.endsWith(".pdf"))
   .sort()
   .map((file) => sha256File(join(resourceDirectory, file))),
 ).then((items) => items.map((item) => ({ ...item, path: relative(studioRoot, item.path) })));
 const previewResourceDirectory = join(resourceDirectory, "pages");
 const previewAssets = await Promise.all(
  (await readdir(previewResourceDirectory))
   .filter((file) => file.endsWith(".webp"))
   .sort()
   .map((file) => sha256File(join(previewResourceDirectory, file))),
 ).then((items) => items.map((item) => ({ ...item, path: relative(studioRoot, item.path) })));

 return {
  root: studioRoot,
  reading,
  hskReadingPassages: hskReading.passages.length,
  hskGrammarItems,
  dictationBooks: dictation.books.length,
  dictationLessons: dictationLessons.length,
  dictationSegments: dictationLessons.reduce((total, lesson) => total + lesson.segments.length, 0),
  humanitiesItems,
  personalLessons: personalCurriculum.lessons.length,
  personalExercises,
  dailyReading: {
   paragraphs: dailyReading.paragraphs.length,
   vocabulary: dailyReading.vocabulary.length,
   grammarPoints: dailyReading.grammarPoints.length,
   questions: dailyReading.questions.length,
  },
  pronunciationRegressionCases: pronunciationCorpus.cases.length,
  assets,
  previewAssets,
 };
}

export async function assertStudioAssetParity(studioRoot: string, destinationRoot: string) {
 const inventory = await loadStudioInventory(studioRoot);
 const expectedAssets = [
  ...inventory.assets.map((asset) => ({
   ...asset,
   relativePath: `public/resources/${asset.path.split("/").at(-1)}`,
  })),
  ...inventory.previewAssets.map((asset) => ({
   ...asset,
   relativePath: `public/resources/pages/${asset.path.split("/").at(-1)}`,
  })),
 ];
 for (const asset of expectedAssets) {
  const destination = await sha256File(join(destinationRoot, asset.relativePath));
  if (destination.sha256 !== asset.sha256 || destination.bytes !== asset.bytes) {
   throw new Error(
    `Imported asset mismatch for ${asset.relativePath}. Expected ${asset.sha256}/${asset.bytes}, received ${destination.sha256}/${destination.bytes}.`,
   );
  }
 }
 return expectedAssets.length;
}

export async function computeSourceChecksum(
 studioRoot: string,
 relativePaths: readonly string[],
): Promise<string> {
 const sourceHash = createHash("sha256");
 for (const relativePath of [...relativePaths].sort()) {
  sourceHash.update(relativePath);
  sourceHash.update("\0");
  sourceHash.update(await readFile(join(studioRoot, relativePath)));
 }
 return sourceHash.digest("hex");
}

export async function buildStudioImportPreview(
 studioRoot: string,
 lessonMappings: StudioLessonMapping = {},
): Promise<StudioImportPreview> {
 const inventory = await loadStudioInventory(studioRoot);
 const readingCourse = readingCourseSchema.parse(
  await readJson(join(studioRoot, "src/features/reading/data/reading-course.json")),
 );
 const hskReading = hskReadingSchema.parse(
  await readJson(join(studioRoot, "src/features/reading/hsk/data/hsk-reading-passages.json")),
 );
 const dailyReading = dailyReadingSchema.parse(
  await readJson(join(studioRoot, "src/features/daily-reading/data/daily-reading-seed.json")),
 );
 const personalCurriculum = personalCurriculumSchema.parse(
  await readJson(
   join(studioRoot, "src/features/personal-learning/data/deep-knowledge-curriculum.json"),
  ),
 );
 validateStudioLessonMappings(readingCourse, lessonMappings);
 const personalExerciseFiles = (
  await readdir(join(studioRoot, "src/features/personal-learning/data/exercise-banks"))
 )
  .filter((file) => file.endsWith(".json"))
  .sort();
 const personalExerciseSourceFiles = personalExerciseFiles.map(
  (file) => `src/features/personal-learning/data/exercise-banks/${file}`,
 );
 const personalExerciseBanks = await Promise.all(
  personalExerciseFiles.map(async (file) =>
   exerciseBankSchema.parse(
    await readJson(join(studioRoot, "src/features/personal-learning/data/exercise-banks", file)),
   ),
  ),
 );
 const sourceFiles = [
  join(studioRoot, "src/features/reading/data/reading-course.json"),
  join(studioRoot, "src/features/reading/hsk/data/hsk-reading-passages.json"),
  join(studioRoot, "src/features/practice-lab/dictation/data/hsk-dictation-course.json"),
  join(studioRoot, "src/features/daily-reading/data/daily-reading-seed.json"),
  join(studioRoot, "src/features/contextual-pronunciation/data/curated-regression-corpus.json"),
  join(studioRoot, "src/features/personal-learning/data/deep-knowledge-curriculum.json"),
  join(studioRoot, "src/features/humanities/data/course.json"),
  ...["history", "interpreting", "poetry", "translation"].map((file) =>
   join(studioRoot, `src/features/humanities/data/${file}.json`),
  ),
  ...[1, 2, 3, 4, 5, 6].map((level) =>
   join(studioRoot, `src/features/reading/grammar/data/hsk${level}.json`),
  ),
  ...personalExerciseSourceFiles.map((file) => join(studioRoot, file)),
  ...(await readdir(join(studioRoot, "public/resources")))
   .filter((file) => file.endsWith(".pdf"))
   .map((file) => join(studioRoot, "public/resources", file)),
  ...inventory.previewAssets.map((asset) => join(studioRoot, asset.path)),
 ];
 const sourceChecksum = await computeSourceChecksum(
  studioRoot,
  sourceFiles.map((path) => relative(studioRoot, path)),
 );
 const toDocument = (lesson: z.output<typeof readingLessonSchema>, kind: "core" | "mock") => ({
  sourceId: lesson.id,
  lessonId: lessonMappings[lesson.id] ?? canonicalStudioLessonId(lesson.id),
  slug: lesson.slug,
  kind,
  paragraphIds: lesson.paragraphs.map((paragraph) => paragraph.id),
  vocabularyIds: lesson.vocabulary.map((item) => item.id),
  exerciseGroupIds: lesson.exerciseGroups.map((group) => group.id),
  unresolvedReferences: [],
 });
 const toReinforcementDocument = (
  lesson: z.output<typeof reinforcementLessonSchema>,
 ): StudioImportPreview["documents"][number] => ({
  sourceId: lesson.id,
  lessonId: lessonMappings[lesson.id] ?? canonicalStudioLessonId(lesson.id),
  slug: lesson.slug,
  kind: "reinforcement",
  paragraphIds: [],
  vocabularyIds: [],
  exerciseGroupIds: [],
  unresolvedReferences: [],
 });
 const toHskDocument = (
  passage: z.output<typeof hskReadingSchema>["passages"][number],
 ): StudioImportPreview["documents"][number] => ({
  sourceId: `hsk:${passage.id}`,
  lessonId: canonicalStudioLessonId(`hsk:${passage.id}`),
  slug: `hsk-${passage.slug}`,
  kind: "hsk",
  paragraphIds: passage.paragraphs.map(
   (paragraph) => `${canonicalStudioLessonId(`hsk:${passage.id}`)}:paragraph:${paragraph.id}`,
  ),
  vocabularyIds: [],
  exerciseGroupIds: [],
  unresolvedReferences: [],
 });
 const toDailyDocument = (): StudioImportPreview["documents"][number] => ({
  sourceId: dailyReading.id,
  lessonId: `hanzihome-studio-daily-reading:${dailyReading.id}`,
  slug: `daily-${dailyReading.id}`,
  kind: "daily",
  paragraphIds: dailyReading.paragraphs.map(
   (paragraph) => `hanzihome-studio-daily-reading:${dailyReading.id}:paragraph:${paragraph.id}`,
  ),
  vocabularyIds: dailyReading.vocabulary.map(
   (item) => `hanzihome-studio-daily-reading:${dailyReading.id}:vocab:${item.id}`,
  ),
  exerciseGroupIds: [`hanzihome-studio-daily-reading:${dailyReading.id}:questions`],
  unresolvedReferences: [],
 });
 const personalExerciseLessonIds = new Set(
  personalExerciseBanks.flatMap((bank) => bank.exercises.map((exercise) => exercise.lessonId)),
 );
 const toPersonalDocument = (
  lesson: z.output<typeof personalCurriculumSchema>["lessons"][number],
 ): StudioImportPreview["documents"][number] => ({
  sourceId: lesson.id,
  lessonId: `hanzihome-studio-personal-learning:${lesson.id}`,
  slug: `personal-${lesson.id}`,
  kind: "personal",
  paragraphIds: [],
  vocabularyIds: [],
  exerciseGroupIds: personalExerciseLessonIds.has(lesson.id)
   ? [`hanzihome-studio-personal-learning:${lesson.id}:exercises`]
   : [],
  unresolvedReferences: [],
 });
 const documents: StudioImportPreview["documents"] = [
  ...readingCourse.coreLessons.map((lesson) => toDocument(lesson, "core")),
  ...readingCourse.mockLessons.map((lesson) => toDocument(lesson, "mock")),
  ...readingCourse.reinforcementLessons.map(toReinforcementDocument),
  ...hskReading.passages.map(toHskDocument),
  toDailyDocument(),
  ...personalCurriculum.lessons.map(toPersonalDocument),
 ];
 return {
  sourceRoot: studioRoot,
  sourceChecksum,
  datasets: [
   {
    key: "reader.core",
    recordCount: readingCourse.coreLessons.length,
    sourceFiles: ["src/features/reading/data/reading-course.json"],
   },
   {
    key: "reader.mock",
    recordCount: readingCourse.mockLessons.length,
    sourceFiles: ["src/features/reading/data/reading-course.json"],
   },
   {
    key: "reader.reinforcement",
    recordCount: readingCourse.reinforcementLessons.length,
    sourceFiles: ["src/features/reading/data/reading-course.json"],
   },
   {
    key: "hsk.reading",
    recordCount: inventory.hskReadingPassages,
    sourceFiles: ["src/features/reading/hsk/data/hsk-reading-passages.json"],
   },
   {
    key: "hsk.grammar",
    recordCount: inventory.hskGrammarItems,
    sourceFiles: [
     "src/features/reading/grammar/data/hsk1.json",
     "src/features/reading/grammar/data/hsk2.json",
     "src/features/reading/grammar/data/hsk3.json",
     "src/features/reading/grammar/data/hsk4.json",
     "src/features/reading/grammar/data/hsk5.json",
     "src/features/reading/grammar/data/hsk6.json",
    ],
   },
   {
    key: "dictation",
    recordCount: inventory.dictationSegments,
    sourceFiles: ["src/features/practice-lab/dictation/data/hsk-dictation-course.json"],
   },
   {
    key: "humanities",
    recordCount: inventory.humanitiesItems,
    sourceFiles: [
     "src/features/humanities/data/history.json",
     "src/features/humanities/data/interpreting.json",
     "src/features/humanities/data/poetry.json",
     "src/features/humanities/data/translation.json",
    ],
   },
   {
    key: "personal-learning",
    recordCount: inventory.personalLessons + inventory.personalExercises,
    sourceFiles: [
     "src/features/personal-learning/data/deep-knowledge-curriculum.json",
     ...personalExerciseSourceFiles,
    ],
   },
   {
    key: "daily-reading",
    recordCount:
     inventory.dailyReading.paragraphs +
     inventory.dailyReading.vocabulary +
     inventory.dailyReading.grammarPoints +
     inventory.dailyReading.questions,
    sourceFiles: ["src/features/daily-reading/data/daily-reading-seed.json"],
   },
   {
    key: "authorized-assets",
    recordCount: inventory.assets.length + inventory.previewAssets.length,
    sourceFiles: [...inventory.assets, ...inventory.previewAssets].map((asset) => asset.path),
   },
  ],
  documents,
  inventory,
  excludedDatasets: ["dictionary", "radicals", "polyphonic"],
 };
}

function defaultStudioRoot() {
 return resolve(import.meta.dirname, "..", "..", "hanzi-studio");
}

async function main() {
 const rootFlagIndex = process.argv.indexOf("--root");
 const root = resolve(
  rootFlagIndex >= 0
   ? (process.argv[rootFlagIndex + 1] ?? defaultStudioRoot())
   : (process.env.HANZI_STUDIO_ROOT ?? defaultStudioRoot()),
 );
 const inventory = await loadStudioInventory(root);
 assertStudioInventoryBaseline(inventory);
 const assetDestination = process.argv.indexOf("--check-assets");
 if (assetDestination >= 0) {
  const destinationFlag = process.argv.indexOf("--destination");
  const destination = resolve(
   destinationFlag >= 0
    ? (process.argv[destinationFlag + 1] ?? process.cwd())
    : (process.env.HANZIHOME_ROOT ?? process.cwd()),
  );
  const assetCount = await assertStudioAssetParity(root, destination);
  process.stdout.write(`${JSON.stringify({ destination, assetCount }, null, 2)}\n`);
  return;
 }
 process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) await main();
