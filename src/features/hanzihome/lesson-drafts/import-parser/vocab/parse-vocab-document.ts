import {
  cleanInlineMarkdown,
  cleanLine,
  hasHan,
  normalizeNewlines,
  slugifyText,
} from "@/features/hanzihome/lesson-drafts/import-parser/clean-markdown";
import type { ParserWarning } from "@/features/hanzihome/lesson-drafts/import-parser/types";
import type {
  VocabDraftCollocation,
  VocabDraftExample,
  VocabDraftItem,
} from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";

type VocabParseResult = {
  items: VocabDraftItem[];
  warnings: ParserWarning[];
  mode: "full_vocab" | "quick_glossary" | "none";
};

type MarkdownSection = {
  key: string;
  title: string;
  body: string;
};

function makeId(word: string, index: number) {
  return `draft-vocab-${slugifyText(word, "item")}-${index + 1}`;
}

function getHeadingText(line: string) {
  const trimmed = line.trim();

  const hashHeading = trimmed.match(/^##+\s+(.+)$/);
  if (hashHeading?.[1]) return cleanInlineMarkdown(hashHeading[1]);

  const boldHeading = trimmed.match(/^\*\*([^*]+)\*\*\s*$/);
  if (boldHeading?.[1]) return cleanInlineMarkdown(boldHeading[1]);

  const boldColon = trimmed.match(/^\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/);
  if (boldColon?.[1] && boldColon?.[2]) {
    return `${cleanInlineMarkdown(boldColon[1])}: ${cleanInlineMarkdown(boldColon[2])}`;
  }

  return null;
}

function isFullVocabTitle(text: string) {
  const clean = cleanInlineMarkdown(text);

  return hasHan(clean) && /\s+[–—-]\s+/.test(clean);
}

function isQuickGlossaryLine(line: string) {
  return /^(?:[-*]\s*|\d+\.\s*)?\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/.test(
    line.trim(),
  );
}

function splitFullVocabBlocks(markdown: string) {
  const lines = normalizeNewlines(markdown).split("\n");
  const blocks: string[] = [];

  let current: string[] = [];

  lines.forEach((line) => {
    const headingText = getHeadingText(line);
    const startsNewBlock = headingText ? isFullVocabTitle(headingText) : false;

    if (startsNewBlock) {
      if (current.length > 0) blocks.push(current.join("\n").trim());
      current = [line];
      return;
    }

    if (current.length > 0) current.push(line);
  });

  if (current.length > 0) blocks.push(current.join("\n").trim());

  return blocks.filter(Boolean);
}

function parseTitle(block: string) {
  const firstLine = block.split("\n")[0] ?? "";
  const heading = getHeadingText(firstLine) ?? cleanInlineMarkdown(firstLine);
  const parts = heading
    .split(/\s+[–—-]\s+/)
    .map(cleanInlineMarkdown)
    .filter(Boolean);

  return {
    word: parts[0] ?? "",
    pinyin: parts[1] ?? "",
    hanViet: parts[2] ?? "",
    meaning: parts.slice(3).join(" – "),
  };
}



function isVocabSectionHeading(key: string, title: string) {
  const normalizedTitle = cleanInlineMarkdown(title).toLowerCase();

  if (!["1", "2", "3", "4", "5", "6", "7"].includes(key)) return false;

  return (
    /hán việt|liên hệ|nghĩa/.test(normalizedTitle) ||
    /chiết tự|cấu tạo|logic|bản chất/.test(normalizedTitle) ||
    /so sánh|dễ nhầm|phân biệt/.test(normalizedTitle) ||
    /kết hợp|collocation|cụm|thường gặp/.test(normalizedTitle) ||
    /ví dụ|example/.test(normalizedTitle) ||
    /văn hóa|culture/.test(normalizedTitle) ||
    /lưu ý|cảnh báo|warning|lỗi sai/.test(normalizedTitle)
  );
}

function parseSections(block: string) {
  const sections: Record<string, MarkdownSection> = {};
  const lines = normalizeNewlines(block).split("\n");

  let currentKey: string | null = null;
  let currentTitle = "";
  let currentBody: string[] = [];

  const pushCurrent = () => {
    if (!currentKey) return;

    sections[currentKey] = {
      key: currentKey,
      title: cleanInlineMarkdown(currentTitle),
      body: cleanInlineMarkdown(currentBody.join("\n")),
    };
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    const headingMatch = trimmed.match(
      /^\s*(?:\*\*)?(\d+)\.\s+(.+?)(?:\*\*)?\s*$/,
    );

    const key = headingMatch?.[1] ?? "";
    const title = headingMatch?.[2] ?? "";

    if (headingMatch && isVocabSectionHeading(key, title)) {
      pushCurrent();

      currentKey = key;
      currentTitle = title;
      currentBody = [];
      return;
    }

    if (currentKey) {
      currentBody.push(line);
    }
  });

  pushCurrent();

  return sections;
}

function extractPartOfSpeech(block: string) {
  const candidate = normalizeNewlines(block)
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("*") && !line.startsWith("**") && /\*$/.test(line));

  return candidate ? cleanInlineMarkdown(candidate) : "";
}

function extractLevel(block: string) {
  const match = block.match(/\*\*Mức độ học:\s*([^*]+)\*\*/);
  return cleanInlineMarkdown(match?.[1] ?? "");
}

function parseCollocations(body: string): VocabDraftCollocation[] {
  return normalizeNewlines(body)
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .filter(hasHan)
    .map((line) => {
      const colonParts = line.split(/[:：]\s*/);

      if (colonParts.length >= 2) {
        return {
          phrase: cleanInlineMarkdown(colonParts[0] ?? ""),
          meaning: cleanInlineMarkdown(colonParts.slice(1).join(": ")),
        };
      }

      const dashParts = line.split(/\s+[–—-]\s+/);

      return {
        phrase: cleanInlineMarkdown(dashParts[0] ?? ""),
        meaning: cleanInlineMarkdown(dashParts.slice(1).join(" – ")),
      };
    })
    .filter((item) => item.phrase.length > 0);
}

function parseExamples(body: string): VocabDraftExample[] {
  const examples: VocabDraftExample[] = [];
  const lines = normalizeNewlines(body).split("\n");

  let current: VocabDraftExample | null = null;

  lines.forEach((rawLine) => {
    const line = cleanLine(rawLine);

    if (/^中文:/i.test(line)) {
      if (current) examples.push(current);

      current = {
        chinese: cleanInlineMarkdown(line.replace(/^中文:\s*/i, "")),
        pinyin: "",
        translation: "",
        note: "",
      };

      return;
    }

    if (!current) return;

    if (/^Pinyin:/i.test(line)) {
      current.pinyin = cleanInlineMarkdown(line.replace(/^Pinyin:\s*/i, ""));
      return;
    }

    if (/^Dịch:/i.test(line)) {
      current.translation = cleanInlineMarkdown(line.replace(/^Dịch:\s*/i, ""));
      return;
    }

    if (/^Phân tích:/i.test(line)) {
      current.note = cleanInlineMarkdown(line.replace(/^Phân tích:\s*/i, ""));
    }
  });

  if (current) examples.push(current);

  return examples;
}

function createVocabItem(input: {
  id: string;
  word: string;
  pinyin?: string;
  hanViet?: string;
  meaning?: string;
  partOfSpeech?: string;
  level?: string;
  sections?: Partial<VocabDraftItem["sections"]>;
  collocations?: VocabDraftCollocation[];
  examples?: VocabDraftExample[];
  rawMarkdown: string;
}): VocabDraftItem {
  return {
    id: input.id,
    word: input.word,
    pinyin: input.pinyin ?? "",
    hanViet: input.hanViet ?? "",
    meaning: input.meaning ?? "",
    partOfSpeech: input.partOfSpeech ?? "",
    level: input.level ?? "",
    category: "Chưa phân nhóm",
    sections: {
      meaning: input.sections?.meaning ?? input.meaning ?? "",
      characterLogic: input.sections?.characterLogic ?? "",
      comparison: input.sections?.comparison ?? "",
      culture: input.sections?.culture ?? "",
      warning: input.sections?.warning ?? "",
    },
    collocations: input.collocations ?? [],
    examples: input.examples ?? [],
    rawMarkdown: input.rawMarkdown,
  };
}

function parseQuickGlossary(markdown: string): VocabParseResult {
  const items: VocabDraftItem[] = [];

  normalizeNewlines(markdown)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      if (!isQuickGlossaryLine(line)) return;

      const match = line.match(
        /^(?:[-*]\s*|\d+\.\s*)?\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/,
      );

      const word = cleanInlineMarkdown(match?.[1] ?? "");
      const meaning = cleanInlineMarkdown(match?.[2] ?? "");

      if (!hasHan(word)) return;

      items.push(
        createVocabItem({
          id: makeId(word, index),
          word,
          meaning,
          rawMarkdown: line,
        }),
      );
    });

  if (items.length === 0) {
    return {
      items: [],
      warnings: [],
      mode: "none",
    };
  }

  return {
    items,
    mode: "quick_glossary",
    warnings: [
      {
        code: "missing_field",
        message:
          "Quick glossary chỉ auto-fill từ và nghĩa; pinyin/Hán Việt/ví dụ cần sửa tay.",
        severity: "warning",
      },
    ],
  };
}

export function parseVocabDocument(markdown: string): VocabParseResult {
  const fullBlocks = splitFullVocabBlocks(markdown);

  if (fullBlocks.length === 0) return parseQuickGlossary(markdown);

  const warnings: ParserWarning[] = [];

  const items = fullBlocks.map((block, index) => {
    const title = parseTitle(block);
    const sections = parseSections(block);

    const item = createVocabItem({
      id: makeId(title.word, index),
      word: title.word,
      pinyin: title.pinyin,
      hanViet: title.hanViet,
      meaning: title.meaning,
      partOfSpeech: extractPartOfSpeech(block),
      level: extractLevel(block),
      sections: {
        meaning: sections["1"]?.body || title.meaning,
        characterLogic: sections["2"]?.body ?? "",
        comparison: sections["3"]?.body ?? "",
        culture: sections["6"]?.body ?? "",
        warning: sections["7"]?.body ?? "",
      },
      collocations: parseCollocations(sections["4"]?.body ?? ""),
      examples: parseExamples(sections["5"]?.body ?? ""),
      rawMarkdown: block,
    });

    if (!item.pinyin) {
      warnings.push({
        code: "missing_field",
        severity: "warning",
        message: `${item.word || `Mục ${index + 1}`}: thiếu pinyin.`,
        path: `vocabItems.${index}.pinyin`,
      });
    }

    if (!item.meaning) {
      warnings.push({
        code: "missing_field",
        severity: "warning",
        message: `${item.word || `Mục ${index + 1}`}: thiếu nghĩa.`,
        path: `vocabItems.${index}.meaning`,
      });
    }

    return item;
  });

  return {
    items,
    warnings,
    mode: "full_vocab",
  };
}
