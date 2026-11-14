import { z } from "zod";
import {
 DeepVocabularyItemSchema,
 VocabularyExampleSchema,
} from "@/features/hanzihome/schemas/vocab.schema";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import itWebVocabSeed from "./it-web-vocab.json";

const itWebExampleSchema = z.object({
 id: z.string().min(1),
 zh: z.string().min(1),
 pinyin: z.string(),
 vi: z.string(),
});

const itWebVocabWordSchema = z.object({
 id: z.string().min(1),
 hanzi: z.string().min(1),
 pinyin: z.string().min(1),
 meaning: z.string().min(1),
 groupId: z.string().min(1),
 groupLabel: z.string().min(1),
 priorityBand: z.enum(["1-3", "4-6", "7-9"]),
 isCore20: z.boolean(),
 note: z.string(),
 examples: z.array(itWebExampleSchema),
});

const itWebGroupSchema = z.object({
 id: z.string().min(1),
 key: z.string().min(1),
 label: z.string().min(1),
 priority: z.enum(["1-3", "4-6", "7-9"]),
 items: z.array(itWebVocabWordSchema).min(1),
});

const itWebSentenceSchema = z.object({
 id: z.string().min(1),
 order: z.number().int().positive(),
 zh: z.string().min(1),
 pinyin: z.string().min(1),
 vi: z.string().min(1),
});

const itWebCorpusSchema = z.object({
 meta: z.object({
  title: z.string().min(1),
  version: z.number().int().positive(),
  groupCount: z.number().int().positive(),
  vocabCount: z.number().int().positive(),
  sentenceCount: z.number().int().positive(),
 }),
 groups: z.array(itWebGroupSchema).min(1),
 sentences: z.array(itWebSentenceSchema),
});

export type ItWebVocabWord = z.infer<typeof itWebVocabWordSchema>;
export type ItWebVocabGroup = z.infer<typeof itWebGroupSchema>;
export type ItWebVocabCorpus = z.infer<typeof itWebCorpusSchema>;
export type ItWebQuickPreset = "all" | "core20" | "band-1-3" | "band-4-6" | "band-7-9";

let _itWebCorpus: ItWebVocabCorpus | null = null;

export function getItWebVocabCorpus(): ItWebVocabCorpus {
 if (!_itWebCorpus) {
  _itWebCorpus = itWebCorpusSchema.parse(itWebVocabSeed);
 }
 return _itWebCorpus;
}

export function itWebWordToHanziHomeVocabItem(
 item: ItWebVocabWord,
 order: number,
): HanziHomeVocabItem {
 const noteObjects = item.note ? [{ text_vi: item.note }] : [];
 const examples = item.examples.map((ex, idx) =>
  VocabularyExampleSchema.parse({
   id: ex.id,
   order: idx + 1,
   zh: ex.zh,
   pinyin: ex.pinyin,
   vi: ex.vi,
   analysis_vi: item.note || "",
   highlight: [item.hanzi],
   grammar_refs: [],
   vocab_refs: [item.id],
   source_ref: item.groupLabel,
   level: "basic",
   audio_key: "",
   notes: noteObjects,
   check_needed: false,
  }),
 );

 const parsedBase = DeepVocabularyItemSchema.parse({
  id: item.id,
  order,
  hanzi: item.hanzi,
  pinyin: item.pinyin,
  pos: {
   raw_vi: item.isCore20 ? "Cốt lõi IT" : "IT / Web",
   raw_cn: "",
   normalized: "unknown",
   notes: [],
  },
  level_tag: "unknown",
  tags: ["it-web", item.groupId],
  meaning: {
   hanviet: "",
   meaning_vi: item.meaning,
   meaning_en: "",
   natural_translations_vi: [item.meaning],
   short_definition_vi: item.meaning,
   textbook_focus_vi: item.groupLabel,
   register_vi: "Giao tiếp công việc IT",
   usage_domain_vi: "Làm website / Phần mềm",
   notes: noteObjects,
  },
  word_formation: {
   characters: [],
   word_logic_vi: "",
   memory_tip_vi: item.note,
   warning_vi: "",
   notes: noteObjects,
   check_needed: false,
  },
  comparison: {
   near_synonyms: [],
   antonyms: [],
   contrast_pairs: [],
   usage_rules: item.note ? [item.note] : [],
   notes: [],
  },
  collocations: [],
  examples,
  audio_key: "",
  raw_markdown: "",
  notes: noteObjects,
  check_needed: false,
 });

 return {
  ...parsedBase,
  examples,
  runtimeId: item.id,
  lessonId: item.groupId,
  category: item.isCore20 ? "Cốt lõi IT" : "IT / Web",
  tone: "",
  detailSections: [],
 };
}

export function getItWebVocabItemsByFilter(options?: {
 preset?: ItWebQuickPreset;
 groupIds?: readonly string[];
}): HanziHomeVocabItem[] {
 const corpus = getItWebVocabCorpus();
 const preset = options?.preset ?? "all";
 const groupSet =
  options?.groupIds && options.groupIds.length > 0 ? new Set(options.groupIds) : null;

 const rawWords: ItWebVocabWord[] = [];
 for (const group of corpus.groups) {
  if (groupSet && !groupSet.has(group.id)) continue;
  for (const word of group.items) {
   if (preset === "core20" && !word.isCore20) continue;
   if (preset === "band-1-3" && word.priorityBand !== "1-3") continue;
   if (preset === "band-4-6" && word.priorityBand !== "4-6") continue;
   if (preset === "band-7-9" && word.priorityBand !== "7-9") continue;
   rawWords.push(word);
  }
 }

 return rawWords.map((word, idx) => itWebWordToHanziHomeVocabItem(word, idx + 1));
}
