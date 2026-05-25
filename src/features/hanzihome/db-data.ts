import "server-only";

import { z } from "zod";

import bundle from "../../../data/hanzihome/hanzihome_bundle_clean.json";
import type {
  HanziHomeCatalogCourse,
  HanziHomeCatalogData,
  GrammarViewModel,
  HanziHomeCourse,
  HanziHomeCourseBook,
  HanziHomeData,
  HanziHomeLesson,
  VocabExample,
  VocabViewModel,
} from "@/features/hanzihome/types";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

const courseRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  type: z.string(),
  course_order: z.number().nullable(),
});

const bookRowSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  title: z.string(),
  short_title: z.string().nullable(),
  book_order: z.number().nullable(),
});

const lessonRowSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  book_id: z.string(),
  lesson_number: z.number(),
  lesson_order: z.number(),
  title_zh: z.string(),
  title_vi: z.string().nullable(),
  source_file: z.string().nullable(),
});

const lessonTextRowSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  text_key: z.string(),
  title: z.string().nullable(),
  content: z.string(),
  content_format: z.enum(["markdown", "plain"]),
});

const vocabRowSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  course_id: z.string(),
  book_id: z.string(),
  word: z.string(),
  pinyin: z.string(),
  han_viet: z.string(),
  meaning: z.string(),
  category: z.string(),
  level: z.string().nullable(),
  pos_vi: z.string().nullable(),
  pos_zh: z.string().nullable(),
});

const vocabExampleRowSchema = z.object({
  id: z.string(),
  vocab_item_id: z.string(),
  lesson_id: z.string(),
  example_order: z.number(),
  zh: z.string(),
  pinyin: z.string().nullable(),
  vi: z.string().nullable(),
  note: z.string().nullable(),
});

const vocabDetailSectionRowSchema = z.object({
  id: z.string(),
  vocab_item_id: z.string(),
  lesson_id: z.string(),
  section_key: z.string(),
  title: z.string(),
  lines: z.array(z.string()),
  section_order: z.number(),
});

const grammarRowSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  course_id: z.string(),
  book_id: z.string(),
  title: z.string(),
  clean_title: z.string(),
  core: z.string(),
  content_md: z.string().nullable(),
  structures_view: z.array(z.string()),
  notes: z.array(z.string()),
});

const grammarExampleRowSchema = z.object({
  id: z.string(),
  grammar_point_id: z.string(),
  lesson_id: z.string(),
  example_order: z.number(),
  zh: z.string(),
  pinyin: z.string().nullable(),
  vi: z.string().nullable(),
  note: z.string().nullable(),
});

const grammarDetailSectionRowSchema = z.object({
  id: z.string(),
  grammar_point_id: z.string(),
  lesson_id: z.string(),
  section_key: z.string(),
  title: z.string(),
  lines: z.array(z.string()),
  section_order: z.number(),
});

const contentCountRowSchema = z.object({
  course_id: z.string(),
  lesson_id: z.string(),
});

const lessonDetailRowSchema = z.object({
  id: z.string(),
  course_id: z.string(),
  book_id: z.string(),
  lesson_number: z.number(),
  lesson_order: z.number(),
  title_zh: z.string(),
  title_vi: z.string().nullable(),
  source_file: z.string().nullable(),
});

type CourseRow = z.infer<typeof courseRowSchema>;
type BookRow = z.infer<typeof bookRowSchema>;
type LessonRow = z.infer<typeof lessonRowSchema>;
type LessonTextRow = z.infer<typeof lessonTextRowSchema>;
type VocabRow = z.infer<typeof vocabRowSchema>;
type VocabExampleRow = z.infer<typeof vocabExampleRowSchema>;
type VocabDetailSectionRow = z.infer<typeof vocabDetailSectionRowSchema>;
type GrammarRow = z.infer<typeof grammarRowSchema>;
type GrammarExampleRow = z.infer<typeof grammarExampleRowSchema>;
type GrammarDetailSectionRow = z.infer<typeof grammarDetailSectionRowSchema>;
type ContentCountRow = z.infer<typeof contentCountRowSchema>;

type PageResult = {
  data: unknown[] | null;
  error: {
    message: string;
  } | null;
};

function parseRows<T>(schema: z.ZodType<T>, rows: unknown[] | null) {
  return z.array(schema).parse(rows ?? []);
}

async function fetchPagedRows<T>(
  schema: z.ZodType<T>,
  fetchPage: (from: number, to: number) => Promise<PageResult>,
  errorMessage: string,
) {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const result = await fetchPage(from, to);

    if (result.error) {
      throw new Error(`${errorMessage}: ${result.error.message}`);
    }

    const page = parseRows(schema, result.data);
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return rows;
    }
  }
}

function groupByKey<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const current = grouped.get(key);

    if (current) {
      current.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return grouped;
}

function sortByOrder<T>(items: T[], getOrder: (item: T) => number) {
  return [...items].sort((a, b) => getOrder(a) - getOrder(b));
}

function mapCourse(row: CourseRow): HanziHomeCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    type: row.type,
    order: row.course_order ?? 1000,
  };
}

function mapBook(row: BookRow): HanziHomeCourseBook {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    shortTitle: row.short_title ?? undefined,
    order: row.book_order ?? 1000,
  };
}

function mapExample(row: VocabExampleRow | GrammarExampleRow): VocabExample {
  return {
    zh: row.zh,
    pinyin: row.pinyin ?? undefined,
    vi: row.vi ?? undefined,
    note: row.note ?? undefined,
  };
}

function mapVocabItem({
  row,
  examples,
  detailSections,
}: {
  row: VocabRow;
  examples: VocabExampleRow[];
  detailSections: VocabDetailSectionRow[];
}): VocabViewModel {
  const pos =
    row.pos_vi || row.pos_zh
      ? {
          vi: row.pos_vi ?? undefined,
          zh: row.pos_zh ?? undefined,
        }
      : undefined;

  return {
    id: row.id,
    lessonId: row.lesson_id,
    word: row.word,
    pinyin: row.pinyin,
    hanViet: row.han_viet,
    meaning: row.meaning,
    category: row.category,
    level: row.level ?? undefined,
    pos,
    examplesParsed: sortByOrder(examples, (example) => example.example_order).map(
      mapExample,
    ),
    detailSections: sortByOrder(
      detailSections,
      (section) => section.section_order,
    ).map((section) => ({
      key: section.section_key,
      title: section.title,
      lines: section.lines,
    })),
  };
}

function mapGrammarPoint({
  row,
  examples,
  detailSections,
}: {
  row: GrammarRow;
  examples: GrammarExampleRow[];
  detailSections: GrammarDetailSectionRow[];
}): GrammarViewModel {
  const sortedDetailSections = sortByOrder(
    detailSections,
    (section) => section.section_order,
  );

  return {
    id: row.id,
    title: row.title,
    contentMd: row.content_md ?? undefined,
    cleanTitle: row.clean_title,
    core: row.core,
    structuresView: row.structures_view,
    examplesParsed: sortByOrder(examples, (example) => example.example_order).map(
      mapExample,
    ),
    notes: row.notes,
    detailSections: sortedDetailSections.map((section) => ({
      key: section.section_key,
      title: section.title,
      lines: section.lines,
    })),
  };
}

function mapLesson({
  row,
  course,
  book,
  lessonTexts,
  vocab,
  grammar,
}: {
  row: LessonRow;
  course?: HanziHomeCourse;
  book?: HanziHomeCourseBook;
  lessonTexts: LessonTextRow[];
  vocab: VocabViewModel[];
  grammar: GrammarViewModel[];
}): HanziHomeLesson {
  const vocabCategories = Array.from(
    groupByKey(vocab, (item) => item.category),
    ([nameVi, words]) => ({
      nameVi,
      words: words.map((item) => item.word),
    }),
  );
  const mainText = lessonTexts.find((item) => item.text_key === "main");
  const applicationText = lessonTexts.find((item) =>
    ["application", "reading", "reading-application", "grammar-application"].includes(
      item.text_key,
    ),
  );
  const grammarSummaryText = lessonTexts.find((item) =>
    ["grammar-summary", "summary"].includes(item.text_key),
  );
  const vocabularyText = lessonTexts.find((item) =>
    ["vocabulary", "vocab"].includes(item.text_key),
  );
  const properNounsText = lessonTexts.find((item) =>
    ["proper-nouns", "names"].includes(item.text_key),
  );
  const hasNotes = Boolean(
    mainText?.content ||
      applicationText?.content ||
      grammarSummaryText?.content ||
      vocabularyText?.content ||
      properNounsText?.content,
  );

  return {
    id: row.id,
    lessonNumber: row.lesson_number,
    titleZh: row.title_zh,
    title: row.title_vi || `Bài ${row.lesson_number}: ${row.title_zh}`,
    sourceFile: row.source_file ?? undefined,
    courseId: row.course_id,
    courseTitle: course?.title,
    bookId: row.book_id,
    bookTitle: book?.title,
    bookOrder: book?.order,
    lessonOrder: row.lesson_order,
    vocabCategories,
    vocabCount: vocab.length,
    vocabIds: vocab.map((item) => item.id),
    grammarPointIds: grammar.map((item) => item.id),
    vocab,
    grammar,
    isDbBacked: true,
    notes: hasNotes
      ? {
          overviewMarkdown: mainText?.content,
          applicationMarkdown: applicationText?.content,
          grammarSummary: grammarSummaryText?.content,
          vocabularyText: vocabularyText?.content,
          properNounsText: properNounsText?.content,
        }
      : undefined,
  };
}

function mapLessonSummary(row: LessonRow): HanziHomeLesson {
  return {
    id: row.id,
    lessonNumber: row.lesson_number,
    titleZh: row.title_zh,
    title: row.title_vi || `Bài ${row.lesson_number}: ${row.title_zh}`,
    sourceFile: row.source_file ?? undefined,
    courseId: row.course_id,
    bookId: row.book_id,
    lessonOrder: row.lesson_order,
    vocabIds: [],
    grammarPointIds: [],
    vocab: [],
    grammar: [],
    isDbBacked: true,
  };
}

function countByCourse(rows: ContentCountRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.course_id, (counts.get(row.course_id) ?? 0) + 1);
  }

  return counts;
}

function buildCatalogCourses({
  courses,
  books,
  lessons,
  vocabRows,
  grammarRows,
}: {
  courses: CourseRow[];
  books: BookRow[];
  lessons: LessonRow[];
  vocabRows: ContentCountRow[];
  grammarRows: ContentCountRow[];
}): HanziHomeCatalogCourse[] {
  const booksByCourse = groupByKey(books, (book) => book.course_id);
  const lessonsByCourse = groupByKey(lessons, (lesson) => lesson.course_id);
  const vocabCounts = countByCourse(vocabRows);
  const grammarCounts = countByCourse(grammarRows);

  return courses.map((row) => {
    const course = mapCourse(row);
    const courseLessons = sortByOrder(
      lessonsByCourse.get(row.id) ?? [],
      (lesson) => lesson.lesson_order,
    );
    const fallbackLesson = courseLessons.at(-1);

    return {
      ...course,
      stats: {
        bookCount: booksByCourse.get(row.id)?.length ?? 0,
        lessonCount: courseLessons.length,
        vocabCount: vocabCounts.get(row.id) ?? 0,
        grammarCount: grammarCounts.get(row.id) ?? 0,
      },
      fallbackLessonId: fallbackLesson?.id,
    };
  });
}

export async function getDbHanziHomeCatalog() {
  const supabase = await createClient();

  const [coursesResult, booksResult, lessonsResult] = await Promise.all([
    supabase
      .from("hanzihome_courses")
      .select("id, slug, title, subtitle, type, course_order")
      .order("course_order", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .from("hanzihome_course_books")
      .select("id, course_id, title, short_title, book_order")
      .order("course_id", { ascending: true })
      .order("book_order", { ascending: true }),
    supabase
      .from("hanzihome_lessons")
      .select(
        "id, course_id, book_id, lesson_number, lesson_order, title_zh, title_vi, source_file",
      )
      .order("course_id", { ascending: true })
      .order("book_id", { ascending: true })
      .order("lesson_order", { ascending: true }),
  ]);

  if (coursesResult.error || booksResult.error || lessonsResult.error) {
    throw new Error("Could not load DB-backed HanziHome catalog");
  }

  return {
    courses: parseRows(courseRowSchema, coursesResult.data),
    books: parseRows(bookRowSchema, booksResult.data),
    lessons: parseRows(lessonRowSchema, lessonsResult.data),
  };
}

export async function getDbHanziHomeLessonContent(lessonId: string) {
  const supabase = await createClient();

  const [vocabResult, grammarResult] = await Promise.all([
    supabase
      .from("hanzihome_vocab_items")
      .select(
        "id, lesson_id, course_id, book_id, word, pinyin, han_viet, meaning, category, level, pos_vi, pos_zh",
      )
      .eq("lesson_id", lessonId)
      .order("item_order", { ascending: true }),
    supabase
      .from("hanzihome_grammar_points")
      .select(
        "id, lesson_id, course_id, book_id, title, clean_title, core, content_md, structures_view, notes",
      )
      .eq("lesson_id", lessonId)
      .order("point_order", { ascending: true }),
  ]);

  if (vocabResult.error || grammarResult.error) {
    throw new Error("Could not load DB-backed HanziHome lesson content");
  }

  return {
    vocab: parseRows(vocabRowSchema, vocabResult.data),
    grammar: parseRows(grammarRowSchema, grammarResult.data),
  };
}

export async function getDbHanziHomeCatalogSummary({
  includeLessons = false,
}: {
  includeLessons?: boolean;
} = {}): Promise<HanziHomeCatalogData> {
  const supabase = await createClient();

  const [courses, books, lessons, vocabRows, grammarRows] = await Promise.all([
    fetchPagedRows(
      courseRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_courses")
          .select("id, slug, title, subtitle, type, course_order")
          .order("course_order", { ascending: true })
          .order("title", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome catalog courses",
    ),
    fetchPagedRows(
      bookRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_course_books")
          .select("id, course_id, title, short_title, book_order")
          .order("course_id", { ascending: true })
          .order("book_order", { ascending: true })
          .order("title", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome catalog books",
    ),
    fetchPagedRows(
      lessonRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_lessons")
          .select(
            "id, course_id, book_id, lesson_number, lesson_order, title_zh, title_vi, source_file",
          )
          .order("course_id", { ascending: true })
          .order("book_id", { ascending: true })
          .order("lesson_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome catalog lessons",
    ),
    fetchPagedRows(
      contentCountRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_vocab_items")
          .select("course_id, lesson_id")
          .order("course_id", { ascending: true })
          .range(from, to),
      "Could not count DB-backed HanziHome vocabulary",
    ),
    fetchPagedRows(
      contentCountRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_grammar_points")
          .select("course_id, lesson_id")
          .order("course_id", { ascending: true })
          .range(from, to),
      "Could not count DB-backed HanziHome grammar",
    ),
  ]);

  return {
    source: courses.length > 0 || lessons.length > 0 ? "db" : "empty",
    courses: buildCatalogCourses({
      courses,
      books,
      lessons,
      vocabRows,
      grammarRows,
    }),
    books: books.map(mapBook),
    lessons: includeLessons ? lessons.map(mapLessonSummary) : [],
    radicals: [...bundle.radicals].sort((a, b) => a.index - b.index),
    meta: bundle.meta,
  };
}

export async function getDbHanziHomeLessonDetail(
  lessonId: string,
): Promise<HanziHomeLesson | null> {
  const supabase = await createClient();

  const lessonResult = await supabase
    .from("hanzihome_lessons")
    .select(
      "id, course_id, book_id, lesson_number, lesson_order, title_zh, title_vi, source_file",
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonResult.error) {
    throw new Error(
      `Could not load DB-backed HanziHome lesson: ${lessonResult.error.message}`,
    );
  }

  const lesson = lessonDetailRowSchema.nullable().parse(lessonResult.data);

  if (!lesson) {
    return null;
  }

  const [
    courseResult,
    bookResult,
    lessonTextResult,
    vocabResult,
    vocabExamplesResult,
    vocabDetailSectionsResult,
    grammarResult,
    grammarExamplesResult,
    grammarDetailSectionsResult,
  ] = await Promise.all([
    supabase
      .from("hanzihome_courses")
      .select("id, slug, title, subtitle, type, course_order")
      .eq("id", lesson.course_id)
      .maybeSingle(),
    supabase
      .from("hanzihome_course_books")
      .select("id, course_id, title, short_title, book_order")
      .eq("id", lesson.book_id)
      .maybeSingle(),
    supabase
      .from("hanzihome_lesson_texts")
      .select("id, lesson_id, text_key, title, content, content_format")
      .eq("lesson_id", lesson.id)
      .order("text_key", { ascending: true }),
    supabase
      .from("hanzihome_vocab_items")
      .select(
        "id, lesson_id, course_id, book_id, word, pinyin, han_viet, meaning, category, level, pos_vi, pos_zh",
      )
      .eq("lesson_id", lesson.id)
      .order("item_order", { ascending: true }),
    supabase
      .from("hanzihome_vocab_examples")
      .select("id, vocab_item_id, lesson_id, example_order, zh, pinyin, vi, note")
      .eq("lesson_id", lesson.id)
      .order("vocab_item_id", { ascending: true })
      .order("example_order", { ascending: true }),
    supabase
      .from("hanzihome_vocab_detail_sections")
      .select(
        "id, vocab_item_id, lesson_id, section_key, title, lines, section_order",
      )
      .eq("lesson_id", lesson.id)
      .order("vocab_item_id", { ascending: true })
      .order("section_order", { ascending: true }),
    supabase
      .from("hanzihome_grammar_points")
      .select(
        "id, lesson_id, course_id, book_id, title, clean_title, core, content_md, structures_view, notes",
      )
      .eq("lesson_id", lesson.id)
      .order("point_order", { ascending: true }),
    supabase
      .from("hanzihome_grammar_examples")
      .select(
        "id, grammar_point_id, lesson_id, example_order, zh, pinyin, vi, note",
      )
      .eq("lesson_id", lesson.id)
      .order("grammar_point_id", { ascending: true })
      .order("example_order", { ascending: true }),
    supabase
      .from("hanzihome_grammar_detail_sections")
      .select(
        "id, grammar_point_id, lesson_id, section_key, title, lines, section_order",
      )
      .eq("lesson_id", lesson.id)
      .order("grammar_point_id", { ascending: true })
      .order("section_order", { ascending: true }),
  ]);

  const results = [
    courseResult,
    bookResult,
    lessonTextResult,
    vocabResult,
    vocabExamplesResult,
    vocabDetailSectionsResult,
    grammarResult,
    grammarExamplesResult,
    grammarDetailSectionsResult,
  ];
  const failedResult = results.find((result) => result.error);

  if (failedResult?.error) {
    throw new Error(
      `Could not load DB-backed HanziHome lesson detail: ${failedResult.error.message}`,
    );
  }

  const course = courseRowSchema.nullable().parse(courseResult.data);
  const book = bookRowSchema.nullable().parse(bookResult.data);
  const lessonTexts = parseRows(lessonTextRowSchema, lessonTextResult.data);
  const vocabRows = parseRows(vocabRowSchema, vocabResult.data);
  const vocabExamples = parseRows(
    vocabExampleRowSchema,
    vocabExamplesResult.data,
  );
  const vocabDetailSections = parseRows(
    vocabDetailSectionRowSchema,
    vocabDetailSectionsResult.data,
  );
  const grammarRows = parseRows(grammarRowSchema, grammarResult.data);
  const grammarExamples = parseRows(
    grammarExampleRowSchema,
    grammarExamplesResult.data,
  );
  const grammarDetailSections = parseRows(
    grammarDetailSectionRowSchema,
    grammarDetailSectionsResult.data,
  );
  const vocabExamplesByItem = groupByKey(
    vocabExamples,
    (row) => row.vocab_item_id,
  );
  const vocabDetailSectionsByItem = groupByKey(
    vocabDetailSections,
    (row) => row.vocab_item_id,
  );
  const grammarExamplesByPoint = groupByKey(
    grammarExamples,
    (row) => row.grammar_point_id,
  );
  const grammarDetailSectionsByPoint = groupByKey(
    grammarDetailSections,
    (row) => row.grammar_point_id,
  );

  return mapLesson({
    row: lesson,
    course: course ? mapCourse(course) : undefined,
    book: book ? mapBook(book) : undefined,
    lessonTexts,
    vocab: vocabRows.map((row) =>
      mapVocabItem({
        row,
        examples: vocabExamplesByItem.get(row.id) ?? [],
        detailSections: vocabDetailSectionsByItem.get(row.id) ?? [],
      }),
    ),
    grammar: grammarRows.map((row) =>
      mapGrammarPoint({
        row,
        examples: grammarExamplesByPoint.get(row.id) ?? [],
        detailSections: grammarDetailSectionsByPoint.get(row.id) ?? [],
      }),
    ),
  });
}

// Legacy/full-load compatibility path. Do not use this for dashboard or normal
// lesson workspace reads; use catalog summary and lesson detail queries instead.
export async function getDbHanziHomeData(): Promise<HanziHomeData> {
  const supabase = await createClient();

  const [
    courses,
    books,
    lessons,
    lessonTexts,
    vocabRows,
    vocabExamples,
    vocabDetailSections,
    grammarRows,
    grammarExamples,
    grammarDetailSections,
  ] = await Promise.all([
    fetchPagedRows(
      courseRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_courses")
          .select("id, slug, title, subtitle, type, course_order")
          .order("course_order", { ascending: true })
          .order("title", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome courses",
    ),
    fetchPagedRows(
      bookRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_course_books")
          .select("id, course_id, title, short_title, book_order")
          .order("course_id", { ascending: true })
          .order("book_order", { ascending: true })
          .order("title", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome books",
    ),
    fetchPagedRows(
      lessonRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_lessons")
          .select(
            "id, course_id, book_id, lesson_number, lesson_order, title_zh, title_vi, source_file",
          )
          .order("course_id", { ascending: true })
          .order("book_id", { ascending: true })
          .order("lesson_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome lessons",
    ),
    fetchPagedRows(
      lessonTextRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_lesson_texts")
          .select("id, lesson_id, text_key, title, content, content_format")
          .order("lesson_id", { ascending: true })
          .order("text_key", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome lesson texts",
    ),
    fetchPagedRows(
      vocabRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_vocab_items")
          .select(
            "id, lesson_id, course_id, book_id, word, pinyin, han_viet, meaning, category, level, pos_vi, pos_zh",
          )
          .order("lesson_id", { ascending: true })
          .order("item_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome vocabulary",
    ),
    fetchPagedRows(
      vocabExampleRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_vocab_examples")
          .select(
            "id, vocab_item_id, lesson_id, example_order, zh, pinyin, vi, note",
          )
          .order("vocab_item_id", { ascending: true })
          .order("example_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome vocabulary examples",
    ),
    fetchPagedRows(
      vocabDetailSectionRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_vocab_detail_sections")
          .select(
            "id, vocab_item_id, lesson_id, section_key, title, lines, section_order",
          )
          .order("vocab_item_id", { ascending: true })
          .order("section_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome vocabulary detail sections",
    ),
    fetchPagedRows(
      grammarRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_grammar_points")
          .select(
            "id, lesson_id, course_id, book_id, title, clean_title, core, content_md, structures_view, notes",
          )
          .order("lesson_id", { ascending: true })
          .order("point_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome grammar",
    ),
    fetchPagedRows(
      grammarExampleRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_grammar_examples")
          .select(
            "id, grammar_point_id, lesson_id, example_order, zh, pinyin, vi, note",
          )
          .order("grammar_point_id", { ascending: true })
          .order("example_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome grammar examples",
    ),
    fetchPagedRows(
      grammarDetailSectionRowSchema,
      async (from, to) =>
        supabase
          .from("hanzihome_grammar_detail_sections")
          .select(
            "id, grammar_point_id, lesson_id, section_key, title, lines, section_order",
          )
          .order("grammar_point_id", { ascending: true })
          .order("section_order", { ascending: true })
          .range(from, to),
      "Could not load DB-backed HanziHome grammar detail sections",
    ),
  ]);

  const mappedCourses = courses.map(mapCourse);
  const mappedBooks = books.map(mapBook);
  const coursesById = new Map(mappedCourses.map((course) => [course.id, course]));
  const booksById = new Map(mappedBooks.map((book) => [book.id, book]));
  const lessonTextsByLesson = groupByKey(lessonTexts, (row) => row.lesson_id);
  const vocabExamplesByItem = groupByKey(
    vocabExamples,
    (row) => row.vocab_item_id,
  );
  const vocabDetailSectionsByItem = groupByKey(
    vocabDetailSections,
    (row) => row.vocab_item_id,
  );
  const grammarExamplesByPoint = groupByKey(
    grammarExamples,
    (row) => row.grammar_point_id,
  );
  const grammarDetailSectionsByPoint = groupByKey(
    grammarDetailSections,
    (row) => row.grammar_point_id,
  );

  const vocabByLesson = groupByKey(
    vocabRows.map((row) =>
      mapVocabItem({
        row,
        examples: vocabExamplesByItem.get(row.id) ?? [],
        detailSections: vocabDetailSectionsByItem.get(row.id) ?? [],
      }),
    ),
    (item) => item.lessonId ?? "",
  );
  const grammarByLesson = groupByKey(
    grammarRows.map((row) => ({
      lessonId: row.lesson_id,
      point: mapGrammarPoint({
        row,
        examples: grammarExamplesByPoint.get(row.id) ?? [],
        detailSections: grammarDetailSectionsByPoint.get(row.id) ?? [],
      }),
    })),
    (item) => item.lessonId,
  );

  const mappedLessons: HanziHomeLesson[] = lessons.map((row) =>
    mapLesson({
      row,
      course: coursesById.get(row.course_id),
      book: booksById.get(row.book_id),
      lessonTexts: lessonTextsByLesson.get(row.id) ?? [],
      vocab: vocabByLesson.get(row.id) ?? [],
      grammar: (grammarByLesson.get(row.id) ?? []).map((item) => item.point),
    }),
  );

  return {
    courses: mappedCourses,
    books: mappedBooks,
    lessons: mappedLessons,
    radicals: [...bundle.radicals].sort((a, b) => a.index - b.index),
    meta: bundle.meta,
  };
}
