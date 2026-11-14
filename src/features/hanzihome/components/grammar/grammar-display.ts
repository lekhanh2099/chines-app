import type { GrammarViewModel } from "@/features/hanzihome/types";

export type GrammarDetailSection = NonNullable<GrammarViewModel["detailSections"]>[number];

export function cleanGrammarDisplayLine(value: string) {
 return value
  .replace(/^#{1,6}\s*/g, "")
  .replace(/\*\*([^*\n]+)\*\*/g, "$1")
  .replace(/__([^_\n]+)__/g, "$1")
  .replace(/`([^`\n]+)`/g, "$1")
  .replace(/^[-*]\s*(?=(cấu trúc|công thức|pattern|mẫu câu|句型|结构|格式)\s*[:：])/i, "")
  .trim();
}

export function normalizeGrammarText(value: string) {
 return value
  .replace(/[#*_`>-]/g, "")
  .replace(/\s+/g, " ")
  .trim()
  .toLocaleLowerCase("vi-VN");
}

export function isDuplicateCoreSection(section: GrammarDetailSection, core: string) {
 const normalizedCore = normalizeGrammarText(core);
 if (!normalizedCore) return false;

 const normalizedSection = normalizeGrammarText(section.lines.join(" "));
 if (normalizedSection === normalizedCore) return true;

 const normalizedTitle = normalizeGrammarText(section.title);
 return (
  normalizedTitle.includes("bản chất") &&
  normalizedSection.includes(normalizedCore) &&
  normalizedSection.length <= normalizedCore.length + 32
 );
}

export function isImportantGrammarLine(line: string) {
 return /^(cấu trúc|công thức|pattern|mẫu câu|句型|结构|格式)\s*[:：]/i.test(line.trim());
}

export function splitImportantGrammarLine(line: string) {
 const match = /^([^:：]{1,32})[:：]\s*(.+)$/.exec(line.trim());

 return {
  label: match?.[1]?.trim(),
  value: match?.[2]?.trim() || line.trim(),
 };
}
