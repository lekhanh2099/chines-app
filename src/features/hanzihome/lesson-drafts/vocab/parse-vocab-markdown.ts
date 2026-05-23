import type {
  VocabDraftCollocation,
  VocabDraftExample,
  VocabDraftImportResult,
  VocabDraftItem,
} from "@/features/hanzihome/lesson-drafts/vocab/vocab-draft.schema";

type MarkdownSection = {
  title: string;
  body: string;
};

function hasCjk(value: string) {
  return /\p{Script=Han}/u.test(value);
}

function slugifyWord(word: string, index: number) {
  const safeWord = word
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .toLowerCase();

  return `draft-vocab-${safeWord || "item"}-${index + 1}`;
}

function isLikelyVocabHeading(title: string) {
  return hasCjk(title) && /\s+[–—-]\s+/.test(title);
}

function splitEntryBlocks(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const allHeadingMatches = Array.from(normalized.matchAll(/^##\s+(.+)$/gm));

  const headingMatches = allHeadingMatches.filter((match) =>
    isLikelyVocabHeading(match[1]?.trim() ?? ""),
  );

  return headingMatches.map((match, index) => {
    const start = match.index ?? 0;
    const next = headingMatches[index + 1];
    const end = next?.index ?? normalized.length;

    return normalized.slice(start, end).trim();
  });
}

function parseTitleLine(block: string, index: number) {
  const titleLine = block.split("\n")[0]?.replace(/^##\s+/, "").trim() ?? "";
  const parts = titleLine
    .split(/\s+[–—-]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const word = parts[0] ?? "";
  const pinyin = parts[1] ?? "";
  const hanViet = parts[2] ?? "";
  const meaning = parts.slice(3).join(" – ");

  return {
    word,
    pinyin,
    hanViet,
    meaning,
    warning: word
      ? null
      : `Mục số ${index + 1} thiếu từ chính ở heading.`,
  };
}

function extractPartOfSpeech(block: string) {
  const match = block.match(/^\*([^*\n]+)\*/m);
  return match?.[1]?.trim() ?? "";
}

function extractLevel(block: string) {
  const match = block.match(/\*\*Mức độ học:\s*([^*]+)\*\*/);
  return match?.[1]?.trim() ?? "";
}

function parseSections(block: string): Record<string, MarkdownSection> {
  const matches = Array.from(block.matchAll(/^\*\*(\d+)\.\s+(.+?)\*\*\s*$/gm));
  const sections: Record<string, MarkdownSection> = {};

  matches.forEach((match, index) => {
    const key = match[1] ?? "";
    const title = match[2]?.trim() ?? "";
    const start = (match.index ?? 0) + match[0].length;
    const next = matches[index + 1];
    const end = next?.index ?? block.length;

    sections[key] = {
      title,
      body: block.slice(start, end).trim(),
    };
  });

  return sections;
}

function stripMarkdownBold(value: string) {
  return value.replace(/\*\*/g, "").trim();
}

function parseCollocations(body: string): VocabDraftCollocation[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^\d+\.\s+/.test(line) || /^\*\*.+?\*\*/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, ""))
    .map((line) => {
      const colonParts = line.split(/[:：]\s+/);
      if (colonParts.length >= 2) {
        return {
          phrase: stripMarkdownBold(colonParts[0] ?? ""),
          meaning: colonParts.slice(1).join(": ").trim(),
        };
      }

      const dashParts = line.split(/\s+[–—-]\s+/);
      return {
        phrase: stripMarkdownBold(dashParts[0] ?? ""),
        meaning: dashParts.slice(1).join(" – ").trim(),
      };
    })
    .filter((item) => item.phrase.length > 0);
}

function parseExamples(body: string): VocabDraftExample[] {
  const examples: VocabDraftExample[] = [];
  const lines = body.split("\n");

  let current: VocabDraftExample | null = null;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (/^\d+\.\s+中文:/.test(line)) {
      if (current) examples.push(current);

      current = {
        chinese: stripMarkdownBold(line.replace(/^\d+\.\s+中文:\s*/, "")),
        pinyin: "",
        translation: "",
        note: "",
      };

      return;
    }

    if (!current) return;

    if (line.startsWith("Pinyin:")) {
      current.pinyin = line.replace(/^Pinyin:\s*/, "").trim();
      return;
    }

    if (line.startsWith("Dịch:")) {
      current.translation = line.replace(/^Dịch:\s*/, "").trim();
      return;
    }

    if (line.startsWith("Phân tích:")) {
      current.note = stripMarkdownBold(line.replace(/^Phân tích:\s*/, ""));
    }
  });

  if (current) examples.push(current);

  return examples;
}

function createBaseItem(input: {
  id: string;
  word: string;
  pinyin?: string;
  hanViet?: string;
  meaning?: string;
  partOfSpeech?: string;
  level?: string;
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
      meaning: input.meaning ?? "",
      characterLogic: "",
      comparison: "",
      culture: "",
      warning: "",
    },
    collocations: [],
    examples: [],
    rawMarkdown: input.rawMarkdown,
  };
}

function parseQuickGlossaryLines(markdown: string): VocabDraftImportResult {
  const warnings: string[] = [];
  const items: VocabDraftItem[] = [];

  markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const match = line.match(/^(?:[-*]\s*|\d+\.\s*)?\*\*([^*]+)\*\*\s*[:：]\s*(.+)$/);
      if (!match) return;

      const word = match[1]?.trim() ?? "";
      const meaning = match[2]?.trim() ?? "";

      if (!hasCjk(word)) return;

      items.push(
        createBaseItem({
          id: slugifyWord(word, index),
          word,
          meaning,
          rawMarkdown: line,
        }),
      );
    });

  if (items.length > 0) {
    warnings.push(
      "Đã dùng quick glossary parser. Format này chỉ auto-fill từ và nghĩa; pinyin/Hán Việt/ví dụ cần sửa tay.",
    );
  }

  return {
    items,
    warnings,
  };
}

export function parseVocabMarkdown(markdown: string): VocabDraftImportResult {
  const warnings: string[] = [];
  const blocks = splitEntryBlocks(markdown);

  if (blocks.length === 0) {
    const quickResult = parseQuickGlossaryLines(markdown);

    if (quickResult.items.length > 0) return quickResult;

    return {
      items: [],
      warnings: [
        "Không tìm thấy mục từ nào. Dùng heading dạng ## Từ – pinyin – Hán Việt – nghĩa, hoặc quick line dạng **词**: nghĩa.",
      ],
    };
  }

  const items: VocabDraftItem[] = blocks.map((block, index) => {
    const title = parseTitleLine(block, index);
    const sections = parseSections(block);

    if (title.warning) warnings.push(title.warning);

    const item: VocabDraftItem = {
      id: slugifyWord(title.word, index),
      word: title.word,
      pinyin: title.pinyin,
      hanViet: title.hanViet,
      meaning: title.meaning,
      partOfSpeech: extractPartOfSpeech(block),
      level: extractLevel(block),
      category: "Chưa phân nhóm",
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
    };

    if (!item.pinyin) warnings.push(`${item.word || `Mục ${index + 1}`}: thiếu pinyin.`);
    if (!item.meaning) warnings.push(`${item.word || `Mục ${index + 1}`}: thiếu nghĩa tiếng Việt.`);

    return item;
  });

  return {
    items,
    warnings,
  };
}
