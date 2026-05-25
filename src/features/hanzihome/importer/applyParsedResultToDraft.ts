import GithubSlugger from "github-slugger";

import {
 learningFieldValueToPreview,
 sectionToPlainText,
} from "@/features/hanzihome/importer/apply-parse-profile";
import type {
 AppliedParseResult,
 LearningFieldName,
 MappedImportItem,
} from "@/features/hanzihome/importer/importer.types";
import type { LessonDraftContent } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import {
 createEmptyLessonDraftNotes,
 grammarDraftItemSchema,
 lessonDraftNotesSchema,
 type GrammarDraftExample,
 type GrammarDraftItem,
 type LessonDraftNotes,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import type {
 VocabDraftCollocation,
 VocabDraftExample,
 VocabDraftItem,
} from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import { vocabDraftItemSchema } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";

export type ApplyImportMode = "replace" | "append" | "mergeByTitle";

export type ApplyImportTarget =
 | "lessonText"
 | "vocab"
 | "grammar"
 | "exercise"
 | "mixed";

type ApplyParsedResultToDraftInput = {
 draftContent: LessonDraftContent;
 parsedResult: AppliedParseResult;
 target: ApplyImportTarget;
 mode: ApplyImportMode;
};

function valueToText(item: MappedImportItem, field: LearningFieldName) {
 return (item.fields[field] ?? [])
  .map((value) => learningFieldValueToPreview(value))
  .filter(Boolean)
  .join("\n\n")
  .trim();
}

function valueToList(item: MappedImportItem, field: LearningFieldName) {
 return (item.fields[field] ?? [])
  .flatMap((value) => learningFieldValueToPreview(value).split(/\n+/))
  .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
  .filter(Boolean);
}

function createStableId(prefix: string, title: string, index: number) {
 const slugger = new GithubSlugger();
 const slug = slugger.slug(title || `${prefix}-${index + 1}`) || `${index + 1}`;

 return `import-${prefix}-${slug}-${index + 1}`;
}

function cleanGrammarTitle(title: string) {
 return title.replace(/^PHẦN\s+[IVX]+\s*:\s*/iu, "").trim() || title;
}

function textToGrammarExamples(text: string): GrammarDraftExample[] {
 return text
  .split(/\n{2,}/)
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => ({
   chinese: block,
   pinyin: "",
   translation: "",
   note: "",
  }));
}

function textToVocabExamples(text: string): VocabDraftExample[] {
 return text
  .split(/\n{2,}/)
  .map((block) => block.trim())
  .filter(Boolean)
  .map((block) => ({
   chinese: block,
   pinyin: "",
   translation: "",
   note: "",
  }));
}

function textToCollocations(text: string): VocabDraftCollocation[] {
 return text
  .split(/\n+/)
  .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
  .filter(Boolean)
  .map((line) => {
   const [phrase = line, meaning = ""] = line.split(/\s+[–-]\s+/, 2);

   return {
    phrase: phrase.trim(),
    meaning: meaning.trim(),
   };
  });
}

function itemRawMarkdown(item: MappedImportItem) {
 return Object.entries(item.fields)
  .flatMap(([field, values]) =>
   values.map((value) => `### ${field}\n\n${learningFieldValueToPreview(value)}`),
  )
  .join("\n\n");
}

function mapGrammarItem(item: MappedImportItem, index: number): GrammarDraftItem {
 const opening = valueToText(item, "grammar.opening");
 const core = valueToText(item, "grammar.core");
 const structures = valueToList(item, "grammar.structures");
 const blindSpots = valueToText(item, "grammar.blindSpots");
 const comparisons = valueToText(item, "grammar.comparisons");
 const traps = valueToText(item, "grammar.traps");
 const examplesText = valueToText(item, "grammar.examples");
 const summary = valueToText(item, "grammar.summary");
 const notes = valueToText(item, "grammar.notes");
 const exercises = valueToText(item, "grammar.exercises");
 const title = cleanGrammarTitle(item.title);

 return {
  id: createStableId("grammar", title, index),
  title,
  pattern: structures[0] ?? "",
  shortMeaning: summary || opening,
  coreLogic: [opening, core, blindSpots].filter(Boolean).join("\n\n"),
  formulas: structures,
  examples: textToGrammarExamples(examplesText),
  comparisons,
  pitfalls: [traps, notes].filter(Boolean).join("\n\n"),
  practice: exercises,
  cultureNotes: "",
  rawMarkdown: itemRawMarkdown(item),
  confidence: 0.8,
 };
}

function mapVocabItem(item: MappedImportItem, index: number): VocabDraftItem {
 const word = item.title;
 const meaning = valueToText(item, "vocab.meaning");
 const comparisons = valueToText(item, "vocab.comparisons");
 const notes = valueToText(item, "vocab.notes");
 const examples = valueToText(item, "vocab.examples");
 const collocations = valueToText(item, "vocab.collocations");

 return {
  id: createStableId("vocab", word, index),
  word,
  pinyin: valueToText(item, "vocab.pinyin"),
  hanViet: valueToText(item, "vocab.hanViet"),
  meaning,
  partOfSpeech: valueToText(item, "vocab.pos"),
  level: "",
  category: "Imported",
  sections: {
   meaning,
   characterLogic: "",
   comparison: comparisons,
   culture: "",
   warning: notes,
  },
  collocations: textToCollocations(collocations),
  examples: textToVocabExamples(examples),
  rawMarkdown: itemRawMarkdown(item),
 };
}

function mergeByTitle<T extends { title?: string; word?: string }>(
 currentItems: T[],
 incomingItems: T[],
) {
 const incomingByTitle = new Map(
  incomingItems.map((item) => [
   (item.title ?? item.word ?? "").trim().toLocaleLowerCase("vi-VN"),
   item,
  ]),
 );
 const mergedItems = currentItems.map((item) => {
  const key = (item.title ?? item.word ?? "").trim().toLocaleLowerCase("vi-VN");
  return incomingByTitle.get(key) ?? item;
 });
 const currentKeys = new Set(
  currentItems.map((item) =>
   (item.title ?? item.word ?? "").trim().toLocaleLowerCase("vi-VN"),
  ),
 );
 const newItems = incomingItems.filter(
  (item) =>
   !currentKeys.has((item.title ?? item.word ?? "").trim().toLocaleLowerCase("vi-VN")),
 );

 return [...mergedItems, ...newItems];
}

function mergeItems<T extends { title?: string; word?: string }>(
 currentItems: T[],
 incomingItems: T[],
 mode: ApplyImportMode,
) {
 if (mode === "replace") return incomingItems;
 if (mode === "mergeByTitle") return mergeByTitle(currentItems, incomingItems);

 return [...currentItems, ...incomingItems];
}

function parseExistingGrammarItems(items: Array<Record<string, unknown>>) {
 return items.flatMap((item) => {
  const parsed = grammarDraftItemSchema.safeParse(item);
  return parsed.success ? [parsed.data] : [];
 });
}

function parseExistingVocabItems(items: unknown[]) {
 return items.flatMap((item) => {
  const parsed = vocabDraftItemSchema.safeParse(item);
  return parsed.success ? [parsed.data] : [];
 });
}

function getDraftNotes(content: LessonDraftContent): LessonDraftNotes {
 const parsed = lessonDraftNotesSchema.safeParse(content.lesson.notes);

 return parsed.success ? parsed.data : createEmptyLessonDraftNotes();
}

function applyLessonText(
 content: LessonDraftContent,
 result: AppliedParseResult,
 mode: ApplyImportMode,
) {
 const readingText = result.specialSections
  .filter((section) => section.role === "readingText")
  .map((section) => `## ${section.title}\n\n${section.content}`)
  .join("\n\n");
 const notes = getDraftNotes(content);
 const overviewMarkdown =
  mode === "append" && notes.overviewMarkdown
   ? [notes.overviewMarkdown, readingText].filter(Boolean).join("\n\n---\n\n")
   : readingText || notes.overviewMarkdown;

 return {
  ...content,
  lesson: {
   ...content.lesson,
   notes: {
    ...notes,
    overviewMarkdown,
   },
  },
 };
}

function applyLessonSummary(
 content: LessonDraftContent,
 result: AppliedParseResult,
 mode: ApplyImportMode,
) {
 const summaryText = result.specialSections
  .filter((section) => section.role === "lessonSummary")
  .map((section) => `## ${section.title}\n\n${section.content}`)
  .join("\n\n");

 if (!summaryText) return content;

 const notes = getDraftNotes(content);
 const grammarSummary =
  mode === "append" && notes.grammarSummary
   ? [notes.grammarSummary, summaryText].filter(Boolean).join("\n\n---\n\n")
   : summaryText;

 return {
  ...content,
  lesson: {
   ...content.lesson,
   notes: {
    ...notes,
    grammarSummary,
   },
  },
 };
}

function applyGrammar(
 content: LessonDraftContent,
 result: AppliedParseResult,
 mode: ApplyImportMode,
) {
 const incomingItems = result.items
  .filter((item) => item.role === "grammarItem")
  .map(mapGrammarItem);

 if (incomingItems.length === 0) return content;

 const grammarPoints = mergeItems(
  parseExistingGrammarItems(content.grammarPoints),
  incomingItems,
  mode,
 );

 return {
  ...content,
  lesson: {
   ...content.lesson,
   grammarPointIds: grammarPoints.map((item) => item.id),
  },
  grammarPoints,
 };
}

function applyVocab(
 content: LessonDraftContent,
 result: AppliedParseResult,
 mode: ApplyImportMode,
) {
 const incomingItems = result.items
  .filter((item) => item.role === "vocabItem")
  .map(mapVocabItem);

 if (incomingItems.length === 0) return content;

 const vocab = mergeItems(
  parseExistingVocabItems(content.vocab),
  incomingItems,
  mode,
 );

 return {
  ...content,
  lesson: {
   ...content.lesson,
   vocabIds: vocab.map((item) => item.id),
  },
  vocab,
 };
}

function applyExercises(content: LessonDraftContent, result: AppliedParseResult) {
 const exerciseNotes = result.items
  .filter((item) => item.role === "exerciseSet")
  .map((item) => `## ${item.title}\n\n${itemRawMarkdown(item)}`)
  .join("\n\n");

 if (!exerciseNotes) return content;

 const notes = getDraftNotes(content);

 return {
  ...content,
  lesson: {
   ...content.lesson,
   notes: {
    ...notes,
    personalNote: [notes.personalNote, exerciseNotes].filter(Boolean).join("\n\n"),
   },
  },
 };
}

export function applyParsedResultToDraft({
 draftContent,
 parsedResult,
 target,
 mode,
}: ApplyParsedResultToDraftInput): LessonDraftContent {
 if (target === "grammar") {
  return applyGrammar(draftContent, parsedResult, mode);
 }

 if (target === "vocab") {
  return applyVocab(draftContent, parsedResult, mode);
 }

 if (target === "lessonText") {
  return applyLessonText(draftContent, parsedResult, mode);
 }

 if (target === "exercise") {
  return applyExercises(draftContent, parsedResult);
 }

 return applyExercises(
  applyLessonSummary(
   applyLessonText(
    applyVocab(applyGrammar(draftContent, parsedResult, mode), parsedResult, mode),
    parsedResult,
    mode,
   ),
   parsedResult,
   mode,
  ),
  parsedResult,
 );
}

export function getApplyPreviewText(result: AppliedParseResult) {
 const grammarCount = result.items.filter((item) => item.role === "grammarItem").length;
 const vocabCount = result.items.filter((item) => item.role === "vocabItem").length;
 const exerciseCount = result.items.filter((item) => item.role === "exerciseSet").length;
 const readingCount = result.specialSections.filter(
  (section) => section.role === "readingText",
 ).length;
 const summaryCount = result.specialSections.filter(
  (section) => section.role === "lessonSummary",
 ).length;
 const unmappedText = result.unmappedSections
  .map((section) => sectionToPlainText(section))
  .filter(Boolean);

 return {
  grammarCount,
  vocabCount,
  exerciseCount,
  readingCount,
  summaryCount,
  unmappedCount: unmappedText.length,
 };
}
