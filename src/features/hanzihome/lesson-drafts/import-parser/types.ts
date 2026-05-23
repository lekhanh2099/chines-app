import type { LessonDraftNotes } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import type { GrammarDraftItem } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import type { VocabDraftItem } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";

export type ParsedDocumentKind =
  | "vocab_batch"
  | "quick_glossary"
  | "grammar_batch"
  | "lesson_mixed"
  | "unknown";

export type ParserWarning = {
  code:
    | "missing_field"
    | "low_confidence"
    | "unknown_chunk"
    | "possible_heading_noise"
    | "duplicate_item"
    | "unsupported_format";
  message: string;
  severity: "info" | "warning" | "error";
  path?: string;
  sourceText?: string;
};

export type ParsedImportResult = {
  kind: ParsedDocumentKind;
  confidence: number;
  lessonNotes?: LessonDraftNotes;
  vocabItems: VocabDraftItem[];
  grammarPoints: GrammarDraftItem[];
  warnings: ParserWarning[];
  rawText: string;
};
