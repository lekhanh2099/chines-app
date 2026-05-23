import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { vocabDraftItemSchema } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import type {
  HanziHomeLesson,
  VocabViewModel,
} from "@/features/hanzihome/types";

function toLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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

export function mapLessonDraftToHanziHomeLesson(
  draft: LessonDraft,
): HanziHomeLesson {
  const lessonId = draft.lessonKey || `draft-${draft.id}`;
  const vocab = draft.content.vocab
    .map((item) => mapDraftVocabItem(item, lessonId))
    .filter((item): item is VocabViewModel => Boolean(item));

  return {
    id: lessonId,
    lessonNumber: draft.lessonNumber ?? 9999,
    titleZh: draft.titleZh,
    title: `Bài ${draft.lessonNumber ?? "?"}: ${draft.titleZh}`,
    sourceFile: "Supabase draft",
    vocabCategories: [],
    vocabCount: vocab.length,
    vocabIds: vocab.map((item) => item.id),
    grammarPointIds: draft.content.lesson.grammarPointIds,
    vocab,
    grammar: [],
    isDraft: true,
    draftId: draft.id,
    status: draft.status,
  };
}
