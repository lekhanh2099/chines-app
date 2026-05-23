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

type GrammarBlock = {
  title: string;
  body: string;
  application: boolean;
};

type Subsection = {
  title: string;
  body: string;
};

function makeId(title: string, index: number) {
  return `draft-grammar-${slugifyText(title, "point")}-${index + 1}`;
}

function isApplicationHeading(title: string) {
  return /điển tích|ứng dụng|hàng ngày|story|câu chuyện|đọc thêm/i.test(title);
}

function isPhanHeading(line: string) {
  return /^##+\s+PHẦN\s+[IVXLC]+[:：]/i.test(line.trim());
}

function stripMarkdownHeading(line: string) {
  return cleanInlineMarkdown(
    line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^>\s*/, "")
      .trim(),
  );
}

function extractHeadingTitle(line: string) {
  return stripMarkdownHeading(line).replace(/^PHẦN\s+[IVXLC]+[:：]\s*/i, "");
}

function splitPhanBlocks(markdown: string): GrammarBlock[] {
  const lines = normalizeNewlines(markdown).split("\n");
  const blocks: GrammarBlock[] = [];

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
      currentLines = [];
      return;
    }

    if (currentTitle) currentLines.push(line);
  });

  pushCurrent();

  return blocks;
}

function splitOutlineBlocks(markdown: string): GrammarBlock[] {
  const lines = normalizeNewlines(markdown).split("\n");
  const blocks: GrammarBlock[] = [];

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

    if (
      match?.[1] &&
      title &&
      !/^ví dụ|lưu ý|công dụng|cấu trúc|công thức/i.test(title)
    ) {
      pushCurrent();
      currentTitle = title;
      currentLines = [];
      return;
    }

    if (currentTitle) currentLines.push(line);
  });

  pushCurrent();

  return blocks;
}

function splitSubsections(body: string): Subsection[] {
  const lines = normalizeNewlines(body).split("\n");
  const sections: Subsection[] = [];

  let currentTitle = "";
  let currentLines: string[] = [];

  const pushCurrent = () => {
    if (!currentTitle) return;

    sections.push({
      title: currentTitle,
      body: currentLines.join("\n").trim(),
    });
  };

  lines.forEach((line) => {
    const match = line.trim().match(/^#{3,6}\s+(.+)$/);

    if (match?.[1]) {
      pushCurrent();
      currentTitle = cleanInlineMarkdown(match[1]);
      currentLines = [];
      return;
    }

    if (currentTitle) currentLines.push(line);
  });

  pushCurrent();

  return sections;
}

function cleanBodyText(value: string) {
  return normalizeNewlines(value)
    .split("\n")
    .map((line) =>
      cleanInlineMarkdown(
        line
          .replace(/^[-*]\s+/, "")
          .replace(/^>\s*/, "")
          .replace(/^#{1,6}\s+/, "")
          .trim(),
      ),
    )
    .filter(Boolean)
    .join("\n")
    .trim();
}

function getSubsectionText(body: string, keywords: RegExp) {
  const sections = splitSubsections(body).filter((section) =>
    keywords.test(section.title),
  );

  if (sections.length > 0) {
    return sections.map((section) => cleanBodyText(section.body)).join("\n\n");
  }

  return "";
}

function extractCoreLogic(body: string) {
  const sectionText = getSubsectionText(
    body,
    /bản chất|cốt lõi|logic|công dụng|công thức/i,
  );

  const source = sectionText || body;

  const candidates = normalizeNewlines(source)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#{1,6}\s+/.test(line))
    .filter((line) => !/^>\s*/.test(line))
    .filter((line) => !/^\*\*?công thức/i.test(line))
    .filter((line) => !/^công thức/i.test(line))
    .filter((line) => !/^cấu trúc/i.test(line))
    .filter((line) => !/^[-*]\s*\*/.test(line))
    .filter((line) => !(hasHan(line) && /[。！？]/.test(line)))
    .map(cleanLine)
    .filter(Boolean);

  return candidates[0] ?? "";
}

function extractFormulas(body: string) {
  const formulas: string[] = [];

  toNonEmptyLines(body).forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith(">")) {
      const formula = cleanInlineMarkdown(trimmed.replace(/^>\s*/, ""));

      if (formula && (hasHan(formula) || /[+……]/.test(formula))) {
        formulas.push(formula);
      }

      return;
    }

    const structureMatch = cleanLine(trimmed).match(
      /^(?:công thức|cấu trúc)(?:\s+chuẩn)?[:：]\s*(.+)$/i,
    );

    if (structureMatch?.[1]) {
      const formula = cleanInlineMarkdown(structureMatch[1]);

      if (formula && (hasHan(formula) || /[+……]/.test(formula))) {
        formulas.push(formula);
      }
    }
  });

  return Array.from(new Set(formulas)).filter(Boolean);
}

function extractExamples(body: string): GrammarDraftExample[] {
  const examples: GrammarDraftExample[] = [];

  toNonEmptyLines(body).forEach((line) => {
    const raw = line.trim();

    const italicExample = raw.match(
      /[*_]+([^*_]*[\p{Script=Han}][^*_]*[。！？])[*_]+\s*[（(]([^）)]+)[）)]/u,
    );

    if (italicExample?.[1]) {
      examples.push({
        chinese: cleanInlineMarkdown(italicExample[1]),
        pinyin: "",
        translation: cleanInlineMarkdown(italicExample[2] ?? ""),
        note: "",
      });

      return;
    }

    const clean = cleanLine(raw);
    const plainExample = clean.match(
      /^([^。！？]*[\p{Script=Han}][^。！？]*[。！？])\s*[（(]([^）)]+)[）)]/u,
    );

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

function parsePattern(title: string, body: string) {
  const fromTitle = title.match(/[\p{Script=Han}……（）()、/+]+/u)?.[0] ?? "";

  if (fromTitle) return fromTitle;

  const formula = extractFormulas(body).find((item) => hasHan(item));

  return formula ?? "";
}

function parseGrammarBlock(block: GrammarBlock, index: number): GrammarDraftItem {
  const title = cleanInlineMarkdown(block.title);
  const formulas = extractFormulas(block.body);
  const coreLogic = extractCoreLogic(block.body);

  return {
    id: makeId(title, index),
    title,
    pattern: parsePattern(title, block.body),
    shortMeaning: coreLogic,
    coreLogic,
    formulas,
    examples: extractExamples(block.body),
    comparisons: getSubsectionText(
      block.body,
      /so sánh|phân biệt|dễ nhầm|khác/i,
    ),
    pitfalls: getSubsectionText(
      block.body,
      /bẫy|lỗi sai|điểm mù|não việt|lưu ý/i,
    ),
    practice: getSubsectionText(block.body, /luyện tập|practice|bài tập/i),
    cultureNotes: getSubsectionText(
      block.body,
      /đời sống|tình huống|douyin|hài hước|ứng dụng|văn hóa/i,
    ),
    rawMarkdown: block.body,
    confidence: 0.78,
  };
}

function extractVocabText(markdown: string) {
  const vocabMatch = markdown.match(
    /Từ vựng[:：]\s*([\s\S]*?)(?:\nTên riêng[:：]|\n##|\n#|$)/i,
  );

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

  lessonNotes.overviewMarkdown =
    normalizeNewlines(markdown).split(/\n##+\s+PHẦN\s+[IVXLC]+[:：]/i)[0]?.trim() ??
    "";

  lessonNotes.grammarSummary = grammarBlocks
    .map((block, index) => `${index + 1}. ${block.title}`)
    .join("\n");

  const grammarPoints = grammarBlocks.map(parseGrammarBlock);

  return {
    grammarPoints,
    lessonNotes,
    warnings: [],
    mode:
      grammarPoints.length > 0 && applicationBlocks.length > 0
        ? "lesson_mixed"
        : grammarPoints.length > 0
          ? "grammar_batch"
          : "none",
  };
}
