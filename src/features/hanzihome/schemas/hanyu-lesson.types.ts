import type { z } from "zod";

import type {
 CharacterWritingItemSchema,
 ExerciseSchema,
 GrammarBlockSchema,
 GrammarPointSchema,
 HanyuLessonSchema,
 NoteItemSchema,
 ReadingItemSchema,
 SectionSchema,
 TextBlockSchema,
 VocabularyItemSchema,
} from "./hanyu-lesson.schema";

export type HanyuLesson = z.output<typeof HanyuLessonSchema>;
export type Section = z.output<typeof SectionSchema>;
export type TextBlock = z.output<typeof TextBlockSchema>;
export type VocabularyItem = z.output<typeof VocabularyItemSchema>;
export type NoteItem = z.output<typeof NoteItemSchema>;
export type GrammarPoint = z.output<typeof GrammarPointSchema>;
export type GrammarBlock = z.output<typeof GrammarBlockSchema>;
export type Exercise = z.output<typeof ExerciseSchema>;
export type ReadingItem = z.output<typeof ReadingItemSchema>;
export type CharacterWritingItem = z.output<typeof CharacterWritingItemSchema>;
