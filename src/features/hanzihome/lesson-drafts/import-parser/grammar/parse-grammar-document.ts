import {
  cleanInlineMarkdown,
  cleanLine,
  hasHan,
  normalizeNewlines,
  slugifyText,
  toNonEmptyLines,
} from "@/features/hanzihome/lesson-drafts/import-parser/clean-markdown";
import type { ParserWarning } from "@/features/hanzihome/lesson-drafts/import-parser/types";
import type {
  GrammarDraftExample,
  GrammarDraftItem,
  LessonDraftNotes,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import { createEmptyLessonDraftNotes } from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";

type GrammarParseResult = {
  grammarPoints: GrammarDraftItem[];
  lessonNotes: LessonDraftNotes;
  warnings: ParserWarning[];
  mode: "grammar_batch" | "lesson_mixed" | "none";
};

function makeId(title: string, index: number) {
  return `draft-grammar-${slugifyText(title, "point")}-${index + 1}`;
}

function isApplicationHeading(title: string) {
  return /điển tích|ứng dụng|hàng ngày|story|câu chuyện/i.test(title);
}

function isPhanHeading(line: string) {
  return /^##+\s+PHẦN\s+[IVXLC]+[:：]/i.test(line.trim());
}

function extractHeadingTitle(line: string) {
  return cleanInlineMarkdown(
    line
      .replace(/^##+\s+/, "")
      .replace(/^PHẦN\s+[IVXLC]+[:：]\s*/i, "")
      .trim(),
  );
}

function splitPhanBlocks(markdown: string) {
  const lines = normalizeNewlines(markdown).split("\n");
  const blocks: Array<{ title: string; body: string; application: boolean }> = [];

  let currentTitle = "";
  let currentLines: string[] = [];

  const pushCurrent = () => {
    if (!currentTitle) return;

    blocks.push({
      title: currentTitle,
      body: currentLines.join("\n").trim(),
      application: isApplicationHeading(currentTitle),
    });
  };

  lines.forEach((line) => {
    if (isPhanHeading(line)) {
      pushCurrent();
      currentTitle = extractHeadingTitle(line);
      currentLines = [line];
      return;
    }

    if (currentTitle) currentLines.push(line);
  });

  pushCurrent();

  return blocks;
}

function splitOutlineBlocks(markdown: string) {
  const lines = normalizeNewlines(markdown).split("\n");
  const blocks: Array<{ title: string; body: string; application: boolean }> = [];

  let currentTitle = "";
  let currentLines: string[] = [];

  const pushCurrent = () => {
    if (!currentTitle) return;

    blocks.push({
      title: currentTitle,
      body: currentLines.join("\n").trim(),
      application: isApplicationHeading(currentTitle),
    });
  };

  lines.forEach((line) => {
    const match = line.match(/^(\d+)\.\s+(.+)$/);
    const title = cleanInlineMarkdown(match?.[2] ?? "");

    if (match?.[1] && title && !/^ví dụ|lưu ý|công dụng|cấu trúc/i.test(title)) {
      pushCurrent();
      currentTitle = title;
      currentLines = [line];
      return;
    }

    if (currentTitle) currentLines.push(line);
  });

  pushCurrent();

  return blocks;
}

function extractCoreLogic(body: string) {
  const lines = toNonEmptyLines(body);
  const logicLine = lines.find((line) =>
    /logic cốt lõi|bản chất|công dụng/i.test(line),
  );

  return logicLine ? cleanLine(logicLine) : cleanLine(lines[1] ?? "");
}

function extractFormulas(body: string) {
  const lines = toNonEmptyLines(body);
  const formulas: string[] = [];

  lines.forEach((line) => {
    const clean = cleanLine(line);

    if (line.trim().startsWith(">")) {
      formulas.push(clean.replace(/^>\s*/, ""));
      return;
    }

    if (
      /công thức|cấu trúc/i.test(clean) &&
      /[:：]/.test(clean)
    ) {
      formulas.push(clean.replace(/^.*?[:：]\s*/, ""));
      return;
    }

    if (
      hasHan(clean) &&
      (/……|都|也|一边|先|然后|最后|再|又/.test(clean)) &&
      clean.length <= 80
    ) {
      formulas.push(clean);
    }
  });

  return Array.from(new Set(formulas)).filter(Boolean);
}

function extractExamples(body: string): GrammarDraftExample[] {
  const examples: GrammarDraftExample[] = [];

  toNonEmptyLines(body).forEach((line) => {
    const clean = cleanLine(line);

    const italicExample = clean.match(/\*([^*]*[\p{Script=Han}][^*]*)\*\s*[（(]([^）)]+)[）)]/u);
    if (italicExample?.[1]) {
      examples.push({
        chinese: cleanInlineMarkdown(italicExample[1]),
        pinyin: "",
        translation: cleanInlineMarkdown(italicExample[2] ?? ""),
        note: "",
      });

      return;
    }

    const plainExample = clean.match(/^([^。！？]*[\p{Script=Han}][^。！？]*[。！？])\s*[（(]([^）)]+)[）)]/u);
    if (plainExample?.[1]) {
      examples.push({
        chinese: cleanInlineMarkdown(plainExample[1]),
        pinyin: "",
        translation: cleanInlineMarkdown(plainExample[2] ?? ""),
        note: "",
      });
    }
  });

  return examples;
}

function extractSectionText(body: string, keywords: RegExp) {
  const lines = toNonEmptyLines(body);
  const matched = lines.filter((line) => keywords.test(line));

  return matched.map(cleanLine).join("\n");
}

function parsePattern(title: string, body: string) {
  if (hasHan(title)) return title.match(/[\p{Script=Han}……（）()、/]+/u)?.[0] ?? "";

  const formula = extractFormulas(body).find(hasHan);

  return formula ?? "";
}

function parseGrammarBlock(
  block: { title: string; body: string; application: boolean },
  index: number,
): GrammarDraftItem {
  const title = cleanInlineMarkdown(block.title);

  return {
    id: makeId(title, index),
    title,
    pattern: parsePattern(title, block.body),
    shortMeaning: extractCoreLogic(block.body),
    coreLogic: extractCoreLogic(block.body),
    formulas: extractFormulas(block.body),
    examples: extractExamples(block.body),
    comparisons: extractSectionText(block.body, /so sánh|phân biệt|vs|khác/i),
    pitfalls: extractSectionText(block.body, /bẫy|lỗi sai|điểm mù|não việt/i),
    practice: "",
    cultureNotes: extractSectionText(block.body, /đời sống|tình huống|douyin|hài hước/i),
    rawMarkdown: block.body,
    confidence: 0.72,
  };
}

function extractVocabText(markdown: string) {
  const vocabMatch = markdown.match(/Từ vựng[:：]\s*([\s\S]*?)(?:\nTên riêng[:：]|\n##|\n#|$)/i);
  return cleanInlineMarkdown(vocabMatch?.[1] ?? "");
}

function extractProperNounsText(markdown: string) {
  const properMatch = markdown.match(/Tên riêng[:：]\s*([\s\S]*?)(?:\n##|\n#|$)/i);
  return cleanInlineMarkdown(properMatch?.[1] ?? "");
}

export function parseGrammarDocument(markdown: string): GrammarParseResult {
  const phanBlocks = splitPhanBlocks(markdown);
  const blocks = phanBlocks.length > 0 ? phanBlocks : splitOutlineBlocks(markdown);

  const lessonNotes = createEmptyLessonDraftNotes();
  lessonNotes.vocabularyText = extractVocabText(markdown);
  lessonNotes.properNounsText = extractProperNounsText(markdown);

  const grammarBlocks = blocks.filter((block) => !block.application);
  const applicationBlocks = blocks.filter((block) => block.application);

  lessonNotes.applicationMarkdown = applicationBlocks
    .map((block) => block.body)
    .join("\n\n---\n\n")
    .trim();

  lessonNotes.overviewMarkdown = normalizeNewlines(markdown)
    .split(/\n##+\s+PHẦN\s+[IVXLC]+[:：]/i)[0]
    ?.trim() ?? "";

  lessonNotes.grammarSummary = grammarBlocks
    .map((block, index) => `${index + 1}. ${block.title}`)
    .join("\n");

  const grammarPoints = grammarBlocks.map(parseGrammarBlock);

  return {
    grammarPoints,
    lessonNotes,
    warnings: [],
    mode: grammarPoints.length > 0 && applicationBlocks.length > 0
      ? "lesson_mixed"
      : grammarPoints.length > 0
        ? "grammar_batch"
        : "none",
  };
}
