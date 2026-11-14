import "server-only";

import { runtimeDeepVocabularyItemSchema } from "@/features/hanzihome/schemas/runtime-content.schema";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import type { VocabRow } from "./supabase-content-row.schemas";
import {
 isMissingRequiredText,
 normalizeLevel,
 normalizePos,
 normalizeText,
} from "./supabase-hanzihome-content-utils";

function detailLines(rows: VocabRow["details"], key: string) {
 return rows
  .filter((row) => row.section_key === key)
  .sort((left, right) => left.section_order - right.section_order)
  .flatMap((row) => row.lines)
  .map((line) => line.trim())
  .filter(Boolean);
}

export function vocabRowToViewModel(row: VocabRow): HanziHomeVocabItem {
 const meaningLines = detailLines(row.details, "meaning");
 const wordFormationLines = detailLines(row.details, "word_formation");
 const comparisonLines = detailLines(row.details, "comparison");
 const cultureLines = detailLines(row.details, "culture");
 const warningLines = detailLines(row.details, "warnings");
 const noteLines = detailLines(row.details, "notes");
 const collocationRows = row.details
  .filter((detail) => detail.section_key === "collocations")
  .sort((left, right) => left.section_order - right.section_order)
  .flatMap((detail) => detail.lines);
 const coreNeedsReview = isMissingRequiredText(row.pinyin) || isMissingRequiredText(row.meaning);

 const parsed = runtimeDeepVocabularyItemSchema.parse({
  id: row.id,
  order: row.item_order,
  hanzi: row.word,
  pinyin: normalizeText(row.pinyin),
  pos: {
   raw_vi: normalizeText(row.pos_vi),
   raw_cn: normalizeText(row.pos_zh),
   normalized: normalizePos(row.pos_vi),
   notes: [],
  },
  level_tag: normalizeLevel(row.level),
  tags: [],
  meaning: {
   hanviet: row.han_viet,
   meaning_vi: normalizeText(row.meaning),
   meaning_en: row.meaning_en ?? "",
   natural_translations_vi: row.meaning ? [row.meaning] : [],
   short_definition_vi: meaningLines[0] || row.meaning,
   textbook_focus_vi: meaningLines.slice(1).join("\n"),
   register_vi: "",
   usage_domain_vi: "",
   notes: noteLines.map((line, index) => ({
    id: `${row.id}:note:${index + 1}`,
    kind: "general",
    text_vi: line,
   })),
  },
  word_formation: {
   characters: [],
   word_logic_vi: wordFormationLines.join("\n"),
   memory_tip_vi: "",
   warning_vi: "",
   notes: [],
   check_needed: coreNeedsReview,
  },
  comparison: {
   near_synonyms: [],
   antonyms: [],
   contrast_pairs: [],
   usage_rules: comparisonLines,
   notes: [],
  },
  collocations: collocationRows.map((line, index) => ({
   id: `${row.id}:collocation:${index + 1}`,
   order: index + 1,
   zh: line,
   pinyin: "",
   vi: "",
   pattern: "",
   note_vi: "",
   tags: [],
   notes: [],
  })),
  examples: row.examples
   .slice()
   .sort((left, right) => left.example_order - right.example_order)
   .map((example) => ({
    id: example.id,
    order: example.example_order,
    zh: example.zh,
    pinyin: normalizeText(example.pinyin),
    vi: normalizeText(example.vi),
    analysis_vi: normalizeText(example.note),
    highlight: [],
    grammar_refs: [],
    vocab_refs: [],
    source_ref: "",
    level: "basic",
    audio_key: "",
    notes: [],
    check_needed: isMissingRequiredText(example.pinyin) || isMissingRequiredText(example.vi),
    editMeta: {
     entityType: "vocab_example",
     entityId: example.id,
     dbId: example.id,
     updatedAt: example.updated_at,
     parentEntityType: "vocab_item",
     parentEntityId: `${row.lesson_id}__${row.id}`,
     order: example.example_order,
     orderField: "example_order",
    },
   })),
  culture_note:
   cultureLines.length > 0
    ? {
       title: "Văn hóa và ngữ cảnh",
       content_vi: cultureLines.join("\n"),
       tags: [],
       source_refs: [],
       notes: [],
       check_needed: false,
      }
    : undefined,
  warnings: warningLines.map((line, index) => ({
   id: `${row.id}:warning:${index + 1}`,
   order: index + 1,
   rule_vi: line,
   natural_examples: [],
   unnatural_examples: [],
   wrong_examples: [],
   correct_examples: [],
   explanation_vi: "",
   severity: "warning",
   notes: [],
  })),
  audio_key: "",
  raw_markdown: "",
  notes: [],
  check_needed: coreNeedsReview,
 });

 return {
  ...parsed,
  examples: parsed.examples.map((example, index) => {
   const source = row.examples
    .slice()
    .sort((left, right) => left.example_order - right.example_order)[index];
   if (!source) return example;
   return {
    ...example,
    editMeta: {
     entityType: "vocab_example",
     entityId: source.id,
     dbId: source.id,
     updatedAt: source.updated_at,
     parentEntityType: "vocab_item",
     parentEntityId: `${row.lesson_id}__${row.id}`,
     order: source.example_order,
     orderField: "example_order",
    },
   };
  }),
  runtimeId: `${row.lesson_id}__${row.id}`,
  lessonId: row.lesson_id,
  category: row.category || "Từ vựng",
  tone: row.tone ?? "",
  tags: row.tags,
  detailSections: row.details
   .slice()
   .sort((left, right) => left.section_order - right.section_order)
   .map((detail) => ({
    id: detail.id,
    key: detail.section_key,
    title: detail.title,
    lines: detail.lines,
    order: detail.section_order,
    editMeta: {
     entityType: "vocab_detail_section",
     entityId: detail.id,
     dbId: detail.id,
     updatedAt: detail.updated_at,
     parentEntityType: "vocab_item",
     parentEntityId: `${row.lesson_id}__${row.id}`,
     order: detail.section_order,
     orderField: "section_order",
    },
   })),
  editMeta: {
   entityType: "vocab_item",
   entityId: `${row.lesson_id}__${row.id}`,
   dbId: row.id,
   updatedAt: row.updated_at,
   parentEntityType: "lesson",
   parentEntityId: row.lesson_id,
  },
 };
}
