import type { z } from "zod";

import type {
 CharacterAnalysisSchema,
 CollocationSchema,
 ComparisonSchema,
 CultureNoteSchema,
 DeepVocabularyItemSchema,
 MeaningSchema,
 WarningSchema,
 WordFormationSchema,
} from "./vocab.schema";

export type Meaning = z.output<typeof MeaningSchema>;
export type CharacterAnalysis = z.output<typeof CharacterAnalysisSchema>;
export type WordFormation = z.output<typeof WordFormationSchema>;
export type Comparison = z.output<typeof ComparisonSchema>;
export type Collocation = z.output<typeof CollocationSchema>;
export type CultureNote = z.output<typeof CultureNoteSchema>;
export type Warning = z.output<typeof WarningSchema>;
export type DeepVocabularyItem = z.output<typeof DeepVocabularyItemSchema>;
