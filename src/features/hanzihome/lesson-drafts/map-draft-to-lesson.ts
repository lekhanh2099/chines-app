import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import {
  DEFAULT_HANYU_BOOK_ID,
  DEFAULT_HANYU_COURSE_ID,
} from "@/features/hanzihome/courses/course-catalog";
import { grammarDraftItemSchema } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import { vocabDraftItemSchema } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import type {
  GrammarViewModel,
  HanziHomeLesson,
  VocabViewModel,
} from "@/features/hanzihome/types";

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanHeading(value: string) {
  return value
    .replace(/^#+\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .trim();
}

function markdownToDetailSections(rawMarkdown: string) {
  const lines = rawMarkdown.replace(/\r\n/g, "\n").split("\n");
  const sections: Array<{ key: string; title: string; lines: string[] }> = [];
  let current: { key: string; title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)$/);

    if (headingMatch) {
      if (current && current.lines.length > 0) {
        sections.push(current);
      }

      const title = cleanHeading(headingMatch[1] || "Chi tiết");
      current = {
        key: title
          .toLocaleLowerCase("vi-VN")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "detail",
        title,
        lines: [],
      };
      continue;
    }

    if (current) {
      const cleaned = line.trim();
      if (cleaned && cleaned !== "---") {
        current.lines.push(cleaned);
      }
    }
  }

  if (current && current.lines.length > 0) {
    sections.push(current);
  }

  return sections;
}

function mapDraftVocabItem(value: unknown, lessonId: string): VocabViewModel | null {
  const parsed = vocabDraftItemSchema.safeParse(value);

  if (!parsed.success) return null;

  const item = parsed.data;

  return {
    id: item.id,
    lessonId,
    word: item.word,
    pinyin: item.pinyin,
    hanViet: item.hanViet,
    meaning: item.meaning,
    category: item.category,
    level: item.level,
    pos: {
      vi: item.partOfSpeech,
    },
    examplesParsed: item.examples.map((example) => ({
      zh: example.chinese,
      pinyin: example.pinyin,
      vi: example.translation,
      note: example.note,
    })),
    detailSections: [
      {
        key: "meaning",
        title: "Nghĩa",
        lines: toLines(item.sections.meaning),
      },
      {
        key: "etymology",
        title: "Chiết tự / logic",
        lines: toLines(item.sections.characterLogic),
      },
      {
        key: "comparisons",
        title: "So sánh",
        lines: toLines(item.sections.comparison),
      },
      {
        key: "collocations",
        title: "Kết hợp thường gặp",
        lines: item.collocations.map((collocation) =>
          [collocation.phrase, collocation.meaning].filter(Boolean).join(" – "),
        ),
      },
      {
        key: "culture",
        title: "Văn hóa",
        lines: toLines(item.sections.culture),
      },
      {
        key: "notes",
        title: "Lưu ý",
        lines: toLines(item.sections.warning),
      },
    ].filter((section) => section.lines.length > 0),
  };
}

function mapDraftGrammarItem(value: unknown): GrammarViewModel | null {
  const parsed = grammarDraftItemSchema.safeParse(value);

  if (!parsed.success) return null;

  const item = parsed.data;
  const detailSections = markdownToDetailSections(item.rawMarkdown);
  const hasStructuredSections = detailSections.length > 0;
  const contentMd = hasStructuredSections || item.rawMarkdown.includes("### grammar.")
    ? ""
    : item.rawMarkdown;

  return {
    id: item.id,
    title: item.title,
    cleanTitle: item.title,
    core: item.coreLogic || item.shortMeaning,
    structuresView: item.formulas,
    examplesParsed: item.examples.map((example) => ({
      zh: example.chinese,
      pinyin: example.pinyin,
      vi: example.translation,
      note: example.note,
    })),
    notes: [
      ...toLines(item.comparisons),
      ...toLines(item.pitfalls),
      ...toLines(item.cultureNotes),
      ...toLines(item.practice),
    ],
    detailSections,
    contentMd,
  };
}

function dedupeGrammarByTitle(items: GrammarViewModel[]) {
  const byTitle = new Map<string, GrammarViewModel>();

  items.forEach((item) => {
    byTitle.set(item.cleanTitle.trim().toLocaleLowerCase("vi-VN"), item);
  });

  return Array.from(byTitle.values());
}

export function mapLessonDraftToHanziHomeLesson(
  draft: LessonDraft,
): HanziHomeLesson {
  const lessonId = draft.lessonKey || `draft-${draft.id}`;
  const vocab = draft.content.vocab
    .map((item) => mapDraftVocabItem(item, lessonId))
    .filter((item): item is VocabViewModel => Boolean(item));

  const grammar = dedupeGrammarByTitle(draft.content.grammarPoints
    .map(mapDraftGrammarItem)
    .filter((item): item is GrammarViewModel => Boolean(item)));

  return {
    id: lessonId,
    lessonNumber: draft.lessonNumber ?? 9999,
    titleZh: draft.titleZh,
    title: `Bài ${draft.lessonNumber ?? "?"}: ${draft.titleZh}`,
    sourceFile: "Bài nháp",
    courseId: draft.content.lesson.courseId || DEFAULT_HANYU_COURSE_ID,
    courseTitle: draft.content.lesson.courseTitle || "Giáo trình Hán ngữ",
    bookId: draft.content.lesson.bookId || DEFAULT_HANYU_BOOK_ID,
    bookTitle: draft.content.lesson.bookTitle || "Giáo trình Hán ngữ 2",
    bookOrder: draft.content.lesson.bookOrder ?? 2,
    lessonOrder:
      draft.content.lesson.lessonOrder ?? draft.lessonNumber ?? 9999,
    vocabCategories: [],
    vocabCount: vocab.length,
    vocabIds: vocab.map((item) => item.id),
    grammarPointIds: grammar.map((item) => item.id),
    vocab,
    grammar,
    isDraft: true,
    draftId: draft.id,
    status: draft.status,
    notes: draft.content.lesson.notes,
  };
}
