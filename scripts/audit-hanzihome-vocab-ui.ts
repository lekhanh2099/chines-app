import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { ZodError } from "zod";

import type {
 DeepVocabularyItem,
 DeepVocabularyLesson,
} from "../src/features/hanzihome/static-json/schemas/vocab.schema.ts";

const defaultDataRoot = path.join(process.cwd(), "data/hanzihome");
const vocabSchemaModulePath = "../src/features/hanzihome/static-json/schemas/vocab.schema.ts";
const shouldShowWarnings = process.argv.includes("--show-warnings");

type Severity = "error" | "warning";

type IssueCode =
 | "SCHEMA_INVALID"
 | "EMPTY_LESSON"
 | "DUPLICATE_ITEM_ID"
 | "DUPLICATE_ORDER"
 | "DUPLICATE_HANZI"
 | "GROUP_WORD_NOT_FOUND"
 | "MISSING_MEANING"
 | "MISSING_EXAMPLES"
 | "MISSING_WORD_FORMATION"
 | "SPARSE_RENDER_SECTIONS"
 | "UNKNOWN_POS"
 | "MISSING_FLASHCARD"
 | "EXAMPLE_HIGHLIGHT_NOT_IN_SENTENCE";

type AuditIssue = {
 severity: Severity;
 code: IssueCode;
 dataset: string;
 file: string;
 lessonIndex?: number;
 itemId?: string;
 hanzi?: string;
 message: string;
};

type DatasetSummary = {
 dataset: string;
 files: number;
 lessons: number;
 items: number;
 errors: number;
 warnings: number;
 unknownPos: number;
 sparseItems: number;
};

type VocabSchemaModule =
 typeof import("../src/features/hanzihome/static-json/schemas/vocab.schema.ts");

function hasText(value: string | undefined) {
 return Boolean(value?.trim());
}

function hasMeaningContent(item: DeepVocabularyItem) {
 const meaning = item.meaning;

 return [
  meaning.short_definition_vi,
  meaning.meaning_vi,
  meaning.meaning_en,
  meaning.textbook_focus_vi,
  meaning.register_vi,
  meaning.usage_domain_vi,
  ...meaning.natural_translations_vi,
  ...meaning.notes.map((note) => note.text_vi),
 ].some(hasText);
}

function hasWordFormationContent(item: DeepVocabularyItem) {
 const formation = item.word_formation;

 return (
  formation.characters.length > 0 ||
  [
   formation.word_logic_vi,
   formation.memory_tip_vi,
   formation.warning_vi,
   ...formation.notes.map((note) => note.text_vi),
  ].some(hasText)
 );
}

function hasComparisonContent(item: DeepVocabularyItem) {
 const comparison = item.comparison;

 return (
  comparison.near_synonyms.length > 0 ||
  comparison.antonyms.length > 0 ||
  comparison.contrast_pairs.length > 0 ||
  comparison.usage_rules.length > 0 ||
  comparison.notes.some((note) => hasText(note.text_vi))
 );
}

function hasCultureOrWarningContent(item: DeepVocabularyItem) {
 return (
  Boolean(
   item.culture_note && [item.culture_note.title, item.culture_note.content_vi].some(hasText),
  ) ||
  item.warnings.some((warning) =>
   [warning.rule_vi, warning.explanation_vi, ...warning.notes.map((note) => note.text_vi)].some(
    hasText,
   ),
  ) ||
  item.notes.some((note) => hasText(note.text_vi))
 );
}

function getRenderableSections(item: DeepVocabularyItem) {
 return [
  hasMeaningContent(item) ? "meaning" : "",
  hasWordFormationContent(item) ? "word_formation" : "",
  hasComparisonContent(item) ? "comparison" : "",
  item.collocations.length > 0 ? "collocations" : "",
  item.examples.length > 0 ? "examples" : "",
  hasCultureOrWarningContent(item) ? "notes" : "",
  item.flashcard ? "flashcard" : "",
 ].filter(Boolean);
}

function addIssue(issues: AuditIssue[], issue: AuditIssue) {
 issues.push(issue);
}

function formatSchemaIssue(error: ZodError) {
 return error.issues
  .slice(0, 8)
  .map((issue) => {
   const pathLabel = issue.path.length > 0 ? issue.path.join(".") : "(root)";
   return `${pathLabel}: ${issue.message}`;
  })
  .join("; ");
}

async function pathExists(targetPath: string) {
 try {
  await stat(targetPath);
  return true;
 } catch {
  return false;
 }
}

async function getDatasetVocabDirs() {
 const explicitDataset = process.argv
  .find((arg) => arg.startsWith("--dataset="))
  ?.replace("--dataset=", "");

 if (explicitDataset) {
  return [path.resolve(process.cwd(), explicitDataset)];
 }

 const datasetNames = await readdir(defaultDataRoot).catch(() => []);
 const vocabDirs = await Promise.all(
  datasetNames.sort().map(async (datasetName) => {
   const vocabDir = path.join(defaultDataRoot, datasetName, "vocab");
   return (await pathExists(vocabDir)) ? vocabDir : null;
  }),
 );

 return vocabDirs.filter((vocabDir): vocabDir is string => Boolean(vocabDir));
}

async function readVocabularyLessons(
 vocabDir: string,
 schemaModule: VocabSchemaModule,
 issues: AuditIssue[],
) {
 const dataset = path.basename(path.dirname(vocabDir));
 const files = (await readdir(vocabDir)).filter((file) => file.endsWith(".json")).sort();
 const lessons: Array<{ file: string; lesson: DeepVocabularyLesson }> = [];

 for (const file of files) {
  const filePath = path.join(vocabDir, file);

  try {
   const raw = JSON.parse(await readFile(filePath, "utf8")) as unknown;
   lessons.push({
    file,
    lesson: schemaModule.DeepVocabularyLessonSchema.parse(raw),
   });
  } catch (error) {
   const message =
    error instanceof ZodError
     ? formatSchemaIssue(error)
     : error instanceof Error
       ? error.message
       : String(error);

   addIssue(issues, {
    severity: "error",
    code: "SCHEMA_INVALID",
    dataset,
    file,
    message,
   });
  }
 }

 return { dataset, files, lessons };
}

function auditLesson({
 dataset,
 file,
 lesson,
 issues,
}: {
 dataset: string;
 file: string;
 lesson: DeepVocabularyLesson;
 issues: AuditIssue[];
}) {
 const lessonIndex = lesson.source.lesson_index;
 const itemIds = new Map<string, DeepVocabularyItem>();
 const orderIndexes = new Map<number, DeepVocabularyItem>();
 const hanziValues = new Map<string, DeepVocabularyItem>();
 const knownWords = new Set(lesson.items.map((item) => item.hanzi));

 if (lesson.items.length === 0) {
  addIssue(issues, {
   severity: "error",
   code: "EMPTY_LESSON",
   dataset,
   file,
   lessonIndex,
   message: "Lesson has no vocab items.",
  });
 }

 for (const group of lesson.overview.groups) {
  for (const word of group.words) {
   if (!knownWords.has(word)) {
    addIssue(issues, {
     severity: "warning",
     code: "GROUP_WORD_NOT_FOUND",
     dataset,
     file,
     lessonIndex,
     message: `Overview group "${group.title_vi}" references "${word}", but no item has that hanzi.`,
    });
   }
  }
 }

 for (const item of lesson.items) {
  auditItem({
   dataset,
   file,
   lessonIndex,
   item,
   issues,
   itemIds,
   orderIndexes,
   hanziValues,
  });
 }
}

function auditItem({
 dataset,
 file,
 lessonIndex,
 item,
 issues,
 itemIds,
 orderIndexes,
 hanziValues,
}: {
 dataset: string;
 file: string;
 lessonIndex: number;
 item: DeepVocabularyItem;
 issues: AuditIssue[];
 itemIds: Map<string, DeepVocabularyItem>;
 orderIndexes: Map<number, DeepVocabularyItem>;
 hanziValues: Map<string, DeepVocabularyItem>;
}) {
 const baseIssue = {
  dataset,
  file,
  lessonIndex,
  itemId: item.id,
  hanzi: item.hanzi,
 };

 const existingLessonItem = itemIds.get(item.id);
 if (existingLessonItem) {
  addIssue(issues, {
   ...baseIssue,
   severity: "error",
   code: "DUPLICATE_ITEM_ID",
   message: `Duplicate item id "${item.id}" inside this lesson.`,
  });
 } else {
  itemIds.set(item.id, item);
 }

 const existingOrderItem = orderIndexes.get(item.order);
 if (existingOrderItem) {
  addIssue(issues, {
   ...baseIssue,
   severity: "error",
   code: "DUPLICATE_ORDER",
   message: `Duplicate order ${item.order} with "${existingOrderItem.hanzi}".`,
  });
 } else {
  orderIndexes.set(item.order, item);
 }

 const existingHanziItem = hanziValues.get(item.hanzi);
 if (existingHanziItem) {
  addIssue(issues, {
   ...baseIssue,
   severity: "warning",
   code: "DUPLICATE_HANZI",
   message: `Duplicate hanzi "${item.hanzi}" with item ${existingHanziItem.id}.`,
  });
 } else {
  hanziValues.set(item.hanzi, item);
 }

 if (!hasMeaningContent(item)) {
  addIssue(issues, {
   ...baseIssue,
   severity: "error",
   code: "MISSING_MEANING",
   message: "Item has no renderable meaning content.",
  });
 }

 if (item.examples.length === 0) {
  addIssue(issues, {
   ...baseIssue,
   severity: "warning",
   code: "MISSING_EXAMPLES",
   message: "Item has no examples, so the examples section and flashcard context are weak.",
  });
 }

 if (!hasWordFormationContent(item)) {
  addIssue(issues, {
   ...baseIssue,
   severity: "error",
   code: "MISSING_WORD_FORMATION",
   message: "Item has no renderable word formation / character logic content.",
  });
 }

 const sections = getRenderableSections(item);
 if (sections.length < 4) {
  addIssue(issues, {
   ...baseIssue,
   severity: "warning",
   code: "SPARSE_RENDER_SECTIONS",
   message: `Only ${sections.length} renderable sections: ${sections.join(", ") || "none"}.`,
  });
 }

 if (item.pos.normalized === "unknown") {
  addIssue(issues, {
   ...baseIssue,
   severity: "warning",
   code: "UNKNOWN_POS",
   message: "POS is unknown. Keep it if uncertain, but this is useful to review.",
  });
 }

 if (!item.flashcard) {
  addIssue(issues, {
   ...baseIssue,
   severity: "warning",
   code: "MISSING_FLASHCARD",
   message: "Item has no explicit flashcard payload.",
  });
 }

 for (const example of item.examples) {
  for (const highlight of example.highlight) {
   if (highlight && !example.zh.includes(highlight)) {
    addIssue(issues, {
     ...baseIssue,
     severity: "warning",
     code: "EXAMPLE_HIGHLIGHT_NOT_IN_SENTENCE",
     message: `Example ${example.id} highlights "${highlight}", but sentence does not contain it.`,
    });
   }
  }
 }
}

function summarizeDataset({
 dataset,
 files,
 lessons,
 issues,
}: {
 dataset: string;
 files: string[];
 lessons: Array<{ lesson: DeepVocabularyLesson }>;
 issues: AuditIssue[];
}): DatasetSummary {
 const datasetIssues = issues.filter((issue) => issue.dataset === dataset);

 return {
  dataset,
  files: files.length,
  lessons: lessons.length,
  items: lessons.reduce((sum, entry) => sum + entry.lesson.items.length, 0),
  errors: datasetIssues.filter((issue) => issue.severity === "error").length,
  warnings: datasetIssues.filter((issue) => issue.severity === "warning").length,
  unknownPos: datasetIssues.filter((issue) => issue.code === "UNKNOWN_POS").length,
  sparseItems: datasetIssues.filter((issue) => issue.code === "SPARSE_RENDER_SECTIONS").length,
 };
}

function printIssues(issues: AuditIssue[]) {
 const maxIssuesToPrint = 80;

 for (const issue of issues.slice(0, maxIssuesToPrint)) {
  const itemLabel = [issue.lessonIndex && `lesson ${issue.lessonIndex}`, issue.hanzi]
   .filter(Boolean)
   .join(" · ");
  const location = [issue.dataset, issue.file, itemLabel].filter(Boolean).join(" / ");

  console.error(`[${issue.severity.toUpperCase()}] ${issue.code} ${location}: ${issue.message}`);
 }

 if (issues.length > maxIssuesToPrint) {
  console.error(`...and ${issues.length - maxIssuesToPrint} more issues.`);
 }
}

async function main() {
 const schemaModule = (await import(vocabSchemaModulePath)) as VocabSchemaModule;
 const vocabDirs = await getDatasetVocabDirs();
 const issues: AuditIssue[] = [];
 const summaries: DatasetSummary[] = [];

 if (vocabDirs.length === 0) {
  throw new Error("No data/hanzihome/*/vocab directories found.");
 }

 for (const vocabDir of vocabDirs) {
  const { dataset, files, lessons } = await readVocabularyLessons(vocabDir, schemaModule, issues);

  for (const entry of lessons) {
   auditLesson({
    dataset,
    file: entry.file,
    lesson: entry.lesson,
    issues,
   });
  }

  summaries.push(summarizeDataset({ dataset, files, lessons, issues }));
 }

 const errors = issues.filter((issue) => issue.severity === "error");
 const warnings = issues.filter((issue) => issue.severity === "warning");

 console.log(
  JSON.stringify(
   {
    ok: errors.length === 0,
    datasets: summaries,
    totals: {
     files: summaries.reduce((sum, summary) => sum + summary.files, 0),
     lessons: summaries.reduce((sum, summary) => sum + summary.lessons, 0),
     items: summaries.reduce((sum, summary) => sum + summary.items, 0),
     errors: errors.length,
     warnings: warnings.length,
    },
   },
   null,
   2,
  ),
 );

 if (errors.length > 0) {
  printIssues(errors);
 } else if (shouldShowWarnings && warnings.length > 0) {
  printIssues(warnings);
 } else if (warnings.length > 0) {
  console.log("Warnings are summarized only. Re-run with --show-warnings to list them.");
 }

 if (errors.length > 0) {
  process.exitCode = 1;
 }
}

main().catch((error: unknown) => {
 console.error(error instanceof Error ? error.message : error);
 process.exitCode = 1;
});
