import type {
  StaticLessonData,
  StaticVocabData,
  VocabExample,
  VocabViewModel,
} from "@/features/hanzihome/types";

type VocabCategory = {
  nameVi: string;
  words: string[];
};

function lines(value?: string[]) {
  return (value || []).map((item) => item.trim()).filter(Boolean);
}

function getVocabCategories(lesson: StaticLessonData): VocabCategory[] {
  return lesson.vocabCategories;
}

function categoryForWord(lesson: StaticLessonData, word: string) {
  const categories = getVocabCategories(lesson);

  return (
    categories.find((category: VocabCategory) =>
      category.words.includes(word),
    )?.nameVi || "Từ vựng"
  );
}

export function parseVocabExamples(rawLines?: string[]): VocabExample[] {
  const source = lines(rawLines);
  const examples: VocabExample[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const line = source[index];
    if (!line?.startsWith("中文:")) continue;

    examples.push({
      zh: line.replace(/^中文:\s*/, ""),
      pinyin: source[index + 1]?.replace(/^Pinyin:\s*/i, ""),
      vi: source[index + 2]?.replace(/^Dịch:\s*/i, ""),
      note: source[index + 3]?.replace(/^Phân tích:\s*/i, ""),
    });
  }

  return examples;
}

export function buildVocabViewModel(
  entry: StaticVocabData,
  lesson: StaticLessonData,
): VocabViewModel {
  const raw = entry.rawSections || {};
  const detailSections = [
    { key: "meaning", title: "Nghĩa", lines: lines(raw.meaningBlock) },
    {
      key: "etymology",
      title: "Chiết tự / logic",
      lines: lines(raw.etymologyBlock || entry.etymology),
    },
    {
      key: "comparisons",
      title: "So sánh",
      lines: lines(raw.comparisonBlock || entry.comparisons),
    },
    {
      key: "collocations",
      title: "Kết hợp thường gặp",
      lines: lines(raw.collocationsBlock || entry.collocations),
    },
    {
      key: "culture",
      title: "Văn hóa",
      lines: lines(raw.cultureBlock || entry.culture),
    },
    {
      key: "notes",
      title: "Lưu ý lỗi sai",
      lines: lines(raw.notesBlock || entry.notes),
    },
  ].filter((section) => section.lines.length > 0);

  return {
    ...entry,
    level: entry.level ?? undefined,
    pos: entry.pos ?? undefined,
    category: categoryForWord(lesson, entry.word),
    examplesParsed: parseVocabExamples(raw.examplesBlock || entry.examples),
    detailSections,
  };
}
