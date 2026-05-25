import type { LessonDraftContent } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import type {
  GrammarDraftItem,
  LessonDraftNotes,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import type { VocabDraftItem } from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";
import type {
  GrammarViewModel,
  HanziHomeLesson,
  VocabExample,
  VocabViewModel,
} from "@/features/hanzihome/types";

const emptyNotes: LessonDraftNotes = {
  overviewMarkdown: "",
  grammarSummary: "",
  vocabularyText: "",
  properNounsText: "",
  applicationMarkdown: "",
  personalNote: "",
};

function joinLines(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean).join("\n");
}

function joinExamples(examples: VocabExample[]) {
  return examples
    .map((example) =>
      [example.zh, example.pinyin, example.vi, example.note]
        .map((line) => line?.trim())
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n\n");
}

function findSectionText(
  sections: Array<{ key: string; title: string; lines: string[] }>,
  keys: string[],
) {
  const normalizedKeys = new Set(keys);
  const section = sections.find((item) => normalizedKeys.has(item.key));

  return section ? joinLines(section.lines) : "";
}

function buildRawVocabMarkdown(item: VocabViewModel) {
  const sections = item.detailSections
    .map((section) => {
      const body = joinLines(section.lines);

      return body ? `## ${section.title}\n${body}` : "";
    })
    .filter(Boolean);
  const examples = joinExamples(item.examplesParsed);

  return [
    `# ${item.word}`,
    item.pinyin,
    item.hanViet,
    item.meaning,
    ...sections,
    examples ? `## Ví dụ\n${examples}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildRawGrammarMarkdown(item: GrammarViewModel) {
  const sections = item.detailSections
    ?.map((section) => {
      const body = joinLines(section.lines);

      return body ? `## ${section.title}\n${body}` : "";
    })
    .filter(Boolean);
  const examples = joinExamples(item.examplesParsed);

  return [
    `# ${item.cleanTitle || item.title || "Ngữ pháp"}`,
    item.contentMd,
    item.core,
    item.structuresView.length > 0
      ? `## Công thức\n${item.structuresView.join("\n")}`
      : "",
    sections?.join("\n\n"),
    examples ? `## Ví dụ\n${examples}` : "",
    item.notes.length > 0 ? `## Lưu ý\n${item.notes.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function toDraftExample(example: VocabExample) {
  return {
    chinese: example.zh,
    pinyin: example.pinyin ?? "",
    translation: example.vi ?? "",
    note: example.note ?? "",
  };
}

function toDraftVocabItem(item: VocabViewModel): VocabDraftItem {
  const collocationLines = item.detailSections.find(
    (section) => section.key === "collocations",
  )?.lines;

  return {
    id: `seed-copy-${item.id}`,
    word: item.word,
    pinyin: item.pinyin,
    hanViet: item.hanViet,
    meaning: item.meaning,
    partOfSpeech: item.pos?.vi || item.pos?.zh || "",
    level: item.level ?? "",
    category: item.category,
    sections: {
      meaning:
        findSectionText(item.detailSections, ["meaning"]) || item.meaning,
      characterLogic: findSectionText(item.detailSections, [
        "etymology",
        "logic",
        "characterLogic",
      ]),
      comparison: findSectionText(item.detailSections, [
        "comparisons",
        "comparison",
      ]),
      culture: findSectionText(item.detailSections, ["culture"]),
      warning: findSectionText(item.detailSections, [
        "notes",
        "warning",
        "mistakes",
      ]),
    },
    collocations:
      collocationLines?.map((line) => ({
        phrase: line,
        meaning: "",
      })) ?? [],
    examples: item.examplesParsed.map(toDraftExample),
    rawMarkdown: buildRawVocabMarkdown(item),
  };
}

function toDraftGrammarItem(item: GrammarViewModel): GrammarDraftItem {
  return {
    id: `seed-copy-${item.id}`,
    title: item.cleanTitle || item.title || "Ngữ pháp",
    pattern: item.structuresView[0] ?? "",
    shortMeaning: item.core,
    coreLogic: item.contentMd || item.core,
    formulas: item.structuresView,
    examples: item.examplesParsed.map(toDraftExample),
    comparisons: findSectionText(item.detailSections ?? [], [
      "comparisons",
      "comparison",
    ]),
    pitfalls: [
      findSectionText(item.detailSections ?? [], ["notes", "warning", "traps"]),
      joinLines(item.notes),
    ]
      .filter(Boolean)
      .join("\n"),
    practice: findSectionText(item.detailSections ?? [], ["practice"]),
    cultureNotes: findSectionText(item.detailSections ?? [], ["culture"]),
    rawMarkdown: buildRawGrammarMarkdown(item),
    confidence: 1,
  };
}

function toDraftNotes(lesson: HanziHomeLesson): LessonDraftNotes {
  return {
    ...emptyNotes,
    overviewMarkdown: lesson.notes?.overviewMarkdown ?? "",
    grammarSummary: lesson.notes?.grammarSummary ?? "",
    vocabularyText: lesson.notes?.vocabularyText ?? "",
    properNounsText: lesson.notes?.properNounsText ?? "",
    applicationMarkdown: lesson.notes?.applicationMarkdown ?? "",
    personalNote: lesson.notes?.personalNote ?? "",
  };
}

export function seedLessonDetailToLessonDraftContent({
  lesson,
  lessonKey,
}: {
  lesson: HanziHomeLesson;
  lessonKey: string;
}): LessonDraftContent {
  const vocab = lesson.vocab.map(toDraftVocabItem);
  const grammarPoints = lesson.grammar.map(toDraftGrammarItem);

  return {
    lesson: {
      id: lessonKey,
      lessonNumber: lesson.lessonNumber,
      titleZh: lesson.titleZh,
      titleVi: lesson.title,
      courseId: lesson.courseId,
      courseTitle: lesson.courseTitle,
      bookId: lesson.bookId,
      bookTitle: lesson.bookTitle,
      bookOrder: lesson.bookOrder,
      lessonOrder: lesson.lessonOrder,
      vocabIds: vocab.map((item) => item.id),
      grammarPointIds: grammarPoints.map((item) => item.id),
      notes: toDraftNotes(lesson),
    },
    vocab,
    grammarPoints,
    flashcards: [],
  };
}
