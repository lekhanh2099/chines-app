import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderAnnotation } from "@/features/reader/runtime/reader-services";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import { analyzeContextualPronunciation } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { DictationSource } from "@/features/hanzihome/practice/translation-practice";
import { splitTrailingTranslation } from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import type { HanziHomeLesson, HanziHomeVocabItem } from "@/features/hanzihome/types";
import {
 DeepVocabularyItemSchema,
 PartOfSpeechSchema,
 VocabularyExampleSchema,
} from "@/features/hanzihome/schemas/vocab.schema";

const nonChineseTextPattern = /[^\p{Script=Han}\p{Number}\p{Punctuation}\p{Separator}\p{Symbol}]/gu;

export function isChineseOnlyText(value: string) {
 return value.replace(nonChineseTextPattern, "").trim().length === value.trim().length;
}

function tableColumns(block: TextbookLesson["sections"][number]["blocks"][number]) {
 const headers = block.rows[0] ?? [];
 const pinyinColumnIndex = headers.findIndex((header) => /pinyin/iu.test(header));
 const hanziColumnIndex = headers.findIndex((header) =>
  /tiếng trung|giản thể|hán tự|từ vựng|^từ$/iu.test(header),
 );
 return { headers, pinyinColumnIndex, hanziColumnIndex };
}

export function businessChineseTableColumns(
 block: TextbookLesson["sections"][number]["blocks"][number],
 displayMode: LessonDisplayMode,
 answerVisible: boolean,
) {
 const columns = tableColumns(block);
 const visibleColumnIndexes = columns.headers
  .map((header, index) => ({ header, index }))
  .filter(({ header }) => displayMode.showMeaning || !/tiếng việt|nghĩa|hán việt/iu.test(header))
  .filter(({ index }) => answerVisible || !block.answerColumnIndexes?.includes(index))
  .map(({ index }) => index);
 return {
  ...columns,
  isVocabularyTable: columns.hanziColumnIndex >= 0 && columns.pinyinColumnIndex >= 0,
  visibleColumnIndexes,
 };
}

export function isCanonicalVocabularyTable(
 block: TextbookLesson["sections"][number]["blocks"][number],
 vocabulary: TextbookLesson["vocab"],
) {
 const { pinyinColumnIndex, hanziColumnIndex } = tableColumns(block);
 const rows = block.rows.slice(1);

 return (
  hanziColumnIndex >= 0 &&
  pinyinColumnIndex >= 0 &&
  rows.length === vocabulary.length &&
  vocabulary.every(
   (item, index) =>
    rows[index]?.[hanziColumnIndex] === item.hanzi &&
    rows[index]?.[pinyinColumnIndex] === item.pinyin,
  )
 );
}

export function pairedTextbookTranslations(sections: TextbookLesson["sections"]) {
 const translations = new Map<string, string>();
 const translationIndex = sections.findIndex((section) => section.title.includes("DỊCH BÀI KHÓA"));
 const sourceSection = translationIndex > 0 ? sections[translationIndex - 1] : undefined;
 const translationSection = translationIndex >= 0 ? sections[translationIndex] : undefined;
 if (!sourceSection || !translationSection) return translations;
 sourceSection.blocks.forEach((block, index) => {
  const translation = translationSection.blocks[index];
  if (translation?.text) translations.set(block.id, translation.text);
 });
 return translations;
}

export function splitBusinessChineseExercise(text: string) {
 const separatorIndex = text.indexOf("→");
 return {
  prompt: text.slice(0, separatorIndex).trim(),
  answer: text.slice(separatorIndex + 1).trim(),
 };
}

export function splitPipePhraseDrill(text: string): string[] {
 if (text.includes("→") || (text.match(/\|/g) ?? []).length < 2) return [];
 const phrases = text
  .split("|")
  .map((part) => part.trim())
  .filter(Boolean)
  .flatMap((part) =>
   /^[\p{Script=Han}]{2,}(?:\s+[\p{Script=Han}]{2,})+$/u.test(part) ? part.split(/\s+/u) : [part],
  );
 return phrases.length >= 3 ? phrases : [];
}

export function pairPracticeBlankAnswers(
 blocks: readonly TextbookLesson["sections"][number]["blocks"][number][],
): { pairedAnswers: ReadonlyMap<string, string>; consumedAnswerBlockIds: ReadonlySet<string> } {
 const pairedAnswers = new Map<string, string>();
 const consumedAnswerBlockIds = new Set<string>();
 blocks.forEach((block, index) => {
  if (block.type !== "paragraph") return;
  const match = block.text.match(/^(?:Gợi ý đáp án|Đáp án|参考答案)\s*[:：]?\s*→\s*([\s\S]+)$/iu);
  if (!match) return;
  const lines = match[1]
   .split(/\n/u)
   .map((line) => line.trim())
   .filter(Boolean);
  const precedingBlankBlocks: TextbookLesson["sections"][number]["blocks"] = [];
  for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
   const previous = blocks[previousIndex];
   if (previous.type !== "paragraph" || previous.text.includes("→")) break;
   if (/[_＿]{3,}/u.test(previous.text)) precedingBlankBlocks.unshift(previous);
  }
  if (precedingBlankBlocks.length === 0 || precedingBlankBlocks.length !== lines.length) return;
  precedingBlankBlocks.forEach((prompt, lineIndex) =>
   pairedAnswers.set(prompt.id, lines[lineIndex]),
  );
  consumedAnswerBlockIds.add(block.id);
 });
 return { pairedAnswers, consumedAnswerBlockIds };
}

export type ParsedPracticeChoice = {
 key: string;
 text: string;
};

export type ParsedPracticeExerciseItem = {
 prompt: string;
 displayPrompt: string;
 answer: string;
 keywordHint: string;
 baseWord: string;
 hasBlank: boolean;
 reorderTokens: readonly string[];
 choices: readonly ParsedPracticeChoice[];
 correctChoice: string;
};

export function parsePracticeExerciseItem(
 promptText: string,
 answerText: string,
): ParsedPracticeExerciseItem {
 let cleanAnswer = answerText;
 let displayPrompt = promptText;
 let keywordHint = "";
 const answerHint = answerText.match(
  /^[(（]([^()（）]+)[)）]\s*(?:Đáp án|Gợi ý đáp án)\s*[:：]\s*([\s\S]+)$/iu,
 );
 if (answerHint) {
  keywordHint = answerHint[1].trim();
  cleanAnswer = answerHint[2].trim();
 }
 const promptHint = promptText.match(/\s+[(（]([\p{Script=Han}….\s、/]+|hoàn thành câu)[)）]$/iu);
 if (promptHint) {
  if (!keywordHint) keywordHint = promptHint[1].trim();
  displayPrompt = promptText.slice(0, promptHint.index).trim();
 }
 const baseWord = displayPrompt.match(/^([\p{Script=Han}]{1,4})\s*[_＿]{3,}$/u)?.[1] ?? "";
 const choices: ParsedPracticeChoice[] = [];
 let correctChoice = "";
 const choiceMatch = displayPrompt.match(
  /^([\s\S]*?)\s+A[.．、]\s*([\s\S]+?)\s+B[.．、]\s*([\s\S]+?)\s+C[.．、]\s*([\s\S]+?)(?:\s+D[.．、]\s*([\s\S]+?))?$/u,
 );
 const choiceAnswer = cleanAnswer.match(/^(?:Đáp án|正确答案)\s*[:：]?\s*([A-D])\b/iu);
 if (choiceMatch && choiceAnswer) {
  displayPrompt = choiceMatch[1].trim();
  ["A", "B", "C", "D"].forEach((key, index) => {
   const text = choiceMatch[index + 2]?.trim();
   if (text) choices.push({ key, text });
  });
  correctChoice = choiceAnswer[1].toUpperCase();
 }
 const reorderTokens =
  (displayPrompt.match(/\//gu) ?? []).length >= 3
   ? displayPrompt
      .split("/")
      .map((token) => token.trim())
      .filter(Boolean)
   : [];
 return {
  prompt: promptText,
  displayPrompt,
  answer: cleanAnswer,
  keywordHint,
  baseWord,
  hasBlank: /[_＿]{3,}/u.test(displayPrompt),
  reorderTokens,
  choices,
  correctChoice,
 };
}

export type PracticeAnswerEvaluation = {
 isAnswered: boolean;
 isExactMatch: boolean;
 isKeywordMatch: boolean;
};

export function evaluatePracticeAnswer(
 userAnswer: string,
 item: ParsedPracticeExerciseItem,
): PracticeAnswerEvaluation {
 const punctuation = /[，。！？；：、“”‘’（）().,!?;:'"\s…—_＿-]/gu;
 const normalizedAnswer = userAnswer.replace(punctuation, "");
 if (!normalizedAnswer) return { isAnswered: false, isExactMatch: false, isKeywordMatch: false };
 const candidates = item.answer
  .split(/\n+/u)
  .flatMap((answer) => splitTrailingTranslation(answer).source.split(/\/+/u))
  .map((answer) =>
   answer
    .trim()
    .replace(/^(?:Đáp án|Gợi ý đáp án|参考答案)\s*[:：]?\s*/iu, "")
    .replace(/^\(\d+\)\s*/u, "")
    .replace(punctuation, ""),
  );
 const withBaseWord = `${item.baseWord}${userAnswer}`.replace(punctuation, "");
 const completedPrompt =
  (item.displayPrompt.match(/[_＿]{3,}/gu) ?? []).length === 1
   ? item.displayPrompt
      .replace(/[_＿]{3,}/u, () => userAnswer)
      .replace(/^\(\d+\)\s*/u, "")
      .replace(punctuation, "")
   : "";
 if (
  candidates.some(
   (answer) =>
    answer === normalizedAnswer ||
    (item.baseWord && answer === withBaseWord) ||
    (completedPrompt.length > 0 && answer === completedPrompt),
  )
 ) {
  return { isAnswered: true, isExactMatch: true, isKeywordMatch: false };
 }
 const keywords = item.keywordHint.match(/[\p{Script=Han}]+/gu) ?? [];
 return {
  isAnswered: true,
  isExactMatch: false,
  isKeywordMatch:
   keywords.length > 0 &&
   keywords.every((keyword) => userAnswer.includes(keyword)) &&
   userAnswer.trim().length > item.keywordHint.length,
 };
}

export function splitBusinessChineseGrammarExample(text: string) {
 const source = text.trim();
 if (source.includes("→")) {
  const example = splitBusinessChineseExercise(source);
  if (isChineseOnlyText(example.prompt) && /^"?[A-Za-zÀ-ỹ]/u.test(example.answer)) {
   return { source: example.prompt, translation: example.answer };
  }
 }
 if (!/^\(\d+\)\s*"?\p{Script=Han}/u.test(source)) {
  return { source, translation: "" };
 }

 const separatorIndex = source.search(/[。！？.!?…]"?\s+"?[A-Za-zÀ-ỹ]/u);
 if (separatorIndex < 0) return { source, translation: "" };
 const sourceEnd = separatorIndex + (source.charAt(separatorIndex + 1) === '"' ? 2 : 1);
 return {
  source: source.slice(0, sourceEnd).trim(),
  translation: source.slice(sourceEnd).trim(),
 };
}

export function businessChineseSourceSections(sections: TextbookLesson["sections"]) {
 return sections.filter((section) => !section.title.includes("DỊCH BÀI KHÓA"));
}

export function businessChineseContentSections(sections: TextbookLesson["sections"]) {
 return businessChineseSourceSections(sections).filter((section) => section.blocks.length > 0);
}

export function businessChineseTabAvailable(
 key: string,
 sections: TextbookLesson["sections"],
 dictationCount: number,
 vocabularyCount: number,
) {
 return (
  key === "all" ||
  key === "notes" ||
  key === "translation" ||
  (key === "dictation" && dictationCount > 0) ||
  (key === "vocab" && vocabularyCount > 0) ||
  (key === "review" && vocabularyCount > 0) ||
  sections.some((section) => section.category === key)
 );
}

export function businessChineseVocabularyTableIds(
 sections: TextbookLesson["sections"],
 vocabulary: TextbookLesson["vocab"],
) {
 return sections.flatMap((section) =>
  section.blocks
   .filter((block) => isCanonicalVocabularyTable(block, vocabulary))
   .map((block) => block.id),
 );
}

export function businessChineseVisibleBlocks(
 section: TextbookLesson["sections"][number],
 canonicalVocabularyTableIds: readonly string[],
) {
 return section.blocks.filter((block) => !canonicalVocabularyTableIds.includes(block.id));
}

export function businessChineseVisibleSections(
 sections: TextbookLesson["sections"],
 activeView: string,
) {
 return sections
  .filter((section) => activeView === "all" || section.category === activeView)
  .flatMap((section) => {
   if (section.category !== "grammar") return [section];

   const groups: TextbookLesson["sections"] = [];
   for (const block of section.blocks) {
    const current = groups.at(-1);
    if (block.type === "subheading" || !current) {
     groups.push({
      ...section,
      id: groups.length === 0 ? section.id : `${section.id}:${block.id}`,
      title: block.type === "subheading" ? block.text : section.title,
      blocks: [block],
     });
    } else {
     current.blocks.push(block);
    }
   }
   return groups.length > 0 ? groups : [section];
  });
}

export function businessChineseReaderVocabulary(vocabulary: TextbookLesson["vocab"]) {
 return vocabulary.map((item) => ({
  id: item.id,
  word: item.hanzi,
  pinyin: item.pinyin,
  meaning: item.meaning,
 }));
}

export function businessChinesePronunciationAnalyses(document: ReaderDocumentModel) {
 return new Map(
  document.segments.map((segment) => [
   segment.id,
   analyzeContextualPronunciation({ text: segment.zh, sourcePinyin: segment.pinyin ?? null }),
  ]),
 );
}

export function businessChineseSectionDocuments(document: ReaderDocumentModel) {
 const documents = new Map<string, ReaderDocumentModel>();
 for (const section of document.sections) {
  documents.set(section.id, {
   ...document,
   id: `${document.id}:${section.id}`,
   title: section.id === document.sections[0]?.id ? document.title : undefined,
   titleVi: section.id === document.sections[0]?.id ? document.titleVi : undefined,
   sections: document.sections.filter((readerSection) => readerSection.id === section.id),
   segments: document.segments.filter((segment) => segment.sectionId === section.id),
  });
 }
 return documents;
}

export function businessChineseReaderAnnotations(
 annotations: readonly ReaderAnnotationRow[],
): ReaderAnnotation[] {
 return annotations.flatMap((annotation) =>
  annotation.paragraph_id !== null &&
  annotation.start_offset !== null &&
  annotation.end_offset !== null &&
  annotation.end_offset > annotation.start_offset &&
  annotation.selected_text.length > 0
   ? [
      {
       id: annotation.id,
       segmentId: annotation.paragraph_id,
       text: annotation.selected_text,
       noteText: annotation.note_text,
       start: annotation.start_offset,
       end: annotation.end_offset,
       color: annotation.color,
      },
     ]
   : [],
 );
}

export function businessChineseDictationCount(sources: readonly DictationSource[]) {
 return sources.reduce((count, source) => count + source.entries.length, 0);
}

function normalizeTextbookPos(pos: string) {
 const normalized = pos.trim().toLowerCase().replaceAll(" ", "_");
 const parsed = PartOfSpeechSchema.safeParse(normalized);
 return parsed.success ? parsed.data : "unknown";
}

type ExtractedTextbookSentence = {
 readonly zh: string;
 readonly vi: string;
 readonly blockId: string;
 readonly category: TextbookLesson["sections"][number]["category"];
};

function extractLessonSentences(lesson: TextbookLesson): readonly ExtractedTextbookSentence[] {
 const sentences: ExtractedTextbookSentence[] = [];
 for (const section of lesson.sections) {
  if (
   section.category !== "text" &&
   section.category !== "grammar" &&
   section.category !== "practice"
  ) {
   continue;
  }
  for (const block of section.blocks) {
   if (!block.text) continue;
   const zhParts = block.text
    .split(/(?<=[。！？!?\n])/gu)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
   const viParts = block.translation
    ? block.translation
       .split(/(?<=[.!?\n])/gu)
       .map((s) => s.trim())
       .filter((s) => s.length > 0)
    : [];

   for (let i = 0; i < zhParts.length; i++) {
    const zh = zhParts[i];
    if (!zh) continue;
    let vi = "";
    if (zhParts.length === viParts.length) {
     vi = viParts[i] ?? "";
    } else if (zhParts.length === 1 && viParts.length === 1) {
     vi = viParts[0] ?? "";
    }
    sentences.push({ zh, vi, blockId: block.id, category: section.category });
   }
  }
 }
 return sentences;
}

function findBestVocabSentence(
 sentences: readonly ExtractedTextbookSentence[],
 word: TextbookLesson["vocab"][number],
): ExtractedTextbookSentence | null {
 const candidates = sentences.filter((s) => {
  if (!s.zh.includes(word.hanzi)) return false;
  if (s.zh.length < 8 || s.zh.length > 65) return false;
  if (/^\(?\d+[\.\)]/u.test(s.zh)) return false;
  return true;
 });

 if (candidates.length === 0) {
  const relaxed = sentences.find(
   (s) => s.zh.includes(word.hanzi) && s.zh.length >= 6 && s.zh.length <= 80,
  );
  return relaxed ?? null;
 }

 const sorted = [...candidates].sort((a, b) => {
  const aHasVi = a.vi.length > 0 ? 1 : 0;
  const bHasVi = b.vi.length > 0 ? 1 : 0;
  if (aHasVi !== bHasVi) return bHasVi - aHasVi;

  const aIsText = a.category === "text" ? 1 : 0;
  const bIsText = b.category === "text" ? 1 : 0;
  if (aIsText !== bIsText) return bIsText - aIsText;

  const aDist = Math.abs(a.zh.length - 26);
  const bDist = Math.abs(b.zh.length - 26);
  return aDist - bDist;
 });

 return sorted[0] ?? null;
}

export function textbookLessonToReviewLesson(lesson: TextbookLesson): HanziHomeLesson {
 const sentences = extractLessonSentences(lesson);

 const vocab: HanziHomeVocabItem[] = lesson.vocab.map((item, index) => {
  const bestSentence = findBestVocabSentence(sentences, item);
  const examples = bestSentence
   ? [
      VocabularyExampleSchema.parse({
       id: `${item.id}:ex:1`,
       order: 1,
       zh: bestSentence.zh,
       pinyin: "",
       vi: bestSentence.vi,
       analysis_vi: "",
       highlight: [item.hanzi],
       grammar_refs: [],
       vocab_refs: [item.id],
       source_ref: lesson.title,
       level: "basic",
       audio_key: "",
       notes: [],
       check_needed: false,
      }),
     ]
   : [];

  const parsedBase = DeepVocabularyItemSchema.parse({
   id: item.id,
   order: index + 1,
   hanzi: item.hanzi,
   pinyin: item.pinyin,
   pos: {
    raw_vi: item.pos,
    raw_cn: "",
    normalized: normalizeTextbookPos(item.pos),
    notes: [],
   },
   level_tag: "unknown",
   tags: [lesson.bookKey],
   meaning: {
    hanviet: item.hanviet,
    meaning_vi: item.meaning,
    meaning_en: "",
    natural_translations_vi: [item.meaning],
    short_definition_vi: item.meaning,
    textbook_focus_vi: "",
    register_vi: "",
    usage_domain_vi: "",
    notes: [],
   },
   word_formation: {
    characters: [],
    word_logic_vi: "",
    memory_tip_vi: "",
    warning_vi: "",
    notes: [],
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
   notes: [],
   check_needed: false,
  });

  return {
   ...parsedBase,
   examples,
   runtimeId: item.id,
   lessonId: lesson.id,
   category: item.pos || "vocab",
   tone: "",
   detailSections: [],
  };
 });

 return {
  id: lesson.id,
  lessonNumber: lesson.number,
  titleZh: lesson.rawTitle || lesson.title,
  title: lesson.title,
  vocabIds: lesson.vocab.map((v) => v.id),
  grammarPointIds: [],
  vocab,
  grammar: [],
 };
}

export type ContextualVocabDrillItem = {
 id: string;
 sentenceId: string;
 targetWord: string;
 targetPinyin: string;
 targetMeaning: string;
 targetHanviet: string;
 fullSentence: string;
 sentenceTranslation: string;
 displayPrompt: string;
};

export function generateContextualVocabDrills(
 lesson: TextbookLesson,
 limit = 10,
): readonly ContextualVocabDrillItem[] {
 const sentences = extractLessonSentences(lesson);
 const drills: ContextualVocabDrillItem[] = [];
 const usedWords = new Set<string>();

 for (const word of lesson.vocab) {
  if (usedWords.has(word.hanzi)) continue;
  const best = findBestVocabSentence(sentences, word);
  if (!best) continue;

  usedWords.add(word.hanzi);
  const displayPrompt = best.zh.replace(word.hanzi, " ______ ");
  drills.push({
   id: `${lesson.id}:drill:${word.id}`,
   sentenceId: best.blockId,
   targetWord: word.hanzi,
   targetPinyin: word.pinyin,
   targetMeaning: word.meaning,
   targetHanviet: word.hanviet,
   fullSentence: best.zh,
   sentenceTranslation: best.vi,
   displayPrompt,
  });

  if (drills.length >= limit) break;
 }

 return drills;
}

export function evaluateContextualVocabDrill(input: string, targetWord: string): boolean {
 const cleanInput = input.trim().replace(/\s+/gu, "");
 const cleanTarget = targetWord.trim().replace(/\s+/gu, "");
 return cleanInput.length > 0 && cleanInput === cleanTarget;
}
