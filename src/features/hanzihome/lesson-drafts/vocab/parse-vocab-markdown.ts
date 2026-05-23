import { parseLessonDraftImport } from "@/features/hanzihome/lesson-drafts/import-parser";
import type { VocabDraftImportResult } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";

export function parseVocabMarkdown(markdown: string): VocabDraftImportResult {
  const result = parseLessonDraftImport(markdown);

  return {
    items: result.vocabItems,
    warnings: result.warnings.map((warning) =>
      warning.path ? `${warning.path}: ${warning.message}` : warning.message,
    ),
  };
}
