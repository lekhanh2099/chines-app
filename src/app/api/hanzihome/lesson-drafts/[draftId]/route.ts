import { NextResponse } from "next/server";
import { z } from "zod";

import { getDbHanziHomeLessonDetail } from "@/features/hanzihome/db-data";
import { createEmptyLessonDraftNotes } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import { grammarDraftItemSchema } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import {
 isPostgresUniqueViolation,
 toLessonDraft,
 updateLessonDraftRequestSchema,
 type LessonDraft,
 type LessonDraftContent,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { vocabDraftItemSchema } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import type {
 GrammarViewModel,
 HanziHomeLesson,
 VocabViewModel,
} from "@/features/hanzihome/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
 params: Promise<{
  draftId: string;
 }>;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type InsertRow = Record<string, unknown>;

const draftSelect =
 "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at";

const courseOwnerSchema = z.object({
 id: z.string(),
 user_id: z.string().nullable(),
});

function isDbLessonId(id: string) {
 return id.includes("__");
}

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

function linesToText(lines: string[] | undefined) {
 return (lines ?? []).join("\n");
}

function getSectionText(
 sections: VocabViewModel["detailSections"] | GrammarViewModel["detailSections"],
 keys: string[],
) {
 const matched = sections?.find((section) =>
  keys.includes(section.key.toLowerCase()),
 );

 return linesToText(matched?.lines);
}

function splitPartOfSpeech(value: string | undefined) {
 const raw = value?.trim() ?? "";

 if (!raw) {
  return {
   vi: "",
   zh: "",
  };
 }

 const [vi, zh] = raw.split("/").map((item) => item.trim());

 return {
  vi: vi ?? raw,
  zh: zh ?? "",
 };
}

function vocabToDraftItem(item: VocabViewModel) {
 const partOfSpeech = [item.pos?.vi, item.pos?.zh].filter(Boolean).join(" / ");

 return {
  id: item.id,
  word: item.word,
  pinyin: item.pinyin,
  hanViet: item.hanViet,
  meaning: item.meaning,
  partOfSpeech,
  level: item.level ?? "",
  category: item.category,
  sections: {
   meaning: getSectionText(item.detailSections, ["meaning", "nghia"]),
   characterLogic: getSectionText(item.detailSections, [
    "character-logic",
    "logic",
    "etymology",
    "chiet-tu",
   ]),
   comparison: getSectionText(item.detailSections, [
    "comparison",
    "compare",
    "so-sanh",
   ]),
   culture: getSectionText(item.detailSections, ["culture", "van-hoa"]),
   warning: getSectionText(item.detailSections, [
    "warning",
    "note",
    "notes",
    "canh-bao",
   ]),
  },
  collocations: [],
  examples: item.examplesParsed.map((example) => ({
   chinese: example.zh,
   pinyin: example.pinyin ?? "",
   translation: example.vi ?? "",
   note: example.note ?? "",
  })),
  rawMarkdown: item.detailSections
   .map((section) => [`### ${section.title}`, ...section.lines].join("\n"))
   .join("\n\n"),
 };
}

function grammarToDraftItem(point: GrammarViewModel) {
 return {
  id: point.id,
  title: point.cleanTitle || point.title || "",
  pattern: point.structuresView.join("\n"),
  shortMeaning: point.core,
  coreLogic: point.core,
  formulas: point.structuresView,
  examples: point.examplesParsed.map((example) => ({
   chinese: example.zh,
   pinyin: example.pinyin ?? "",
   translation: example.vi ?? "",
   note: example.note ?? "",
  })),
  comparisons: getSectionText(point.detailSections, [
   "comparison",
   "compare",
   "so-sanh",
  ]),
  pitfalls: getSectionText(point.detailSections, [
   "pitfalls",
   "warning",
   "canh-bao",
  ]),
  practice: getSectionText(point.detailSections, ["practice", "luyen-tap"]),
  cultureNotes: getSectionText(point.detailSections, ["culture", "van-hoa"]),
  rawMarkdown: point.contentMd ?? "",
  confidence: 1,
 };
}

function normalizeDraftNotes(lesson: HanziHomeLesson) {
 const emptyNotes = createEmptyLessonDraftNotes();

 return {
  overviewMarkdown: lesson.notes?.overviewMarkdown ?? emptyNotes.overviewMarkdown,
  grammarSummary: lesson.notes?.grammarSummary ?? emptyNotes.grammarSummary,
  vocabularyText: lesson.notes?.vocabularyText ?? emptyNotes.vocabularyText,
  properNounsText: lesson.notes?.properNounsText ?? emptyNotes.properNounsText,
  applicationMarkdown:
   lesson.notes?.applicationMarkdown ?? emptyNotes.applicationMarkdown,
  personalNote: lesson.notes?.personalNote ?? emptyNotes.personalNote,
 };
}

function dbLessonToVirtualDraft({
 lesson,
 userId,
}: {
 lesson: HanziHomeLesson;
 userId: string;
}): LessonDraft {
 const notes = normalizeDraftNotes(lesson);

 return {
  id: lesson.id,
  userId,
  lessonKey: lesson.id,
  status: "published",
  titleZh: lesson.titleZh,
  titleVi: lesson.title,
  lessonNumber: lesson.lessonNumber,
  content: {
   lesson: {
    id: lesson.id,
    lessonNumber: lesson.lessonNumber,
    titleZh: lesson.titleZh,
    titleVi: lesson.title,
    courseId: lesson.courseId,
    courseTitle: lesson.courseTitle,
    bookId: lesson.bookId,
    bookTitle: lesson.bookTitle,
    bookOrder: lesson.bookOrder,
    lessonOrder: lesson.lessonOrder,
    vocabIds: lesson.vocabIds,
    grammarPointIds: lesson.grammarPointIds,
    notes,
   },
   vocab: lesson.vocab.map(vocabToDraftItem),
   grammarPoints: lesson.grammar.map(grammarToDraftItem),
   flashcards: [],
  },
  createdAt: nowIso(),
  updatedAt: nowIso(),
 };
}

async function assertCanEditDbLesson({
 supabase,
 lesson,
 userId,
}: {
 supabase: SupabaseClient;
 lesson: HanziHomeLesson;
 userId: string;
}) {
 if (lesson.courseId === "hanyu-jiaocheng") {
  throw new Error("Seed lesson is read-only");
 }

 const { data, error } = await supabase
  .from("hanzihome_courses")
  .select("id, user_id")
  .eq("id", lesson.courseId)
  .maybeSingle();

 if (error) {
  throw new Error("Could not check course owner");
 }

 const course = courseOwnerSchema.nullable().parse(data);

 if (!course || course.user_id !== userId) {
  throw new Error("Lesson is not editable by this user");
 }
}

function vocabDetailRows({
 itemId,
 lessonId,
 ownerId,
 source,
 sections,
 now,
}: {
 itemId: string;
 lessonId: string;
 ownerId: string;
 source: string;
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
   id: `${itemId}-section-${key}`,
   vocab_item_id: itemId,
   lesson_id: lessonId,
   owner_id: ownerId,
   source,
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
 pointId,
 lessonId,
 ownerId,
 source,
 item,
 now,
}: {
 pointId: string;
 lessonId: string;
 ownerId: string;
 source: string;
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
   id: `${pointId}-section-${key}`,
   grammar_point_id: pointId,
   lesson_id: lessonId,
   owner_id: ownerId,
   source,
   section_key: key,
   title,
   lines: compactLines(text),
   section_order: index + 1,
   imported_at: now,
   updated_at: now,
  }))
  .filter((row) => row.lines.length > 0);
}

async function replaceDbLessonContent({
 supabase,
 lesson,
 content,
 userId,
}: {
 supabase: SupabaseClient;
 lesson: HanziHomeLesson;
 content: LessonDraftContent;
 userId: string;
}) {
 const now = nowIso();
 const source = "custom";
 const courseId = lesson.courseId;
 const bookId = lesson.bookId;

 if (!courseId || !bookId) {
  throw new Error("Missing lesson course/book");
 }

 const vocabItems = content.vocab.map((item) => vocabDraftItemSchema.parse(item));
 const grammarItems = content.grammarPoints.map((item) =>
  grammarDraftItemSchema.parse(item),
 );

 const metadata = content.lesson;
 const notes = metadata.notes;

 const { error: lessonUpdateError } = await supabase
  .from("hanzihome_lessons")
  .update({
   title_zh: metadata.titleZh,
   title_vi: metadata.titleVi || null,
   lesson_number: metadata.lessonNumber ?? lesson.lessonNumber,
   lesson_order:
    metadata.lessonOrder ?? metadata.lessonNumber ?? lesson.lessonOrder,
   updated_at: now,
  })
  .eq("id", lesson.id);

 if (lessonUpdateError) {
  throw new Error(`Could not update lesson metadata: ${lessonUpdateError.message}`);
 }

 if (notes) {
  const noteRows = [
   ["main", "Tổng quan", notes.overviewMarkdown],
   ["grammar-summary", "Tổng hợp ngữ pháp", notes.grammarSummary],
   ["vocabulary", "Từ vựng", notes.vocabularyText],
   ["proper-nouns", "Tên riêng", notes.properNounsText],
   ["application", "Bài đọc áp dụng", notes.applicationMarkdown],
   ["personal-note", "Ghi chú riêng", notes.personalNote],
  ]
   .filter(([, , contentText]) => String(contentText ?? "").trim())
   .map(([key, title, contentText]) => ({
    id: `${lesson.id}-text-${key}`,
    lesson_id: lesson.id,
    owner_id: userId,
    source,
    text_key: key,
    title,
    content: contentText,
    content_format: "markdown",
    imported_at: now,
    updated_at: now,
   }));

  await supabase.from("hanzihome_lesson_texts").delete().eq("lesson_id", lesson.id);

  if (noteRows.length > 0) {
   const { error } = await supabase.from("hanzihome_lesson_texts").insert(noteRows);

   if (error) {
    throw new Error(`Could not save lesson texts: ${error.message}`);
   }
  }
 }

 const oldVocabIds = lesson.vocab.map((item) => item.id);
 const oldGrammarIds = lesson.grammar.map((item) => item.id);

 if (oldVocabIds.length > 0) {
  await supabase
   .from("hanzihome_vocab_examples")
   .delete()
   .in("vocab_item_id", oldVocabIds);
  await supabase
   .from("hanzihome_vocab_detail_sections")
   .delete()
   .in("vocab_item_id", oldVocabIds);
  await supabase.from("hanzihome_vocab_items").delete().in("id", oldVocabIds);
 }

 if (oldGrammarIds.length > 0) {
  await supabase
   .from("hanzihome_grammar_examples")
   .delete()
   .in("grammar_point_id", oldGrammarIds);
  await supabase
   .from("hanzihome_grammar_detail_sections")
   .delete()
   .in("grammar_point_id", oldGrammarIds);
  await supabase.from("hanzihome_grammar_points").delete().in("id", oldGrammarIds);
 }

 const vocabRows: InsertRow[] = [];
 const vocabExampleRows: InsertRow[] = [];
 const vocabSectionRows: InsertRow[] = [];

 vocabItems.forEach((item, itemIndex) => {
  const pos = splitPartOfSpeech(item.partOfSpeech);

  vocabRows.push({
   id: item.id,
   lesson_id: lesson.id,
   course_id: courseId,
   book_id: bookId,
   owner_id: userId,
   source,
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
   source_file: lesson.sourceFile ?? null,
   imported_at: now,
   updated_at: now,
  });

  item.examples.forEach((example, exampleIndex) => {
   vocabExampleRows.push({
    id: `${item.id}-example-${exampleIndex + 1}`,
    vocab_item_id: item.id,
    lesson_id: lesson.id,
    owner_id: userId,
    source,
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
    itemId: item.id,
    lessonId: lesson.id,
    ownerId: userId,
    source,
    sections: item.sections,
    now,
   }),
  );
 });

 const grammarRows: InsertRow[] = [];
 const grammarExampleRows: InsertRow[] = [];
 const grammarSectionRows: InsertRow[] = [];

 grammarItems.forEach((item, itemIndex) => {
  grammarRows.push({
   id: item.id,
   lesson_id: lesson.id,
   course_id: courseId,
   book_id: bookId,
   owner_id: userId,
   source,
   point_order: itemIndex + 1,
   title: item.title,
   clean_title: item.title,
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
    id: `${item.id}-example-${exampleIndex + 1}`,
    grammar_point_id: item.id,
    lesson_id: lesson.id,
    owner_id: userId,
    source,
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
    pointId: item.id,
    lessonId: lesson.id,
    ownerId: userId,
    source,
    item,
    now,
   }),
  );
 });

 if (vocabRows.length > 0) {
  const { error } = await supabase.from("hanzihome_vocab_items").insert(vocabRows);
  if (error) throw new Error(`Could not save vocab items: ${error.message}`);
 }

 if (vocabExampleRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_vocab_examples")
   .insert(vocabExampleRows);
  if (error) throw new Error(`Could not save vocab examples: ${error.message}`);
 }

 if (vocabSectionRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_vocab_detail_sections")
   .insert(vocabSectionRows);
  if (error) throw new Error(`Could not save vocab detail sections: ${error.message}`);
 }

 if (grammarRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_grammar_points")
   .insert(grammarRows);
  if (error) throw new Error(`Could not save grammar points: ${error.message}`);
 }

 if (grammarExampleRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_grammar_examples")
   .insert(grammarExampleRows);
  if (error) throw new Error(`Could not save grammar examples: ${error.message}`);
 }

 if (grammarSectionRows.length > 0) {
  const { error } = await supabase
   .from("hanzihome_grammar_detail_sections")
   .insert(grammarSectionRows);
  if (error) {
   throw new Error(`Could not save grammar detail sections: ${error.message}`);
  }
 }
}

export async function GET(_request: Request, context: RouteContext) {
 const { draftId } = await context.params;
 const supabase = await createClient();

 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 if (isDbLessonId(draftId)) {
  const lesson = await getDbHanziHomeLessonDetail(draftId);

  if (!lesson) {
   return jsonError("Lesson not found", 404);
  }

  await assertCanEditDbLesson({ supabase, lesson, userId: user.id });

  return NextResponse.json({
   draft: dbLessonToVirtualDraft({ lesson, userId: user.id }),
  });
 }

 const { data, error } = await supabase
  .from("hanzihome_lesson_drafts")
  .select(draftSelect)
  .eq("id", draftId)
  .eq("user_id", user.id)
  .maybeSingle();

 if (error) {
  return jsonError("Could not load lesson draft", 500);
 }

 if (!data) {
  return jsonError("Lesson draft not found", 404);
 }

 return NextResponse.json({ draft: toLessonDraft(data) });
}

export async function PUT(request: Request, context: RouteContext) {
 const { draftId } = await context.params;
 const supabase = await createClient();

 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 const body: unknown = await request.json();
 const parsed = updateLessonDraftRequestSchema.safeParse(body);

 if (!parsed.success) {
  return NextResponse.json(
   {
    error: "Invalid lesson draft payload",
    issues: parsed.error.flatten(),
   },
   { status: 400 },
  );
 }

 if (isDbLessonId(draftId)) {
  const lesson = await getDbHanziHomeLessonDetail(draftId);

  if (!lesson) {
   return jsonError("Lesson not found", 404);
  }

  try {
   await assertCanEditDbLesson({ supabase, lesson, userId: user.id });

   const baseContent =
    parsed.data.content ??
    dbLessonToVirtualDraft({ lesson, userId: user.id }).content;

   const content: LessonDraftContent = {
    ...baseContent,
    lesson: {
     ...baseContent.lesson,
     lessonNumber:
      parsed.data.lessonNumber ??
      baseContent.lesson.lessonNumber ??
      lesson.lessonNumber,
     titleZh: parsed.data.titleZh ?? baseContent.lesson.titleZh,
     titleVi: parsed.data.titleVi ?? baseContent.lesson.titleVi,
     courseId: parsed.data.courseId ?? baseContent.lesson.courseId,
     courseTitle: parsed.data.courseTitle ?? baseContent.lesson.courseTitle,
     bookId: parsed.data.bookId ?? baseContent.lesson.bookId,
     bookTitle: parsed.data.bookTitle ?? baseContent.lesson.bookTitle,
     bookOrder: parsed.data.bookOrder ?? baseContent.lesson.bookOrder,
     lessonOrder:
      parsed.data.lessonOrder ??
      baseContent.lesson.lessonOrder ??
      parsed.data.lessonNumber ??
      lesson.lessonOrder,
    },
   };

   await replaceDbLessonContent({
    supabase,
    lesson,
    content,
    userId: user.id,
   });

   const updatedLesson = await getDbHanziHomeLessonDetail(draftId);

   if (!updatedLesson) {
    return jsonError("Lesson not found after update", 404);
   }

   return NextResponse.json({
    draft: dbLessonToVirtualDraft({
     lesson: updatedLesson,
     userId: user.id,
    }),
   });
  } catch (error) {
   return jsonError(
    error instanceof Error ? error.message : "Could not update DB lesson",
    500,
   );
  }
 }

 const patch: {
  lesson_key?: string;
  status?: "draft" | "published" | "archived";
  title_zh?: string;
  title_vi?: string | null;
  lesson_number?: number;
  content?: unknown;
  updated_at: string;
 } = {
  updated_at: nowIso(),
 };

 if (parsed.data.lessonNumber !== undefined) {
  patch.lesson_number = parsed.data.lessonNumber;
 }

 if (parsed.data.titleZh !== undefined) {
  patch.title_zh = parsed.data.titleZh;
 }

 if (parsed.data.titleVi !== undefined) {
  patch.title_vi = parsed.data.titleVi || null;
 }

 if (parsed.data.status !== undefined) {
  patch.status = parsed.data.status;
 }

 if (parsed.data.lessonKey !== undefined) {
  patch.lesson_key = parsed.data.lessonKey;
 }

 if (parsed.data.content !== undefined) {
  patch.content = parsed.data.content;
 }

 const { data, error } = await supabase
  .from("hanzihome_lesson_drafts")
  .update(patch)
  .eq("id", draftId)
  .eq("user_id", user.id)
  .select(draftSelect)
  .maybeSingle();

 if (error) {
  if (isPostgresUniqueViolation(error)) {
   return jsonError("Lesson draft already exists", 409);
  }

  return jsonError("Could not update lesson draft", 500);
 }

 if (!data) {
  return jsonError("Lesson draft not found", 404);
 }

 return NextResponse.json({ draft: toLessonDraft(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
 const { draftId } = await context.params;
 const supabase = await createClient();

 const {
  data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
  return jsonError("Unauthorized", 401);
 }

 if (isDbLessonId(draftId)) {
  return jsonError("Cannot delete DB lesson through draft editor", 405);
 }

 const { error } = await supabase
  .from("hanzihome_lesson_drafts")
  .delete()
  .eq("id", draftId)
  .eq("user_id", user.id);

 if (error) {
  return jsonError("Could not delete lesson draft", 500);
 }

 return NextResponse.json({ ok: true });
}
