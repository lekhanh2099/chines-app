import radicalsData from "../../../data/hanzihome-db/radicals.json";
import {
 DEFAULT_HANYU_COURSE_ID,
 HANYU_Q3_COURSE_ID,
 hanzihomeCourseBooks,
 hanzihomeCourses,
} from "@/features/hanzihome/courses/course-catalog";
import {
 HanyuLessonSchema,
 type GrammarBlock,
 type GrammarPoint,
 type HanyuLesson,
 type Section,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import {
 DeepVocabularyItemSchema,
} from "@/features/hanzihome/static-json/schemas/vocab.schema";
import {
 requireHanziHomeDbJson,
} from "@/features/hanzihome/static-json/hanzihome-db-static-json";
import type {
 DbDatasetManifest,
 DbLessonManifestItem,
 DbLessonMeta,
 DbRelation,
 DbRootManifest,
 DbSectionPayload,
 DbVocabularyIndexItem,
 DbVocabularyItemPayload,
 HanziHomeDbDataset,
} from "@/features/hanzihome/static-json/hanzihome-db.types";
import type {
 GrammarViewModel,
 HanziHomeCatalogCourse,
 HanziHomeCatalogData,
 HanziHomeData,
 HanziHomeLesson,
 HanziHomeVocabItem,
} from "@/features/hanzihome/types";

type DbVocabularyGroup = {
 id?: string;
 order?: number;
 title?: string;
 title_vi?: string;
 words?: string[];
};

type DbLessonBundle = {
 dataset: HanziHomeDbDataset;
 courseId: string;
 courseTitle: string;
 bookId: string;
 bookTitle: string;
 bookOrder: number;
 lessonNumber: number;
  lessonOrder: number;
  lessonMeta: DbLessonMeta;
  sectionIndex: Array<{ id?: string; file: string }>;
  sections: DbSectionPayload[];
 vocabularyIndex: DbVocabularyIndexItem[];
 vocabularyItems: DbVocabularyItemPayload[];
 vocabularyGroups: Array<Record<string, unknown>>;
 relations: {
  all: DbRelation[];
  contentToVocabulary: DbRelation[];
  contentToGrammar: DbRelation[];
  lessonVocabToVocabulary: DbRelation[];
  vocabGroupToVocabulary: DbRelation[];
 };
};

type RuntimeLessonEntry = {
 bundle: DbLessonBundle;
 sourceLesson: HanyuLesson;
 vocab: HanziHomeVocabItem[];
 grammar: GrammarViewModel[];
};

type NormalizedPos = HanziHomeVocabItem["pos"]["normalized"];

const rootManifest =
 requireHanziHomeDbJson<DbRootManifest>("manifest.json");

const partOfSpeechValues = new Set<NormalizedPos>([
 "noun",
 "verb",
 "adjective",
 "adverb",
 "particle",
 "preposition",
 "conjunction",
 "measure_word",
 "pronoun",
 "numeral",
 "interjection",
 "phrase",
 "noun_phrase",
 "verb_phrase",
 "verb_noun",
 "adjective_phrase",
 "idiom",
 "proper_noun",
 "grammar_word",
 "morpheme",
 "unknown",
]);

function unknownRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, unknown>)
  : {};
}

function recordString(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function recordNumber(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function recordArray(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

function normalizePartOfSpeech(value: unknown): NormalizedPos {
 if (typeof value === "string" && partOfSpeechValues.has(value as NormalizedPos)) {
  return value as NormalizedPos;
 }

 return "unknown";
}

function joinDbPath(...parts: string[]) {
 return parts
  .map((part) => part.replace(/^\/+|\/+$/g, ""))
  .filter(Boolean)
  .join("/");
}

function datasetToCourse(dataset: HanziHomeDbDataset) {
 return dataset === "q3" ? HANYU_Q3_COURSE_ID : DEFAULT_HANYU_COURSE_ID;
}

function getBookMeta(courseId: string, lessonNumber: number) {
 if (courseId === HANYU_Q3_COURSE_ID) {
  if (lessonNumber >= 13) {
   return {
    bookId: "hanyu-q3-xia",
    bookTitle: "Giáo trình Hán ngữ 3 Hạ",
    bookOrder: 2,
   };
  }

  return {
   bookId: "hanyu-q3-shang",
   bookTitle: "Giáo trình Hán ngữ 3 Thượng",
   bookOrder: 1,
  };
 }

 if (lessonNumber <= 12) {
  return {
   bookId: "hanyu-q2-shang",
   bookTitle: "Giáo trình Hán ngữ 2 Thượng",
   bookOrder: 1,
  };
 }

 return {
  bookId: "hanyu-q2-xia",
  bookTitle: "Giáo trình Hán ngữ 2 Hạ",
  bookOrder: 2,
 };
}

function getDatasetManifest(dataset: HanziHomeDbDataset) {
 return requireHanziHomeDbJson<DbDatasetManifest>(`${dataset}/manifest.json`);
}

function getCourseTitle(courseId: string) {
 return hanzihomeCourses.find((course) => course.id === courseId)?.title ?? "";
}

function loadRelationFile<T = DbRelation[]>(basePath: string, file: string): T {
 return requireHanziHomeDbJson<T>(joinDbPath(basePath, "relations", file));
}

function loadLessonBundle(
 dataset: HanziHomeDbDataset,
 lesson: DbLessonManifestItem,
): DbLessonBundle {
 const basePath = joinDbPath(dataset, lesson.folder);
 const lessonMeta = requireHanziHomeDbJson<DbLessonMeta>(
  joinDbPath(basePath, "lesson.json"),
 );
 const sectionIndex = requireHanziHomeDbJson<Array<{ file: string }>>(
  joinDbPath(basePath, "sections/index.json"),
 );
 const sections = sectionIndex.map((section) =>
  requireHanziHomeDbJson<DbSectionPayload>(
   joinDbPath(basePath, "sections", section.file),
  ),
 );
 const vocabularyIndex = requireHanziHomeDbJson<DbVocabularyIndexItem[]>(
  joinDbPath(basePath, "vocabulary/index.json"),
 );
 const vocabularyItems = vocabularyIndex.map((item) =>
  requireHanziHomeDbJson<DbVocabularyItemPayload>(
   joinDbPath(basePath, item.file),
  ),
 );
 const vocabularyGroups = requireHanziHomeDbJson<Array<Record<string, unknown>>>(
  joinDbPath(basePath, "vocabulary/groups.json"),
 );
 const courseId = datasetToCourse(dataset);
 const bookMeta = getBookMeta(courseId, lesson.lessonIndex);

 return {
  dataset,
  courseId,
  courseTitle: getCourseTitle(courseId),
  ...bookMeta,
  lessonNumber: lesson.lessonIndex,
  lessonOrder: lesson.lessonIndex,
  lessonMeta,
  sectionIndex,
  sections,
  vocabularyIndex,
  vocabularyItems,
  vocabularyGroups,
  relations: {
   all: loadRelationFile(basePath, "all.json"),
   contentToVocabulary: loadRelationFile(
    basePath,
    "content-to-vocabulary-item.json",
   ),
   contentToGrammar: loadRelationFile(basePath, "content-to-grammar.json"),
   lessonVocabToVocabulary: loadRelationFile(
    basePath,
    "lesson-vocab-to-vocabulary-item.json",
   ),
   vocabGroupToVocabulary: loadRelationFile(
    basePath,
    "vocab-group-to-vocabulary-item.json",
   ),
 },
 };
}

function buildSourceLesson(bundle: DbLessonBundle): HanyuLesson {
 const sourceLesson = {
  lesson: {
   id: bundle.lessonMeta.id,
   title: bundle.lessonMeta.title,
   sections: bundle.sections,
   metadata: {
    lesson_index: bundle.lessonMeta.lessonIndex,
    lesson_title_cn: bundle.lessonMeta.title.zh,
    lesson_title_pinyin: bundle.lessonMeta.title.pinyin,
    lesson_title_vi: bundle.lessonMeta.title.vi,
    lesson_title_en: bundle.lessonMeta.title.en,
    source_refs: bundle.lessonMeta.sourceRefs,
   },
  },
 };
 const parsed = HanyuLessonSchema.safeParse(sourceLesson);

 if (!parsed.success) {
  throw new Error(
   `Invalid HanziHome DB lesson ${bundle.dataset}/lesson_${String(
    bundle.lessonNumber,
   ).padStart(2, "0")}: ${parsed.error.message}`,
  );
 }

 return parsed.data;
}

function getCategoryForWord(
 groups: Array<Record<string, unknown>>,
 item: DbVocabularyItemPayload,
) {
 const hanzi = recordString(item, "hanzi");
 const matchingGroup = groups
  .map((group) => unknownRecord(group))
  .sort((a, b) => recordNumber(a, "order") - recordNumber(b, "order"))
  .find((group) => {
   const words = recordArray(group, "words");
   return words.some((word) => word === hanzi);
  }) as DbVocabularyGroup | undefined;

 return matchingGroup?.title_vi || matchingGroup?.title || "Từ vựng";
}

function syntheticVocabFallback(params: {
 item: DbVocabularyItemPayload;
 indexItem: DbVocabularyIndexItem;
 lessonId: string;
 lessonNumber: number;
 category: string;
}): HanziHomeVocabItem {
 const { item, indexItem, lessonId, category } = params;
 const posDetail = unknownRecord(item.pos_detail);
 const meaningVi = recordString(item, "meaning_vi");
 const hanzi = recordString(item, "hanzi");
 const pinyin = recordString(item, "pinyin");
 const posNormalized = normalizePartOfSpeech(
  posDetail.normalized || posDetail.schema_compatible_pos || item.pos,
 );

 return {
  id: recordString(item, "id") || indexItem.id,
  type: "deep_vocabulary_item",
  order: indexItem.order,
  hanzi,
  pinyin,
  category,
  runtimeId: `${lessonId}__${recordString(item, "id") || indexItem.id}`,
  lessonId,
  level_tag: "unknown",
  pos: {
   raw_vi: recordString(item, "pos"),
   raw_cn: "",
   normalized: posNormalized,
   notes: [],
  },
  tags: [],
  meaning: {
   hanviet: "",
   meaning_vi: meaningVi,
   meaning_en: "",
   short_definition_vi: meaningVi,
   natural_translations_vi: meaningVi ? [meaningVi] : [],
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
   check_needed: true,
  },
  comparison: {
   near_synonyms: [],
   antonyms: [],
   contrast_pairs: [],
   usage_rules: [],
   notes: [],
  },
  collocations: [],
  examples: [],
  warnings: [],
  notes: [],
  check_needed: true,
  audio_key: "",
  raw_markdown: "",
  materialized: item.materialized,
 } as HanziHomeVocabItem;
}

export function normalizeDbVocabItem(params: {
 item: DbVocabularyItemPayload;
 indexItem: DbVocabularyIndexItem;
 lessonId: string;
 lessonNumber: number;
 category: string;
}): HanziHomeVocabItem {
 const parsed = DeepVocabularyItemSchema.safeParse(params.item);

 if (params.indexItem.materialized_kind === "source_deep_vocab" && parsed.success) {
  return {
   ...parsed.data,
   runtimeId: `${params.lessonId}__${parsed.data.id}`,
   lessonId: params.lessonId,
   category: params.category,
  };
 }

 return syntheticVocabFallback(params);
}

function normalizeDbVocabItems(bundle: DbLessonBundle) {
 return bundle.vocabularyItems.map((item, index) => {
  const indexItem = bundle.vocabularyIndex[index];

  if (!indexItem) {
   throw new Error(
    `Missing vocabulary index entry for ${bundle.dataset}/lesson_${bundle.lessonNumber} item ${index}`,
   );
  }

  return normalizeDbVocabItem({
   item,
   indexItem,
   lessonId: bundle.lessonMeta.id,
   lessonNumber: bundle.lessonNumber,
   category: getCategoryForWord(bundle.vocabularyGroups, item),
  });
 });
}

function markdownHeading(level: number, title: string) {
 return `${"#".repeat(level)} ${title}`;
}

function joinLines(lines: Array<string | undefined>) {
 return lines.map((line) => line?.trim()).filter(Boolean) as string[];
}

function sectionTitle(section: Section) {
 return section.title_vi || section.title;
}

function renderLessonSection(section: Section) {
 const header = markdownHeading(2, sectionTitle(section));

 if ("items" in section && Array.isArray(section.items)) {
  return [
   header,
   ...section.items.map((item) => {
    const record = unknownRecord(item);
    return joinLines([
     markdownHeading(
      3,
      recordString(record, "title_vi") ||
       recordString(record, "title") ||
       recordString(record, "hanzi") ||
       recordString(record, "id") ||
       "Mục",
     ),
     recordString(record, "meaning_vi"),
    ]).join("\n");
   }),
  ].join("\n\n");
 }

 return header;
}

function renderLessonOverviewMarkdown(sourceLesson: HanyuLesson) {
 return [
  joinLines([
   markdownHeading(2, "Thông tin bài học"),
   sourceLesson.lesson.title.pinyin,
   sourceLesson.lesson.title.vi,
  ]).join("\n\n"),
  ...sourceLesson.lesson.sections
   .slice()
   .sort((a, b) => a.order - b.order)
   .map(renderLessonSection),
 ]
  .filter(Boolean)
  .join("\n\n---\n\n");
}

function renderTextSection(sourceLesson: HanyuLesson) {
 const textSection = sourceLesson.lesson.sections.find(
  (section) => section.type === "text",
 );

 if (!textSection || !("blocks" in textSection)) return "";

 return [
  markdownHeading(2, sectionTitle(textSection)),
  ...textSection.blocks.map((block) => {
   const lines = [markdownHeading(3, block.title_vi || block.title)];
   const record = unknownRecord(block);

   for (const key of ["lines", "paragraphs"]) {
    for (const value of recordArray(record, key)) {
     const line = unknownRecord(value);
     lines.push(
      ...joinLines([
       recordString(line, "speaker")
        ? `**${recordString(line, "speaker")}:** ${recordString(line, "zh")}`
        : recordString(line, "zh"),
       recordString(line, "pinyin")
        ? `_${recordString(line, "pinyin")}_`
        : undefined,
       recordString(line, "vi"),
      ]),
     );
    }
   }

   return lines.join("\n");
  }),
 ].join("\n\n");
}

function renderGrammarBlockItem(itemValue: unknown) {
 const item = unknownRecord(itemValue);
 const left = unknownRecord(item.left);
 const right = unknownRecord(item.right);
 const wrong = recordString(item, "wrong");
 const correct = recordString(item, "correct");
 const explanation = recordString(item, "explanation_vi");
 const aspect = recordString(item, "aspect");

 if (recordString(left, "label") || recordString(right, "label")) {
  return joinLines([
   aspect ? `**${aspect}**` : undefined,
   recordString(left, "label") || recordString(left, "value")
    ? `- ${recordString(left, "label")}: ${recordString(left, "value")}`
    : undefined,
   recordString(right, "label") || recordString(right, "value")
    ? `- ${recordString(right, "label")}: ${recordString(right, "value")}`
    : undefined,
  ]);
 }

 if (wrong || correct) {
  return joinLines([
   wrong ? `- Sai: ${wrong}` : undefined,
   correct ? `- Đúng: ${correct}` : undefined,
   explanation ? `- Vì sao: ${explanation}` : undefined,
  ]);
 }

 return joinLines([
  recordString(item, "title") || recordString(item, "label"),
  recordString(item, "content_vi") || recordString(item, "meaning_vi"),
  recordString(item, "note_vi") || recordString(item, "explanation_vi"),
 ]).map((line) => `- ${line}`);
}

function renderGrammarBlockDetailLines(block: GrammarBlock) {
 const record = unknownRecord(block);
 const formulas = recordArray(record, "formulas").map(unknownRecord);
 const notes = recordArray(record, "notes_vi").filter(
  (note): note is string => typeof note === "string" && Boolean(note.trim()),
 );
 const items = recordArray(record, "items");
 const questions = recordArray(record, "questions").map(unknownRecord);

 return [
  recordString(record, "content_vi"),
  recordString(record, "pattern")
   ? `Cấu trúc: ${recordString(record, "pattern")}`
   : "",
  recordString(record, "meaning_vi"),
  ...formulas.map((formula) =>
   [recordString(formula, "label"), recordString(formula, "pattern")]
    .filter(Boolean)
    .join(": "),
  ),
  ...notes,
  ...items.flatMap(renderGrammarBlockItem),
  ...questions.map((question) => recordString(question, "prompt")),
 ].filter(Boolean);
}

function getGrammarPointCore(point: GrammarPoint) {
 for (const block of point.blocks) {
  const record = unknownRecord(block);
  const type = recordString(record, "type");
  const content = recordString(record, "content_vi");

  if (type === "grammar_overview" && content) return content;
 }

 for (const block of point.blocks) {
  const record = unknownRecord(block);
  const content =
   recordString(record, "content_vi") || recordString(record, "meaning_vi");

  if (content) return content;
 }

 return "";
}

function renderGrammarBlock(block: GrammarBlock) {
 const lines = [markdownHeading(4, block.title)];
 const record = unknownRecord(block);
 const formulas = recordArray(record, "formulas").map(unknownRecord);
 const notes = recordArray(record, "notes_vi").filter(
  (note): note is string => typeof note === "string" && Boolean(note.trim()),
 );
 const examples = recordArray(record, "examples").map(unknownRecord);
 const items = recordArray(record, "items");

 if (recordString(record, "content_vi")) {
  lines.push(recordString(record, "content_vi"));
 }
 if (recordString(record, "pattern")) {
  lines.push(`**Cấu trúc:** ${recordString(record, "pattern")}`);
 }
 if (recordString(record, "meaning_vi")) {
  lines.push(recordString(record, "meaning_vi"));
 }
 if (formulas.length > 0) {
  lines.push(
   ...formulas.map(
    (formula) =>
     `- **${recordString(formula, "label")}:** ${recordString(formula, "pattern")}`,
   ),
  );
 }
 if (notes.length > 0) lines.push(...notes.map((note) => `- ${note}`));
 if (examples.length > 0) {
  lines.push(
   ...examples.flatMap((example) =>
    joinLines([
     recordString(example, "zh"),
     recordString(example, "pinyin")
      ? `_${recordString(example, "pinyin")}_`
      : "",
     recordString(example, "vi"),
    ]),
   ),
  );
 }
 if (items.length > 0) lines.push(...items.flatMap(renderGrammarBlockItem));

 return lines.filter(Boolean).join("\n");
}

function renderGrammarPoint(point: GrammarPoint) {
 return [
  markdownHeading(3, point.title_vi || point.title),
  point.level ? `**Cấp độ:** ${point.level}` : "",
  ...point.blocks.map(renderGrammarBlock),
 ]
  .filter(Boolean)
  .join("\n\n");
}

function buildLessonDocumentGrammarViewModels(
 lessonId: string,
 sourceLesson: HanyuLesson,
): GrammarViewModel[] {
 const grammarSection = sourceLesson.lesson.sections.find(
  (section) => section.type === "grammar",
 );

 if (!grammarSection) return [];

 return grammarSection.items.map((point) => {
  const itemTitle = point.title_vi || point.title;
  const detailSections = point.blocks
   .map((block) => ({
    id: `${lessonId}__${point.id}__${block.id}`,
    key: `${lessonId}-${point.id}-${block.id}`,
    title: block.title,
    lines: renderGrammarBlockDetailLines(block),
   }))
   .filter((section) => section.lines.length > 0);
  const examples = point.blocks.flatMap((block) => {
   const record = unknownRecord(block);

   return recordArray(record, "examples")
    .map(unknownRecord)
    .map((example, index) => ({
     id:
      recordString(example, "id") ||
      `${lessonId}__${point.id}__${block.id}__example_${index + 1}`,
     zh: recordString(example, "zh"),
     pinyin: recordString(example, "pinyin") || undefined,
     vi: recordString(example, "vi") || undefined,
     note: recordString(example, "note_vi") || undefined,
    }))
    .filter((example) => Boolean(example.zh));
  });

  return {
   id: `${lessonId}__${point.id}`,
   title: itemTitle,
   cleanTitle: itemTitle,
   core: getGrammarPointCore(point),
   contentMd: renderGrammarPoint(point),
   structuresView: point.blocks
    .map((block) => recordString(unknownRecord(block), "pattern"))
    .filter(Boolean),
   examplesParsed: examples,
   notes: [],
   detailSections,
  };
 });
}

function getEntryVocabCategories(bundle: DbLessonBundle) {
 return bundle.vocabularyGroups.map((group) => ({
  nameVi:
   recordString(group, "title_vi") ||
   recordString(group, "title") ||
   "Từ vựng",
  words: recordArray(group, "words").filter(
   (word): word is string => typeof word === "string",
  ),
 }));
}

function getEntryVocabularyText(bundle: DbLessonBundle) {
 return getEntryVocabCategories(bundle)
  .map((group) => `**${group.nameVi}:** ${group.words.join("、")}`)
  .join("\n\n");
}

function buildLessonSummary(entry: RuntimeLessonEntry): HanziHomeLesson {
 const { bundle, sourceLesson, grammar } = entry;
 const sectionFilesById = Object.fromEntries(
  sourceLesson.lesson.sections.map((section, index) => [
   section.id,
   bundle.sectionIndex[index]?.file ?? "",
  ]),
 );
 const vocabularyItemFilesByRuntimeId = Object.fromEntries(
  entry.vocab.map((item, index) => [
   item.runtimeId,
   bundle.vocabularyIndex[index]?.file ?? "",
  ]),
 );
 const vocabularyItemPayloadsByRuntimeId = Object.fromEntries(
  entry.vocab.map((item, index) => [item.runtimeId, bundle.vocabularyItems[index]]),
 );

 return {
  id: bundle.lessonMeta.id,
  dbSource: {
   dataset: bundle.dataset,
   lessonFolder: `lesson_${String(bundle.lessonNumber).padStart(2, "0")}`,
   lessonMeta: bundle.lessonMeta,
   sectionFilesById,
   vocabularyItemFilesByRuntimeId,
   vocabularyItemPayloadsByRuntimeId,
  },
  legacyLessonId: `${bundle.dataset}_lesson_${bundle.lessonNumber}`,
  lessonNumber: bundle.lessonNumber,
  titleZh: bundle.lessonMeta.title.zh,
  title: `Bài ${bundle.lessonNumber}: ${bundle.lessonMeta.title.zh}`,
  sourceFile: "",
  courseId: bundle.courseId,
  courseTitle: bundle.courseTitle,
  bookId: bundle.bookId,
  bookTitle: bundle.bookTitle,
  bookOrder: bundle.bookOrder,
  lessonOrder: bundle.lessonOrder,
  vocabCategories: getEntryVocabCategories(bundle),
  vocabCount: bundle.vocabularyIndex.length,
  grammarCount: grammar.length,
  vocabIds: entry.vocab.map((item) => item.runtimeId),
  grammarPointIds: grammar.map((point) => point.id),
  vocab: [],
  grammar: [],
  notes: {
   overviewMarkdown: renderLessonOverviewMarkdown(sourceLesson),
   lessonTextMarkdown: renderTextSection(sourceLesson),
   exerciseMarkdown:
    sourceLesson.lesson.sections
     .filter((section) => section.type === "exercises")
     .map(renderLessonSection)
     .join("\n\n") || "",
   readingMarkdown:
    sourceLesson.lesson.sections
     .filter((section) => section.type === "reading")
     .map(renderLessonSection)
     .join("\n\n") || "",
   vocabularyText: getEntryVocabularyText(bundle),
  },
 };
}

function buildLessonDetail(entry: RuntimeLessonEntry): HanziHomeLesson {
 const summary = buildLessonSummary(entry);

 return {
  ...summary,
  vocab: entry.vocab,
  grammar: entry.grammar,
  sourceLesson: entry.sourceLesson,
 };
}

function buildRuntimeLessonEntries() {
 return (["q2", "q3"] satisfies HanziHomeDbDataset[]).flatMap((dataset) => {
  const manifest = getDatasetManifest(dataset);

  return manifest.lessons.map((lesson) => {
   const bundle = loadLessonBundle(dataset, lesson);
   const sourceLesson = buildSourceLesson(bundle);
   const vocab = normalizeDbVocabItems(bundle);
   const grammar = buildLessonDocumentGrammarViewModels(
    bundle.lessonMeta.id,
    sourceLesson,
   );

   return { bundle, sourceLesson, vocab, grammar };
  });
 });
}

const runtimeLessonEntries = buildRuntimeLessonEntries();
const lessonSummaries = runtimeLessonEntries.map(buildLessonSummary);

function getStaticRadicals() {
 return [...radicalsData.radicals].sort((a, b) => a.index - b.index);
}

export function getHanziHomeCatalogSummary(
 includeLessons = false,
): HanziHomeCatalogData {
 const courses: HanziHomeCatalogCourse[] = hanzihomeCourses.map((course) => ({
  ...course,
  stats: {
   bookCount: hanzihomeCourseBooks.filter((book) => book.courseId === course.id)
    .length,
   lessonCount: lessonSummaries.filter(
    (lesson) => lesson.courseId === course.id,
   ).length,
   vocabCount: lessonSummaries
    .filter((lesson) => lesson.courseId === course.id)
    .reduce((sum, lesson) => sum + (lesson.vocabCount ?? 0), 0),
   grammarCount: lessonSummaries
    .filter((lesson) => lesson.courseId === course.id)
    .reduce((sum, lesson) => sum + (lesson.grammarCount ?? 0), 0),
  },
  fallbackLessonId: lessonSummaries.find(
   (lesson) => lesson.courseId === course.id,
  )?.id,
 }));
 const vocabCount = lessonSummaries.reduce(
  (sum, lesson) => sum + (lesson.vocabCount ?? 0),
  0,
 );
 const grammarCount = lessonSummaries.reduce(
  (sum, lesson) => sum + (lesson.grammarCount ?? 0),
  0,
 );

 return {
  source: "static",
  courses,
  books: hanzihomeCourseBooks,
  lessons: includeLessons ? lessonSummaries : [],
  radicals: getStaticRadicals(),
  meta: {
   app: "hanzihome",
   dataset: "hanzihome-db",
   version: rootManifest.schemaVersion,
   generatedAt: rootManifest.generatedAt,
   sourceFiles: ["data/hanzihome-db"],
   counts: {
    lessons: rootManifest.counts.lessons,
    vocab: vocabCount,
    grammarPoints: grammarCount,
    radicals: radicalsData.radicals.length,
    flashcards: vocabCount,
   },
   schemaNote:
    "data/hanzihome-db is the runtime source of truth; legacy data/hanzihome is not used as fallback.",
  },
 };
}

export function getHanziHomeCourseLessonSummaries(courseId: string) {
 return lessonSummaries.filter((lesson) => lesson.courseId === courseId);
}

export function getHanziHomeLessonDetail(
 lessonId: string | null | undefined,
): HanziHomeLesson | null {
 const entry = runtimeLessonEntries.find(
  (item) => item.bundle.lessonMeta.id === lessonId,
 );

 return entry ? buildLessonDetail(entry) : null;
}

export function getHanziHomeData(): HanziHomeData {
 const lessons = runtimeLessonEntries.map(buildLessonDetail);

 return {
  courses: hanzihomeCourses,
  books: hanzihomeCourseBooks,
  lessons,
  radicals: getStaticRadicals(),
  meta: getHanziHomeCatalogSummary().meta,
 };
}
