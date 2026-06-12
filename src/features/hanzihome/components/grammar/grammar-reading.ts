import type { GrammarViewModel } from "@/features/hanzihome/types";

export type GrammarReading = {
 title: string;
 contentMd: string;
 preview?: string;
};

const readingHeadingPattern =
 /^##\s*(BÀI ĐỌC(?:\s+THÊM) ?(?:\s+ÁP DỤNG) ?|BÀI ĐỌC THÊM ÁP DỤNG NGỮ PHÁP)\b/i;
const topLevelHeadingPattern = /^##\s+/;

function normalizeNewlines(value: string) {
 return value.replace(/\r\n/g, "\n");
}

function cleanMarkdownInline(value: string) {
 return value
  .replace(/^#+\s*/, "")
  .replace(/\*\*([^*\n]+)\*\*/g, "$1")
  .replace(/__([^_\n]+)__/g, "$1")
  .replace(/`([^`\n]+)`/g, "$1")
  .trim();
}

function getReadingPreview(contentMd: string) {
 return normalizeNewlines(contentMd)
  .split("\n")
  .map((line) =>
   cleanMarkdownInline(line)
    .replace(/^[-*+]\s+/, "")
    .trim(),
  )
  .find(Boolean);
}

export function extractGrammarReading(
 points: GrammarViewModel[],
): GrammarReading | null {
 for (const point of points) {
  const contentMd = point.contentMd?.trim();
  if (!contentMd) continue;

  const lines = normalizeNewlines(contentMd).split("\n");
  const headingIndex = lines.findIndex((line) =>
   readingHeadingPattern.test(line.trim()),
  );

  if (headingIndex === -1) continue;

  const heading = lines[headingIndex] ?? "";
  const endIndex = lines.findIndex((line, index) => {
   if (index <= headingIndex) return false;
   return topLevelHeadingPattern.test(line.trim());
  });
  const bodyLines =
   endIndex === -1
    ? lines.slice(headingIndex + 1)
    : lines.slice(headingIndex + 1, endIndex);
  const readingContentMd = bodyLines.join("\n").trim();

  if (!readingContentMd) continue;

  return {
   title: cleanMarkdownInline(heading) || "Bài đọc áp dụng",
   contentMd: readingContentMd,
   preview: getReadingPreview(readingContentMd),
  };
 }

 return null;
}

export function extractReadingFromMarkdown(
 contentMd?: string,
): GrammarReading | null {
 const normalizedContent = contentMd?.trim();
 if (!normalizedContent) return null;

 const lines = normalizeNewlines(normalizedContent).split("\n");
 const headingIndex = lines.findIndex((line) =>
  readingHeadingPattern.test(line.trim()),
 );

 if (headingIndex === -1) {
  return {
   title: "Bài đọc áp dụng",
   contentMd: normalizedContent,
   preview: getReadingPreview(normalizedContent),
  };
 }

 const heading = lines[headingIndex] ?? "";
 const readingContentMd = lines.slice(headingIndex + 1).join("\n").trim();

 if (!readingContentMd) return null;

 return {
  title: cleanMarkdownInline(heading) || "Bài đọc áp dụng",
  contentMd: readingContentMd,
  preview: getReadingPreview(readingContentMd),
 };
}
