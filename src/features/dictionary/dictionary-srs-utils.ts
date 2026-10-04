import { z } from "zod";
import type { JsonFieldValue } from "@/types/json";

const progressRowSchema = z.object({
 vocab_id: z.string(),
 dictionary_id: z.string().nullable().optional(),
 proficiency_level: z.number().nullable().optional(),
 is_favorited: z.boolean().nullable().optional(),
 personal_note: z.string().nullable().optional(),
 personal_note_mode: z.enum(["normal", "important"]).nullable().optional(),
 updated_at: z.string().nullable().optional(),
});

const legacyProgressRowSchema = progressRowSchema.omit({
 dictionary_id: true,
 personal_note: true,
 personal_note_mode: true,
 updated_at: true,
});

export const vocabRowSchema = z.object({
 id: z.string(),
 hanzi: z.string(),
 pinyin: z.string().nullable().optional(),
 sino_vietnamese: z.string().nullable().optional(),
 meaning: z.string().nullable().optional(),
});

export const dictionaryRowSchema = z.object({
 id: z.string(),
 headword: z.string(),
 pinyin: z.string().nullable().optional(),
 sino_vietnamese: z.string().nullable().optional(),
 ai_analysis: z.json().nullable().optional(),
});

export type ProgressRow = z.infer<typeof progressRowSchema>;
type VocabRow = z.infer<typeof vocabRowSchema>;
type DictionaryRow = z.infer<typeof dictionaryRowSchema>;

type SavedVocabItem = {
 id: string;
 dictionaryId?: string;
 hanzi: string;
 pinyin: string;
 hanViet: string;
 meaning: string;
 level: number;
 saved: boolean;
 note: string;
 updatedAt: string;
};

function getMeaningFromAnalysis(value: JsonFieldValue) {
 const parsed = z
  .object({
   meaning_summary: z.string().optional(),
   sino_vietnamese: z.string().optional(),
   han_viet: z.string().optional(),
   definitions: z
    .array(
     z.object({
      meaning: z.string().optional(),
      text: z.string().optional(),
     }),
    )
    .optional(),
  })
  .loose()
  .safeParse(value);

 if (!parsed.success) return { meaning: "", hanViet: "" };

 const firstDefinition = parsed.data.definitions?.find((item) => item.meaning || item.text);

 return {
  meaning: parsed.data.meaning_summary || firstDefinition?.meaning || firstDefinition?.text || "",
  hanViet: parsed.data.sino_vietnamese || parsed.data.han_viet || "",
 };
}

export function normalizeProgressRows(data: JsonFieldValue[], legacy: boolean): ProgressRow[] {
 return data.map((row) => {
  if (legacy) {
   return {
    ...legacyProgressRowSchema.parse(row),
    dictionary_id: null,
    personal_note: null,
    personal_note_mode: null,
    updated_at: null,
   };
  }
  return progressRowSchema.parse(row);
 });
}

export function buildSavedItems({
 progressRows,
 vocabRows,
 dictionaryRows,
}: {
 progressRows: ProgressRow[];
 vocabRows: VocabRow[];
 dictionaryRows: DictionaryRow[];
}): SavedVocabItem[] {
 const vocabById = new Map(vocabRows.map((row) => [row.id, row]));
 const dictionaryById = new Map(dictionaryRows.map((row) => [row.id, row]));

 return progressRows.flatMap((progress) => {
  const vocab = vocabById.get(progress.vocab_id);
  const dictionary = progress.dictionary_id ? dictionaryById.get(progress.dictionary_id) : null;
  const hanzi = dictionary?.headword || vocab?.hanzi;

  if (!hanzi) throw new Error("Saved vocabulary could not be resolved");

  const analysis = getMeaningFromAnalysis(dictionary?.ai_analysis);

  return [
   {
    id: progress.vocab_id,
    dictionaryId: progress.dictionary_id || undefined,
    hanzi,
    pinyin: dictionary?.pinyin || vocab?.pinyin || "",
    hanViet: dictionary?.sino_vietnamese || vocab?.sino_vietnamese || analysis.hanViet || "",
    meaning: analysis.meaning || vocab?.meaning || "",
    level: progress.proficiency_level ?? 0,
    saved: progress.is_favorited ?? true,
    note: progress.personal_note || "",
    updatedAt: progress.updated_at || "",
   },
  ];
 });
}

export function matchesQuery(item: SavedVocabItem, query: string, locale: string) {
 if (!query) return true;
 const haystack = [item.hanzi, item.pinyin, item.hanViet, item.meaning, item.note].join(" ");
 return haystack.toLocaleLowerCase(locale).includes(query);
}
