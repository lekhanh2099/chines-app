export function normalizeNewlines(value: string) {
  return value.replace(/\r\n/g, "\n");
}

export function hasHan(value: string) {
  return /\p{Script=Han}/u.test(value);
}

export function cleanInlineMarkdown(value: string) {
  return normalizeNewlines(value)
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function cleanLine(value: string) {
  return cleanInlineMarkdown(value)
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .trim();
}

export function stripHorizontalRules(value: string) {
  return normalizeNewlines(value).replace(/^\s*[-*_]{3,}\s*$/gm, "");
}

export function toNonEmptyLines(value: string) {
  return normalizeNewlines(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function slugifyText(value: string, fallback: string) {
  const safe = value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]/gu, "")
    .toLowerCase();

  return safe || fallback;
}
