import type {
 AppliedParseResult,
 ExampleBlock,
 LearningBlock,
 LearningFieldValue,
 LearningListItem,
 LearningSection,
 ParseMeta,
 ParserWarning,
} from "@/features/hanzihome/importer/importer.types";

const parserVersion = "smart-md-parser-v2.0.0";

const pinyinToneMarkPattern = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/iu;
const cjkPattern = /[\u3400-\u9fff]/u;
const vietnameseMarkPattern =
 /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu;
const notePattern =
 /\b(ở đây|nhấn mạnh|dùng để|khác với|ghi chú|lưu ý|chú ý|note|注意|hàm ý|sắc thái)\b/iu;

function stripMarkdownHeadingMarker(value: string) {
 return value.replace(/^\s{0,3}#{1,6}\s+/, "").trim();
}

function stripOrderedPrefix(value: string) {
 let next = value.trim();
 let previous = "";

 while (next && next !== previous) {
  previous = next;
  next = next
   .replace(/^PHẦN\s+(?:\d+|[IVX]+)\s*[:：.-]\s*/iu, "")
   .replace(/^(?:[IVX]+|[A-Z])\s*[.)]\s+/iu, "")
   .replace(/^\d+(?:\.\d+)*\s*[.)．、:：-]?\s*/u, "")
   .replace(/^[一二三四五六七八九十百]+[、.．:：-]\s*/u, "")
   .replace(/^（[一二三四五六七八九十百\d]+）\s*/u, "")
   .replace(/^\([一二三四五六七八九十百\d]+\)\s*/u, "")
   .trim();
 }

 return next;
}

export function cleanDisplayTitle(raw: string) {
 const title = stripOrderedPrefix(stripMarkdownHeadingMarker(raw))
  .replace(/\s+/g, " ")
  .trim();

 return title || raw.trim();
}

export function normalizeSmartHeading(raw: string) {
 return cleanDisplayTitle(raw)
  .normalize("NFC")
  .toLocaleLowerCase("vi-VN")
  .replace(/\s+/g, " ")
  .trim();
}

function isHeadingLikeLine(line: string) {
 return /^\s{0,3}#{1,6}\s+/u.test(line);
}

function hasCjk(value: string) {
 return cjkPattern.test(value);
}

function looksLikePinyin(value: string) {
 const trimmed = value.trim();
 if (!trimmed || hasCjk(trimmed)) return false;
 if (pinyinToneMarkPattern.test(trimmed)) return true;

 const words = trimmed
  .replace(/[.,!?;:"“”'()（）\-–—]/gu, " ")
  .split(/\s+/)
  .filter(Boolean);

 if (words.length < 3) return false;

 const shortLatinWords = words.filter((word) => /^[a-züv]{1,7}$/iu.test(word));
 return shortLatinWords.length / words.length >= 0.82;
}

function looksLikeVietnameseTranslation(value: string) {
 const trimmed = value.trim();
 if (!trimmed || hasCjk(trimmed) || looksLikePinyin(trimmed)) return false;
 if (vietnameseMarkPattern.test(trimmed)) return true;

 const commonWords = trimmed.match(
  /\b(là|của|một|những|người|không|được|trong|với|cho|số|câu|nghĩa)\b/giu,
 );
 return (commonWords?.length ?? 0) >= 2;
}

function looksLikeNote(value: string) {
 return notePattern.test(value);
}

function flushExample(
 examples: ExampleBlock[],
 current: Partial<ExampleBlock>,
) {
 if (!current.hanzi && !current.translation) return;

 examples.push({
  hanzi: current.hanzi?.trim() ?? "",
  pinyin: current.pinyin?.trim() || undefined,
  translation: current.translation?.trim() || undefined,
  note: current.note?.trim() || undefined,
 });
}

function listItemToLines(item: LearningListItem, depth = 0): string[] {
 const prefix = "  ".repeat(depth);
 const ownText = item.blocks
  .flatMap((block) => blockToTextLines(block, depth))
  .join(" ")
  .trim();
 const lines = ownText ? [`${prefix}- ${ownText}`] : [];

 item.children.forEach((child) => {
  lines.push(...listItemToLines(child, depth + 1));
 });

 return lines;
}

function blockToTextLines(block: LearningBlock, depth = 0): string[] {
 if (block.type === "paragraph") return [block.text];
 if (block.type === "code") {
  const fence = block.lang ? `\`\`\`${block.lang}` : "```";
  return [fence, block.value, "```"];
 }
 if (block.type === "quote") {
  return block.blocks
   .flatMap((child) => blockToTextLines(child, depth))
   .map((line) => `> ${line}`);
 }
 if (block.type === "table") {
  const rows = [block.table.headers, ...block.table.rows].filter(
   (row) => row.length > 0,
  );
  return rows.map((row) => row.join(" | "));
 }
 if (block.type === "thematicBreak") return ["---"];

 return block.items.flatMap((item) => listItemToLines(item, depth));
}

function sectionToText(section: LearningSection) {
 return section.blocks.flatMap((block) => blockToTextLines(block)).join("\n").trim();
}

function fieldValueToText(value: LearningFieldValue) {
 if (value.kind === "text") return value.value;
 if (value.kind === "list") return value.value.join("\n");
 if (value.kind === "examples") {
  return value.value
   .map((example) =>
    [
     example.hanzi,
     example.pinyin ? `Pinyin: ${example.pinyin}` : "",
     example.translation ? `Nghĩa: ${example.translation}` : "",
     example.note ? `Ghi chú: ${example.note}` : "",
    ]
     .filter(Boolean)
     .join("\n"),
   )
   .join("\n\n");
 }

 const rows = [value.value.headers, ...value.value.rows].filter(
  (row) => row.length > 0,
 );
 return rows.map((row) => row.join(" | ")).join("\n");
}

export function detectExampleBlocks(text: string): ExampleBlock[] {
 const examples: ExampleBlock[] = [];
 let current: Partial<ExampleBlock> = {};

 const lines = text
  .replace(/\r\n/g, "\n")
  .split("\n")
  .map((line) =>
   line
    .trim()
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)]\s+/, ""),
  )
  .filter((line) => line && line !== "---" && !isHeadingLikeLine(line));

 lines.forEach((line) => {
  const withoutLabel = line
   .replace(/^Pinyin[:：]\s*/iu, "")
   .replace(/^(?:Nghĩa|Dịch|Dịch nghĩa|Translation)[:：]\s*/iu, "")
   .replace(/^(?:Ghi chú|Note)[:：]\s*/iu, "")
   .trim();

  if (hasCjk(withoutLabel) && !looksLikeNote(withoutLabel)) {
   if (current.hanzi || current.translation) {
    flushExample(examples, current);
    current = {};
   }

   current.hanzi = withoutLabel;
   return;
  }

  if (looksLikePinyin(withoutLabel)) {
   current.pinyin = [current.pinyin, withoutLabel].filter(Boolean).join(" ");
   return;
  }

  if (looksLikeVietnameseTranslation(withoutLabel) && !current.translation) {
   current.translation = withoutLabel;
   return;
  }

  current.note = [current.note, withoutLabel].filter(Boolean).join("\n");
 });

 flushExample(examples, current);

 return examples.filter((example) => example.hanzi || example.translation);
}

export function textToLearningFieldValue(
 field: string,
 text: string,
): LearningFieldValue {
 if (field === "grammar.examples" || field === "vocab.examples") {
  const examples = detectExampleBlocks(text);
  if (examples.length > 0) return { kind: "examples", value: examples };
 }

 return { kind: "text", value: text };
}

function sectionsCharacterCount(sections: LearningSection[]): number {
 return sections.reduce((total, section) => {
  const ownText = sectionToText(section);
  return total + section.title.length + ownText.length + sectionsCharacterCount(section.children);
 }, 0);
}

function sectionsCount(sections: LearningSection[]): number {
 return sections.reduce(
  (total, section) => total + 1 + sectionsCount(section.children),
  0,
 );
}

function fieldsCharacterCount(result: AppliedParseResult) {
 return result.items.reduce((itemTotal, item) => {
  const fieldTotal = Object.values(item.fields).reduce((fieldTotalValue, values) => {
   return (
    fieldTotalValue +
     (values ?? []).reduce(
     (valueTotal, value) => valueTotal + fieldValueToText(value).length,
     0,
    )
   );
  }, 0);

  return itemTotal + item.title.length + fieldTotal;
 }, 0);
}

function warningsWithMeta(result: AppliedParseResult): ParserWarning[] {
 const warnings = [...result.warnings];

 result.items.forEach((item) => {
  if (!item.fallback) return;

  warnings.push({
   severity: "warning",
   sectionId: item.sourceSectionId,
   type: "FALLBACK_USED",
   message:
    item.fallbackReason === "NO_FIELD_CHILDREN_MAPPED"
     ? `Parser chưa tách được field cho "${item.title}", đang giữ nội dung thô.`
     : `Parser dùng fallback cho "${item.title}".`,
  });
 });

 result.unmappedSections.forEach((section) => {
  warnings.push({
   severity: "warning",
   sectionId: section.id,
   type: "UNKNOWN_SECTION",
   message: `Section "${section.title}" chưa được map chắc và đã được giữ lại.`,
  });
 });

 return warnings;
}

export function buildParseMeta(result: AppliedParseResult): ParseMeta {
 const totalCharacters = result.doc.rawMarkdown.trim().length;
 const rawMappedCharacters = fieldsCharacterCount(result);
 const rawPreservedCharacters = sectionsCharacterCount(result.unmappedSections);
 const mappedCharacters = Math.min(rawMappedCharacters, totalCharacters);
 const preservedCharacters = Math.min(
  rawPreservedCharacters,
  Math.max(0, totalCharacters - mappedCharacters),
 );
 const droppedCharacters = Math.max(
  0,
  totalCharacters - mappedCharacters - preservedCharacters,
 );
 const coverage =
  totalCharacters > 0
   ? (mappedCharacters + preservedCharacters) / totalCharacters
   : 1;

 return {
  totalSections: sectionsCount(result.doc.sections),
  mappedSections: result.items.length + result.specialSections.length,
  preservedSections: result.unmappedSections.length,
  droppedSections: droppedCharacters > 0 ? 1 : 0,
  totalCharacters,
  mappedCharacters,
  preservedCharacters,
  droppedCharacters,
  coverage,
  mappedRatio: totalCharacters > 0 ? mappedCharacters / totalCharacters : 1,
  preservedRatio:
   totalCharacters > 0 ? preservedCharacters / totalCharacters : 0,
  droppedRatio: totalCharacters > 0 ? droppedCharacters / totalCharacters : 0,
  confidence: Math.max(0, Math.min(1, coverage - (droppedCharacters > 0 ? 0.2 : 0))),
  parserVersion,
  warnings: warningsWithMeta(result),
 };
}
