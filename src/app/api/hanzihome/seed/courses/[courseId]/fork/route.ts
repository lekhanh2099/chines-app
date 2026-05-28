import { NextResponse } from "next/server";

import { getHanziHomeData } from "@/features/hanzihome/static-data";
import type { HanziHomeLesson, VocabExample } from "@/features/hanzihome/types";
import { createClient } from "@/lib/supabase/server";

type InsertRow = Record<string, unknown>;

function slugify(value: string) {
 const slug = value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)+/g, "");

 return slug || "custom-course";
}

function makeForkId(courseId: string, originalId: string) {
 return `${courseId}__${originalId}`;
}

function cleanTitle(title: string) {
 return title.replace(/\\\./g, ".").replace(/^(\d+\.)\s*/, "").trim();
}

async function insertRows(
 supabase: Awaited<ReturnType<typeof createClient>>,
 table: string,
 rows: InsertRow[],
) {
 if (rows.length === 0) return;

 const { error } = await supabase.from(table).insert(rows);

 if (error) {
  throw new Error(`Could not insert ${table}: ${error.message}`);
 }
}

function mapExamples({
 examples,
 parentId,
 lessonId,
 sourceKey,
 parentColumn,
 now,
 userId,
}: {
 examples: VocabExample[];
 parentId: string;
 lessonId: string;
 sourceKey: string;
 parentColumn: "vocab_item_id" | "grammar_point_id";
 now: string;
 userId: string;
}) {
 return examples.map((example, index) => ({
  id: `${parentId}-example-${index + 1}`,
  [parentColumn]: parentId,
  lesson_id: lessonId,
  owner_id: userId,
  source: sourceKey,
  example_order: index + 1,
  zh: example.zh,
  pinyin: example.pinyin ?? null,
  vi: example.vi ?? null,
  note: example.note ?? null,
  imported_at: now,
  updated_at: now,
 }));
}

function buildForkRows({
 userId,
 sourceCourseId,
 targetCourseId,
}: {
 userId: string;
 sourceCourseId: string;
 targetCourseId: string;
}) {
 const data = getHanziHomeData();
 const sourceCourse = data.courses.find((course) => course.id === sourceCourseId);

 if (!sourceCourse) {
  throw new Error("Seed course not found");
 }

 const now = new Date().toISOString();
 const sourceKey = "custom";
 const targetCourseTitle = `${sourceCourse.title} - Bản cá nhân`;
 const sourceBooks = data.books.filter((book) => book.courseId === sourceCourseId);
 const sourceLessons = data.lessons.filter(
  (lesson) => lesson.courseId === sourceCourseId,
 );

 const bookIdBySourceId = new Map(
  sourceBooks.map((book) => [book.id, makeForkId(targetCourseId, book.id)]),
 );

 const lessonIdBySourceId = new Map(
  sourceLessons.map((lesson) => [
   lesson.id,
   makeForkId(targetCourseId, lesson.id),
  ]),
 );

 const courseRows: InsertRow[] = [
  {
   id: targetCourseId,
   user_id: userId,
   slug: slugify(`${sourceCourse.slug}-ban-ca-nhan-${userId.slice(0, 8)}`),
   title: targetCourseTitle,
   subtitle: `Bản chỉnh sửa cá nhân từ ${sourceCourse.title}`,
   type: sourceCourse.type,
   course_order: (sourceCourse.order ?? 1) + 1000,
   source: sourceKey,
   imported_at: now,
   updated_at: now,
  },
 ];

 const bookRows: InsertRow[] = sourceBooks.map((book) => ({
  id: bookIdBySourceId.get(book.id),
  course_id: targetCourseId,
  user_id: userId,
  source: sourceKey,
  title: book.title,
  short_title: book.shortTitle ?? null,
  book_order: book.order,
  imported_at: now,
  updated_at: now,
 }));

 const lessonRows: InsertRow[] = sourceLessons.map((lesson) => ({
  id: lessonIdBySourceId.get(lesson.id),
  course_id: targetCourseId,
  book_id: bookIdBySourceId.get(lesson.bookId ?? "") ?? null,
  owner_id: userId,
  source: sourceKey,
  lesson_number: lesson.lessonNumber,
  lesson_order: lesson.lessonOrder ?? lesson.lessonNumber,
  title_zh: lesson.titleZh,
  title_vi: lesson.title,
  source_file: lesson.sourceFile ?? null,
  imported_at: now,
  updated_at: now,
 }));

 const lessonTextRows: InsertRow[] = sourceLessons.map((lesson) => {
  const targetLessonId = lessonIdBySourceId.get(lesson.id);

  return {
   id: `${targetLessonId}-main-text`,
   lesson_id: targetLessonId,
   owner_id: userId,
   source: sourceKey,
   text_key: "main",
   title: `Bài khóa ${lesson.lessonNumber}`,
   content: lesson.notes?.overviewMarkdown ?? "",
   content_format: "markdown",
   imported_at: now,
   updated_at: now,
  };
 });

 const vocabRows: InsertRow[] = [];
 const vocabExampleRows: InsertRow[] = [];
 const vocabSectionRows: InsertRow[] = [];

 const grammarRows: InsertRow[] = [];
 const grammarExampleRows: InsertRow[] = [];
 const grammarSectionRows: InsertRow[] = [];

 for (const lesson of sourceLessons) {
  const targetLessonId = lessonIdBySourceId.get(lesson.id);
  const targetBookId = bookIdBySourceId.get(lesson.bookId ?? "") ?? null;

  if (!targetLessonId) continue;

  lesson.vocab.forEach((item, index) => {
   const targetVocabId = makeForkId(targetCourseId, item.id);

   vocabRows.push({
    id: targetVocabId,
    lesson_id: targetLessonId,
    course_id: targetCourseId,
    book_id: targetBookId,
    owner_id: userId,
    source: sourceKey,
    item_order: index + 1,
    word: item.word,
    pinyin: item.pinyin,
    han_viet: item.hanViet,
    meaning: item.meaning,
    category: item.category,
    level: item.level ?? null,
    pos_vi: item.pos?.vi ?? null,
    pos_zh: item.pos?.zh ?? null,
    tone: null,
    source_file: lesson.sourceFile ?? null,
    imported_at: now,
    updated_at: now,
   });

   vocabExampleRows.push(
    ...mapExamples({
     examples: item.examplesParsed,
     parentId: targetVocabId,
     lessonId: targetLessonId,
     sourceKey,
     parentColumn: "vocab_item_id",
     now,
     userId,
    }),
   );

   item.detailSections.forEach((section, sectionIndex) => {
    vocabSectionRows.push({
     id: `${targetVocabId}-section-${section.key}`,
     vocab_item_id: targetVocabId,
     lesson_id: targetLessonId,
     owner_id: userId,
     source: sourceKey,
     section_key: section.key,
     title: section.title,
     lines: section.lines,
     section_order: sectionIndex + 1,
     imported_at: now,
     updated_at: now,
    });
   });
  });

  lesson.grammar.forEach((point, index) => {
   const targetGrammarId = makeForkId(targetCourseId, point.id);

   grammarRows.push({
    id: targetGrammarId,
    lesson_id: targetLessonId,
    course_id: targetCourseId,
    book_id: targetBookId,
    owner_id: userId,
    source: sourceKey,
    point_order: index + 1,
    title: point.title ?? point.cleanTitle,
    clean_title: cleanTitle(point.cleanTitle),
    core: point.core,
    content_md: point.contentMd ?? null,
    structures_view: point.structuresView,
    notes: point.notes,
    imported_at: now,
    updated_at: now,
   });

   grammarExampleRows.push(
    ...mapExamples({
     examples: point.examplesParsed,
     parentId: targetGrammarId,
     lessonId: targetLessonId,
     sourceKey,
     parentColumn: "grammar_point_id",
     now,
     userId,
    }),
   );

   point.detailSections?.forEach((section, sectionIndex) => {
    grammarSectionRows.push({
     id: `${targetGrammarId}-section-${section.key}`,
     grammar_point_id: targetGrammarId,
     lesson_id: targetLessonId,
     owner_id: userId,
     source: sourceKey,
     section_key: section.key,
     title: section.title,
     lines: section.lines,
     section_order: sectionIndex + 1,
     imported_at: now,
     updated_at: now,
    });
   });
  });
 }

 const firstLessonId = sourceLessons[0]
  ? lessonIdBySourceId.get(sourceLessons[0].id)
  : undefined;

 return {
  course: sourceCourse,
  courseRows,
  bookRows,
  lessonRows,
  lessonTextRows,
  vocabRows,
  vocabExampleRows,
  vocabSectionRows,
  grammarRows,
  grammarExampleRows,
  grammarSectionRows,
  firstLessonId,
 };
}

export async function POST(
 _request: Request,
 { params }: { params: Promise<{ courseId: string }> },
) {
 const { courseId } = await params;
 const supabase = await createClient();

 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const data = getHanziHomeData();
 const sourceCourse = data.courses.find((course) => course.id === courseId);

 if (!sourceCourse) {
  return NextResponse.json({ error: "Seed course not found" }, { status: 404 });
 }

 const personalSlug = slugify(
  `${sourceCourse.slug}-ban-ca-nhan-${user.id.slice(0, 8)}`,
 );

 const existingCourse = await supabase
  .from("hanzihome_courses")
  .select("id, slug, title")
  .eq("user_id", user.id)
  .eq("slug", personalSlug)
  .maybeSingle();

 if (existingCourse.error) {
  return NextResponse.json(
   { error: "Could not check existing fork" },
   { status: 500 },
  );
 }

 if (existingCourse.data) {
  const firstLesson = await supabase
   .from("hanzihome_lessons")
   .select("id")
   .eq("course_id", existingCourse.data.id)
   .order("lesson_order", { ascending: true })
   .limit(1)
   .maybeSingle();

  return NextResponse.json({
   courseId: existingCourse.data.id,
   lessonId: firstLesson.data?.id ?? null,
   reused: true,
  });
 }

 const targetCourseId = crypto.randomUUID();

 try {
  const rows = buildForkRows({
   userId: user.id,
   sourceCourseId: courseId,
   targetCourseId,
  });

  await insertRows(supabase, "hanzihome_courses", rows.courseRows);
  await insertRows(supabase, "hanzihome_course_books", rows.bookRows);
  await insertRows(supabase, "hanzihome_lessons", rows.lessonRows);
  await insertRows(supabase, "hanzihome_lesson_texts", rows.lessonTextRows);
  await insertRows(supabase, "hanzihome_vocab_items", rows.vocabRows);
  await insertRows(supabase, "hanzihome_vocab_examples", rows.vocabExampleRows);
  await insertRows(
   supabase,
   "hanzihome_vocab_detail_sections",
   rows.vocabSectionRows,
  );
  await insertRows(supabase, "hanzihome_grammar_points", rows.grammarRows);
  await insertRows(
   supabase,
   "hanzihome_grammar_examples",
   rows.grammarExampleRows,
  );
  await insertRows(
   supabase,
   "hanzihome_grammar_detail_sections",
   rows.grammarSectionRows,
  );

  return NextResponse.json(
   {
    courseId: targetCourseId,
    lessonId: rows.firstLessonId ?? null,
    reused: false,
   },
   { status: 201 },
  );
 } catch (error) {
  await supabase.from("hanzihome_courses").delete().eq("id", targetCourseId);

  return NextResponse.json(
   {
    error:
     error instanceof Error
      ? error.message
      : "Could not fork seed course",
   },
   { status: 500 },
  );
 }
}
