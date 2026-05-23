import { z } from "zod";

export const vocabDraftExampleSchema = z.object({
  chinese: z.string(),
  pinyin: z.string(),
  translation: z.string(),
  note: z.string(),
});

export const vocabDraftCollocationSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
});

export const vocabDraftSectionsSchema = z.object({
  meaning: z.string(),
  characterLogic: z.string(),
  comparison: z.string(),
  culture: z.string(),
  warning: z.string(),
});

export const vocabDraftItemSchema = z.object({
  id: z.string(),
  word: z.string(),
  pinyin: z.string(),
  hanViet: z.string(),
  meaning: z.string(),
  partOfSpeech: z.string(),
  level: z.string(),
  category: z.string(),
  sections: vocabDraftSectionsSchema,
  collocations: z.array(vocabDraftCollocationSchema),
  examples: z.array(vocabDraftExampleSchema),
  rawMarkdown: z.string(),
});

export const vocabDraftImportResultSchema = z.object({
  items: z.array(vocabDraftItemSchema),
  warnings: z.array(z.string()),
});

export type VocabDraftExample = z.infer<typeof vocabDraftExampleSchema>;
export type VocabDraftCollocation = z.infer<typeof vocabDraftCollocationSchema>;
export type VocabDraftSections = z.infer<typeof vocabDraftSectionsSchema>;
export type VocabDraftItem = z.infer<typeof vocabDraftItemSchema>;
export type VocabDraftImportResult = z.infer<typeof vocabDraftImportResultSchema>;

export function createEmptyVocabDraftItem(): VocabDraftItem {
  return {
    id: `vocab-${Date.now()}`,
    word: "",
    pinyin: "",
    hanViet: "",
    meaning: "",
    partOfSpeech: "",
    level: "",
    category: "Chưa phân nhóm",
    sections: {
      meaning: "",
      characterLogic: "",
      comparison: "",
      culture: "",
      warning: "",
    },
    collocations: [],
    examples: [],
    rawMarkdown: "",
  };
}
