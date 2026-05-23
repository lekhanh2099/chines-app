import { z } from "zod";

export const grammarDraftExampleSchema = z.object({
  chinese: z.string(),
  pinyin: z.string(),
  translation: z.string(),
  note: z.string(),
});

export const grammarDraftItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  pattern: z.string(),
  shortMeaning: z.string(),
  coreLogic: z.string(),
  formulas: z.array(z.string()),
  examples: z.array(grammarDraftExampleSchema),
  comparisons: z.string(),
  pitfalls: z.string(),
  practice: z.string(),
  cultureNotes: z.string(),
  rawMarkdown: z.string(),
  confidence: z.number().min(0).max(1),
});

export const lessonDraftNotesSchema = z.object({
  overviewMarkdown: z.string(),
  grammarSummary: z.string(),
  vocabularyText: z.string(),
  properNounsText: z.string(),
  applicationMarkdown: z.string(),
  personalNote: z.string(),
});

export type GrammarDraftExample = z.infer<typeof grammarDraftExampleSchema>;
export type GrammarDraftItem = z.infer<typeof grammarDraftItemSchema>;
export type LessonDraftNotes = z.infer<typeof lessonDraftNotesSchema>;

export function createEmptyGrammarDraftItem(): GrammarDraftItem {
  return {
    id: `grammar-${Date.now()}`,
    title: "",
    pattern: "",
    shortMeaning: "",
    coreLogic: "",
    formulas: [],
    examples: [],
    comparisons: "",
    pitfalls: "",
    practice: "",
    cultureNotes: "",
    rawMarkdown: "",
    confidence: 0,
  };
}

export function createEmptyLessonDraftNotes(): LessonDraftNotes {
  return {
    overviewMarkdown: "",
    grammarSummary: "",
    vocabularyText: "",
    properNounsText: "",
    applicationMarkdown: "",
    personalNote: "",
  };
}
