import radicalsData from "../../../data/hanzihome/hanzihome_radicals_clean.json";
import {
 DEFAULT_HANYU_COURSE_ID,
 HANYU_Q3_COURSE_ID,
 hanzihomeCourseBooks,
 hanzihomeCourses,
} from "@/features/hanzihome/courses/course-catalog";
import {
 HanyuLessonSchema,
 type CharacterWritingItem,
 type Exercise,
 type GrammarBlock,
 type GrammarPoint,
 type HanyuLesson,
 type NoteItem,
 type ReadingItem,
 type Section,
 type TextBlock,
 type VocabularyItem,
} from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";
import {
 q3LessonJson,
 q3VocabJson,
 q2LessonJson,
 q2VocabJson,
} from "@/features/hanzihome/static-json/q2-static-json";
import {
 DeepVocabularyLessonSchema,
 type DeepVocabularyItem,
 type DeepVocabularyLesson,
} from "@/features/hanzihome/static-json/schemas/vocab.schema";
import type {
 GrammarViewModel,
 HanziHomeVocabItem,
 HanziHomeCatalogCourse,
 HanziHomeCatalogData,
 HanziHomeData,
 HanziHomeLesson,
} from "@/features/hanzihome/types";

function parseStaticVocabLessons(lessons: unknown[]) {
 return lessons
  .flatMap((lesson) => {
   const result = DeepVocabularyLessonSchema.safeParse(lesson);

   return result.success ? [result.data] : [];
  })
  .sort((a, b) => a.source.lesson_index - b.source.lesson_index);
}

function parseStaticLessonDocuments(lessons: unknown[]) {
 return lessons
  .flatMap((lesson) => {
   const result = HanyuLessonSchema.safeParse(lesson);

   return result.success ? [result.data] : [];
  })
  .sort((a, b) => a.source.lesson_index - b.source.lesson_index);
}

const q2VocabLessons = parseStaticVocabLessons(q2VocabJson);
const q3VocabLessons = parseStaticVocabLessons(q3VocabJson);

const q2LessonDocuments = parseStaticLessonDocuments(q2LessonJson);
const q3LessonDocuments = parseStaticLessonDocuments(q3LessonJson);

const q2LessonDocumentsByIndex = new Map(
 q2LessonDocuments.map((lesson) => [lesson.source.lesson_index, lesson]),
);

const q3LessonDocumentsByIndex = new Map(
 q3LessonDocuments.map((lesson) => [lesson.source.lesson_index, lesson]),
);

type StaticCourseRuntime = {
 courseId: string;
 courseTitle: string;
 dataset: string;
 vocabLessons: DeepVocabularyLesson[];
 lessonDocuments: HanyuLesson[];
 lessonDocumentsByIndex: Map<number, HanyuLesson>;
 sourceFiles: string[];
};

type RuntimeLessonEntry = {
 runtime: StaticCourseRuntime;
 lessonNumber: number;
 vocabLesson?: DeepVocabularyLesson;
 lessonDocument?: HanyuLesson;
};

const staticCourseRuntimes: StaticCourseRuntime[] = [
 {
  courseId: DEFAULT_HANYU_COURSE_ID,
  courseTitle: "Giáo trình Hán ngữ Quyển 2",
  dataset: "q2-static-json",
  vocabLessons: q2VocabLessons,
  lessonDocuments: q2LessonDocuments,
  lessonDocumentsByIndex: q2LessonDocumentsByIndex,
  sourceFiles: [
   "data/hanzihome/q2/vocab/*.json",
   "data/hanzihome/q2/lessons/*.json",
  ],
 },
 {
  courseId: HANYU_Q3_COURSE_ID,
  courseTitle: "Giáo trình Hán ngữ Quyển 3",
  dataset: "q3-static-json",
  vocabLessons: q3VocabLessons,
  lessonDocuments: q3LessonDocuments,
  lessonDocumentsByIndex: q3LessonDocumentsByIndex,
  sourceFiles: [
   "data/hanzihome/q3/vocab/*.json",
   "data/hanzihome/q3/lessons/*.json",
  ],
 },
];

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

function getRuntimeLessonEntries(runtime: StaticCourseRuntime) {
 const vocabByIndex = new Map(
  runtime.vocabLessons.map((lesson) => [lesson.source.lesson_index, lesson]),
 );
 const lessonIndexes = Array.from(
  new Set([
   ...runtime.vocabLessons.map((lesson) => lesson.source.lesson_index),
   ...runtime.lessonDocuments.map((lesson) => lesson.source.lesson_index),
  ]),
 ).sort((a, b) => a - b);

 return lessonIndexes.map(
  (lessonNumber): RuntimeLessonEntry => ({
   runtime,
   lessonNumber,
   vocabLesson: vocabByIndex.get(lessonNumber),
   lessonDocument: runtime.lessonDocumentsByIndex.get(lessonNumber),
  }),
 );
}

function getStaticRadicals() {
 return [...radicalsData.radicals].sort((a, b) => a.index - b.index);
}

function joinLines(lines: Array<string | undefined>) {
 return lines.map((line) => line?.trim()).filter(Boolean) as string[];
}

function getCategoryForWord(
 lesson: DeepVocabularyLesson,
 item: DeepVocabularyItem,
) {
 const group = lesson.overview.groups.find((entry) =>
  entry.words.includes(item.hanzi),
 );

 return group?.title_vi || "Từ vựng";
}

function buildHanziHomeVocabItem(
 item: DeepVocabularyItem,
 lesson: DeepVocabularyLesson,
 lessonId: string,
): HanziHomeVocabItem {
 return {
  ...item,
  runtimeId: `${lessonId}__${item.id}`,
  lessonId,
  category: getCategoryForWord(lesson, item),
 };
}

function markdownHeading(level: number, title: string) {
 return `${"#".repeat(level)} ${title}`;
}

function sectionTitle(section: Section) {
 return section.title_vi || section.title;
}

function renderExampleLines(example: {
 zh: string;
 pinyin?: string;
 vi?: string;
 note_vi?: string;
}) {
 return joinLines([
  example.zh,
  example.pinyin ? `_${example.pinyin}_` : undefined,
  example.vi,
  example.note_vi,
 ]);
}

function renderTextBlock(block: TextBlock) {
 const lines = [markdownHeading(3, block.title_vi || block.title)];

 if (block.type === "text_dialogue") {
  if (block.lines.length > 0) {
   for (const line of block.lines) {
    lines.push(
     [
      line.speaker ? `**${line.speaker}:**` : "",
      line.zh,
      line.pinyin ? `_${line.pinyin}_` : "",
      line.vi,
     ]
      .filter(Boolean)
      .join(" "),
    );
   }
  }

  for (const scene of block.scenes) {
   if (scene.summary_vi) lines.push("", `**Tình huống:** ${scene.summary_vi}`);

   for (const line of scene.lines) {
    lines.push(
     [
      line.speaker ? `**${line.speaker}:**` : "",
      line.zh,
      line.pinyin ? `_${line.pinyin}_` : "",
      line.vi,
     ]
      .filter(Boolean)
      .join(" "),
    );
   }
  }
 }

 if (block.type === "text_narrative") {
  if (block.lines.length > 0) {
   for (const line of block.lines) {
    lines.push("", line.zh, line.pinyin ? `_${line.pinyin}_` : "", line.vi);
   }
  }

  for (const paragraph of block.paragraphs) {
   lines.push(
    "",
    paragraph.zh,
    paragraph.pinyin ? `_${paragraph.pinyin}_` : "",
    paragraph.vi,
   );
  }
 }

 return lines.join("\n").trim();
}

function renderTextSection(lessonDocument: HanyuLesson | undefined) {
 const textSection = lessonDocument?.lesson.sections.find(
  (section) => section.type === "text",
 );

 if (!textSection) return "";

 return [
  markdownHeading(2, sectionTitle(textSection)),
  ...textSection.blocks.map(renderTextBlock),
 ]
  .filter(Boolean)
  .join("\n\n");
}

function unknownRecord(value: unknown): Record<string, unknown> {
 return value && typeof value === "object" && !Array.isArray(value)
  ? (value as Record<string, unknown>)
  : {};
}

function recordString(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function recordArray(record: Record<string, unknown>, key: string) {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

function buildLessonDocumentGrammarViewModels(
 lessonId: string,
 lessonDocument: HanyuLesson | undefined,
): GrammarViewModel[] {
 const grammarSection = lessonDocument?.lesson.sections.find(
  (section) => section.type === "grammar",
 );

 if (!grammarSection) return [];

 return grammarSection.items.map((point) => {
  const itemTitle = point.title_vi || point.title;
  const contentMd = renderGrammarPoint(point);
  const detailSections = point.blocks.map((block) => ({
   key: `${lessonId}-${point.id}-${block.id}`,
   title: block.title,
   lines: renderGrammarBlock(block)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean),
  }));
  const examples = point.blocks.flatMap((block) => {
   const record = unknownRecord(block);

   return recordArray(record, "examples")
    .map(unknownRecord)
    .map((example) => ({
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
   core: detailSections[0]?.lines[1] || contentMd,
   contentMd,
   structuresView: point.blocks
    .map((block) => recordString(unknownRecord(block), "pattern"))
    .filter(Boolean),
   examplesParsed: examples,
   notes: [],
   detailSections,
  };
 });
}

function buildGrammarViewModels(entry: RuntimeLessonEntry, lessonId: string) {
 return buildLessonDocumentGrammarViewModels(lessonId, entry.lessonDocument);
}

function renderVocabularyItem(item: VocabularyItem) {
 const examples = item.examples.flatMap((example) =>
  renderExampleLines(example),
 );

 return joinLines([
  markdownHeading(3, `${item.hanzi} · ${item.pinyin}`),
  item.meaning_vi,
  item.meaning_en,
  item.pos !== "unknown" ? `**Từ loại:** ${item.pos}` : undefined,
  examples.length > 0 ? ["**Ví dụ:**", ...examples].join("\n") : undefined,
 ]);
}

function renderNoteItem(item: NoteItem) {
 return joinLines([
  markdownHeading(3, item.title),
  item.structure ? `**Cấu trúc:** ${item.structure}` : undefined,
  item.meaning_vi,
  ...item.examples.map((example) => renderExampleLines(example).join("\n")),
 ]).join("\n\n");
}

function renderGrammarBlock(block: GrammarBlock) {
 const lines = [markdownHeading(4, block.title)];
 const record = unknownRecord(block);
 const content = recordString(record, "content_vi");
 const pattern = recordString(record, "pattern");
 const meaning = recordString(record, "meaning_vi");
 const formulas = recordArray(record, "formulas").map(unknownRecord);
 const notes = recordArray(record, "notes_vi").filter(
  (note): note is string => typeof note === "string" && Boolean(note.trim()),
 );
 const examples = recordArray(record, "examples").map(unknownRecord);
 const items = recordArray(record, "items");
 const questions = recordArray(record, "questions").map(unknownRecord);

 if (content) lines.push(content);
 if (pattern) lines.push(`**Cấu trúc:** ${pattern}`);
 if (meaning) lines.push(meaning);
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
 if (items.length > 0) {
  lines.push(...items.map((item) => `- ${JSON.stringify(item)}`));
 }
 if (questions.length > 0) {
  lines.push(
   ...questions.map((question) => `- ${recordString(question, "prompt")}`),
  );
 }

 return lines.filter(Boolean).join("\n");
}

function renderGrammarPoint(item: GrammarPoint) {
 return [
  markdownHeading(3, item.title_vi || item.title),
  item.level ? `**Cấp độ:** ${item.level}` : "",
  ...item.blocks.map(renderGrammarBlock),
 ]
  .filter(Boolean)
  .join("\n\n");
}

function renderExercise(item: Exercise) {
 return joinLines([
  markdownHeading(3, item.title_vi || item.title),
  item.instruction.vi || item.instruction.zh,
  item.skill_focus.length > 0
   ? `**Trọng tâm:** ${item.skill_focus.join(", ")}`
   : undefined,
 ]);
}

function renderReadingItem(item: ReadingItem) {
 const lines = [markdownHeading(3, item.title_vi || item.title)];
 const record = unknownRecord(item);

 if (item.type === "reading_text") {
  for (const paragraphValue of recordArray(record, "paragraphs")) {
   const paragraph = unknownRecord(paragraphValue);
   lines.push(
    ...joinLines([
     recordString(paragraph, "zh"),
     recordString(paragraph, "pinyin")
      ? `_${recordString(paragraph, "pinyin")}_`
      : "",
     recordString(paragraph, "vi"),
    ]),
   );
  }
 }

 if (
  item.type === "reading_short_answer" ||
  item.type === "reading_true_false" ||
  item.type === "reading_multiple_choice"
 ) {
  lines.push(
   "",
   "**Câu hỏi:**",
   ...recordArray(record, "questions").map((questionValue) => {
    const question = unknownRecord(questionValue);
    const questionText = unknownRecord(question.question);
    const statementText = unknownRecord(question.statement);
    const promptText = unknownRecord(question.prompt);

    if (recordString(questionText, "vi") || recordString(questionText, "zh")) {
     return `- ${recordString(questionText, "vi") || recordString(questionText, "zh")}`;
    }
    if (
     recordString(statementText, "vi") ||
     recordString(statementText, "zh")
    ) {
     return `- ${recordString(statementText, "vi") || recordString(statementText, "zh")}`;
    }
    return `- ${recordString(promptText, "vi") || recordString(promptText, "zh")}`;
   }),
  );
 }

 if (item.type === "reading_cloze") {
  const instruction = unknownRecord(record.instruction);
  const wordBank = recordArray(record, "word_bank").filter(
   (word): word is string => typeof word === "string" && Boolean(word.trim()),
  );

  lines.push(
   recordString(instruction, "vi") || recordString(instruction, "zh"),
   wordBank.length > 0 ? `**Từ cho sẵn:** ${wordBank.join("、")}` : "",
  );
 }

 return lines.filter(Boolean).join("\n");
}

function renderCharacterWritingItem(item: CharacterWritingItem) {
 return joinLines([
  markdownHeading(3, item.hanzi),
  item.pinyin,
  item.vocab_ref ? `**Từ vựng:** ${item.vocab_ref}` : undefined,
  item.radical ? `**Bộ:** ${item.radical}` : undefined,
  item.stroke_count ? `**Số nét:** ${item.stroke_count}` : undefined,
 ]);
}

function renderLooseItem(value: unknown) {
 const item = unknownRecord(value);
 const title =
  recordString(item, "title_vi") ||
  recordString(item, "title") ||
  recordString(item, "hanzi") ||
  recordString(item, "id") ||
  "Mục";
 const dialogue = recordArray(item, "dialogue").map((lineValue) => {
  const line = unknownRecord(lineValue);
  return [
   recordString(line, "speaker") ? `**${recordString(line, "speaker")}:**` : "",
   recordString(line, "zh"),
   recordString(line, "pinyin") ? `_${recordString(line, "pinyin")}_` : "",
   recordString(line, "vi"),
  ]
   .filter(Boolean)
   .join(" ");
 });

 return joinLines([
  markdownHeading(3, title),
  recordString(item, "pinyin"),
  recordString(item, "meaning_vi"),
  recordString(item, "function_vi"),
  ...dialogue,
 ]).join("\n\n");
}

function renderLessonSection(section: Section) {
 const header = markdownHeading(2, sectionTitle(section));

 if (section.type === "text") {
  return [header, ...section.blocks.map(renderTextBlock)].join("\n\n");
 }
 if (section.type === "vocabulary") {
  return [header, ...section.items.map(renderVocabularyItem)].join("\n\n");
 }
 if (section.type === "notes") {
  return [header, ...section.items.map(renderNoteItem)].join("\n\n");
 }
 if (section.type === "grammar") {
  return [header, ...section.items.map(renderGrammarPoint)].join("\n\n");
 }
 if (section.type === "exercises") {
  return [header, ...section.items.map(renderExercise)].join("\n\n");
 }
 if (section.type === "proper_nouns" || section.type === "communication") {
  return [header, ...section.items.map(renderLooseItem)].join("\n\n");
 }
 if (section.type === "reading") {
  return [header, ...section.items.map(renderReadingItem)].join("\n\n");
 }
 if (section.type === "character_writing") {
  return [header, ...section.items.map(renderCharacterWritingItem)].join(
   "\n\n",
  );
 }

 return "";
}

function renderLessonOverviewMarkdown(
 lessonDocument: HanyuLesson | undefined,
 fallbackIntro: string,
) {
 if (!lessonDocument) return fallbackIntro;

 return [
  joinLines([
   markdownHeading(2, "Thông tin bài học"),
   lessonDocument.source.volume_vi,
   lessonDocument.source.lesson_title_pinyin,
   lessonDocument.source.lesson_title_vi,
  ]).join("\n\n"),
  ...lessonDocument.lesson.sections
   .sort((a, b) => a.order - b.order)
   .map(renderLessonSection),
 ]
  .filter(Boolean)
  .join("\n\n---\n\n");
}

function getEntryLessonId(entry: RuntimeLessonEntry) {
 return entry.lessonDocument?.lesson.id || entry.vocabLesson?.lesson.id || "";
}

function getEntryTitleZh(entry: RuntimeLessonEntry) {
 return (
  entry.lessonDocument?.lesson.title.zh ||
  entry.vocabLesson?.lesson.title.zh ||
  `Bài ${entry.lessonNumber}`
 );
}

function getEntrySourceFile(entry: RuntimeLessonEntry) {
 const sourceFiles =
  entry.lessonDocument?.source.source_files ||
  entry.vocabLesson?.source.source_files;

 return sourceFiles?.map((file) => file.name).join(", ") || "";
}

function getEntryOverviewNote(entry: RuntimeLessonEntry) {
 return (
  entry.lessonDocument?.source.lesson_title_vi ||
  entry.vocabLesson?.overview.note_vi ||
  ""
 );
}

function getEntryVocabCategories(entry: RuntimeLessonEntry) {
 return (
  entry.vocabLesson?.overview.groups.map((group) => ({
   nameVi: group.title_vi,
   words: group.words,
  })) ?? []
 );
}

function getEntryVocabularyText(entry: RuntimeLessonEntry) {
 return (
  entry.vocabLesson?.overview.groups
   .map((group) => `**${group.title_vi}:** ${group.words.join("、")}`)
   .join("\n\n") || ""
 );
}

function buildLessonSummary(entry: RuntimeLessonEntry): HanziHomeLesson {
 const lessonNumber = entry.lessonNumber;
 const bookMeta = getBookMeta(entry.runtime.courseId, lessonNumber);
 const lessonId = getEntryLessonId(entry);
 const grammar = buildGrammarViewModels(entry, lessonId);

 return {
  id: lessonId,
  lessonNumber,
  titleZh: getEntryTitleZh(entry),
  title: `Bài ${lessonNumber}: ${getEntryTitleZh(entry)}`,
  sourceFile: getEntrySourceFile(entry),
  courseId: entry.runtime.courseId,
  courseTitle: entry.runtime.courseTitle,
  bookId: bookMeta.bookId,
  bookTitle: bookMeta.bookTitle,
  bookOrder: bookMeta.bookOrder,
  lessonOrder: lessonNumber,
  vocabCategories: getEntryVocabCategories(entry),
  vocabCount: entry.vocabLesson?.items.length ?? 0,
  grammarCount: grammar.length,
  vocabIds:
   entry.vocabLesson?.items.map((item) => `${lessonId}__${item.id}`) ?? [],
  grammarPointIds: grammar.map((point) => point.id),
  vocab: [],
  grammar: [],
  notes: {
   overviewMarkdown: renderLessonOverviewMarkdown(
    entry.lessonDocument,
    getEntryOverviewNote(entry),
   ),
   lessonTextMarkdown: renderTextSection(entry.lessonDocument),
   exerciseMarkdown:
    entry.lessonDocument?.lesson.sections
     .filter((section) => section.type === "exercises")
     .map(renderLessonSection)
     .join("\n\n") || "",
   readingMarkdown:
    entry.lessonDocument?.lesson.sections
     .filter((section) => section.type === "reading")
     .map(renderLessonSection)
     .join("\n\n") || "",
   vocabularyText: getEntryVocabularyText(entry),
  },
 };
}

function buildLessonDetail(entry: RuntimeLessonEntry): HanziHomeLesson {
 const summary = buildLessonSummary(entry);
 const lessonId = summary.id;
 const vocabLesson = entry.vocabLesson;

 return {
  ...summary,
  vocab: vocabLesson
   ? vocabLesson.items.map((item) =>
      buildHanziHomeVocabItem(item, vocabLesson, lessonId),
     )
   : [],
  grammar: buildGrammarViewModels(entry, lessonId),
  sourceLesson: entry.lessonDocument,
 };
}

const runtimeLessonEntries = staticCourseRuntimes.flatMap(
 getRuntimeLessonEntries,
);
const lessonSummaries = runtimeLessonEntries.map(buildLessonSummary);

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
 const sourceFiles = staticCourseRuntimes.flatMap(
  (runtime) => runtime.sourceFiles,
 );

 return {
  source: "static",
  courses,
  books: hanzihomeCourseBooks,
  lessons: includeLessons ? lessonSummaries : [],
  radicals: getStaticRadicals(),
  meta: {
   app: "hanzihome",
   dataset: staticCourseRuntimes.map((runtime) => runtime.dataset).join("+"),
   version: "2.1.0",
   generatedAt: "2026-06-01",
   sourceFiles,
   counts: {
    lessons: lessonSummaries.length,
    vocab: vocabCount,
    grammarPoints: grammarCount,
    radicals: radicalsData.radicals.length,
    flashcards: vocabCount,
   },
   schemaNote:
    "Static Hanyu JSON is the runtime source of truth; Supabase is only used for auth, notes, and memory tips.",
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
  (item) => getEntryLessonId(item) === lessonId,
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
