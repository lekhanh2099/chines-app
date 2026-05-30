import { NextResponse } from "next/server";
import { z } from "zod";

import { grammarDraftItemSchema } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import {
 toLessonDraft,
 type LessonDraftContent,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { vocabDraftItemSchema } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
 params: Promise<{
  draftId: string;
 }>;
};

type InsertRow = Record<string, unknown>;

const draftSelect =
 "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at";

const ownerRowSchema = z.object({
 id: z.string(),
 user_id: z.string().nullable(),
});

function jsonError(message: string, status: number) {
 return NextResponse.json({ error: message }, { status });
}

function nowIso() {
 return new Date().toISOString();
}

function compactLines(value: string | undefined | null) {
 return (value ?? "")
  .split(/\n+/)
  .map((line) => line.trim())
  .filter(Boolean);
}

function splitPartOfSpeech(value: string | undefined) {
 const raw = value?.trim() ?? "";

 if (!raw) return { vi: "", zh: "" };

 const [vi, zh] = raw.split("/").map((item) => item.trim());

 return {
  vi: vi ?? raw,
  zh: zh ?? "",
 };
}

function titleKey(value: string) {
 return value.trim().toLocaleLowerCase("vi-VN");
}

function uniqueLessonTitle(title: string, seenTitles: Map<string, number>) {
 const key = titleKey(title);
 const count = seenTitles.get(key) ?? 0;
 seenTitles.set(key, count + 1);

 return count === 0 ? title : `${title} (${count + 1})`;
}

function vocabDetailRows({
 dbItemId,
 lessonId,
 ownerId,
 sections,
 now,
}: {
 dbItemId: string;
 lessonId: string;
 ownerId: string;
 sections: z.infer<typeof vocabDraftItemSchema>["sections"];
 now: string;
}) {
 const configs = [
  ["meaning", "Nghĩa", sections.meaning],
  ["character-logic", "Logic chữ", sections.characterLogic],
  ["comparison", "So sánh", sections.comparison],
  ["culture", "Văn hóa", sections.culture],
  ["warning", "Lưu ý", sections.warning],
 ] as const;

 return configs
  .map(([key, title, text], index) => ({
   id: `${dbItemId}-section-${key}`,
   vocab_item_id: dbItemId,
   lesson_id: lessonId,
   owner_id: ownerId,
   source: "custom",
   section_key: key,
   title,
   lines: compactLines(text),
   section_order: index + 1,
   imported_at: now,
   updated_at: now,
  }))
  .filter((row) => row.lines.length > 0);
}

function grammarDetailRows({
 dbPointId,
 lessonId,
 ownerId,
 item,
 now,
}: {
 dbPointId: string;
 lessonId: string;
 ownerId: string;
 item: z.infer<typeof grammarDraftItemSchema>;
 now: string;
}) {
 const configs = [
  ["comparison", "So sánh", item.comparisons],
  ["pitfalls", "Điểm dễ sai", item.pitfalls],
  ["practice", "Luyện tập", item.practice],
  ["culture", "Văn hóa", item.cultureNotes],
  ["raw", "Markdown gốc", item.rawMarkdown],
 ] as const;

 return configs
  .map(([key, title, text], index) => ({
   id: `${dbPointId}-section-${key}`,
   grammar_point_id: dbPointId,
   lesson_id: lessonId,
   owner_id: ownerId,
   source: "custom",
   section_key: key,
   title,
   lines: compactLines(text),
   section_order: index + 1,
   imported_at: now,
   updated_at: now,
  }))
  .filter((row) => row.lines.length > 0);
}

async function assertOwnCourseAndBook({
 supabase,
 courseId,
 bookId,
 userId,
}: {
 supabase: Awaited<ReturnType<typeof createClient>>;
 courseId: string;
 bookId: string;
 userId: string;
}) {
 const [courseResult, bookResult] = await Promise.all([
  supabase
   .from("hanzihome_courses")
   .select("id, user_id")
   .eq("id", courseId)
   .maybeSingle(),
  supabase
   .from("hanzihome_course_books")
   .select("id, user_id")
   .eq("id", bookId)
   .eq("course_id", courseId)
   .maybeSingle(),
 ]);

 if (courseResult.error || bookResult.error) {
  throw new Error("Could not check course ownership");
 }

 const course = ownerRowSchema.nullable().parse(courseResult.data);
 const book = ownerRowSchema.nullable().parse(bookResult.data);

 if (!course || course.user_id !== userId || !book || book.user_id !== userId) {
  throw new Error("Course or book is not editable by this user");
 }
}

async function clearExistingLessonContent({
 supabase,
 lessonId,
}: {
 supabase: Awaited<ReturnType<typeof createClient>>;
 lessonId: string;
}) {
 const results = await Promise.all([
  supabase.from("hanzihome_vocab_examples").delete().eq("lesson_id", lessonId),
  supabase
   .from("hanzihome_vocab_detail_sections")
   .delete()
   .eq("lesson_id", lessonId),
  supabase.from("hanzihome_vocab_items").delete().eq("lesson_id", lessonId),
  supabase
   .from("hanzihome_grammar_examples")
   .delete()
   .eq("lesson_id", lessonId),
  supabase
   .from("hanzihome_grammar_detail_sections")
   .delete()
   .eq("lesson_id", lessonId),
  supabase.from("hanzihome_grammar_points").delete().eq("lesson_id", lessonId),
  supabase.from("hanzihome_lesson_texts").delete().eq("lesson_id", lessonId),
 ]);

 const failed = results.find((result) => result.error);

 if (failed?.error) {
  throw new Error(`Could not clear old lesson content: ${failed.error.message}`);
 }
}

async function saveLessonContent({
 supabase,
 lessonId,
 content,
 userId,
 now,
}: {
 supabase: Awaited<ReturnType<typeof createClient>>;
 lessonId: string;
 content: LessonDraftContent;
 userId: string;
 now: string;
}) {
 const notes = content.lesson.notes;
 const noteRows = notes
  ? [
     ["main", "Tổng quan", notes.overviewMarkdown],
     ["grammar-summary", "Tổng hợp ngữ pháp", notes.grammarSummary],
     ["vocabulary", "Từ vựng", notes.vocabularyText],
     ["proper-nouns", "Tên riêng", notes.properNounsText],
     ["application", "Bài đọc áp dụng", notes.applicationMarkdown],
     ["personal-note", "Ghi chú riêng", notes.personalNote],
    ]
     .filter(([, , contentText]) => String(contentText ?? "").trim())
     .map(([key, title, contentText]) => ({
      id: `${lessonId}-text-${key}`,
      lesson_id: lessonId,
      owner_id: userId,
      source: "custom",
      text_key: key,
      title,
      content: contentText,
      content_format: "markdown",
      imported_at: now,
      updated_at: now,
     }))
  : [];

 const vocabItems = content.vocab.map((item) => vocabDraftItemSchema.parse(item));
 const grammarItems = content.grammarPoints.map((item) =>
  grammarDraftItemSchema.parse(item),
 );
 const courseId = content.lesson.courseId;
 const bookId = content.lesson.bookId;

 if (!courseId || !bookId) {
  throw new Error("Missing lesson course/book");
 }

 const vocabRows: InsertRow[] = [];
 const vocabExampleRows: InsertRow[] = [];
 const vocabSectionRows: InsertRow[] = [];

 vocabItems.forEach((item, itemIndex) => {
  const pos = splitPartOfSpeech(item.partOfSpeech);
  const dbItemId = `${lessonId}__vocab-${itemIndex + 1}-${item.id}`;

  vocabRows.push({
   id: dbItemId,
   lesson_id: lessonId,
   course_id: courseId,
   book_id: bookId,
   owner_id: userId,
   source: "custom",
   item_order: itemIndex + 1,
   word: item.word,
   pinyin: item.pinyin,
   han_viet: item.hanViet,
   meaning: item.meaning,
   category: item.category,
   level: item.level || null,
   pos_vi: pos.vi || null,
   pos_zh: pos.zh || null,
   tone: null,
   source_file: null,
   imported_at: now,
   updated_at: now,
  });

  item.examples.forEach((example, exampleIndex) => {
   vocabExampleRows.push({
    id: `${dbItemId}-example-${exampleIndex + 1}`,
    vocab_item_id: dbItemId,
    lesson_id: lessonId,
    owner_id: userId,
    source: "custom",
    example_order: exampleIndex + 1,
    zh: example.chinese,
    pinyin: example.pinyin || null,
    vi: example.translation || null,
    note: example.note || null,
    imported_at: now,
    updated_at: now,
   });
  });

  vocabSectionRows.push(
   ...vocabDetailRows({
    dbItemId,
    lessonId,
    ownerId: userId,
    sections: item.sections,
    now,
   }),
  );
 });

 const grammarRows: InsertRow[] = [];
 const grammarExampleRows: InsertRow[] = [];
 const grammarSectionRows: InsertRow[] = [];
 const seenGrammarTitles = new Map<string, number>();

 grammarItems.forEach((item, itemIndex) => {
  const dbPointId = `${lessonId}__grammar-${itemIndex + 1}-${item.id}`;
  const title = uniqueLessonTitle(item.title, seenGrammarTitles);

  grammarRows.push({
   id: dbPointId,
   lesson_id: lessonId,
   course_id: courseId,
   book_id: bookId,
   owner_id: userId,
   source: "custom",
   point_order: itemIndex + 1,
   title,
   clean_title: title,
   core: item.coreLogic || item.shortMeaning,
   content_md: item.rawMarkdown || null,
   structures_view: item.formulas,
   notes: [
    item.shortMeaning,
    item.pattern,
    item.comparisons,
    item.pitfalls,
    item.practice,
    item.cultureNotes,
   ].filter(Boolean),
   imported_at: now,
   updated_at: now,
  });

  item.examples.forEach((example, exampleIndex) => {
   grammarExampleRows.push({
    id: `${dbPointId}-example-${exampleIndex + 1}`,
    grammar_point_id: dbPointId,
    lesson_id: lessonId,
    owner_id: userId,
    source: "custom",
    example_order: exampleIndex + 1,
    zh: example.chinese,
    pinyin: example.pinyin || null,
    vi: example.translation || null,
    note: example.note || null,
    imported_at: now,
    updated_at: now,
   });
  });

  grammarSectionRows.push(
   ...grammarDetailRows({
    dbPointId,
    lessonId,
    ownerId: userId,
    item,
    now,
   }),
  );
 });

 const inserts = [
  noteRows.length > 0
   ? supabase.from("hanzihome_lesson_texts").insert(noteRows)
   : null,
  vocabRows.length > 0
   ? supabase.from("hanzihome_vocab_items").insert(vocabRows)
   : null,
  vocabExampleRows.length > 0
   ? supabase.from("hanzihome_vocab_examples").insert(vocabExampleRows)
   : null,
  vocabSectionRows.length > 0
   ? supabase.from("hanzihome_vocab_detail_sections").insert(vocabSectionRows)
   : null,
  grammarRows.length > 0
   ? supabase.from("hanzihome_grammar_points").insert(grammarRows)
   : null,
  grammarExampleRows.length > 0
   ? supabase.from("hanzihome_grammar_examples").insert(grammarExampleRows)
   : null,
  grammarSectionRows.length > 0
   ? supabase
      .from("hanzihome_grammar_detail_sections")
      .insert(grammarSectionRows)
   : null,
 ].filter((item): item is Exclude<typeof item, null> => Boolean(item));

 const results = await Promise.all(inserts);
 const failed = results.find((result) => result.error);

 if (failed?.error) {
  throw new Error(`Could not save lesson content: ${failed.error.message}`);
 }
}

export async function POST(_request: Request, context: RouteContext) {
 const { draftId } = await context.params;
 const supabase = await createClient();
 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const { data: draftRow, error: draftError } = await supabase
  .from("hanzihome_lesson_drafts")
  .select(draftSelect)
  .eq("id", draftId)
  .eq("user_id", user.id)
  .maybeSingle();

 if (draftError) {
  return jsonError("Could not load lesson draft", 500);
 }

 if (!draftRow) {
  return jsonError("Lesson draft not found", 404);
 }

 const draft = toLessonDraft(draftRow);
 const content = draft.content;
 const courseId = content.lesson.courseId;
 const bookId = content.lesson.bookId;

 if (!courseId || !bookId) {
  return jsonError("Draft is missing course/book", 400);
 }

 try {
  await assertOwnCourseAndBook({
   supabase,
   courseId,
   bookId,
   userId: user.id,
  });

  const lessonId = draft.lessonKey.includes("__")
   ? draft.lessonKey
   : `${courseId}__${draft.lessonKey}`;
  const lessonNumber =
   content.lesson.lessonNumber ?? draft.lessonNumber ?? content.lesson.lessonOrder;
  const lessonOrder = content.lesson.lessonOrder ?? lessonNumber;

  if (!lessonNumber || !lessonOrder) {
   return jsonError("Draft is missing lesson number", 400);
  }

  const now = nowIso();

  const { error: lessonError } = await supabase
   .from("hanzihome_lessons")
   .upsert(
    {
     id: lessonId,
     course_id: courseId,
     book_id: bookId,
     owner_id: user.id,
     source: "custom",
     lesson_number: lessonNumber,
     lesson_order: lessonOrder,
     title_zh: content.lesson.titleZh || draft.titleZh,
     title_vi: content.lesson.titleVi || draft.titleVi || null,
     source_file: null,
     imported_at: now,
     updated_at: now,
    },
    { onConflict: "id" },
   );

  if (lessonError) {
   return jsonError(`Could not publish lesson: ${lessonError.message}`, 409);
  }

  await clearExistingLessonContent({ supabase, lessonId });
  await saveLessonContent({
   supabase,
   lessonId,
   content: {
    ...content,
    lesson: {
     ...content.lesson,
     id: lessonId,
     courseId,
     bookId,
     lessonNumber,
     lessonOrder,
    },
   },
   userId: user.id,
   now,
  });

  await supabase
   .from("hanzihome_lesson_drafts")
   .update({
    status: "published",
    lesson_key: lessonId,
    updated_at: now,
    content: {
     ...content,
     lesson: {
      ...content.lesson,
      id: lessonId,
      courseId,
      bookId,
      lessonNumber,
      lessonOrder,
     },
    },
   })
   .eq("id", draft.id)
   .eq("user_id", user.id);

  return NextResponse.json({ ok: true, lessonId, courseId });
 } catch (error) {
  return jsonError(
   error instanceof Error ? error.message : "Could not publish lesson draft",
   500,
  );
 }
}
