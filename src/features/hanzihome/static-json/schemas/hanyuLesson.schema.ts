import { z } from "zod";

/**
 * Hanyu Lesson App Data Schema v2.1.0
 * -------------------------------------------------------
 * Purpose:
 * - Store one Chinese textbook lesson in a stable, UI-first structure.
 * - Keep outer sections fixed.
 * - Allow inner blocks/exercises/readings to expand by `type`.
 * - Support rendering, flashcards, grammar highlighting, answer checking, and reading evidence.
 *
 * Recommended usage:
 * const parsed = HanyuLessonSchema.parse(data);
 * type HanyuLesson = z.infer<typeof HanyuLessonSchema>;
 */

/* -------------------------------------------------------------------------- */
/* Common primitives                                                          */
/* -------------------------------------------------------------------------- */

export const LocalizedTextSchema = z.object({
 zh: z.string().optional().default(""),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 en: z.string().optional().default(""),
});

export const InstructionSchema = z.object({
 zh: z.string().optional().default(""),
 vi: z.string().optional().default(""),
});

export const RenderingSchema = z
 .object({
  renderer: z.string(),
  input_mode: z.string().optional(),
  show_word_bank: z.boolean().optional(),
  show_answer_after_submit: z.boolean().optional(),
  shuffle_questions: z.boolean().optional(),
  shuffle_choices: z.boolean().optional(),
 })
 .passthrough();

export const GradingModeSchema = z.enum([
 "exact",
 "choice",
 "pattern",
 "keyword",
 "semantic",
 "manual",
 "none",
]);

export const GradingSchema = z
 .object({
  mode: GradingModeSchema,
  required_pattern: z.string().optional(),
  required_keywords: z.array(z.string()).optional(),
  case_sensitive: z.boolean().optional(),
  reason: z.string().optional(),
 })
 .passthrough();

export const EvidenceSchema = z.object({
 paragraph_id: z.string(),
 quote: z.string(),
});

export const ExampleSchema = z.object({
 id: z.string(),
 zh: z.string(),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 en: z.string().optional().default(""),
 highlight: z.array(z.string()).optional().default([]),
 grammar_refs: z.array(z.string()).optional().default([]),
 vocab_refs: z.array(z.string()).optional().default([]),
 source_ref: z.string().optional().default(""),
 note_vi: z.string().optional().default(""),
 audio_key: z.string().optional().default(""),
});

/* -------------------------------------------------------------------------- */
/* Source / root                                                              */
/* -------------------------------------------------------------------------- */

export const SourceFileSchema = z.object({
 name: z.string(),
 type: z.string(),
 check_needed: z.boolean().optional().default(false),
});

export const SourceSchema = z.object({
 book: z.string(),
 volume: z.string(),
 volume_vi: z.string().optional().default(""),
 lesson_index: z.number().int().positive(),
 lesson_number_cn: z.string(),
 lesson_title_cn: z.string(),
 lesson_title_pinyin: z.string().optional().default(""),
 lesson_title_vi: z.string().optional().default(""),
 lesson_title_en: z.string().optional().default(""),
 source_files: z.array(SourceFileSchema).optional().default([]),
});

/* -------------------------------------------------------------------------- */
/* Text section                                                               */
/* -------------------------------------------------------------------------- */

export const TextLineSchema = z.object({
 id: z.string(),
 order: z.number().int().positive(),
 speaker: z.string().optional().default(""),
 zh: z.string(),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 audio_key: z.string().optional().default(""),
 vocab_refs: z.array(z.string()).optional().default([]),
 grammar_refs: z.array(z.string()).optional().default([]),
 notes: z.array(z.string()).optional().default([]),
});

export const TextSceneSchema = z.object({
 id: z.string(),
 order: z.number().int().positive(),
 summary_vi: z.string().optional().default(""),
 lines: z.array(TextLineSchema),
});

export const TextDialogueBlockSchema = z.object({
 id: z.string(),
 type: z.literal("text_dialogue"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 scenes: z.array(TextSceneSchema).optional().default([]),
 lines: z.array(TextLineSchema).optional().default([]),
 comprehension_questions: z.array(z.unknown()).optional().default([]),
});

export const TextParagraphSchema = z.object({
 id: z.string(),
 order: z.number().int().positive(),
 zh: z.string(),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 audio_key: z.string().optional().default(""),
 vocab_refs: z.array(z.string()).optional().default([]),
 grammar_refs: z.array(z.string()).optional().default([]),
});

export const TextNarrativeBlockSchema = z.object({
 id: z.string(),
 type: z.literal("text_narrative"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 paragraphs: z.array(TextParagraphSchema).optional().default([]),
 lines: z.array(TextLineSchema).optional().default([]),
 comprehension_questions: z.array(z.unknown()).optional().default([]),
});

export const TextBlockSchema = z.discriminatedUnion("type", [
 TextDialogueBlockSchema,
 TextNarrativeBlockSchema,
]);

/* -------------------------------------------------------------------------- */
/* Vocabulary section                                                         */
/* -------------------------------------------------------------------------- */

export const PartOfSpeechSchema = z.string().min(1).default("unknown");

export const VocabularyExampleSchema = z.object({
 id: z.string(),
 zh: z.string(),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 source_ref: z.string().optional().default(""),
 grammar_refs: z.array(z.string()).optional().default([]),
 vocab_refs: z.array(z.string()).optional().default([]),
});

export const FlashcardSchema = z.object({
 front: z.string(),
 back: z.string(),
 modes: z.array(
  z.enum([
   "hanzi_to_meaning",
   "meaning_to_hanzi",
   "pinyin_to_hanzi",
   "audio_to_hanzi",
  ]),
 ),
});

export const VocabularyItemSchema = z.object({
 id: z.string(),
 type: z.literal("vocabulary_item"),
 order: z.number().int().positive(),
 hanzi: z.string(),
 pinyin: z.string().optional().default(""),
 meaning_vi: z.string(),
 meaning_en: z.string().optional().default(""),
 pos: PartOfSpeechSchema.optional().default("unknown"),
 tags: z.array(z.string()).optional().default([]),
 examples: z.array(VocabularyExampleSchema).optional().default([]),
 flashcard: FlashcardSchema.optional(),
 audio_key: z.string().optional().default(""),
 check_needed: z.boolean().optional().default(false),
});

/* -------------------------------------------------------------------------- */
/* Notes section                                                              */
/* -------------------------------------------------------------------------- */

export const NoteItemSchema = z.object({
 id: z.string(),
 type: z.literal("note"),
 order: z.number().int().positive(),
 title: z.string(),
 structure: z.string().optional().default(""),
 meaning_vi: z.string(),
 examples: z.array(ExampleSchema).optional().default([]),
 source_refs: z.array(z.string()).optional().default([]),
 check_needed: z.boolean().optional().default(false),
});

/* -------------------------------------------------------------------------- */
/* Grammar section                                                            */
/* -------------------------------------------------------------------------- */

export const FormulaSchema = z.object({
 label: z.string(),
 pattern: z.string(),
});

export const GrammarOverviewBlockSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_overview"),
 order: z.number().int().positive(),
 title: z.string(),
 content_vi: z.string(),
 examples: z.array(ExampleSchema).optional().default([]),
});

export const GrammarStructureBlockSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_structure"),
 order: z.number().int().positive(),
 title: z.string(),
 pattern: z.string(),
 meaning_vi: z.string(),
 formulas: z.array(FormulaSchema).optional().default([]),
 examples: z.array(ExampleSchema).optional().default([]),
 notes_vi: z.array(z.string()).optional().default([]),
});

export const GrammarQuestionFormBlockSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_question_form"),
 order: z.number().int().positive(),
 title: z.string(),
 pattern: z.string(),
 meaning_vi: z.string(),
 examples: z.array(ExampleSchema).optional().default([]),
});

export const CorrectWrongExampleSchema = z.object({
 id: z.string(),
 zh: z.string(),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 highlight: z.array(z.string()).optional().default([]),
 explanation_vi: z.string().optional().default(""),
});

export const GrammarNegativeFormBlockSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_negative_form"),
 order: z.number().int().positive(),
 title: z.string(),
 pattern: z.string(),
 wrong_pattern: z.string().optional().default(""),
 meaning_vi: z.string(),
 correct_examples: z.array(CorrectWrongExampleSchema).optional().default([]),
 wrong_examples: z.array(CorrectWrongExampleSchema).optional().default([]),
});

export const GrammarComparisonItemSchema = z.object({
 aspect: z.string(),
 left: z.object({
  label: z.string(),
  value: z.string(),
 }),
 right: z.object({
  label: z.string(),
  value: z.string(),
 }),
});

export const GrammarComparisonBlockSchema = z.object({
 id: z.string(),
 type: z.enum(["grammar_comparison", "grammar_compare"]),
 order: z.number().int().positive(),
 title: z.string(),
 items: z.array(GrammarComparisonItemSchema),
});

export const GrammarCommonMistakeSchema = z.object({
 id: z.string(),
 wrong: z.string(),
 correct: z.string(),
 explanation_vi: z.string(),
});

export const GrammarCommonMistakesBlockSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_common_mistakes"),
 order: z.number().int().positive(),
 title: z.string(),
 items: z.array(GrammarCommonMistakeSchema),
});

export const GrammarUsageNotesBlockSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_usage_notes"),
 order: z.number().int().positive(),
 title: z.string(),
 notes_vi: z.array(z.string()),
 examples: z.array(ExampleSchema).optional().default([]),
});

export const GrammarMicroPracticeQuestionSchema = z
 .object({
  id: z.string(),
  type: z.string(),
  prompt: z.string(),
  answer: z.string().optional(),
  acceptable_answers: z.array(z.string()).optional().default([]),
  explanation_vi: z.string().optional().default(""),
  grading: GradingSchema.optional(),
 })
 .passthrough();

export const GrammarMicroPracticeBlockSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_micro_practice"),
 order: z.number().int().positive(),
 title: z.string(),
 questions: z.array(GrammarMicroPracticeQuestionSchema),
});

export const GenericGrammarBlockSchema = z
 .object({
  id: z.string(),
  type: z.string(),
  order: z.number().int().positive(),
  title: z.string(),
 })
 .passthrough();

export const GrammarBlockSchema = z
 .discriminatedUnion("type", [
  GrammarOverviewBlockSchema,
  GrammarStructureBlockSchema,
  GrammarQuestionFormBlockSchema,
  GrammarNegativeFormBlockSchema,
  GrammarComparisonBlockSchema,
  GrammarCommonMistakesBlockSchema,
  GrammarUsageNotesBlockSchema,
  GrammarMicroPracticeBlockSchema,
 ])
 .or(GenericGrammarBlockSchema);

export const GrammarPointSchema = z.object({
 id: z.string(),
 type: z.literal("grammar_point"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 level: z.string().optional().default(""),
 tags: z.array(z.string()).optional().default([]),
 blocks: z.array(GrammarBlockSchema),
});

/* -------------------------------------------------------------------------- */
/* Exercises                                                                  */
/* -------------------------------------------------------------------------- */

export const ExerciseBaseSchema = z.object({
 id: z.string(),
 type: z.string(),
 variant: z.string().optional().default(""),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 instruction: InstructionSchema.optional().default({ zh: "", vi: "" }),
 difficulty: z.enum(["easy", "normal", "hard"]).optional().default("normal"),
 skill_focus: z.array(z.string()).optional().default([]),
 grammar_refs: z.array(z.string()).optional().default([]),
 vocab_refs: z.array(z.string()).optional().default([]),
 rendering: RenderingSchema.optional(),
 check_needed: z.boolean().optional().default(false),
});

export const PhoneticsPairSchema = z.object({
 id: z.string(),
 left: z.string(),
 right: z.string(),
 audio_keys: z.array(z.string()).optional().default([]),
});

export const ReadAloudItemSchema = z.object({
 id: z.string(),
 text: z.string(),
 pinyin: z.string().optional().default(""),
 audio_key: z.string().optional().default(""),
});

export const PhoneticsPartSchema = z.discriminatedUnion("type", [
 z.object({
  id: z.string(),
  type: z.literal("minimal_pair"),
  title: z.string(),
  instruction_vi: z.string().optional().default(""),
  items: z.array(PhoneticsPairSchema),
 }),
 z.object({
  id: z.string(),
  type: z.literal("read_aloud"),
  title: z.string(),
  instruction_vi: z.string().optional().default(""),
  items: z.array(ReadAloudItemSchema),
 }),
]);

export const PhoneticsExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("phonetics"),
 parts: z.array(PhoneticsPartSchema),
});

export const SubstitutionItemSchema = z.object({
 id: z.string(),
 substitution: z.string(),
 expected_dialogue: z.array(z.string()).optional().default([]),
 grammar_refs: z.array(z.string()).optional().default([]),
 vocab_refs: z.array(z.string()).optional().default([]),
});

export const SubstitutionExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("substitution"),
 model: z.array(z.string()),
 items: z.array(SubstitutionItemSchema),
 answer_mode: z.enum(["generated", "manual"]).optional().default("generated"),
});

export const FillBlankQuestionSchema = z.object({
 id: z.string(),
 prompt: z.string(),
 answer: z.string(),
 acceptable_answers: z.array(z.string()).optional().default([]),
 explanation_vi: z.string().optional().default(""),
 grammar_refs: z.array(z.string()).optional().default([]),
 vocab_refs: z.array(z.string()).optional().default([]),
 grading: GradingSchema.optional(),
});

export const AnswerKeyItemSchema = z
 .object({
  question_id: z.string().optional(),
  blank_id: z.string().optional(),
  answer: z.union([z.string(), z.boolean(), z.number()]).optional(),
  sample_answer: z.string().optional(),
  label: z.string().optional(),
  check_needed: z.boolean().optional(),
 })
 .passthrough();

export const ChooseWordsFillBlankExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("choose_words_fill_blank"),
 word_bank: z.array(z.string()),
 questions: z.array(FillBlankQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
});

export const FillBlankExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("fill_blank"),
 questions: z.array(FillBlankQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
});

export const AnswerWithPatternQuestionSchema = z.object({
 id: z.string(),
 prompt: z.string(),
 response_prompt: z.string().optional(),
 sample_answer: z.string(),
 acceptable_answers: z.array(z.string()).optional().default([]),
 grading: GradingSchema.optional(),
 grammar_refs: z.array(z.string()).optional().default([]),
});

export const AnswerWithPatternExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("answer_with_pattern"),
 pattern: z.string(),
 model: z.object({
  prompt: z.string(),
  answer: z.string(),
 }),
 questions: z.array(AnswerWithPatternQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
});

export const CompleteDialogueLineSchema = z.object({
 speaker: z.string().optional(),
 text: z.string(),
 blank_id: z.string().optional(),
});

export const CompleteDialogueSampleAnswerSchema = z.object({
 blank_id: z.string(),
 answer: z.string(),
 explanation_vi: z.string().optional().default(""),
});

export const CompleteDialogueItemSchema = z.object({
 id: z.string(),
 lines: z.array(CompleteDialogueLineSchema),
 sample_answers: z
  .array(CompleteDialogueSampleAnswerSchema)
  .optional()
  .default([]),
 grading: GradingSchema.optional(),
});

export const CompleteDialogueExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("complete_dialogue"),
 dialogues: z.array(CompleteDialogueItemSchema),
});

export const CorrectSentenceQuestionSchema = z.object({
 id: z.string(),
 wrong_sentence: z.string(),
 correct_sentence: z.string(),
 acceptable_answers: z.array(z.string()).optional().default([]),
 explanation_vi: z.string().optional().default(""),
 grammar_refs: z.array(z.string()).optional().default([]),
 check_needed: z.boolean().optional().default(false),
});

export const CorrectSentenceExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("correct_sentence"),
 questions: z.array(CorrectSentenceQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
});

export const ChoiceSchema = z.object({
 id: z.string(),
 text: z.string(),
});

export const MultipleChoiceQuestionSchema = z.object({
 id: z.string(),
 prompt: z.string(),
 choices: z.array(ChoiceSchema),
 answer: z.string(),
 explanation_vi: z.string().optional().default(""),
 grammar_refs: z.array(z.string()).optional().default([]),
 evidence: EvidenceSchema.optional(),
});

export const MultipleChoiceExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("multiple_choice"),
 questions: z.array(MultipleChoiceQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
});

export const CommunicationDialogueLineSchema = z.object({
 speaker: z.string(),
 text: z.string(),
});

export const CommunicationPracticeTaskSchema = z
 .object({
  id: z.string(),
  type: z.string(),
  instruction_vi: z.string(),
  sample_answer: z.array(z.string()).optional().default([]),
 })
 .passthrough();

export const CommunicationDialogueExerciseSchema = ExerciseBaseSchema.extend({
 type: z.literal("communication_dialogue"),
 function: z.string().optional().default(""),
 function_vi: z.string().optional().default(""),
 dialogue: z.array(CommunicationDialogueLineSchema),
 practice_tasks: z
  .array(CommunicationPracticeTaskSchema)
  .optional()
  .default([]),
});

export const GenericExerciseSchema = ExerciseBaseSchema.passthrough();

export const ExerciseSchema = z
 .discriminatedUnion("type", [
  PhoneticsExerciseSchema,
  SubstitutionExerciseSchema,
  ChooseWordsFillBlankExerciseSchema,
  FillBlankExerciseSchema,
  AnswerWithPatternExerciseSchema,
  CompleteDialogueExerciseSchema,
  CorrectSentenceExerciseSchema,
  MultipleChoiceExerciseSchema,
  CommunicationDialogueExerciseSchema,
 ])
 .or(GenericExerciseSchema);

/* -------------------------------------------------------------------------- */
/* Reading section                                                            */
/* -------------------------------------------------------------------------- */

export const SupplementaryWordSchema = z.object({
 id: z.string(),
 hanzi: z.string(),
 pinyin: z.string().optional().default(""),
 meaning_vi: z.string(),
 vocab_ref: z.string().optional().default(""),
});

export const ReadingParagraphSchema = z.object({
 id: z.string(),
 order: z.number().int().positive(),
 zh: z.string(),
 pinyin: z.string().optional().default(""),
 vi: z.string().optional().default(""),
 grammar_refs: z.array(z.string()).optional().default([]),
 vocab_refs: z.array(z.string()).optional().default([]),
});

export const ReadingTextItemSchema = z.object({
 id: z.string(),
 type: z.literal("reading_text"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 supplementary_words: z.array(SupplementaryWordSchema).optional().default([]),
 paragraphs: z.array(ReadingParagraphSchema),
 check_needed: z.boolean().optional().default(false),
});

export const ReadingShortAnswerQuestionSchema = z.object({
 id: z.string(),
 question: z.object({
  zh: z.string(),
  vi: z.string().optional().default(""),
 }),
 answer: z.object({
  zh: z.string(),
  vi: z.string().optional().default(""),
 }),
 acceptable_answers: z.array(z.string()).optional().default([]),
 evidence: EvidenceSchema.optional(),
 grading: GradingSchema.optional(),
});

export const ReadingShortAnswerItemSchema = z.object({
 id: z.string(),
 type: z.literal("reading_short_answer"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 source_text_ref: z.string(),
 questions: z.array(ReadingShortAnswerQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
 rendering: RenderingSchema.optional(),
 check_needed: z.boolean().optional().default(false),
});

export const ReadingTrueFalseQuestionSchema = z.object({
 id: z.string(),
 statement: z.object({
  zh: z.string(),
  vi: z.string().optional().default(""),
 }),
 answer: z.boolean(),
 correct_answer_label: z.string().optional(),
 evidence: EvidenceSchema.optional(),
 explanation_vi: z.string().optional().default(""),
});

export const ReadingTrueFalseItemSchema = z.object({
 id: z.string(),
 type: z.literal("reading_true_false"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 source_text_ref: z.string(),
 questions: z.array(ReadingTrueFalseQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
 rendering: RenderingSchema.optional(),
 check_needed: z.boolean().optional().default(false),
});

export const ClozeTextSegmentSchema = z.object({
 id: z.string(),
 type: z.literal("text"),
 text: z.string(),
});

export const ClozeBlankSegmentSchema = z.object({
 id: z.string(),
 type: z.literal("blank"),
 blank_id: z.string(),
});

export const ClozeSegmentSchema = z.discriminatedUnion("type", [
 ClozeTextSegmentSchema,
 ClozeBlankSegmentSchema,
]);

export const ClozePassageSchema = z.object({
 id: z.string(),
 segments: z.array(ClozeSegmentSchema),
});

export const ClozeAnswerSchema = z.object({
 blank_id: z.string(),
 answer: z.string(),
 acceptable_answers: z.array(z.string()).optional().default([]),
 explanation_vi: z.string().optional().default(""),
 grammar_refs: z.array(z.string()).optional().default([]),
});

export const ReadingClozeItemSchema = z.object({
 id: z.string(),
 type: z.literal("reading_cloze"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 instruction: InstructionSchema.optional().default({ zh: "", vi: "" }),
 word_bank: z.array(z.string()).optional().default([]),
 passage: ClozePassageSchema,
 answers: z.array(ClozeAnswerSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
 rendering: RenderingSchema.optional(),
 check_needed: z.boolean().optional().default(false),
});

export const ReadingMultipleChoiceItemSchema = z.object({
 id: z.string(),
 type: z.literal("reading_multiple_choice"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 source_text_ref: z.string(),
 questions: z.array(MultipleChoiceQuestionSchema),
 answer_key: z.array(AnswerKeyItemSchema).optional().default([]),
 rendering: RenderingSchema.optional(),
 check_needed: z.boolean().optional().default(false),
});

export const GenericReadingItemSchema = z
 .object({
  id: z.string(),
  type: z.string(),
  order: z.number().int().positive(),
  title: z.string(),
  title_vi: z.string().optional().default(""),
  check_needed: z.boolean().optional().default(false),
 })
 .passthrough();

export const ReadingItemSchema = z
 .discriminatedUnion("type", [
  ReadingTextItemSchema,
  ReadingShortAnswerItemSchema,
  ReadingTrueFalseItemSchema,
  ReadingClozeItemSchema,
  ReadingMultipleChoiceItemSchema,
 ])
 .or(GenericReadingItemSchema);

/* -------------------------------------------------------------------------- */
/* Character writing section                                                  */
/* -------------------------------------------------------------------------- */

export const CharacterWritingItemSchema = z.object({
 id: z.string(),
 type: z.literal("character_writing_item"),
 order: z.number().int().positive(),
 hanzi: z.string(),
 pinyin: z.string().optional().default(""),
 vocab_ref: z.string().optional().default(""),
 stroke_count: z.number().int().positive().nullable().optional(),
 radical: z.string().optional().default(""),
 stroke_order_key: z.string().optional().default(""),
 practice: z
  .object({
   grid_type: z.string().optional().default("田字格"),
   repeat_count: z.number().int().positive().optional().default(6),
  })
  .optional()
  .default({ grid_type: "田字格", repeat_count: 6 }),
});

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

export const TextSectionSchema = z.object({
 id: z.string(),
 type: z.literal("text"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 blocks: z.array(TextBlockSchema),
});

export const VocabularySectionSchema = z.object({
 id: z.string(),
 type: z.literal("vocabulary"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 items: z.array(VocabularyItemSchema),
});

export const NotesSectionSchema = z.object({
 id: z.string(),
 type: z.literal("notes"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 items: z.array(NoteItemSchema),
});

export const GrammarSectionSchema = z.object({
 id: z.string(),
 type: z.literal("grammar"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 items: z.array(GrammarPointSchema),
});

export const ExercisesSectionSchema = z.object({
 id: z.string(),
 type: z.literal("exercises"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 items: z.array(ExerciseSchema),
});

export const ReadingSectionSchema = z.object({
 id: z.string(),
 type: z.literal("reading"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 items: z.array(ReadingItemSchema),
});

export const CharacterWritingSectionSchema = z.object({
 id: z.string(),
 type: z.literal("character_writing"),
 order: z.number().int().positive(),
 title: z.string(),
 title_vi: z.string().optional().default(""),
 items: z.array(CharacterWritingItemSchema),
});

export const ProperNounsSectionSchema = z
 .object({
  id: z.string(),
  type: z.literal("proper_nouns"),
  order: z.number().int().positive(),
  title: z.string(),
  title_vi: z.string().optional().default(""),
  items: z.array(z.unknown()).optional().default([]),
 })
 .passthrough();

export const CommunicationSectionSchema = z
 .object({
  id: z.string(),
  type: z.literal("communication"),
  order: z.number().int().positive(),
  title: z.string(),
  title_vi: z.string().optional().default(""),
  items: z.array(z.unknown()).optional().default([]),
 })
 .passthrough();

export const SectionSchema = z.discriminatedUnion("type", [
 TextSectionSchema,
 VocabularySectionSchema,
 ProperNounsSectionSchema,
 NotesSectionSchema,
 GrammarSectionSchema,
 ExercisesSectionSchema,
 CommunicationSectionSchema,
 ReadingSectionSchema,
 CharacterWritingSectionSchema,
]);

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

export const SummaryGrammarPointSchema = z.object({
 id: z.string(),
 title: z.string(),
});

export const SummaryPatternSchema = z.object({
 pattern: z.string(),
 grammar_ref: z.string(),
});

export const LessonSummarySchema = z.object({
 lesson_parts: z.array(z.string()),
 grammar_points: z.array(SummaryGrammarPointSchema).optional().default([]),
 main_patterns: z.array(SummaryPatternSchema).optional().default([]),
 exercise_types: z.array(z.string()).optional().default([]),
 check_needed: z.boolean().optional().default(false),
});

/* -------------------------------------------------------------------------- */
/* Final lesson schema                                                        */
/* -------------------------------------------------------------------------- */

export const LessonSchema = z.object({
 id: z.string(),
 title: LocalizedTextSchema,
 tags: z.array(z.string()).optional().default([]),
 sections: z.array(SectionSchema),
 summary: LessonSummarySchema,
});

export const HanyuLessonSchema = z.object({
 schema_version: z.string().regex(/^2\.\d+\.\d+$/),
 content_type: z.literal("chinese_textbook_lesson"),
 source: SourceSchema,
 lesson: LessonSchema,
});

/* -------------------------------------------------------------------------- */
/* Exported TypeScript types                                                  */
/* -------------------------------------------------------------------------- */

export type HanyuLesson = z.infer<typeof HanyuLessonSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Section = z.infer<typeof SectionSchema>;

export type TextBlock = z.infer<typeof TextBlockSchema>;
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type NoteItem = z.infer<typeof NoteItemSchema>;
export type GrammarPoint = z.infer<typeof GrammarPointSchema>;
export type GrammarBlock = z.infer<typeof GrammarBlockSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ReadingItem = z.infer<typeof ReadingItemSchema>;
export type CharacterWritingItem = z.infer<typeof CharacterWritingItemSchema>;

export type Example = z.infer<typeof ExampleSchema>;
export type Grading = z.infer<typeof GradingSchema>;
export type Rendering = z.infer<typeof RenderingSchema>;

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

export function parseHanyuLesson(input: unknown): HanyuLesson {
 return HanyuLessonSchema.parse(input);
}

export function safeParseHanyuLesson(input: unknown) {
 return HanyuLessonSchema.safeParse(input);
}
