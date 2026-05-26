import { NextResponse } from "next/server";

import {
  DEFAULT_HANYU_BOOK_ID,
  DEFAULT_HANYU_COURSE_ID,
} from "@/features/hanzihome/courses/course-catalog";
import {
  toLessonDraft,
  type LessonDraft,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { grammarDraftItemSchema } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import { vocabDraftItemSchema } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    draftId: string;
  }>;
};

type PublishMeta = {
  lessonId: string;
  courseId: string;
  bookId: string;
  ownerId: string;
  now: string;
  source: "seed" | "custom";
};

const draftSelect =
  "id, user_id, lesson_key, status, title_zh, title_vi, lesson_number, content, created_at, updated_at";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function nullableText(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sectionKey(value: string, index: number) {
  const key =
    value
      .trim()
      .toLocaleLowerCase("vi-VN")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `section-${index + 1}`;

  return key;
}

function buildLessonTextRows(draft: LessonDraft, meta: PublishMeta) {
  const notes = draft.content.lesson.notes;

  if (!notes) return [];

  const textEntries = [
    {
      key: "main",
      title: "Tổng quan",
      content: notes.overviewMarkdown,
    },
    {
      key: "application",
      title: "Ứng dụng",
      content: notes.applicationMarkdown,
    },
    {
      key: "grammar-summary",
      title: "Tổng kết ngữ pháp",
      content: notes.grammarSummary,
    },
    {
      key: "vocabulary",
      title: "Từ vựng",
      content: notes.vocabularyText,
    },
    {
      key: "proper-nouns",
      title: "Tên riêng",
      content: notes.properNounsText,
    },
    {
      key: "personal-note",
      title: "Ghi chú",
      content: notes.personalNote,
    },
  ];

  return textEntries
    .filter((entry) => entry.content.trim().length > 0)
    .map((entry) => ({
      id: `${meta.lessonId}-text-${entry.key}`,
      lesson_id: meta.lessonId,
      owner_id: meta.ownerId,
      source: meta.source,
      text_key: entry.key,
      title: entry.title,
      content: entry.content,
      content_format: "markdown",
      imported_at: meta.now,
      updated_at: meta.now,
    }));
}

function buildVocabRows(draft: LessonDraft, meta: PublishMeta) {
  const items = draft.content.vocab
    .map((value) => vocabDraftItemSchema.safeParse(value))
    .flatMap((result) => (result.success ? [result.data] : []));

  const vocabRows = items.map((item, index) => ({
    id: `${meta.lessonId}-vocab-${index + 1}`,
    lesson_id: meta.lessonId,
    course_id: meta.courseId,
    book_id: meta.bookId,
    owner_id: meta.ownerId,
    source: meta.source,
    item_order: index + 1,
    word: item.word,
    pinyin: item.pinyin,
    han_viet: item.hanViet,
    meaning: item.meaning,
    category: item.category,
    level: nullableText(item.level),
    pos_vi: nullableText(item.partOfSpeech),
    pos_zh: null,
    tone: null,
    source_file: "lesson-draft",
    imported_at: meta.now,
    updated_at: meta.now,
  }));

  const exampleRows = items.flatMap((item, itemIndex) => {
    const vocabItemId = `${meta.lessonId}-vocab-${itemIndex + 1}`;

    return item.examples.map((example, exampleIndex) => ({
      id: `${vocabItemId}-example-${exampleIndex + 1}`,
      vocab_item_id: vocabItemId,
      lesson_id: meta.lessonId,
      owner_id: meta.ownerId,
    source: meta.source,
      example_order: exampleIndex + 1,
      zh: example.chinese,
      pinyin: nullableText(example.pinyin),
      vi: nullableText(example.translation),
      note: nullableText(example.note),
      imported_at: meta.now,
      updated_at: meta.now,
    }));
  });

  const detailRows = items.flatMap((item, itemIndex) => {
    const vocabItemId = `${meta.lessonId}-vocab-${itemIndex + 1}`;
    const sections = [
      {
        key: "meaning",
        title: "Nghĩa",
        lines: lines(item.sections.meaning),
      },
      {
        key: "etymology",
        title: "Chiết tự / logic",
        lines: lines(item.sections.characterLogic),
      },
      {
        key: "comparisons",
        title: "So sánh",
        lines: lines(item.sections.comparison),
      },
      {
        key: "collocations",
        title: "Kết hợp thường gặp",
        lines: item.collocations
          .map((collocation) =>
            [collocation.phrase, collocation.meaning].filter(Boolean).join(" - "),
          )
          .filter(Boolean),
      },
      {
        key: "culture",
        title: "Văn hóa",
        lines: lines(item.sections.culture),
      },
      {
        key: "notes",
        title: "Lưu ý",
        lines: lines(item.sections.warning),
      },
    ].filter((section) => section.lines.length > 0);

    return sections.map((section, sectionIndex) => ({
      id: `${vocabItemId}-section-${section.key}`,
      vocab_item_id: vocabItemId,
      lesson_id: meta.lessonId,
      owner_id: meta.ownerId,
    source: meta.source,
      section_key: section.key,
      title: section.title,
      lines: section.lines,
      section_order: sectionIndex + 1,
      imported_at: meta.now,
      updated_at: meta.now,
    }));
  });

  return {
    vocabRows,
    exampleRows,
    detailRows,
  };
}

function buildGrammarRows(draft: LessonDraft, meta: PublishMeta) {
  const points = draft.content.grammarPoints
    .map((value) => grammarDraftItemSchema.safeParse(value))
    .flatMap((result) => (result.success ? [result.data] : []));

  const grammarRows = points.map((point, index) => ({
    id: `${meta.lessonId}-grammar-${index + 1}`,
    lesson_id: meta.lessonId,
    course_id: meta.courseId,
    book_id: meta.bookId,
    owner_id: meta.ownerId,
    source: meta.source,
    point_order: index + 1,
    title: point.title,
    clean_title: point.title,
    core: point.coreLogic || point.shortMeaning,
    content_md: nullableText(point.rawMarkdown),
    structures_view: point.formulas,
    notes: [
      ...lines(point.comparisons),
      ...lines(point.pitfalls),
      ...lines(point.cultureNotes),
      ...lines(point.practice),
    ],
    imported_at: meta.now,
    updated_at: meta.now,
  }));

  const exampleRows = points.flatMap((point, pointIndex) => {
    const grammarPointId = `${meta.lessonId}-grammar-${pointIndex + 1}`;

    return point.examples.map((example, exampleIndex) => ({
      id: `${grammarPointId}-example-${exampleIndex + 1}`,
      grammar_point_id: grammarPointId,
      lesson_id: meta.lessonId,
      owner_id: meta.ownerId,
    source: meta.source,
      example_order: exampleIndex + 1,
      zh: example.chinese,
      pinyin: nullableText(example.pinyin),
      vi: nullableText(example.translation),
      note: nullableText(example.note),
      imported_at: meta.now,
      updated_at: meta.now,
    }));
  });

  const detailRows = points.flatMap((point, pointIndex) => {
    const grammarPointId = `${meta.lessonId}-grammar-${pointIndex + 1}`;
    const sections = [
      {
        title: "Công thức",
        lines: point.formulas,
      },
      {
        title: "So sánh",
        lines: lines(point.comparisons),
      },
      {
        title: "Lưu ý lỗi sai",
        lines: lines(point.pitfalls),
      },
      {
        title: "Văn hóa",
        lines: lines(point.cultureNotes),
      },
      {
        title: "Luyện tập",
        lines: lines(point.practice),
      },
    ].filter((section) => section.lines.length > 0);

    return sections.map((section, sectionIndex) => {
      const key = sectionKey(section.title, sectionIndex);

      return {
        id: `${grammarPointId}-section-${key}`,
        grammar_point_id: grammarPointId,
        lesson_id: meta.lessonId,
        owner_id: meta.ownerId,
    source: meta.source,
        section_key: key,
        title: section.title,
        lines: section.lines,
        section_order: sectionIndex + 1,
        imported_at: meta.now,
        updated_at: meta.now,
      };
    });
  });

  return {
    grammarRows,
    exampleRows,
    detailRows,
  };
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

  if (draft.status === "archived") {
    return jsonError("Archived drafts cannot be published", 409);
  }

  const lessonId = draft.lessonKey.startsWith("seed-copy-")
    ? draft.lessonKey.replace(/^seed-copy-/, "")
    : draft.lessonKey || draft.content.lesson.id;
  const publishSource: PublishMeta["source"] = draft.lessonKey.startsWith("seed-copy-")
    ? "seed"
    : "custom";
  const courseId = draft.content.lesson.courseId || DEFAULT_HANYU_COURSE_ID;
  const bookId = draft.content.lesson.bookId || DEFAULT_HANYU_BOOK_ID;
  const lessonNumber =
    draft.lessonNumber ?? draft.content.lesson.lessonNumber ?? 9999;
  const lessonOrder = draft.content.lesson.lessonOrder ?? lessonNumber;
  const now = new Date().toISOString();
  const meta = {
    lessonId,
    courseId,
    bookId,
    ownerId: user.id,
    now,
    source: publishSource,
  };

  const lessonTextRows = buildLessonTextRows(draft, meta);
  const vocab = buildVocabRows(draft, meta);
  const grammar = buildGrammarRows(draft, meta);

  const lessonPatch = {
    id: lessonId,
    course_id: courseId,
    book_id: bookId,
    owner_id: user.id,
    source: publishSource,
    lesson_number: lessonNumber,
    lesson_order: lessonOrder,
    title_zh: draft.titleZh,
    title_vi: draft.titleVi ?? null,
    source_file: "lesson-draft",
    imported_at: now,
    updated_at: now,
  };

  const lessonMutation =
    publishSource === "seed"
      ? supabase.from("hanzihome_lessons").update(lessonPatch).eq("id", lessonId)
      : supabase.from("hanzihome_lessons").upsert(lessonPatch, {
          onConflict: "id",
        });

  const { error: lessonError } = await lessonMutation;

  if (lessonError) {
    const status = lessonError.code === "23505" ? 409 : 403;

    return jsonError("Could not publish lesson metadata", status);
  }

  if (publishSource === "seed") {
    const claimResults = await Promise.all([
      supabase
        .from("hanzihome_vocab_examples")
        .update({ owner_id: user.id, updated_at: now })
        .eq("lesson_id", lessonId)
        .eq("source", "seed"),
      supabase
        .from("hanzihome_vocab_detail_sections")
        .update({ owner_id: user.id, updated_at: now })
        .eq("lesson_id", lessonId)
        .eq("source", "seed"),
      supabase
        .from("hanzihome_grammar_examples")
        .update({ owner_id: user.id, updated_at: now })
        .eq("lesson_id", lessonId)
        .eq("source", "seed"),
      supabase
        .from("hanzihome_grammar_detail_sections")
        .update({ owner_id: user.id, updated_at: now })
        .eq("lesson_id", lessonId)
        .eq("source", "seed"),
      supabase
        .from("hanzihome_lesson_texts")
        .update({ owner_id: user.id, updated_at: now })
        .eq("lesson_id", lessonId)
        .eq("source", "seed"),
      supabase
        .from("hanzihome_vocab_items")
        .update({ owner_id: user.id, updated_at: now })
        .eq("lesson_id", lessonId)
        .eq("source", "seed"),
      supabase
        .from("hanzihome_grammar_points")
        .update({ owner_id: user.id, updated_at: now })
        .eq("lesson_id", lessonId)
        .eq("source", "seed"),
    ]);

    if (claimResults.some((result) => result.error)) {
      return jsonError("Could not claim existing seed lesson rows", 403);
    }
  }

  const deleteResults = await Promise.all([
    supabase
      .from("hanzihome_vocab_examples")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("source", publishSource)
      .eq("owner_id", user.id),
    supabase
      .from("hanzihome_vocab_detail_sections")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("source", publishSource)
      .eq("owner_id", user.id),
    supabase
      .from("hanzihome_grammar_examples")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("source", publishSource)
      .eq("owner_id", user.id),
    supabase
      .from("hanzihome_grammar_detail_sections")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("source", publishSource)
      .eq("owner_id", user.id),
    supabase
      .from("hanzihome_lesson_texts")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("source", publishSource)
      .eq("owner_id", user.id),
  ]);

  if (deleteResults.some((result) => result.error)) {
    return jsonError("Could not replace existing lesson child rows", 403);
  }

  const deleteItemResults = await Promise.all([
    supabase
      .from("hanzihome_vocab_items")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("source", publishSource)
      .eq("owner_id", user.id),
    supabase
      .from("hanzihome_grammar_points")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("source", publishSource)
      .eq("owner_id", user.id),
  ]);

  if (deleteItemResults.some((result) => result.error)) {
    return jsonError("Could not replace existing lesson items", 403);
  }

  const insertResults = await Promise.all([
    lessonTextRows.length > 0
      ? supabase.from("hanzihome_lesson_texts").insert(lessonTextRows)
      : Promise.resolve({ error: null }),
    vocab.vocabRows.length > 0
      ? supabase.from("hanzihome_vocab_items").insert(vocab.vocabRows)
      : Promise.resolve({ error: null }),
    grammar.grammarRows.length > 0
      ? supabase.from("hanzihome_grammar_points").insert(grammar.grammarRows)
      : Promise.resolve({ error: null }),
  ]);

  if (insertResults.some((result) => result.error)) {
    return jsonError("Could not publish lesson items", 403);
  }

  const insertChildResults = await Promise.all([
    vocab.exampleRows.length > 0
      ? supabase.from("hanzihome_vocab_examples").insert(vocab.exampleRows)
      : Promise.resolve({ error: null }),
    vocab.detailRows.length > 0
      ? supabase.from("hanzihome_vocab_detail_sections").insert(vocab.detailRows)
      : Promise.resolve({ error: null }),
    grammar.exampleRows.length > 0
      ? supabase.from("hanzihome_grammar_examples").insert(grammar.exampleRows)
      : Promise.resolve({ error: null }),
    grammar.detailRows.length > 0
      ? supabase
          .from("hanzihome_grammar_detail_sections")
          .insert(grammar.detailRows)
      : Promise.resolve({ error: null }),
  ]);

  if (insertChildResults.some((result) => result.error)) {
    return jsonError("Could not publish lesson detail rows", 403);
  }

  const { error: archiveError } = await supabase
    .from("hanzihome_lesson_drafts")
    .update({
      status: "archived",
      updated_at: now,
    })
    .eq("id", draft.id)
    .eq("user_id", user.id);

  if (archiveError) {
    return jsonError("Lesson published but draft could not be archived", 500);
  }

  return NextResponse.json({ lessonId });
}
