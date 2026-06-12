export type HanziHomeDbDataset = "q2" | "q3";

export type DbCounts = {
 lessons: number;
 sections: number;
 lessonVocabItems: number;
 sourceDeepVocabItems: number;
 materializedVocabItems: number;
 syntheticVocabItems: number;
 relations: number;
 checkNeededRelations: number;
 checkNeededVocabItems: number;
 unresolved: number;
 warnings: number;
};

export type DbRootCounts = {
 datasets: number;
 lessons: number;
 relations: number;
 unresolved: number;
 warnings: number;
 syntheticVocabItems: number;
 checkNeededRelations: number;
 checkNeededVocabItems: number;
};

export type DbLessonCounts = {
 sections: number;
 lessonVocabItems: number;
 sourceDeepVocabItems: number;
 materializedVocabItems: number;
 syntheticVocabItems: number;
 hanziOnlyVocabMatches?: number;
 relations: number;
 relationTypes?: Record<string, number>;
 checkNeededRelations: number;
 checkNeededVocabItems: number;
 unresolved: number;
 warnings: number;
};

export type DbRootManifest = {
 schemaVersion: string;
 generatedAt: string;
 outputRoot: string;
 options: {
  sourceCopied: false;
  indexMode: "slim";
  lexicalScan?: boolean;
  includeSingleCharScan?: boolean;
  clean?: boolean;
 };
 datasets: Array<{
  dataset: HanziHomeDbDataset;
  output: string;
  counts: DbCounts;
 }>;
 counts: DbRootCounts;
};

export type DbDatasetManifest = {
 schemaVersion: string;
 dataset: HanziHomeDbDataset;
 source: string;
 generatedAt: string;
 options: Record<string, unknown>;
 counts: DbCounts;
 lessons: DbLessonManifestItem[];
};

export type DbLessonManifestItem = {
 lessonIndex: number;
 id: string;
 title: {
  zh: string;
  pinyin: string;
  vi: string;
  en?: string;
 };
 folder: string;
 sourceRefs?: {
  lessonFile?: string | null;
  vocabFile?: string | null;
 };
 counts: DbLessonCounts;
};

export type DbLessonMeta = {
 schemaVersion: string;
 dataset: HanziHomeDbDataset;
 lessonIndex: number;
 id: string;
 title: {
  zh: string;
  pinyin: string;
  vi: string;
  en?: string;
 };
 sourceRefs?: {
  lessonFile?: string | null;
  vocabFile?: string | null;
 };
 counts: DbLessonCounts;
};

export type DbVocabularyIndexItem = {
 id: string;
 order: number;
 type: string;
 materialized_kind: "source_deep_vocab" | "synthetic_from_lesson_vocab" | string;
 source_deep_vocab_id: string | null;
 source_lesson_vocab_id: string | null;
 check_needed: boolean;
 file: string;
};

export type DbRelation = {
 id: string;
 type:
  | "lesson_vocab_to_vocabulary_item"
  | "vocab_group_to_vocabulary_item"
  | "content_to_vocabulary_item"
  | "content_to_grammar";
 from: {
  id: string;
  kind: string;
  path: string;
 };
 to: {
  id: string;
  kind: string;
  path: string;
 };
 evidence: {
  source: string;
  ref_id?: string;
  matched_text?: string;
  text_offset?: number;
  json_path?: string;
  reason?: string;
 };
 confidence: "exact" | "high" | "medium" | "low";
 check_needed: boolean;
};

export type DbVocabularyItemPayload = Record<string, unknown>;
export type DbSectionPayload = Record<string, unknown>;
