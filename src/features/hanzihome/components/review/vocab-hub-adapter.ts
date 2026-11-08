import {
 DeepVocabularyItemSchema,
 VocabularyExampleSchema,
} from "@/features/hanzihome/schemas/vocab.schema";
import type { CustomVocabItem, HanziHomeVocabItem } from "@/features/hanzihome/types";
import {
 getTextbookCatalog,
 getTextbookLesson,
 type TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { textbookLessonToReviewLesson } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import { adaptAllLessonExercises } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import { adaptTextbookGrammarToPip, type PipGrammarPoint } from "./pip-grammar-adapter";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

export type BookmarkedLessonEntry = {
 readonly id: string;
 readonly bookKey: TextbookLesson["bookKey"];
 readonly bookLabel: string;
 readonly number: number;
 readonly title: string;
 readonly vocabCount: number;
};

export type BookmarkedTextbookGroup = {
 readonly bookKey: TextbookLesson["bookKey"];
 readonly bookLabel: string;
 readonly lessons: readonly BookmarkedLessonEntry[];
 readonly totalVocabCount: number;
};

export type StudyBundle = {
 readonly title: string;
 readonly vocabItems: readonly HanziHomeVocabItem[];
 readonly grammarItems: readonly PipGrammarPoint[];
 readonly practiceItems: readonly UniversalExerciseItem[];
};

export function customVocabToHanziHomeVocabItem(
 item: CustomVocabItem,
 order: number,
): HanziHomeVocabItem {
 const noteObjects = item.note ? [{ text_vi: item.note }] : [];
 const examples = item.exampleZh
  ? [
     VocabularyExampleSchema.parse({
      id: `${item.id}:ex:1`,
      order: 1,
      zh: item.exampleZh,
      pinyin: "",
      vi: item.exampleVi ?? "",
      analysis_vi: item.note ?? "",
      highlight: [item.hanzi],
      grammar_refs: [],
      vocab_refs: [item.id],
      source_ref: "Kho từ riêng",
      level: "basic",
      audio_key: "",
      notes: noteObjects,
      check_needed: false,
     }),
    ]
  : [];

 const parsedBase = DeepVocabularyItemSchema.parse({
  id: item.id,
  order,
  hanzi: item.hanzi,
  pinyin: item.pinyin || "",
  pos: {
   raw_vi: item.pos || "Kho riêng",
   raw_cn: "",
   normalized: "unknown",
   notes: [],
  },
  level_tag: "unknown",
  tags: ["custom-vault"],
  meaning: {
   hanviet: item.hanviet ?? "",
   meaning_vi: item.meaning,
   meaning_en: "",
   natural_translations_vi: [item.meaning],
   short_definition_vi: item.meaning,
   textbook_focus_vi: item.note ?? "",
   register_vi: "",
   usage_domain_vi: "",
   notes: noteObjects,
  },
  word_formation: {
   characters: [],
   word_logic_vi: "",
   memory_tip_vi: item.note ?? "",
   warning_vi: "",
   notes: noteObjects,
   check_needed: false,
  },
  comparison: {
   near_synonyms: [],
   antonyms: [],
   contrast_pairs: [],
   usage_rules: [],
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
  lessonId: "custom-vault",
  category: item.pos || "Kho riêng",
  tone: "",
  detailSections: [],
 };
}

export function customVocabListToHanziHomeVocabItems(
 items: readonly CustomVocabItem[],
): HanziHomeVocabItem[] {
 return items.map((item, idx) => customVocabToHanziHomeVocabItem(item, idx + 1));
}

const HANZI_REGEX = /[\u4e00-\u9fff]/u;

export function parseBulkCustomVocabInput(
 rawText: string,
): Omit<CustomVocabItem, "id" | "createdAt">[] {
 const lines = rawText
  .split(/\r?\n/u)
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

 const results: Omit<CustomVocabItem, "id" | "createdAt">[] = [];

 for (const line of lines) {
  // Skip markdown table header or separator lines
  if (/^\|?[\s\-:|]+\|?$/u.test(line)) continue;
  if (line.includes("中文") && line.includes("Pinyin")) continue;

  let parts: string[] = [];
  if (line.includes("|")) {
   parts = line.split("|").map((p) => p.trim());
   if (parts[0] === "") parts.shift();
   if (parts.at(-1) === "") parts.pop();
  } else if (line.includes("\t")) {
   parts = line.split("\t").map((p) => p.trim());
  } else if (/\s+[-–—:]\s+/u.test(line)) {
   parts = line
    .split(/\s+[-–—:]\s+/u)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  } else if (line.includes(":")) {
   const colonIdx = line.indexOf(":");
   parts = [line.slice(0, colonIdx).trim(), line.slice(colonIdx + 1).trim()].filter(Boolean);
  } else if (line.includes("-")) {
   const dashIdx = line.indexOf("-");
   parts = [line.slice(0, dashIdx).trim(), line.slice(dashIdx + 1).trim()].filter(Boolean);
  }

  if (parts.length >= 3) {
   const hanzi = parts[0] ?? "";
   const pinyin = parts[1] ?? "";
   const meaning = parts[2] ?? "";
   const fourth = parts[3] ?? "";
   const fifth = parts[4] ?? "";
   const hasChineseInFourth = Boolean(fourth && HANZI_REGEX.test(fourth));
   if (hanzi && meaning && HANZI_REGEX.test(hanzi)) {
    results.push({
     hanzi,
     pinyin,
     meaning,
     exampleZh: hasChineseInFourth ? fourth : undefined,
     exampleVi: hasChineseInFourth && fifth ? fifth : undefined,
     note: !hasChineseInFourth && fourth ? fourth : fifth || undefined,
    });
   }
  } else if (parts.length === 2) {
   const first = parts[0] ?? "";
   const second = parts[1] ?? "";
   // Check if first part has "hanzi (pinyin)" format
   const parenMatch = first.match(/^([\u4e00-\u9fff\s…，、]+)\s*[(（]([^)）]+)[)）]$/u);
   if (parenMatch) {
    const hanzi = parenMatch[1]?.trim() ?? "";
    const pinyin = parenMatch[2]?.trim() ?? "";
    if (hanzi && second) {
     results.push({ hanzi, pinyin, meaning: second });
    }
   } else if (first && second && HANZI_REGEX.test(first)) {
    results.push({ hanzi: first, pinyin: "", meaning: second });
   }
  }
 }

 return results;
}

export function buildExercisesFromVocabItems(
 items: readonly HanziHomeVocabItem[],
): UniversalExerciseItem[] {
 if (items.length === 0) return [];
 const exercises: UniversalExerciseItem[] = [];

 // 1. Contextual sentence cloze for items that have an example sentence containing the word
 items.forEach((item, index) => {
  const meaning = getVocabDisplayMeaning(item);
  const firstExample = item.examples[0];
  const cleanTarget = item.hanzi.replace(/……/gu, "").trim();

  if (firstExample && cleanTarget && firstExample.zh.includes(cleanTarget)) {
   const splitIdx = firstExample.zh.indexOf(cleanTarget);
   const preText = firstExample.zh.slice(0, splitIdx);
   const postText = firstExample.zh.slice(splitIdx + cleanTarget.length);
   const maskedSentence = `${preText}____${postText}`;

   exercises.push({
    id: `vocab-ex-cloze-${item.id}-${index}`,
    category: "vocab_cloze",
    title: "Điền từ vào câu giao tiếp",
    prompt: maskedSentence,
    promptTranslation: firstExample.vi || meaning,
    hint: `${item.pinyin ? `${item.pinyin} · ` : ""}${meaning}`,
    explanation: item.meaning.notes[0]?.text_vi || undefined,
    audioText: firstExample.zh,
    interaction: {
     type: "cloze",
     expectedAnswer: cleanTarget,
     placeholder: "Nhập từ tiếng Trung còn thiếu...",
     preText,
     postText,
    },
   });
  }
 });

 // 2. Multiple-choice & recall exercises from meaning -> Hanzi
 items.forEach((item, index) => {
  const meaning = getVocabDisplayMeaning(item);
  if (!meaning) return;

  if (items.length >= 4) {
   const distractors: HanziHomeVocabItem[] = [];
   const distractorHanzi = new Set<string>();
   for (let offset = 1; offset < items.length && distractors.length < 3; offset++) {
    const candidate = items[(index + offset) % items.length];
    if (candidate && candidate.hanzi !== item.hanzi && !distractorHanzi.has(candidate.hanzi)) {
     distractors.push(candidate);
     distractorHanzi.add(candidate.hanzi);
    }
   }

   if (distractors.length === 3) {
    const rawChoices = [item, ...distractors];
    const keys = ["A", "B", "C", "D"];
    const shift = index % 4;
    const rotated = rawChoices.map((_, i) => rawChoices[(i + shift) % 4] ?? item);
    const correctIdx = rotated.findIndex((c) => c.hanzi === item.hanzi);
    const correctKey = keys[correctIdx >= 0 ? correctIdx : 0] ?? "A";

    exercises.push({
     id: `vocab-ex-choice-${item.id}-${index}`,
     category: "practice_choice",
     title: "Phản xạ từ vựng",
     prompt: `Từ/cụm từ nào mang nghĩa: "${meaning}"?`,
     hint: item.pinyin || undefined,
     explanation: item.meaning.notes[0]?.text_vi || `${item.hanzi} (${item.pinyin}): ${meaning}`,
     audioText: item.hanzi,
     interaction: {
      type: "choice",
      correctKey,
      options: rotated.map((choice, i) => ({
       key: keys[i] ?? "A",
       label: choice.pinyin ? `${choice.hanzi} (${choice.pinyin})` : choice.hanzi,
      })),
     },
    });
    return;
   }
  }

  // Fallback cloze when fewer than 4 items
  exercises.push({
   id: `vocab-ex-recall-${item.id}-${index}`,
   category: "vocab_cloze",
   title: "Gõ từ theo nghĩa tiếng Việt",
   prompt: meaning,
   hint: item.pinyin || undefined,
   audioText: item.hanzi,
   interaction: {
    type: "cloze",
    expectedAnswer: item.hanzi.replace(/……/gu, ""),
    placeholder: "Nhập chữ Hán tương ứng...",
   },
  });
 });

 return exercises;
}

export function getBookmarkedTextbookGroups(
 bookmarkedLessonIds: readonly string[],
): BookmarkedTextbookGroup[] {
 const bookmarkedSet = new Set(bookmarkedLessonIds);
 const catalog = getTextbookCatalog();
 const groups: BookmarkedTextbookGroup[] = [];

 for (const book of catalog) {
  const matchedLessons: BookmarkedLessonEntry[] = book.lessons
   .filter((lesson) => bookmarkedSet.has(lesson.id))
   .map((lesson) => ({
    id: lesson.id,
    bookKey: lesson.bookKey,
    bookLabel: book.label,
    number: lesson.number,
    title: lesson.title,
    vocabCount: lesson.vocabCount,
   }));

  if (matchedLessons.length > 0) {
   const totalVocabCount = matchedLessons.reduce((sum, l) => sum + l.vocabCount, 0);
   groups.push({
    bookKey: book.key,
    bookLabel: book.label,
    lessons: matchedLessons,
    totalVocabCount,
   });
  }
 }

 return groups;
}

export function buildStudyBundleFromBookmarkedLessons(
 selectedLessonEntries: readonly BookmarkedLessonEntry[],
): StudyBundle {
 const vocabItems: HanziHomeVocabItem[] = [];
 const grammarItems: PipGrammarPoint[] = [];
 const practiceItems: UniversalExerciseItem[] = [];
 const seenVocabIds = new Set<string>();

 for (const entry of selectedLessonEntries) {
  const fullLesson = getTextbookLesson(entry.bookKey, entry.number);
  if (!fullLesson) continue;

  const reviewLesson = textbookLessonToReviewLesson(fullLesson);
  for (const word of reviewLesson.vocab) {
   const uniqueKey = `${entry.id}:${word.id}`;
   if (seenVocabIds.has(uniqueKey)) continue;
   seenVocabIds.add(uniqueKey);
   vocabItems.push(word);
  }

  const lessonGrammar = adaptTextbookGrammarToPip(fullLesson.sections);
  grammarItems.push(...lessonGrammar);

  const lessonExercises = adaptAllLessonExercises(fullLesson);
  practiceItems.push(...lessonExercises);
 }

 const fallbackExercises =
  practiceItems.length > 0 ? practiceItems : buildExercisesFromVocabItems(vocabItems);

 const title =
  selectedLessonEntries.length === 1
   ? `${selectedLessonEntries[0]?.bookLabel ?? "Giáo trình"} · ${selectedLessonEntries[0]?.title ?? ""}`
   : `Ôn tập ${selectedLessonEntries.length} bài đã đánh dấu`;

 return {
  title,
  vocabItems,
  grammarItems,
  practiceItems: fallbackExercises,
 };
}
