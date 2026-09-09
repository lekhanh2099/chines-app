import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { Json, TablesInsert } from "../src/types/supabase.generated.ts";
import type {
 ReaderExerciseGroupRow,
 ReaderExerciseItemRow,
} from "../src/features/reading/model/reading-exercise.schemas.ts";
import type { ReaderHumanitiesEvaluation } from "../src/features/humanities/model/humanities-exercise.schemas.ts";
import type { ReaderAssetRow } from "../src/features/reading/model/reading-assets.schemas.ts";
import type {
 ReaderDocumentRow,
 ReaderParagraphRow,
 ReaderVocabularyLinkRow,
} from "../src/features/reading/model/reading-resource.schemas.ts";
import {
 assertStudioInventoryBaseline,
 buildStudioImportPreview,
 canonicalStudioLessonId,
 hskReadingSchema,
 grammarDatasetSchema,
 dictationCourseSchema,
 dailyReadingSchema,
 personalCurriculumSchema,
 exerciseBankSchema,
 humanitiesItemSchema,
 humanitiesInterpretingSchema,
 humanitiesPracticeSchema,
 personalPartSchema,
 loadStudioInventory,
 readingCourseSchema,
 studioLessonMappingSchema,
 studioCanonicalCourseId,
 type StudioInventory,
} from "./hanzihome-studio-inventory.ts";

export type CanonicalSeedPackage = {
 courses: Array<TablesInsert<"hanzihome_courses">>;
 books: Array<TablesInsert<"hanzihome_course_books">>;
 lessons: Array<TablesInsert<"hanzihome_lessons">>;
 lessonSections: Array<TablesInsert<"hanzihome_lesson_sections">>;
 lessonTexts: Array<TablesInsert<"hanzihome_lesson_texts">>;
 vocabItems: Array<TablesInsert<"hanzihome_vocab_items">>;
 vocabExamples: Array<TablesInsert<"hanzihome_vocab_examples">>;
 vocabDetailSections: Array<TablesInsert<"hanzihome_vocab_detail_sections">>;
 grammarPoints: Array<TablesInsert<"hanzihome_grammar_points">>;
 grammarExamples: Array<TablesInsert<"hanzihome_grammar_examples">>;
 grammarDetailSections: Array<TablesInsert<"hanzihome_grammar_detail_sections">>;
 listeningItems: Array<TablesInsert<"hanzihome_listening_items">>;
};

export type StudioReaderSeedPackage = {
 documents: ReaderDocumentRow[];
 paragraphs: ReaderParagraphRow[];
 vocabularyLinks: ReaderVocabularyLinkRow[];
 exerciseGroups: ReaderExerciseGroupRow[];
 exerciseItems: ReaderExerciseItemRow[];
 assets: ReaderAssetRow[];
};

export type StudioSeedPackage = {
 sourceChecksum: string;
 canonical: CanonicalSeedPackage;
 reader: StudioReaderSeedPackage;
};

type StudioSeedAdditions = {
 courses: CanonicalSeedPackage["courses"];
 books: CanonicalSeedPackage["books"];
 lessons: CanonicalSeedPackage["lessons"];
 lessonSections: CanonicalSeedPackage["lessonSections"];
 lessonTexts: CanonicalSeedPackage["lessonTexts"];
 vocabItems: CanonicalSeedPackage["vocabItems"];
 vocabExamples: CanonicalSeedPackage["vocabExamples"];
 vocabDetailSections: CanonicalSeedPackage["vocabDetailSections"];
 grammarPoints: CanonicalSeedPackage["grammarPoints"];
 grammarExamples: CanonicalSeedPackage["grammarExamples"];
 grammarDetailSections: CanonicalSeedPackage["grammarDetailSections"];
 listeningItems: CanonicalSeedPackage["listeningItems"];
};

function stableUuid(seed: string): string {
 const bytes = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
 bytes[12] = "5";
 bytes[16] = ((Number.parseInt(bytes[16], 16) & 0x3) | 0x8).toString(16);
 return [
  bytes.slice(0, 8),
  bytes.slice(8, 12),
  bytes.slice(12, 16),
  bytes.slice(16, 20),
  bytes.slice(20),
 ]
  .map((part) => part.join(""))
  .join("-");
}

function splitSentences(text: string): string[] {
 const sentences: string[] = [];
 let current = "";
 for (const character of text.trim()) {
  current += character;
  if (/[。！？!?；;]/u.test(character)) {
   if (current.trim().length > 0) sentences.push(current.trim());
   current = "";
  }
 }
 if (current.trim().length > 0) sentences.push(current.trim());
 return sentences;
}

type ReadingContentLesson = Pick<
 z.output<typeof readingCourseSchema>["coreLessons"][number],
 "id" | "titleZh" | "paragraphs" | "vocabulary"
>;

function withCanonicalKind<T extends { id: string }>(
 lesson: T,
 kind: ReaderDocumentRow["kind"],
): T & { canonicalKind: ReaderDocumentRow["kind"] } {
 return { ...lesson, canonicalKind: kind };
}

function readingSectionPayload(lesson: ReadingContentLesson): Json {
 const paragraphs = lesson.paragraphs.map((paragraph) => ({
  id: paragraph.id,
  order: paragraph.order,
  zh: paragraph.zh,
  pinyin: paragraph.pinyin,
  vi: paragraph.vi,
 }));
 return {
  id: `${lesson.id}:reading`,
  type: "reading",
  order: 1,
  title: lesson.titleZh,
  title_vi: "Đọc hiểu",
  items: [
   {
    id: `${lesson.id}:reading-item`,
    type: "reading_text",
    order: 1,
    title: lesson.titleZh,
    title_vi: "Đọc hiểu",
    paragraphs,
    text: paragraphs.map((paragraph) => paragraph.zh).join("\n"),
    pinyin: paragraphs.map((paragraph) => paragraph.pinyin).join("\n"),
    vi: paragraphs.map((paragraph) => paragraph.vi).join("\n"),
   },
  ],
 };
}

function vocabularySectionPayload(lesson: ReadingContentLesson): Json {
 return {
  id: `${lesson.id}:vocabulary`,
  type: "vocabulary",
  order: 2,
  title: "词汇",
  title_vi: "Từ vựng",
  items: lesson.vocabulary.map((item) => ({
   id: item.id,
   type: "vocabulary_item",
   order: item.order,
   hanzi: item.hanzi,
   pinyin: item.pinyin,
   meaning_vi: item.meaningVi,
   meaning_en: "",
   pos: item.categoryVi,
   tags: [item.level],
   examples: [],
  })),
 };
}

export function buildCanonicalSeedPackage(
 course: z.output<typeof readingCourseSchema>,
 sourceFile: string,
): CanonicalSeedPackage {
 const importedAt = new Date().toISOString();
 const unitsById = new Map(course.units.map((unit) => [unit.id, unit]));
 const allLessons = [
  ...course.coreLessons.map((lesson) => withCanonicalKind(lesson, "core")),
  ...course.mockLessons.map((lesson) => withCanonicalKind(lesson, "mock")),
  ...course.reinforcementLessons.map((lesson) => ({
   ...lesson,
   canonicalKind: "reinforcement",
   titleZh: lesson.slug,
   titleVi: lesson.slug,
   readingLabelVi: "",
   titlePinyin: "",
   genreVi: "",
   displayLabelVi: lesson.slug,
   objectivesVi: [],
   preReadingQuestionsVi: [],
   analysis: {
    mainIdeaVi: "",
    paragraphStructureVi: [],
    logicChainVi: [],
    trapsVi: [],
    keywordsZh: [],
   },
   summary: { modelZh: "", rubricVi: [] },
   sentenceLab: [],
   sourceLabelVi: "",
   counts: { paragraphs: 0, vocabulary: 0, exercises: 0 },
   difficultyVi: lesson.slug,
   unitId: undefined,
   paragraphs: [],
   vocabulary: [],
   exerciseGroups: [],
  })),
 ];
 const books = course.units.map((unit) => ({
  id: `${studioCanonicalCourseId}:book:${unit.id}`,
  course_id: studioCanonicalCourseId,
  title: unit.titleZh,
  short_title: unit.shortVi,
  book_order: unit.number,
  source: "seed",
  imported_at: importedAt,
  user_id: null,
 }));
 const lessonsByBook = new Map<string, number>();
 const lessons = allLessons.map((lesson, index) => {
  const unit = lesson.unitId === undefined ? course.units[0] : unitsById.get(lesson.unitId);
  if (unit === undefined) throw new Error(`Studio lesson ${lesson.id} references a missing unit.`);
  const bookId = `${studioCanonicalCourseId}:book:${unit.id}`;
  const lessonOrder = (lessonsByBook.get(bookId) ?? 0) + 1;
  lessonsByBook.set(bookId, lessonOrder);
  return {
   id: canonicalStudioLessonId(lesson.id),
   course_id: studioCanonicalCourseId,
   book_id: bookId,
   owner_id: null,
   source: "seed",
   lesson_number: lessonOrder,
   lesson_order: lessonOrder,
   title_zh: lesson.titleZh,
   title_vi: lesson.titleVi,
   title_pinyin: null,
   title_en: null,
   tags: ["studio-reader", lesson.canonicalKind],
   source_file: `${sourceFile}#${lesson.id}`,
   imported_at: importedAt,
   sequence: index,
  };
 });
 const vocabItems: Array<TablesInsert<"hanzihome_vocab_items">> = [];
 const vocabDetailSections: Array<TablesInsert<"hanzihome_vocab_detail_sections">> = [];
 const lessonSections: Array<TablesInsert<"hanzihome_lesson_sections">> = [];
 const lessonTexts: Array<TablesInsert<"hanzihome_lesson_texts">> = [];
 for (const lesson of allLessons) {
  const canonicalLesson = lessons.find((item) => item.id === canonicalStudioLessonId(lesson.id));
  if (canonicalLesson === undefined) throw new Error(`Canonical lesson missing for ${lesson.id}.`);
  if (lesson.paragraphs.length > 0) {
   lessonSections.push({
    id: stableUuid(`${canonicalLesson.id}:reading`),
    lesson_id: canonicalLesson.id,
    owner_id: null,
    source: "seed",
    source_section_id: `${lesson.id}:reading`,
    section_key: "studio-reading",
    section_type: "reading",
    title: lesson.titleZh,
    title_vi: "Đọc hiểu",
    section_order: 1,
    payload: readingSectionPayload(lesson),
    source_file: sourceFile,
    imported_at: importedAt,
   });
   lessonSections.push({
    id: stableUuid(`${canonicalLesson.id}:vocabulary`),
    lesson_id: canonicalLesson.id,
    owner_id: null,
    source: "seed",
    source_section_id: `${lesson.id}:vocabulary`,
    section_key: "studio-vocabulary",
    section_type: "vocabulary",
    title: "词汇",
    title_vi: "Từ vựng",
    section_order: 2,
    payload: vocabularySectionPayload(lesson),
    source_file: sourceFile,
    imported_at: importedAt,
   });
   lessonTexts.push({
    id: `${canonicalLesson.id}:source-text`,
    lesson_id: canonicalLesson.id,
    owner_id: null,
    source: "seed",
    text_key: "studio-reader-source",
    title: lesson.titleZh,
    content: lesson.paragraphs.map((paragraph) => paragraph.zh).join("\n"),
    content_format: "plain",
    imported_at: importedAt,
   });
  }
  for (const item of lesson.vocabulary) {
   const vocabId = `${canonicalLesson.id}:vocab:${item.id}`;
   vocabItems.push({
    id: vocabId,
    lesson_id: canonicalLesson.id,
    course_id: canonicalLesson.course_id,
    book_id: canonicalLesson.book_id,
    owner_id: null,
    source: "seed",
    item_order: item.order,
    word: item.hanzi,
    pinyin: item.pinyin,
    han_viet: "",
    meaning: item.meaningVi,
    category: item.categoryVi,
    level: item.level,
    pos_vi: item.categoryVi,
    pos_zh: item.category,
    tone: null,
    source_file: `${sourceFile}#${item.id}`,
    imported_at: importedAt,
    meaning_en: null,
    tags: ["studio-reader", item.level],
   });
   vocabDetailSections.push({
    id: `${vocabId}:context`,
    vocab_item_id: vocabId,
    lesson_id: canonicalLesson.id,
    owner_id: null,
    source: "seed",
    section_key: "meaning",
    title: "语境义",
    lines: [item.meaningInContextVi],
    section_order: 1,
    imported_at: importedAt,
   });
  }
 }
 return {
  courses: [
   {
    id: studioCanonicalCourseId,
    user_id: null,
    slug: studioCanonicalCourseId,
    title: "Hanzi Studio Reader",
    subtitle: "Reader content migrated from the reviewed Hanzi Studio source.",
    type: "reader",
    course_order: 900,
    source: "seed",
    imported_at: importedAt,
   },
  ],
  books,
  lessons: lessons.map(({ sequence: _sequence, ...lesson }) => lesson),
  lessonSections,
  lessonTexts,
  vocabItems,
  vocabExamples: [],
  vocabDetailSections,
  grammarPoints: [],
  grammarExamples: [],
  grammarDetailSections: [],
  listeningItems: [],
 };
}

export function buildHskSeedPackage(hsk: z.output<typeof hskReadingSchema>): {
 canonical: StudioSeedAdditions;
 reader: StudioReaderSeedPackage;
} {
 const importedAt = hsk.importedAt;
 const passagesByVolume = new Map<string, typeof hsk.passages>();
 for (const passage of hsk.passages) {
  passagesByVolume.set(passage.volumeId, [
   ...(passagesByVolume.get(passage.volumeId) ?? []),
   passage,
  ]);
 }
 const books: CanonicalSeedPackage["books"] = [];
 const lessons: CanonicalSeedPackage["lessons"] = [];
 const lessonSections: CanonicalSeedPackage["lessonSections"] = [];
 const lessonTexts: CanonicalSeedPackage["lessonTexts"] = [];
 const documents: ReaderDocumentRow[] = [];
 const paragraphs: ReaderParagraphRow[] = [];
 const bookOrderById = new Map<string, number>();
 const bookTitleById = new Map<string, { titleZh: string; titleVi: string }>();

 for (const [volumeIndex, [volumeId, volumePassages]] of [
  ...passagesByVolume.entries(),
 ].entries()) {
  const bookId = `${studioCanonicalCourseId}:book:${volumeId}`;
  const firstPassage = volumePassages[0];
  if (firstPassage === undefined) continue;
  books.push({
   id: bookId,
   course_id: studioCanonicalCourseId,
   title: firstPassage.volumeLabelZh,
   short_title: firstPassage.volumeLabelVi,
   book_order: 100 + volumeIndex,
   source: "seed",
   imported_at: importedAt,
   user_id: null,
  });
  bookOrderById.set(bookId, 0);
  bookTitleById.set(bookId, {
   titleZh: firstPassage.volumeLabelZh,
   titleVi: firstPassage.volumeLabelVi,
  });
 }

 for (const passage of hsk.passages) {
  const bookId = `${studioCanonicalCourseId}:book:${passage.volumeId}`;
  const previousOrder = bookOrderById.get(bookId);
  const bookTitle = bookTitleById.get(bookId);
  if (previousOrder === undefined || bookTitle === undefined) {
   throw new Error(`HSK passage ${passage.id} references missing volume ${passage.volumeId}.`);
  }
  const lessonOrder = previousOrder + 1;
  bookOrderById.set(bookId, lessonOrder);
  const sourceId = `hsk:${passage.id}`;
  const documentId = canonicalStudioLessonId(sourceId);
  const normalizedParagraphs = passage.paragraphs.map((paragraph) => ({
   id: `${documentId}:paragraph:${paragraph.id}`,
   order: paragraph.order,
   zh: paragraph.zh,
   pinyin: paragraph.pinyin,
   vi: paragraph.vi,
   roleVi: paragraph.roleVi,
  }));
  lessons.push({
   id: documentId,
   course_id: studioCanonicalCourseId,
   book_id: bookId,
   owner_id: null,
   source: "seed",
   lesson_number: lessonOrder,
   lesson_order: lessonOrder,
   title_zh: passage.titleZh,
   title_vi: passage.titleVi,
   title_pinyin: null,
   title_en: null,
   tags: ["studio-reader", "hsk", `HSK${passage.level}`],
   source_file: `src/features/reading/hsk/data/hsk-reading-passages.json#${passage.id}`,
   imported_at: importedAt,
  });
  lessonSections.push({
   id: stableUuid(`${documentId}:reading`),
   lesson_id: documentId,
   owner_id: null,
   source: "seed",
   source_section_id: `${sourceId}:reading`,
   section_key: "studio-hsk-reading",
   section_type: "reading",
   title: passage.titleZh,
   title_vi: passage.titleVi,
   section_order: 1,
   payload: {
    id: `${sourceId}:reading`,
    type: "reading",
    order: 1,
    title: passage.titleZh,
    title_vi: passage.titleVi,
    items: [
     {
      id: `${sourceId}:reading-item`,
      type: "reading_text",
      order: 1,
      title: passage.titleZh,
      title_vi: passage.titleVi,
      paragraphs: normalizedParagraphs,
      text: normalizedParagraphs.map((paragraph) => paragraph.zh).join("\n"),
      pinyin: normalizedParagraphs.map((paragraph) => paragraph.pinyin).join("\n"),
      vi: normalizedParagraphs.map((paragraph) => paragraph.vi).join("\n"),
     },
    ],
   },
   source_file: "src/features/reading/hsk/data/hsk-reading-passages.json",
   imported_at: importedAt,
  });
  lessonTexts.push({
   id: `${documentId}:source-text`,
   lesson_id: documentId,
   owner_id: null,
   source: "seed",
   text_key: "studio-hsk-source",
   title: passage.titleZh,
   content: normalizedParagraphs.map((paragraph) => paragraph.zh).join("\n"),
   content_format: "plain",
   imported_at: importedAt,
  });
  documents.push({
   id: documentId,
   lesson_id: documentId,
   owner_id: null,
   source: "seed",
   publication_status: "published",
   kind: "hsk",
   slug: `hsk-${passage.slug}`,
   unit_id: null,
   reading_number: passage.textNumber,
   title_zh: passage.titleZh,
   title_pinyin: "",
   title_vi: passage.titleVi,
   genre_vi: "Đọc hiểu HSK",
   objectives_vi: ["Đọc hiểu", "Luyện pinyin theo ngữ cảnh"],
   analysis: {
    mainIdeaVi: "",
    paragraphStructureVi: [],
    logicChainVi: [],
    trapsVi: [],
    keywordsZh: [],
   },
   summary: { modelZh: "", rubricVi: [] },
   source_metadata: {
    source_file: "src/features/reading/hsk/data/hsk-reading-passages.json",
    source_id: passage.id,
    source_passage_id: passage.sourceId,
    level: passage.level,
    lesson_number: passage.lessonNumber,
    lesson_title_zh: passage.lessonTitleZh,
    lesson_title_vi: passage.lessonTitleVi,
    volume_id: passage.volumeId,
    volume_label_zh: passage.volumeLabelZh,
    volume_label_vi: passage.volumeLabelVi,
    pinyin_review_status: passage.pinyinReviewStatus,
    counts: { paragraphs: normalizedParagraphs.length, vocabulary: 0, exercises: 0 },
   },
   schema_version: "studio-hsk-reading-v1",
   imported_at: importedAt,
   created_at: importedAt,
   updated_at: importedAt,
   deleted_at: null,
  });
  for (const paragraph of normalizedParagraphs) {
   paragraphs.push({
    id: paragraph.id,
    document_id: documentId,
    source: "seed",
    paragraph_order: paragraph.order,
    zh: paragraph.zh,
    pinyin: paragraph.pinyin,
    vi: paragraph.vi,
    role_vi: paragraph.roleVi,
    source_version: 1,
    created_at: importedAt,
    updated_at: importedAt,
   });
  }
 }
 return {
  canonical: {
   courses: [],
   books,
   lessons,
   lessonSections,
   lessonTexts,
   vocabItems: [],
   vocabExamples: [],
   vocabDetailSections: [],
   grammarPoints: [],
   grammarExamples: [],
   grammarDetailSections: [],
   listeningItems: [],
  },
  reader: {
   documents,
   paragraphs,
   vocabularyLinks: [],
   exerciseGroups: [],
   exerciseItems: [],
   assets: [],
  },
 };
}

export function buildHskGrammarSeedPackage(
 datasets: Array<z.output<typeof grammarDatasetSchema>>,
 importedAt: string,
): { canonical: StudioSeedAdditions; reader: StudioReaderSeedPackage } {
 const courseId = "hanzihome-studio-grammar";
 const courses: CanonicalSeedPackage["courses"] = [
  {
   id: courseId,
   user_id: null,
   slug: courseId,
   title: "Hanzi Studio Grammar",
   subtitle: "HSK grammar content migrated from the reviewed Hanzi Studio source.",
   type: "grammar",
   course_order: 901,
   source: "seed",
   imported_at: importedAt,
  },
 ];
 const books: CanonicalSeedPackage["books"] = [];
 const lessons: CanonicalSeedPackage["lessons"] = [];
 const grammarPoints: CanonicalSeedPackage["grammarPoints"] = [];
 const grammarExamples: CanonicalSeedPackage["grammarExamples"] = [];
 const grammarDetailSections: CanonicalSeedPackage["grammarDetailSections"] = [];

 for (const [datasetIndex, dataset] of datasets.entries()) {
  const bookId = `${courseId}:book:${dataset.level}`;
  const lessonId = `${courseId}:lesson:${dataset.level}`;
  books.push({
   id: bookId,
   user_id: null,
   course_id: courseId,
   title: dataset.level,
   short_title: `Ngữ pháp ${dataset.level}`,
   book_order: datasetIndex + 1,
   source: "seed",
   imported_at: importedAt,
  });
  lessons.push({
   id: lessonId,
   course_id: courseId,
   book_id: bookId,
   owner_id: null,
   source: "seed",
   lesson_number: 1,
   lesson_order: 1,
   title_zh: `${dataset.level} Grammar`,
   title_vi: `Ngữ pháp ${dataset.level}`,
   title_pinyin: null,
   title_en: null,
   tags: ["studio-grammar", dataset.level],
   source_file: `src/features/reading/grammar/data/${dataset.level.toLowerCase()}.json`,
   imported_at: importedAt,
  });

  for (const item of dataset.items) {
   const pointId = `${courseId}:${item.id}`;
   const contentSections = [
    item.core,
    ...item.usage_notes,
    ...item.constraints,
    ...item.contrasts.map((contrast) => `${contrast.with ?? "对比"}: ${contrast.summary_vi}`),
    ...item.common_errors.map(
     (error) => `Sai: ${error.wrong} · Đúng: ${error.right} · ${error.explanation_vi}`,
    ),
   ].filter((line) => line.length > 0);
   grammarPoints.push({
    id: pointId,
    lesson_id: lessonId,
    course_id: courseId,
    book_id: bookId,
    owner_id: null,
    source: "seed",
    point_order: item.order,
    title: item.title,
    clean_title: item.title,
    core: item.core,
    content_md: contentSections.join("\n\n"),
    structures_view: item.structures,
    notes: [...item.usage_notes, ...item.constraints],
    imported_at: importedAt,
    title_vi: item.title_vi,
    level: item.level,
    tags: [...item.categories, ...item.focus],
   });
   let exampleOrder = 0;
   for (const [tier, examples] of Object.entries(item.examples)) {
    for (const example of examples) {
     exampleOrder += 1;
     grammarExamples.push({
      id: `${pointId}:example:${tier}:${exampleOrder}`,
      grammar_point_id: pointId,
      lesson_id: lessonId,
      owner_id: null,
      source: "seed",
      example_order: exampleOrder,
      zh: example.zh,
      pinyin: example.pinyin,
      vi: example.vi,
      note: `${example.origin}: ${example.note_vi}`,
      imported_at: importedAt,
     });
    }
   }
   const detailSections = [
    { key: "focus", title: "Trọng tâm", lines: item.focus },
    { key: "categories", title: "Phân loại", lines: item.categories },
    {
     key: "source",
     title: "Nguồn",
     lines: [`${item.source_ref.primary} · trang ${item.source_ref.pdf_page}`],
    },
    { key: "verification", title: "Kiểm chứng", lines: [item.verification.notes] },
   ];
   for (const [sectionIndex, section] of detailSections.entries()) {
    if (section.lines.length === 0) continue;
    grammarDetailSections.push({
     id: `${pointId}:detail:${section.key}`,
     grammar_point_id: pointId,
     lesson_id: lessonId,
     owner_id: null,
     source: "seed",
     section_key: section.key,
     title: section.title,
     lines: section.lines,
     section_order: sectionIndex + 1,
     imported_at: importedAt,
    });
   }
  }
 }
 return {
  canonical: {
   courses,
   books,
   lessons,
   lessonSections: [],
   lessonTexts: [],
   vocabItems: [],
   vocabExamples: [],
   vocabDetailSections: [],
   grammarPoints,
   grammarExamples,
   grammarDetailSections,
   listeningItems: [],
  },
  reader: {
   documents: [],
   paragraphs: [],
   vocabularyLinks: [],
   exerciseGroups: [],
   exerciseItems: [],
   assets: [],
  },
 };
}

export function buildDictationSeedPackage(
 dictation: z.output<typeof dictationCourseSchema>,
 importedAt: string,
 hsk: Pick<z.output<typeof hskReadingSchema>, "passages"> = { passages: [] },
): { canonical: StudioSeedAdditions; reader: StudioReaderSeedPackage } {
 const courseId = "hanzihome-studio-dictation";
 const courses: CanonicalSeedPackage["courses"] = [
  {
   id: courseId,
   user_id: null,
   slug: courseId,
   title: "Hanzi Studio Dictation",
   subtitle: "Dictation content migrated from the reviewed Hanzi Studio source.",
   type: "dictation",
   course_order: 902,
   source: "seed",
   imported_at: importedAt,
  },
 ];
 const books: CanonicalSeedPackage["books"] = [];
 const lessons: CanonicalSeedPackage["lessons"] = [];
 const lessonSections: CanonicalSeedPackage["lessonSections"] = [];
 const lessonTexts: CanonicalSeedPackage["lessonTexts"] = [];
 const listeningItems: CanonicalSeedPackage["listeningItems"] = [];
 let bookOrder = 0;
 for (const book of dictation.books) {
  for (const volume of book.volumes) {
   bookOrder += 1;
   const bookId = `${courseId}:book:${volume.id}`;
   books.push({
    id: bookId,
    user_id: null,
    course_id: courseId,
    title: volume.titleZh,
    short_title: volume.titleVi,
    book_order: bookOrder,
    source: "seed",
    imported_at: importedAt,
   });
   for (const lesson of volume.lessons) {
    const lessonId = `${courseId}:${lesson.id}`;
    lessons.push({
     id: lessonId,
     course_id: courseId,
     book_id: bookId,
     owner_id: null,
     source: "seed",
     lesson_number: lesson.number,
     lesson_order: lesson.number,
     title_zh: lesson.titleZh,
     title_vi: lesson.titleVi,
     title_pinyin: null,
     title_en: null,
     tags: ["studio-dictation", `HSK${book.level}`],
     source_file: `src/features/practice-lab/dictation/data/hsk-dictation-course.json#${lesson.id}`,
     imported_at: importedAt,
    });
    lessonTexts.push({
     id: `${lessonId}:source-text`,
     lesson_id: lessonId,
     owner_id: null,
     source: "seed",
     text_key: "studio-dictation-source",
     title: lesson.titleZh,
     content: lesson.segments.map((segment) => segment.zh).join("\n"),
     content_format: "plain",
     imported_at: importedAt,
    });
    const sectionId = stableUuid(`${lessonId}:dictation`);
    lessonSections.push({
     id: sectionId,
     lesson_id: lessonId,
     owner_id: null,
     source: "seed",
     source_section_id: `${lesson.id}:dictation`,
     section_key: "studio-dictation",
     section_type: "listening",
     title: lesson.titleZh,
     title_vi: lesson.titleVi,
     section_order: 1,
     payload: {
      category: "extra_practice",
      instructionZh: "听写",
      instructionVi: "Nghe và chép lại",
     },
     source_file: "src/features/practice-lab/dictation/data/hsk-dictation-course.json",
     imported_at: importedAt,
    });
    for (const segment of lesson.segments) {
     const itemId = `${lessonId}:segment:${segment.id}`;
     listeningItems.push({
      id: itemId,
      lesson_id: lessonId,
      owner_id: null,
      source: "seed",
      item_order: segment.order,
      item_type: "dictation",
      category: "extra_practice",
      source_item_key: segment.id,
      prompt_zh: null,
      transcript_zh: segment.zh,
      translation_vi: segment.vi,
      section_id: sectionId,
      section_title: lesson.titleZh,
      options: [],
      answer: { type: "text", accepted: [segment.zh] },
      transcript: {
       mode: "monologue",
       speakers: [
        {
         id: "narrator",
         labelZh: "朗读",
         labelVi: "Người đọc",
         voice: "neutral",
        },
       ],
       lines: [
        {
         order: 1,
         speakerId: "narrator",
         zh: segment.zh,
         pinyin: segment.pinyin,
         vi: segment.vi,
        },
       ],
       full: { zh: segment.zh, pinyin: segment.pinyin, vi: segment.vi },
      },
      explanation_vi: null,
      metadata: {
       source_id: lesson.sourceId,
       source_book: book.id,
       source_volume: volume.id,
       pinyin: segment.pinyin,
       translation_scope: lesson.translationScope,
      },
      tags: ["studio-dictation", `HSK${book.level}`],
      quality_status: "verified_structure",
      quality_issues: [],
      check_needed: false,
      publication_status: "published",
      source_file: "src/features/practice-lab/dictation/data/hsk-dictation-course.json",
      imported_at: importedAt,
     });
    }
   }
  }
 }
 const hskVolumeOrders = new Map<string, number>([
  ["hsk3-independent-passages", 1],
  ["hsk4-upper", 1],
  ["hsk4-lower", 2],
 ]);
 const hskBooks = new Map<string, string>();
 for (const passage of hsk.passages) {
  const volumeOrder = hskVolumeOrders.get(passage.volumeId);
  if (volumeOrder === undefined) {
   throw new Error(
    `Dictation HSK passage ${passage.id} references missing volume ${passage.volumeId}.`,
   );
  }
  const bookId = `${courseId}:book:hsk${passage.level}-volume-${volumeOrder}`;
  if (!hskBooks.has(bookId)) {
   hskBooks.set(bookId, passage.volumeId);
   books.push({
    id: bookId,
    user_id: null,
    course_id: courseId,
    title: passage.volumeLabelZh,
    short_title: passage.volumeLabelVi,
    book_order: 100 + volumeOrder,
    source: "seed",
    imported_at: importedAt,
   });
  }
  const lessonId = `${courseId}:${passage.id}`;
  lessons.push({
   id: lessonId,
   course_id: courseId,
   book_id: bookId,
   owner_id: null,
   source: "seed",
   lesson_number: passage.lessonNumber,
   lesson_order: passage.lessonNumber,
   title_zh: passage.titleZh,
   title_vi: passage.titleVi,
   title_pinyin: null,
   title_en: null,
   tags: ["studio-dictation", "hsk", `HSK${passage.level}`],
   source_file: `src/features/reading/hsk/data/hsk-reading-passages.json#${passage.id}`,
   imported_at: importedAt,
  });
  lessonTexts.push({
   id: `${lessonId}:source-text`,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   text_key: "studio-dictation-source",
   title: passage.titleZh,
   content: passage.paragraphs.map((paragraph) => paragraph.zh).join("\n"),
   content_format: "plain",
   imported_at: importedAt,
  });
  const sectionId = stableUuid(`${lessonId}:dictation`);
  lessonSections.push({
   id: sectionId,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   source_section_id: `${passage.id}:dictation`,
   section_key: "studio-dictation",
   section_type: "listening",
   title: passage.titleZh,
   title_vi: passage.titleVi,
   section_order: 1,
   payload: {
    category: "extra_practice",
    instructionZh: "听写",
    instructionVi: "Nghe và chép lại",
   },
   source_file: "src/features/reading/hsk/data/hsk-reading-passages.json",
   imported_at: importedAt,
  });
  let itemOrder = 0;
  for (const paragraph of passage.paragraphs) {
   const chineseSentences = splitSentences(paragraph.zh);
   const pinyinSentences = splitSentences(paragraph.pinyin);
   const vietnameseSentences = splitSentences(paragraph.vi);
   for (const [sentenceIndex, sentence] of chineseSentences.entries()) {
    itemOrder += 1;
    const pinyin = pinyinSentences[sentenceIndex] ?? paragraph.pinyin;
    const translation = vietnameseSentences[sentenceIndex] ?? paragraph.vi;
    listeningItems.push({
     id: `${lessonId}:paragraph:${paragraph.id}:sentence:${sentenceIndex + 1}`,
     lesson_id: lessonId,
     owner_id: null,
     source: "seed",
     item_order: itemOrder,
     item_type: "dictation",
     category: "extra_practice",
     source_item_key: `${paragraph.id}:sentence:${sentenceIndex + 1}`,
     prompt_zh: null,
     transcript_zh: sentence,
     translation_vi: translation,
     section_id: sectionId,
     section_title: passage.titleZh,
     options: [],
     answer: { type: "text", accepted: [sentence] },
     transcript: {
      mode: "monologue",
      speakers: [{ id: "narrator", labelZh: "朗读", labelVi: "Người đọc", voice: "neutral" }],
      lines: [{ order: 1, speakerId: "narrator", zh: sentence, pinyin, vi: translation }],
      full: { zh: sentence, pinyin, vi: translation },
     },
     explanation_vi: null,
     metadata: {
      source_id: passage.sourceId,
      source_book: `hsk${passage.level}`,
      source_volume: passage.volumeId,
      pinyin,
      translation_scope: "segment",
     },
     tags: ["studio-dictation", "hsk", `HSK${passage.level}`],
     quality_status: "verified_structure",
     quality_issues: [],
     check_needed: false,
     publication_status: "published",
     source_file: "src/features/reading/hsk/data/hsk-reading-passages.json",
     imported_at: importedAt,
    });
   }
  }
 }
 return {
  canonical: {
   courses,
   books,
   lessons,
   lessonSections,
   lessonTexts,
   vocabItems: [],
   vocabExamples: [],
   vocabDetailSections: [],
   grammarPoints: [],
   grammarExamples: [],
   grammarDetailSections: [],
   listeningItems,
  },
  reader: {
   documents: [],
   paragraphs: [],
   vocabularyLinks: [],
   exerciseGroups: [],
   exerciseItems: [],
   assets: [],
  },
 };
}

export function buildDailyReadingSeedPackage(
 daily: z.output<typeof dailyReadingSchema>,
 importedAt: string,
): { canonical: StudioSeedAdditions; reader: StudioReaderSeedPackage } {
 const courseId = "hanzihome-studio-daily-reading";
 const bookId = `${courseId}:book:${daily.level}`;
 const lessonId = `${courseId}:${daily.id}`;
 const documentId = lessonId;
 const courses: CanonicalSeedPackage["courses"] = [
  {
   id: courseId,
   user_id: null,
   slug: courseId,
   title: "Hanzi Studio Daily Reading",
   subtitle: "Daily reading content migrated from the reviewed Hanzi Studio source.",
   type: "reading",
   course_order: 903,
   source: "seed",
   imported_at: importedAt,
  },
 ];
 const books: CanonicalSeedPackage["books"] = [
  {
   id: bookId,
   user_id: null,
   course_id: courseId,
   title: daily.level,
   short_title: `Daily Reading ${daily.level}`,
   book_order: 1,
   source: "seed",
   imported_at: importedAt,
  },
 ];
 const lessons: CanonicalSeedPackage["lessons"] = [
  {
   id: lessonId,
   course_id: courseId,
   book_id: bookId,
   owner_id: null,
   source: "seed",
   lesson_number: 1,
   lesson_order: 1,
   title_zh: daily.titleZh,
   title_vi: daily.titleVi,
   title_pinyin: daily.titlePinyin,
   title_en: null,
   tags: ["studio-daily-reading", daily.level, daily.topic],
   source_file: `src/features/daily-reading/data/daily-reading-seed.json#${daily.id}`,
   imported_at: importedAt,
  },
 ];
 const lessonTexts: CanonicalSeedPackage["lessonTexts"] = [
  {
   id: `${lessonId}:source-text`,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   text_key: "studio-daily-reading-source",
   title: daily.titleZh,
   content: daily.paragraphs.map((paragraph) => paragraph.zh).join("\n"),
   content_format: "plain",
   imported_at: importedAt,
  },
 ];
 const vocabItems: CanonicalSeedPackage["vocabItems"] = daily.vocabulary.map((item) => ({
  id: `${lessonId}:vocab:${item.id}`,
  lesson_id: lessonId,
  course_id: courseId,
  book_id: bookId,
  owner_id: null,
  source: "seed",
  item_order: item.order,
  word: item.hanzi,
  pinyin: item.pinyin,
  han_viet: "",
  meaning: item.meaningVi,
  category: item.categoryVi,
  level: daily.level,
  pos_vi: item.categoryVi,
  pos_zh: null,
  tone: null,
  source_file: `src/features/daily-reading/data/daily-reading-seed.json#${item.id}`,
  imported_at: importedAt,
  meaning_en: null,
  tags: ["studio-daily-reading", daily.level],
 }));
 const vocabDetailSections: CanonicalSeedPackage["vocabDetailSections"] = daily.vocabulary.map(
  (item) => ({
   id: `${lessonId}:vocab:${item.id}:context`,
   vocab_item_id: `${lessonId}:vocab:${item.id}`,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   section_key: "meaning",
   title: "语境义",
   lines: [item.meaningInContextVi],
   section_order: 1,
   imported_at: importedAt,
  }),
 );
 const grammarPoints: CanonicalSeedPackage["grammarPoints"] = daily.grammarPoints.map(
  (item, index) => {
   const pointId = `${lessonId}:grammar:${item.id}`;
   return {
    id: pointId,
    lesson_id: lessonId,
    course_id: courseId,
    book_id: bookId,
    owner_id: null,
    source: "seed",
    point_order: index + 1,
    title: item.patternZh,
    clean_title: item.patternZh,
    core: item.explanationVi,
    content_md: item.explanationVi,
    structures_view: [item.patternZh],
    notes: [],
    imported_at: importedAt,
    title_vi: item.explanationVi,
    level: daily.level,
    tags: ["studio-daily-reading", daily.topic],
   };
  },
 );
 const grammarExamples: CanonicalSeedPackage["grammarExamples"] = daily.grammarPoints.map(
  (item, index) => ({
   id: `${lessonId}:grammar:${item.id}:example`,
   grammar_point_id: `${lessonId}:grammar:${item.id}`,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   example_order: index + 1,
   zh: item.evidenceSentenceZh,
   pinyin: null,
   vi: null,
   note: "Daily Reading evidence sentence",
   imported_at: importedAt,
  }),
 );
 const grammarDetailSections: CanonicalSeedPackage["grammarDetailSections"] =
  daily.grammarPoints.map((item) => ({
   id: `${lessonId}:grammar:${item.id}:detail`,
   grammar_point_id: `${lessonId}:grammar:${item.id}`,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   section_key: "evidence",
   title: "例句",
   lines: [item.evidenceSentenceZh],
   section_order: 1,
   imported_at: importedAt,
  }));
 const paragraphs: ReaderParagraphRow[] = daily.paragraphs.map((paragraph) => ({
  id: `${documentId}:paragraph:${paragraph.id}`,
  document_id: documentId,
  source: "seed",
  paragraph_order: paragraph.order,
  zh: paragraph.zh,
  pinyin: paragraph.pinyin,
  vi: paragraph.vi,
  role_vi: paragraph.roleVi,
  source_version: 1,
  created_at: importedAt,
  updated_at: importedAt,
 }));
 const vocabularyLinks: ReaderVocabularyLinkRow[] = daily.vocabulary.map((item) => ({
  id: `${documentId}:vocab-link:${item.id}`,
  document_id: documentId,
  vocab_item_id: `${lessonId}:vocab:${item.id}`,
  source: "seed",
  item_order: item.order,
  meaning_in_context_vi: item.meaningInContextVi,
  source_ref: `src/features/daily-reading/data/daily-reading-seed.json#${item.id}`,
  created_at: importedAt,
  updated_at: importedAt,
 }));
 const questionGroupId = `${documentId}:questions`;
 const exerciseGroups: ReaderExerciseGroupRow[] = [
  {
   id: questionGroupId,
   document_id: documentId,
   source: "seed",
   exercise_order: 1,
   exercise_type: "short_answer",
   title_zh: "理解问题",
   title_vi: "Câu hỏi đọc hiểu",
   created_at: importedAt,
   updated_at: importedAt,
  },
 ];
 const exerciseItems: ReaderExerciseItemRow[] = daily.questions.map((question, index) => ({
  id: `${questionGroupId}:${question.id}`,
  group_id: questionGroupId,
  source: "seed",
  item_order: index + 1,
  item_type: "short_answer",
  payload: {
   promptZh: question.promptZh,
   promptVi: question.promptVi,
   pinyin: "",
   options: [],
   answer: question.answerZh,
   answerZh: question.answerZh,
   answerVi: question.answerVi,
   scoring: "manual",
   answerSource: question.evidenceParagraphIds.join(","),
   explanationVi: `Evidence: ${question.evidenceParagraphIds.join(", ")}`,
  },
  created_at: importedAt,
  updated_at: importedAt,
 }));
 const documents: ReaderDocumentRow[] = [
  {
   id: documentId,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   publication_status: "published",
   kind: "daily",
   slug: `daily-${daily.id}`,
   unit_id: null,
   reading_number: 1,
   title_zh: daily.titleZh,
   title_pinyin: daily.titlePinyin,
   title_vi: daily.titleVi,
   genre_vi: daily.topic,
   objectives_vi: [daily.whyWorthReadingVi],
   analysis: {
    mainIdeaVi: daily.whyWorthReadingVi,
    paragraphStructureVi: [],
    logicChainVi: [],
    trapsVi: [],
    keywordsZh: [],
   },
   summary: { modelZh: "", rubricVi: [] },
   source_metadata: {
    source_file: "src/features/daily-reading/data/daily-reading-seed.json",
    source_id: daily.id,
    published_date: daily.publishedDate,
    topic: daily.topic,
    level: daily.level,
    estimated_minutes: daily.estimatedMinutes,
    adaptation_notice_vi: daily.adaptationNoticeVi,
   },
   schema_version: "studio-daily-reading-v1",
   imported_at: importedAt,
   created_at: importedAt,
   updated_at: importedAt,
   deleted_at: null,
  },
 ];
 return {
  canonical: {
   courses,
   books,
   lessons,
   lessonSections: [],
   lessonTexts,
   vocabItems,
   vocabExamples: [],
   vocabDetailSections,
   grammarPoints,
   grammarExamples,
   grammarDetailSections,
   listeningItems: [],
  },
  reader: {
   documents,
   paragraphs,
   vocabularyLinks,
   exerciseGroups,
   exerciseItems,
   assets: [],
  },
 };
}

export function buildPersonalLearningSeedPackage(
 curriculum: z.output<typeof personalCurriculumSchema>,
 exerciseBanks: Array<z.output<typeof exerciseBankSchema>>,
 importedAt: string,
): { canonical: StudioSeedAdditions; reader: StudioReaderSeedPackage } {
 const courseId = "hanzihome-studio-personal-learning";
 const bookId = `${courseId}:book:curriculum`;
 const lessonIdBySourceId = new Map(
  curriculum.lessons.map((lesson) => [lesson.id, `${courseId}:${lesson.id}`]),
 );
 const courses: CanonicalSeedPackage["courses"] = [
  {
   id: courseId,
   user_id: null,
   slug: courseId,
   title: "Hanzi Studio Personal Learning",
   subtitle: "Personal-learning curriculum migrated from the reviewed Hanzi Studio source.",
   type: "personal-learning",
   course_order: 904,
   source: "seed",
   imported_at: importedAt,
  },
 ];
 const books: CanonicalSeedPackage["books"] = [
  {
   id: bookId,
   user_id: null,
   course_id: courseId,
   title: "Personal Learning Curriculum",
   short_title: "Personal Learning",
   book_order: 1,
   source: "seed",
   imported_at: importedAt,
  },
 ];
 const lessons: CanonicalSeedPackage["lessons"] = curriculum.lessons.map((lesson) => ({
  id: `${courseId}:${lesson.id}`,
  course_id: courseId,
  book_id: bookId,
  owner_id: null,
  source: "seed",
  lesson_number: lesson.order,
  lesson_order: lesson.order,
  title_zh: lesson.titleZh,
  title_vi: lesson.titleVi,
  title_pinyin: null,
  title_en: null,
  tags: ["studio-personal-learning", lesson.knowledgeNodeId, lesson.levelVi],
  source_file: `src/features/personal-learning/data/deep-knowledge-curriculum.json#${lesson.id}`,
  imported_at: importedAt,
 }));
 const documents: ReaderDocumentRow[] = curriculum.lessons.map((lesson) => {
  const documentId = `${courseId}:${lesson.id}`;
  return {
   id: documentId,
   lesson_id: documentId,
   owner_id: null,
   source: "seed",
   publication_status: "published",
   kind: "personal",
   slug: `personal-${lesson.id}`,
   unit_id: lesson.knowledgeNodeId,
   reading_number: lesson.order,
   title_zh: lesson.titleZh,
   title_pinyin: "",
   title_vi: lesson.titleVi,
   genre_vi: lesson.levelVi,
   objectives_vi: lesson.learningObjectivesVi,
   analysis: {
    mainIdeaVi: lesson.keyIdeaVi,
    paragraphStructureVi: [],
    logicChainVi: [],
    trapsVi: [],
    keywordsZh: [],
   },
   summary: { modelZh: "", rubricVi: [] },
   source_metadata: {
    source_file: "src/features/personal-learning/data/deep-knowledge-curriculum.json",
    source_id: lesson.id,
    knowledge_node_id: lesson.knowledgeNodeId,
    level_vi: lesson.levelVi,
    estimated_minutes: lesson.estimatedMinutes,
    review_status: lesson.reviewStatus,
    confidence: lesson.confidence,
    essential_question_vi: lesson.essentialQuestionVi,
    key_idea_vi: lesson.keyIdeaVi,
    origin_note: lesson.originNote,
    decision_tree_vi: lesson.decisionTreeVi,
    concepts: lesson.concepts,
    mastery_checklist_vi: lesson.masteryChecklistVi,
    source_ids: lesson.sourceIds,
    parts: lesson.parts,
    formula_flows: lesson.formulaFlows,
   },
   schema_version: "studio-personal-learning-v1",
   imported_at: importedAt,
   created_at: importedAt,
   updated_at: importedAt,
   deleted_at: null,
  };
 });
 const paragraphs: ReaderParagraphRow[] = curriculum.lessons.flatMap((lesson) => {
  const documentId = lessonIdBySourceId.get(lesson.id);
  if (documentId === undefined) throw new Error(`Personal lesson ${lesson.id} is missing.`);
  const overview: ReaderParagraphRow = {
   id: `${documentId}:paragraph:overview`,
   document_id: documentId,
   source: "seed",
   paragraph_order: 1,
   zh: lesson.titleZh,
   pinyin: "",
   vi: `${lesson.essentialQuestionVi}\n${lesson.keyIdeaVi}`,
   role_vi: "Tổng quan kiến thức",
   source_version: 1,
   created_at: importedAt,
   updated_at: importedAt,
  };
  let paragraphOrder = 2;
  const examples: ReaderParagraphRow[] = lesson.parts.flatMap((rawPart) => {
   const parsedPart = personalPartSchema.safeParse(rawPart);
   if (!parsedPart.success) return [];
   const part = parsedPart.data;
   return part.examples.map((example, exampleIndex) => ({
    id: `${documentId}:paragraph:${part.id}:${exampleIndex + 1}`,
    document_id: documentId,
    source: "seed",
    paragraph_order: paragraphOrder++,
    zh: example.zh,
    pinyin: "",
    vi: example.vi,
    role_vi: part.coreMeaningVi,
    source_version: 1,
    created_at: importedAt,
    updated_at: importedAt,
   }));
  });
  return [overview, ...examples];
 });
 const exerciseGroups: ReaderExerciseGroupRow[] = [];
 const exerciseItems: ReaderExerciseItemRow[] = [];
 const groupIdByLessonId = new Map<string, string>();
 const groupOrderByLessonId = new Map<string, number>();
 for (const bank of exerciseBanks) {
  for (const exercise of bank.exercises) {
   const documentId = lessonIdBySourceId.get(exercise.lessonId);
   if (documentId === undefined) {
    throw new Error(
     `Personal exercise ${exercise.id} references missing lesson ${exercise.lessonId}.`,
    );
   }
   const groupId = groupIdByLessonId.get(exercise.lessonId) ?? `${documentId}:exercises`;
   if (!groupIdByLessonId.has(exercise.lessonId)) {
    const lesson = curriculum.lessons.find((item) => item.id === exercise.lessonId);
    if (lesson === undefined) throw new Error(`Personal lesson ${exercise.lessonId} is missing.`);
    groupIdByLessonId.set(exercise.lessonId, groupId);
    groupOrderByLessonId.set(exercise.lessonId, groupOrderByLessonId.size + 1);
    exerciseGroups.push({
     id: groupId,
     document_id: documentId,
     source: "seed",
     exercise_order: groupOrderByLessonId.get(exercise.lessonId) ?? 1,
     exercise_type: "short_answer",
     title_zh: lesson.titleZh,
     title_vi: "Bài tập luyện tập",
     created_at: importedAt,
     updated_at: importedAt,
    });
   }
   const isMultipleChoice = exercise.exerciseType === "multiple-choice";
   const isJudgement = exercise.exerciseType === "judgement";
   const itemType: ReaderExerciseItemRow["item_type"] = isMultipleChoice
    ? "multiple_choice"
    : isJudgement
      ? "true_false"
      : "short_answer";
   const options =
    isMultipleChoice || isJudgement
     ? exercise.options.map((option) => ({
        key: option.id,
        textZh: option.text,
        textVi: option.text,
       }))
     : [];
   const answer = isMultipleChoice
    ? (exercise.correctOptionIds[0] ?? "")
    : isJudgement
      ? exercise.correctOptionIds[0] === "correct"
       ? "True"
       : "False"
      : (exercise.acceptedAnswersZh[0] ?? "");
   exerciseItems.push({
    id: `${groupId}:${exercise.id}`,
    group_id: groupId,
    source: "seed",
    item_order: exercise.order,
    item_type: itemType,
    payload: {
     promptZh: exercise.stimulusZh,
     promptVi: `${exercise.promptVi}\n${exercise.contextVi}`.trim(),
     pinyin: "",
     options,
     answer,
     answerZh: exercise.acceptedAnswersZh[0] ?? "",
     answerVi: isMultipleChoice || isJudgement ? "" : exercise.explanationVi,
     scoring: isMultipleChoice || isJudgement ? "auto" : "manual",
     answerSource: exercise.sourceIds.join(","),
     explanationVi: exercise.explanationVi,
    },
    created_at: importedAt,
    updated_at: importedAt,
   });
  }
 }
 return {
  canonical: {
   courses,
   books,
   lessons,
   lessonSections: [],
   lessonTexts: [],
   vocabItems: [],
   vocabExamples: [],
   vocabDetailSections: [],
   grammarPoints: [],
   grammarExamples: [],
   grammarDetailSections: [],
   listeningItems: [],
  },
  reader: {
   documents,
   paragraphs,
   vocabularyLinks: [],
   exerciseGroups,
   exerciseItems,
   assets: [],
  },
 };
}

function buildHumanitiesEvaluation(
 item: z.output<typeof humanitiesItemSchema>,
): ReaderHumanitiesEvaluation | undefined {
 if (item.interpreting === undefined && item.translation === undefined) return undefined;
 const parsed =
  item.interpreting !== undefined
   ? humanitiesInterpretingSchema.safeParse(item.interpreting)
   : humanitiesPracticeSchema.safeParse(item.translation);
 if (!parsed.success) return undefined;
 const practice = parsed.data;
 return {
  mode: item.interpreting === undefined ? "translation" : "interpreting",
  direction: practice.direction,
  informationUnits: practice.informationUnits.map((unit) => ({
   id: unit.id,
   type: unit.type,
   canonicalMeaningVi: unit.canonicalMeaningVi,
   required: unit.required,
   weight: unit.weight,
   acceptedRealizations: unit.acceptedRealizations,
  })),
  rubric: practice.rubric.dimensions.map((dimension) => ({
   id: dimension.id,
   labelVi: dimension.labelVi,
   weight: dimension.weight,
   deterministic: dimension.deterministic,
  })),
  references: practice.references.map((reference) => ({ id: reference.id, text: reference.text })),
  preparationSeconds: item.interpreting?.preparationSeconds ?? null,
  maxRecordingSeconds: item.interpreting?.maxRecordingSeconds ?? null,
  replayPolicy: item.interpreting?.replayPolicy ?? null,
  replayLimit: item.interpreting?.replayLimit ?? null,
  noteTakingAllowed: item.interpreting?.noteTakingAllowed ?? null,
 };
}

export function buildHumanitiesSeedPackage(
 items: Array<z.output<typeof humanitiesItemSchema>>,
 importedAt: string,
): { canonical: StudioSeedAdditions; reader: StudioReaderSeedPackage } {
 const courseId = "hanzihome-studio-humanities";
 const booksByKind = new Map<string, string>();
 const courses: CanonicalSeedPackage["courses"] = [
  {
   id: courseId,
   user_id: null,
   slug: courseId,
   title: "Hanzi Studio Humanities",
   subtitle: "Humanities, translation, and interpreting practice migrated from Hanzi Studio.",
   type: "humanities",
   course_order: 905,
   source: "seed",
   imported_at: importedAt,
  },
 ];
 const books: CanonicalSeedPackage["books"] = [];
 const lessons: CanonicalSeedPackage["lessons"] = [];
 const lessonTexts: CanonicalSeedPackage["lessonTexts"] = [];
 const documents: ReaderDocumentRow[] = [];
 const paragraphs: ReaderParagraphRow[] = [];
 const exerciseGroups: ReaderExerciseGroupRow[] = [];
 const exerciseItems: ReaderExerciseItemRow[] = [];

 for (const item of items) {
  const bookId = booksByKind.get(item.kind) ?? `${courseId}:book:${item.kind}`;
  if (!booksByKind.has(item.kind)) {
   booksByKind.set(item.kind, bookId);
   books.push({
    id: bookId,
    user_id: null,
    course_id: courseId,
    title: item.kind,
    short_title: item.kind,
    book_order: books.length + 1,
    source: "seed",
    imported_at: importedAt,
   });
  }
  const lessonId = `${courseId}:${item.id}`;
  lessons.push({
   id: lessonId,
   course_id: courseId,
   book_id: bookId,
   owner_id: null,
   source: "seed",
   lesson_number: lessons.length + 1,
   lesson_order: lessons.length + 1,
   title_zh: item.titleZh,
   title_vi: item.titleVi,
   title_pinyin: null,
   title_en: null,
   tags: ["studio-humanities", item.kind, ...item.tags],
   source_file: `src/features/humanities/data/${item.kind}.json#${item.id}`,
   imported_at: importedAt,
  });
  lessonTexts.push({
   id: `${lessonId}:text`,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   text_key: "humanities-source",
   title: item.titleZh,
   content: item.text.normalizedText,
   content_format: "plain",
   imported_at: importedAt,
  });
  documents.push({
   id: lessonId,
   lesson_id: lessonId,
   owner_id: null,
   source: "seed",
   publication_status: item.status === "published" ? "published" : "draft",
   kind: "humanities",
   slug: item.slug,
   unit_id: item.kind,
   reading_number: documents.length + 1,
   title_zh: item.titleZh,
   title_pinyin: "",
   title_vi: item.titleVi,
   genre_vi: item.subtitleVi ?? item.kind,
   objectives_vi: [
    `Luyện ${item.kind} theo văn bản đã rà soát.`,
    `Hoàn thành trong khoảng ${item.estimatedMinutes} phút.`,
   ],
   analysis: {
    mainIdeaVi: item.titleVi,
    paragraphStructureVi: item.text.segments.map((segment) => segment.naturalTranslationVi ?? ""),
    logicChainVi: [],
    trapsVi: [],
    keywordsZh: [],
   },
   summary: { modelZh: item.text.normalizedText, rubricVi: item.tags },
   source_metadata: {
    source_file: `src/features/humanities/data/${item.kind}.json`,
    source_id: item.id,
    source_version: item.version,
    source_kind: item.kind,
    rights_redistribution_allowed: item.rights.redistributionAllowed,
    tags: item.tags,
   },
   schema_version: "studio-humanities-v1",
   imported_at: importedAt,
   created_at: importedAt,
   updated_at: importedAt,
   deleted_at: null,
  });
  for (const segment of item.text.segments) {
   paragraphs.push({
    id: `${lessonId}:paragraph:${segment.id}`,
    document_id: lessonId,
    source: "seed",
    paragraph_order: segment.order,
    zh: segment.textZh,
    pinyin: segment.pinyin ?? "",
    vi:
     segment.naturalTranslationVi ??
     segment.literalTranslationVi ??
     (item.translation?.direction === "vi-zh" ? item.translation.sourceText : "") ??
     "",
    role_vi: segment.alignmentStatus,
    source_version: 1,
    created_at: importedAt,
    updated_at: importedAt,
   });
  }
  if (item.exercises.length > 0) {
   const groupId = `${lessonId}:exercises`;
   exerciseGroups.push({
    id: groupId,
    document_id: lessonId,
    source: "seed",
    exercise_order: 1,
    exercise_type: "short_answer",
    title_zh: item.titleZh,
    title_vi: "Bài tập humanities",
    created_at: importedAt,
    updated_at: importedAt,
   });
   const evaluation = buildHumanitiesEvaluation(item);
   for (const [index, exercise] of item.exercises.entries()) {
    exerciseItems.push({
     id: `${groupId}:${exercise.id}`,
     group_id: groupId,
     source: "seed",
     item_order: index + 1,
     item_type: "answer_review",
     payload: {
      promptZh: item.text.normalizedText,
      promptVi: exercise.promptVi,
      pinyin: "",
      options: [],
      answer: exercise.sampleAnswers[0] ?? "",
      answerZh: "",
      answerVi: exercise.sampleAnswers[0] ?? "",
      scoring: "review",
      answerSource: exercise.evidenceIds.join(",") || "studio-humanities",
      explanationVi: exercise.type,
      source: item.source,
      glossary: item.glossary,
      annotations: item.annotations,
      claims: item.claims,
      ...(item.kind === "poetry" ? { poetry: item.poetry } : {}),
      ...(item.kind === "history" ? { history: item.history } : {}),
      ...(item.translation === undefined ? {} : { translation: item.translation }),
      ...(item.interpreting === undefined ? {} : { interpreting: item.interpreting }),
      ...(evaluation === undefined ? {} : { evaluation }),
     },
     created_at: importedAt,
     updated_at: importedAt,
    });
   }
  }
 }
 return {
  canonical: {
   courses,
   books,
   lessons,
   lessonSections: [],
   lessonTexts,
   vocabItems: [],
   vocabExamples: [],
   vocabDetailSections: [],
   grammarPoints: [],
   grammarExamples: [],
   grammarDetailSections: [],
   listeningItems: [],
  },
  reader: {
   documents,
   paragraphs,
   vocabularyLinks: [],
   exerciseGroups,
   exerciseItems,
   assets: [],
  },
 };
}

export function buildReaderSeedPackage(
 course: z.output<typeof readingCourseSchema>,
 canonical: CanonicalSeedPackage,
 inventory: StudioInventory,
): StudioReaderSeedPackage {
 const importedAt = canonical.courses[0]?.imported_at ?? new Date().toISOString();
 const documents: ReaderDocumentRow[] = [];
 const paragraphs: ReaderParagraphRow[] = [];
 const vocabularyLinks: ReaderVocabularyLinkRow[] = [];
 const exerciseGroups: ReaderExerciseGroupRow[] = [];
 const exerciseItems: ReaderExerciseItemRow[] = [];
 const unitById = new Map(course.units.map((unit) => [unit.id, unit]));
 const addReadingLesson = (
  lesson: z.output<typeof readingCourseSchema>["coreLessons"][number],
  kind: ReaderDocumentRow["kind"],
 ) => {
  const documentId = canonicalStudioLessonId(lesson.id);
  const unit = lesson.unitId === undefined ? undefined : unitById.get(lesson.unitId);
  documents.push({
   id: documentId,
   lesson_id: documentId,
   owner_id: null,
   source: "seed",
   publication_status: "published",
   kind,
   slug: lesson.slug,
   unit_id: lesson.unitId ?? null,
   reading_number:
    lesson.readingNumber !== undefined && lesson.readingNumber > 0 ? lesson.readingNumber : null,
   title_zh: lesson.titleZh,
   title_pinyin: lesson.titlePinyin,
   title_vi: lesson.titleVi,
   genre_vi: lesson.genreVi,
   objectives_vi: lesson.objectivesVi,
   analysis: lesson.analysis,
   summary: lesson.summary,
   source_metadata: {
    source_file: "src/features/reading/data/reading-course.json",
    source_id: lesson.id,
    source_label_vi: lesson.sourceLabelVi,
    reading_label_vi: lesson.readingLabelVi,
    display_label_vi: lesson.displayLabelVi,
    ...(unit === undefined
     ? {}
     : {
        unit_title_zh: unit.titleZh,
        unit_title_vi: unit.titleVi,
        unit_display_title_vi: unit.displayTitleVi,
        unit_focus_vi: unit.focusVi,
       }),
    pre_reading_questions_vi: lesson.preReadingQuestionsVi,
    sentence_lab: lesson.sentenceLab,
    counts: lesson.counts,
   },
   schema_version: "studio-reading-v1",
   imported_at: importedAt,
   created_at: importedAt,
   updated_at: importedAt,
   deleted_at: null,
  });
  for (const paragraph of lesson.paragraphs) {
   paragraphs.push({
    id: paragraph.id,
    document_id: documentId,
    source: "seed",
    paragraph_order: paragraph.order,
    zh: paragraph.zh,
    pinyin: paragraph.pinyin,
    vi: paragraph.vi,
    role_vi: paragraph.roleVi,
    source_version: 1,
    created_at: importedAt,
    updated_at: importedAt,
   });
  }
  for (const item of lesson.vocabulary) {
   vocabularyLinks.push({
    id: `${documentId}:vocab-link:${item.id}`,
    document_id: documentId,
    vocab_item_id: `${documentId}:vocab:${item.id}`,
    source: "seed",
    item_order: item.order,
    meaning_in_context_vi: item.meaningInContextVi,
    source_ref: `src/features/reading/data/reading-course.json#${item.id}`,
    created_at: importedAt,
    updated_at: importedAt,
   });
  }
  for (const group of lesson.exerciseGroups) {
   exerciseGroups.push({
    id: group.id,
    document_id: documentId,
    source: "seed",
    exercise_order: group.order,
    exercise_type: group.type,
    title_zh: group.titleZh,
    title_vi: group.titleVi,
    created_at: importedAt,
    updated_at: importedAt,
   });
   for (const [itemIndex, item] of group.items.entries()) {
    exerciseItems.push({
     id: item.id,
     group_id: group.id,
     source: "seed",
     item_order: itemIndex + 1,
     item_type: item.type,
     payload: {
      promptZh: item.promptZh,
      promptVi: item.promptVi,
      pinyin: item.pinyin,
      options: item.options,
      answer: item.answer,
      answerZh: item.answerZh,
      answerVi: item.answerVi,
      scoring: item.scoring,
      answerSource: item.answerSource,
      explanationVi: item.explanationVi,
     },
     created_at: importedAt,
     updated_at: importedAt,
    });
   }
  }
 };
 for (const lesson of course.coreLessons) addReadingLesson(lesson, "core");
 for (const lesson of course.mockLessons) addReadingLesson(lesson, "mock");
 for (const lesson of course.reinforcementLessons) {
  const documentId = canonicalStudioLessonId(lesson.id);
  documents.push({
   id: documentId,
   lesson_id: documentId,
   owner_id: null,
   source: "seed",
   publication_status: "published",
   kind: "reinforcement",
   slug: lesson.slug,
   unit_id: lesson.unitId ?? null,
   reading_number:
    lesson.sourceReading !== undefined && lesson.sourceReading > 0 ? lesson.sourceReading : null,
   title_zh: lesson.titleZh,
   title_pinyin: "",
   title_vi: lesson.titleVi,
   genre_vi: "",
   objectives_vi: lesson.studyTasksVi,
   analysis: {
    mainIdeaVi: "",
    paragraphStructureVi: [],
    logicChainVi: [],
    trapsVi: [],
    keywordsZh: lesson.skillFocusZh,
   },
   summary: { modelZh: "", rubricVi: [] },
   source_metadata: {
    source_file: "src/features/reading/data/reading-course.json",
    source_id: lesson.id,
    source_book_title_zh: lesson.sourceBookTitleZh,
    source_unit: lesson.sourceUnit,
    printed_page: lesson.printedPage,
    pdf_page: lesson.pdfPage,
    resource_file: lesson.resourceFile,
    difficulty_vi: lesson.difficultyVi,
    estimated_minutes: lesson.estimatedMinutes,
    notice_vi: lesson.noticeVi,
   },
   schema_version: "studio-reading-v1",
   imported_at: importedAt,
   created_at: importedAt,
   updated_at: importedAt,
   deleted_at: null,
  });
 }
 const assets: ReaderAssetRow[] = [...inventory.assets, ...inventory.previewAssets].map((asset) => {
  const isPdf = asset.path.endsWith(".pdf");
  const publicPath = asset.path.startsWith("public/")
   ? `/${asset.path.slice("public/".length)}`
   : `/${asset.path}`;
  return {
   id: `hanzihome-studio-asset:${asset.path}`,
   document_id: null,
   source: "seed",
   asset_type: isPdf ? "pdf" : "image",
   source_path: asset.path,
   sha256: asset.sha256,
   storage_bucket: null,
   storage_path: null,
   external_url: publicPath,
   mime_type: isPdf ? "application/pdf" : "image/webp",
   rights_status: "licensed",
   redistribution_allowed: true,
   metadata: { source: "hanzi-studio", bytes: asset.bytes },
   created_at: importedAt,
   updated_at: importedAt,
  };
 });
 return { documents, paragraphs, vocabularyLinks, exerciseGroups, exerciseItems, assets };
}

export async function createCanonicalSeedPackage(
 studioRoot: string,
): Promise<CanonicalSeedPackage> {
 const sourceFile = "src/features/reading/data/reading-course.json";
 const course = readingCourseSchema.parse(
  JSON.parse(await readFile(join(studioRoot, sourceFile), "utf8")),
 );
 return buildCanonicalSeedPackage(course, sourceFile);
}

export async function createStudioSeedPackage(studioRoot: string): Promise<StudioSeedPackage> {
 const sourceFile = "src/features/reading/data/reading-course.json";
 const course = readingCourseSchema.parse(
  JSON.parse(await readFile(join(studioRoot, sourceFile), "utf8")),
 );
 const hsk = hskReadingSchema.parse(
  JSON.parse(
   await readFile(
    join(studioRoot, "src/features/reading/hsk/data/hsk-reading-passages.json"),
    "utf8",
   ),
  ),
 );
 const grammarDatasets = await Promise.all(
  [1, 2, 3, 4, 5, 6].map(async (level) =>
   grammarDatasetSchema.parse(
    JSON.parse(
     await readFile(join(studioRoot, `src/features/reading/grammar/data/hsk${level}.json`), "utf8"),
    ),
   ),
  ),
 );
 const dictation = dictationCourseSchema.parse(
  JSON.parse(
   await readFile(
    join(studioRoot, "src/features/practice-lab/dictation/data/hsk-dictation-course.json"),
    "utf8",
   ),
  ),
 );
 const daily = dailyReadingSchema.parse(
  JSON.parse(
   await readFile(
    join(studioRoot, "src/features/daily-reading/data/daily-reading-seed.json"),
    "utf8",
   ),
  ),
 );
 const personalCurriculum = personalCurriculumSchema.parse(
  JSON.parse(
   await readFile(
    join(studioRoot, "src/features/personal-learning/data/deep-knowledge-curriculum.json"),
    "utf8",
   ),
  ),
 );
 const personalExerciseFiles = (
  await readdir(join(studioRoot, "src/features/personal-learning/data/exercise-banks"))
 )
  .filter((file) => file.endsWith(".json"))
  .sort();
 const personalExerciseBanks = await Promise.all(
  personalExerciseFiles.map(async (file) =>
   exerciseBankSchema.parse(
    JSON.parse(
     await readFile(
      join(studioRoot, "src/features/personal-learning/data/exercise-banks", file),
      "utf8",
     ),
    ),
   ),
  ),
 );
 const humanitiesFiles = ["history", "interpreting", "poetry", "translation"];
 const humanitiesItems = (
  await Promise.all(
   humanitiesFiles.map(async (file) =>
    humanitiesItemSchema
     .array()
     .parse(
      JSON.parse(
       await readFile(join(studioRoot, `src/features/humanities/data/${file}.json`), "utf8"),
      ),
     ),
   ),
  )
 ).flat();
 const inventory = await loadStudioInventory(studioRoot);
 const canonicalBase = buildCanonicalSeedPackage(course, sourceFile);
 const hskSeed = buildHskSeedPackage(hsk);
 const importedAt = canonicalBase.courses[0]?.imported_at ?? new Date().toISOString();
 const grammarSeed = buildHskGrammarSeedPackage(grammarDatasets, importedAt);
 const dictationSeed = buildDictationSeedPackage(dictation, importedAt, hsk);
 const dailySeed = buildDailyReadingSeedPackage(daily, importedAt);
 const personalSeed = buildPersonalLearningSeedPackage(
  personalCurriculum,
  personalExerciseBanks,
  importedAt,
 );
 const humanitiesSeed = buildHumanitiesSeedPackage(humanitiesItems, importedAt);
 const canonical: CanonicalSeedPackage = {
  courses: [
   ...canonicalBase.courses,
   ...grammarSeed.canonical.courses,
   ...dictationSeed.canonical.courses,
   ...dailySeed.canonical.courses,
   ...personalSeed.canonical.courses,
   ...humanitiesSeed.canonical.courses,
  ],
  books: [
   ...canonicalBase.books,
   ...hskSeed.canonical.books,
   ...grammarSeed.canonical.books,
   ...dictationSeed.canonical.books,
   ...dailySeed.canonical.books,
   ...personalSeed.canonical.books,
   ...humanitiesSeed.canonical.books,
  ],
  lessons: [
   ...canonicalBase.lessons,
   ...hskSeed.canonical.lessons,
   ...grammarSeed.canonical.lessons,
   ...dictationSeed.canonical.lessons,
   ...dailySeed.canonical.lessons,
   ...personalSeed.canonical.lessons,
   ...humanitiesSeed.canonical.lessons,
  ],
  lessonSections: [
   ...canonicalBase.lessonSections,
   ...hskSeed.canonical.lessonSections,
   ...grammarSeed.canonical.lessonSections,
   ...dictationSeed.canonical.lessonSections,
   ...dailySeed.canonical.lessonSections,
   ...personalSeed.canonical.lessonSections,
   ...humanitiesSeed.canonical.lessonSections,
  ],
  lessonTexts: [
   ...canonicalBase.lessonTexts,
   ...hskSeed.canonical.lessonTexts,
   ...grammarSeed.canonical.lessonTexts,
   ...dictationSeed.canonical.lessonTexts,
   ...dailySeed.canonical.lessonTexts,
   ...personalSeed.canonical.lessonTexts,
   ...humanitiesSeed.canonical.lessonTexts,
  ],
  vocabItems: [
   ...canonicalBase.vocabItems,
   ...hskSeed.canonical.vocabItems,
   ...grammarSeed.canonical.vocabItems,
   ...dictationSeed.canonical.vocabItems,
   ...dailySeed.canonical.vocabItems,
   ...personalSeed.canonical.vocabItems,
   ...humanitiesSeed.canonical.vocabItems,
  ],
  vocabExamples: [
   ...canonicalBase.vocabExamples,
   ...hskSeed.canonical.vocabExamples,
   ...grammarSeed.canonical.vocabExamples,
   ...dictationSeed.canonical.vocabExamples,
   ...dailySeed.canonical.vocabExamples,
   ...personalSeed.canonical.vocabExamples,
   ...humanitiesSeed.canonical.vocabExamples,
  ],
  vocabDetailSections: [
   ...canonicalBase.vocabDetailSections,
   ...hskSeed.canonical.vocabDetailSections,
   ...grammarSeed.canonical.vocabDetailSections,
   ...dictationSeed.canonical.vocabDetailSections,
   ...dailySeed.canonical.vocabDetailSections,
   ...personalSeed.canonical.vocabDetailSections,
   ...humanitiesSeed.canonical.vocabDetailSections,
  ],
  grammarPoints: [
   ...canonicalBase.grammarPoints,
   ...hskSeed.canonical.grammarPoints,
   ...grammarSeed.canonical.grammarPoints,
   ...dictationSeed.canonical.grammarPoints,
   ...dailySeed.canonical.grammarPoints,
   ...personalSeed.canonical.grammarPoints,
   ...humanitiesSeed.canonical.grammarPoints,
  ],
  grammarExamples: [
   ...canonicalBase.grammarExamples,
   ...hskSeed.canonical.grammarExamples,
   ...grammarSeed.canonical.grammarExamples,
   ...dictationSeed.canonical.grammarExamples,
   ...dailySeed.canonical.grammarExamples,
   ...personalSeed.canonical.grammarExamples,
   ...humanitiesSeed.canonical.grammarExamples,
  ],
  grammarDetailSections: [
   ...canonicalBase.grammarDetailSections,
   ...hskSeed.canonical.grammarDetailSections,
   ...grammarSeed.canonical.grammarDetailSections,
   ...dictationSeed.canonical.grammarDetailSections,
   ...dailySeed.canonical.grammarDetailSections,
   ...personalSeed.canonical.grammarDetailSections,
   ...humanitiesSeed.canonical.grammarDetailSections,
  ],
  listeningItems: [
   ...canonicalBase.listeningItems,
   ...hskSeed.canonical.listeningItems,
   ...grammarSeed.canonical.listeningItems,
   ...dictationSeed.canonical.listeningItems,
   ...dailySeed.canonical.listeningItems,
   ...personalSeed.canonical.listeningItems,
   ...humanitiesSeed.canonical.listeningItems,
  ],
 };
 const readerBase = buildReaderSeedPackage(course, canonicalBase, inventory);
 const preview = await buildStudioImportPreview(studioRoot);
 return {
  sourceChecksum: preview.sourceChecksum,
  canonical,
  reader: {
   documents: [
    ...readerBase.documents,
    ...hskSeed.reader.documents,
    ...dailySeed.reader.documents,
    ...personalSeed.reader.documents,
    ...humanitiesSeed.reader.documents,
   ],
   paragraphs: [
    ...readerBase.paragraphs,
    ...hskSeed.reader.paragraphs,
    ...dailySeed.reader.paragraphs,
    ...personalSeed.reader.paragraphs,
    ...humanitiesSeed.reader.paragraphs,
   ],
   vocabularyLinks: [
    ...readerBase.vocabularyLinks,
    ...hskSeed.reader.vocabularyLinks,
    ...dailySeed.reader.vocabularyLinks,
    ...personalSeed.reader.vocabularyLinks,
    ...humanitiesSeed.reader.vocabularyLinks,
   ],
   exerciseGroups: [
    ...readerBase.exerciseGroups,
    ...hskSeed.reader.exerciseGroups,
    ...dailySeed.reader.exerciseGroups,
    ...personalSeed.reader.exerciseGroups,
    ...humanitiesSeed.reader.exerciseGroups,
   ],
   exerciseItems: [
    ...readerBase.exerciseItems,
    ...hskSeed.reader.exerciseItems,
    ...dailySeed.reader.exerciseItems,
    ...personalSeed.reader.exerciseItems,
    ...humanitiesSeed.reader.exerciseItems,
   ],
   assets: [
    ...readerBase.assets,
    ...hskSeed.reader.assets,
    ...dailySeed.reader.assets,
    ...personalSeed.reader.assets,
    ...humanitiesSeed.reader.assets,
   ],
  },
 };
}

function defaultStudioRoot() {
 return resolve(import.meta.dirname, "..", "..", "hanzi-studio");
}

function argument(name: string): string | null {
 const index = process.argv.indexOf(name);
 return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

export async function createStudioImportPreview(
 studioRoot: string,
 lessonMappings: Parameters<typeof buildStudioImportPreview>[1] = {},
) {
 const preview = await buildStudioImportPreview(studioRoot, lessonMappings);
 if (preview.documents.some((document) => document.unresolvedReferences.length > 0)) {
  return {
   ...preview,
   status: "blocked",
   reason: "One or more imported references are unresolved before static package output.",
  };
 }
 return { ...preview, status: "ready", reason: null };
}

async function main() {
 const root = resolve(argument("--root") ?? process.env.HANZI_STUDIO_ROOT ?? defaultStudioRoot());
 if (process.argv.includes("--check")) {
  const inventory = await loadStudioInventory(root);
  assertStudioInventoryBaseline(inventory);
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
  return;
 }
 const mappingPath = argument("--lesson-map");
 const lessonMappings =
  mappingPath === null
   ? {}
   : studioLessonMappingSchema.parse(JSON.parse(await readFile(resolve(mappingPath), "utf8")));
 const preview = await createStudioImportPreview(root, lessonMappings);
 const output = argument("--preview");
 if (output !== null) {
  const target = resolve(output);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
 }
 const seedOutput = argument("--seed-output");
 if (seedOutput !== null) {
  const seed = await createStudioSeedPackage(root);
  const target = resolve(seedOutput);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
 }
 process.stdout.write(`${JSON.stringify(preview, null, 2)}\n`);
 if (preview.status === "blocked") process.exitCode = 2;
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) await main();
