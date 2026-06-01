import grammarData from "../../../data/hanzihome/hanzihome_grammar_clean.json";
import radicalsData from "../../../data/hanzihome/hanzihome_radicals_clean.json";
import {
 DEFAULT_HANYU_COURSE_ID,
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
 VocabExample,
} from "@/features/hanzihome/types";

type LegacyGrammarPoint = {
 id: string;
 lessonNumber: number;
 title: string;
 contentMd?: string;
 structures?: string[];
 examplesRaw?: string[];
};

const q2VocabLessons = q2VocabJson
 .map((lesson) => DeepVocabularyLessonSchema.parse(lesson))
 .sort((a, b) => a.source.lesson_index - b.source.lesson_index);

const q2LessonDocuments = q2LessonJson
 .map((lesson) => HanyuLessonSchema.parse(lesson))
 .sort((a, b) => a.source.lesson_index - b.source.lesson_index);

const q2LessonDocumentsByIndex = new Map(
 q2LessonDocuments.map((lesson) => [lesson.source.lesson_index, lesson]),
);

function getBookMeta(lessonNumber: number) {
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
    lines.push(
     "",
     line.zh,
     line.pinyin ? `_${line.pinyin}_` : "",
     line.vi,
    );
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

function cleanGrammarTitle(value: string) {
 return value
  .replace(/^#+\s*/, "")
  .replace(/^\\?\d+\\?\.\s*/, "")
  .replace(/^\d+[\.)、]\s*/, "")
  .replace(/^[一二三四五六七八九十]+、\s*/, "")
  .replace(/^（[一二三四五六七八九十]+）\s*/, "")
  .replace(/\\([.+*?^${}()|[\]\\])/g, "$1")
  .trim();
}

function parseLegacyExampleLine(line: string): VocabExample | null {
 const value = line
  .replace(/^\*\s*/, "")
  .replace(/^[-•]\s*/, "")
  .trim();

 if (!/[\u3400-\u9fff]/.test(value)) return null;

 const match = value.match(/^(.+?)[（(]([^()（）]+)[）)]$/);
 if (!match) {
  return {
   zh: value,
  };
 }

 return {
  zh: match[1]?.trim() ?? value,
  vi: match[2]?.trim(),
 };
}

function getLegacyGrammarByLessonNumber(lessonNumber: number) {
 return (grammarData.grammarPoints as LegacyGrammarPoint[])
  .filter((point) => point.lessonNumber === lessonNumber)
  .sort((a, b) => a.id.localeCompare(b.id));
}

function buildGrammarViewModels(
 lessonId: string,
 lessonNumber: number,
): GrammarViewModel[] {
 return getLegacyGrammarByLessonNumber(lessonNumber).map((point) => {
  const itemTitle = cleanGrammarTitle(point.title);
  const contentMd = point.contentMd?.trim() || "";
  const detailSections: NonNullable<GrammarViewModel["detailSections"]> =
   contentMd
    ? [
       {
        key: `${lessonId}-${point.id}-content`,
        title: "Chi tiết",
        lines: contentMd.split(/\n+/).map((line) => line.trim()).filter(Boolean),
       },
      ]
    : [];
  const examples = (point.examplesRaw ?? [])
   .map(parseLegacyExampleLine)
   .filter((example): example is VocabExample => Boolean(example));
  const notes = (point.examplesRaw ?? []).filter(
   (line) => !parseLegacyExampleLine(line),
  );

  return {
   id: `${lessonId}__${point.id}`,
   title: itemTitle,
   cleanTitle: itemTitle,
   core: detailSections[0]?.lines[0] || contentMd,
   contentMd,
   structuresView: Array.from(new Set((point.structures ?? []).filter(Boolean))),
   examplesParsed: examples,
   notes: Array.from(new Set(notes.filter(Boolean))),
   detailSections,
  };
 });
}

function renderVocabularyItem(item: VocabularyItem) {
 const examples = item.examples.flatMap((example) => renderExampleLines(example));

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
   ...formulas.map((formula) => `- **${recordString(formula, "label")}:** ${recordString(formula, "pattern")}`),
  );
 }
 if (notes.length > 0) lines.push(...notes.map((note) => `- ${note}`));
 if (examples.length > 0) {
  lines.push(...examples.flatMap((example) =>
   joinLines([
    recordString(example, "zh"),
    recordString(example, "pinyin")
     ? `_${recordString(example, "pinyin")}_`
     : "",
    recordString(example, "vi"),
   ]),
  ));
 }
 if (items.length > 0) {
  lines.push(...items.map((item) => `- ${JSON.stringify(item)}`));
 }
 if (questions.length > 0) {
  lines.push(...questions.map((question) => `- ${recordString(question, "prompt")}`));
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
    if (recordString(statementText, "vi") || recordString(statementText, "zh")) {
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
  return [header, ...section.items.map(renderCharacterWritingItem)].join("\n\n");
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

function buildLessonSummary(lesson: DeepVocabularyLesson): HanziHomeLesson {
 const lessonNumber = lesson.source.lesson_index;
 const bookMeta = getBookMeta(lessonNumber);
 const lessonId = lesson.lesson.id;
 const lessonDocument = q2LessonDocumentsByIndex.get(lessonNumber);
 const grammar = buildGrammarViewModels(lessonId, lessonNumber);

 return {
  id: lessonId,
  lessonNumber,
  titleZh: lesson.lesson.title.zh,
  title: `Bài ${lessonNumber}: ${lesson.lesson.title.zh}`,
  sourceFile: lesson.source.source_files.map((file) => file.name).join(", "),
  courseId: DEFAULT_HANYU_COURSE_ID,
  courseTitle: "Giáo trình Hán ngữ Quyển 2",
  bookId: bookMeta.bookId,
  bookTitle: bookMeta.bookTitle,
  bookOrder: bookMeta.bookOrder,
  lessonOrder: lessonNumber,
  vocabCategories: lesson.overview.groups.map((group) => ({
   nameVi: group.title_vi,
   words: group.words,
  })),
  vocabCount: lesson.items.length,
  grammarCount: grammar.length,
  vocabIds: lesson.items.map((item) => `${lessonId}__${item.id}`),
  grammarPointIds: grammar.map((point) => point.id),
  vocab: [],
  grammar: [],
  notes: {
   overviewMarkdown: renderLessonOverviewMarkdown(
    lessonDocument,
    lesson.overview.note_vi,
   ),
   lessonTextMarkdown: renderTextSection(lessonDocument),
   exerciseMarkdown:
    lessonDocument?.lesson.sections
     .filter((section) => section.type === "exercises")
     .map(renderLessonSection)
     .join("\n\n") || "",
   readingMarkdown:
    lessonDocument?.lesson.sections
     .filter((section) => section.type === "reading")
     .map(renderLessonSection)
     .join("\n\n") || "",
   vocabularyText: lesson.overview.groups
    .map((group) => `**${group.title_vi}:** ${group.words.join("、")}`)
    .join("\n\n"),
  },
 };
}

function buildLessonDetail(lesson: DeepVocabularyLesson): HanziHomeLesson {
 const summary = buildLessonSummary(lesson);
 const lessonId = lesson.lesson.id;
 const lessonDocument = q2LessonDocumentsByIndex.get(lesson.source.lesson_index);

 return {
 ...summary,
  vocab: lesson.items.map((item) =>
   buildHanziHomeVocabItem(item, lesson, lessonId),
  ),
  grammar: buildGrammarViewModels(lessonId, lesson.source.lesson_index),
  sourceLesson: lessonDocument,
 };
}

const lessonSummaries = q2VocabLessons.map(buildLessonSummary);

export function getHanziHomeCatalogSummary(
 includeLessons = false,
): HanziHomeCatalogData {
 const vocabCount = q2VocabLessons.reduce(
  (sum, lesson) => sum + lesson.items.length,
  0,
 );
 const grammarCount = lessonSummaries.reduce(
  (sum, lesson) => sum + (lesson.grammarCount ?? 0),
  0,
 );
 const courses: HanziHomeCatalogCourse[] = hanzihomeCourses.map((course) => ({
  ...course,
  stats: {
   bookCount: hanzihomeCourseBooks.length,
   lessonCount: lessonSummaries.length,
   vocabCount,
   grammarCount,
  },
  fallbackLessonId: lessonSummaries.at(0)?.id,
 }));

 return {
  source: "static",
  courses,
  books: hanzihomeCourseBooks,
  lessons: includeLessons ? lessonSummaries : [],
  radicals: getStaticRadicals(),
  meta: {
   app: "hanzihome",
   dataset: "q2-static-json",
   version: "2.1.0",
   generatedAt: "2026-05-31",
   sourceFiles: [
    "data/hanzihome/q2/vocab/*.json",
    "data/hanzihome/q2/lessons/*.json",
   ],
   counts: {
    lessons: lessonSummaries.length,
    vocab: vocabCount,
    grammarPoints: grammarCount,
    radicals: radicalsData.radicals.length,
    flashcards: vocabCount,
   },
   schemaNote:
    "Static Q2 JSON is the runtime source of truth; Supabase is only used for auth and notes.",
  },
 };
}

export function getHanziHomeCourseLessonSummaries(courseId: string) {
 if (courseId !== DEFAULT_HANYU_COURSE_ID) return [];

 return lessonSummaries;
}

export function getHanziHomeLessonDetail(
 lessonId: string | null | undefined,
): HanziHomeLesson | null {
 const lesson = q2VocabLessons.find((item) => item.lesson.id === lessonId);

 return lesson ? buildLessonDetail(lesson) : null;
}

export function getHanziHomeData(): HanziHomeData {
 const lessons = q2VocabLessons.map(buildLessonDetail);

 return {
  courses: hanzihomeCourses,
  books: hanzihomeCourseBooks,
  lessons,
  radicals: getStaticRadicals(),
  meta: getHanziHomeCatalogSummary().meta,
 };
}
