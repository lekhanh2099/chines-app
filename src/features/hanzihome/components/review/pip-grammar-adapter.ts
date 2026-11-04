import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

export type PipGrammarExample = {
 readonly zh: string;
 readonly vi?: string;
};

export type PipGrammarPoint = {
 readonly id: string;
 readonly title: string;
 readonly formula?: string;
 readonly explanation?: string;
 readonly commonPhrases?: readonly string[];
 readonly examples: readonly PipGrammarExample[];
};

const NUMBERED_HEADING_REGEX =
 /^(\([一二三四五六七八九十]+\)|\[\d+\]|\d+\.\s*(?:Cấu trúc|Ngữ pháp|[“"「『]))/u;
const NUMBERED_EXAMPLE_REGEX = /^(\([0-9]+\)|[①②③④⑤⑥⑦⑧⑨⑩]|\d+\.)\s*/u;
const ZH_VI_SPLIT_REGEX =
 /^([\p{Script=Han}\p{Script=Latin}\s\d\p{P}]+?[!?.。！？])\s+([\p{Script=Latin}].+)$/u;

function parseMarkdownTableExamples(rawText: string): readonly PipGrammarExample[] {
 const parts = rawText
  .split("|")
  .map((s) => s.trim())
  .filter(
   (s) =>
    s.length > 0 &&
    s !== "---" &&
    !s.startsWith("Ví dụ") &&
    s !== "Tiếng Trung" &&
    s !== "Tiếng Việt",
  );

 const examples: PipGrammarExample[] = [];
 for (let i = 0; i < parts.length - 1; i += 2) {
  const zh = parts[i];
  const vi = parts[i + 1];
  if (zh) {
   examples.push({
    zh,
    vi: vi && vi.length > 0 ? vi : undefined,
   });
  }
 }
 return examples;
}

type MutableGrammarPoint = {
 id: string;
 title: string;
 formula?: string;
 explanation?: string;
 commonPhrases: string[];
 examples: PipGrammarExample[];
};

export function adaptTextbookGrammarToPip(
 sections: readonly TextbookLesson["sections"][number][],
): readonly PipGrammarPoint[] {
 const grammarSections = sections.filter((section) => section.category === "grammar");
 const points: PipGrammarPoint[] = [];
 let current: MutableGrammarPoint | null = null;

 const flushCurrent = () => {
  if (
   current &&
   (current.explanation ||
    current.examples.length > 0 ||
    current.formula ||
    current.commonPhrases.length > 0)
  ) {
   points.push({
    id: current.id,
    title: current.title,
    formula: current.formula,
    explanation: current.explanation,
    commonPhrases: current.commonPhrases.length > 0 ? current.commonPhrases : undefined,
    examples: current.examples,
   });
  }
 };

 for (const section of grammarSections) {
  for (const block of section.blocks) {
   const rawText = block.text?.trim() ?? "";
   if (!rawText) continue;

   const isSubheading = block.type === "subheading";
   const isNumberedHeading =
    block.type === "paragraph" && NUMBERED_HEADING_REGEX.test(rawText) && rawText.length < 90;

   if (isSubheading || isNumberedHeading) {
    flushCurrent();
    current = {
     id: block.id,
     title: rawText,
     formula: undefined,
     explanation: undefined,
     commonPhrases: [],
     examples: [],
    };
    continue;
   }

   if (!current) {
    current = {
     id: block.id,
     title: section.title || "Điểm ngữ pháp",
     formula: undefined,
     explanation: undefined,
     commonPhrases: [],
     examples: [],
    };
   }

   if (rawText.startsWith("Công thức:") || rawText.startsWith("Cấu trúc:")) {
    current.formula = rawText.replace(/^(?:Công thức|Cấu trúc):\s*/u, "");
   } else if (rawText.startsWith("Cách dùng:")) {
    current.explanation = rawText.replace(/^Cách dùng:\s*/u, "");
   } else if (rawText.startsWith("Các cụm từ thường gặp:")) {
    const phrases = rawText
     .replace(/^Các cụm từ thường gặp:\s*/u, "")
     .split(/[,，]\s*/u)
     .map((p) => p.trim())
     .filter((p) => p.length > 0);
    current.commonPhrases = [...current.commonPhrases, ...phrases];
   } else if (rawText.includes("|") && rawText.includes("Tiếng Trung")) {
    const tableExamples = parseMarkdownTableExamples(rawText);
    current.examples = [...current.examples, ...tableExamples];
   } else if (NUMBERED_EXAMPLE_REGEX.test(rawText)) {
    const clean = rawText.replace(NUMBERED_EXAMPLE_REGEX, "");
    const splitMatch = clean.match(ZH_VI_SPLIT_REGEX);
    const matchedZh = splitMatch?.[1];
    const matchedVi = splitMatch?.[2];

    if (matchedZh && matchedVi) {
     current.examples = [
      ...current.examples,
      {
       zh: matchedZh.trim(),
       vi: matchedVi.trim(),
      },
     ];
    } else {
     current.examples = [
      ...current.examples,
      {
       zh: clean,
       vi: undefined,
      },
     ];
    }
   } else {
    if (!current.explanation) {
     current.explanation = rawText;
    } else {
     current.explanation = `${current.explanation}\n${rawText}`;
    }
   }
  }
 }

 flushCurrent();

 return points;
}
