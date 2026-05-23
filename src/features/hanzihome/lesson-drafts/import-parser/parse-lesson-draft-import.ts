import { normalizeImportInput } from "@/features/hanzihome/lesson-drafts/import-parser/normalize-input";
import type {
  ParsedDocumentKind,
  ParsedImportResult,
} from "@/features/hanzihome/lesson-drafts/import-parser/types";
import { parseGrammarDocument } from "@/features/hanzihome/lesson-drafts/import-parser/grammar/parse-grammar-document";
import { parseVocabDocument } from "@/features/hanzihome/lesson-drafts/import-parser/vocab/parse-vocab-document";

function chooseKind(input: {
  vocabCount: number;
  grammarCount: number;
  grammarMode: string;
  vocabMode: string;
}): ParsedDocumentKind {
  if (input.vocabCount > 0 && input.grammarCount > 0) return "lesson_mixed";
  if (input.grammarMode === "lesson_mixed") return "lesson_mixed";
  if (input.grammarCount > 0) return "grammar_batch";
  if (input.vocabMode === "quick_glossary") return "quick_glossary";
  if (input.vocabCount > 0) return "vocab_batch";
  return "unknown";
}

export function parseLessonDraftImport(rawText: string): ParsedImportResult {
  const normalized = normalizeImportInput(rawText);
  const grammarResult = parseGrammarDocument(normalized.text);

  const shouldParseVocab = grammarResult.grammarPoints.length === 0;
  const vocabResult = shouldParseVocab
    ? parseVocabDocument(normalized.text)
    : {
        items: [],
        warnings: [],
        mode: "none" as const,
      };

  const kind = chooseKind({
    vocabCount: vocabResult.items.length,
    grammarCount: grammarResult.grammarPoints.length,
    grammarMode: grammarResult.mode,
    vocabMode: vocabResult.mode,
  });

  const itemCount =
    vocabResult.items.length + grammarResult.grammarPoints.length;

  return {
    kind,
    confidence: itemCount > 0 ? 0.72 : 0,
    lessonNotes: grammarResult.lessonNotes,
    vocabItems: vocabResult.items,
    grammarPoints: grammarResult.grammarPoints,
    warnings: [...vocabResult.warnings, ...grammarResult.warnings],
    rawText: normalized.text,
  };
}
