export type LessonOverviewMarkdownSection = {
 id: string;
 title: string;
 level: 1 | 2 | 3 | 4 | 5 | 6;
 content: string;
 startLine: number;
 endLine: number;
 headingLine?: string;
};

function normalizeLooseMarkdownHeadings(value: string) {
 return value.replace(/^(#{1,6})(?=\S)/gmu, "$1 ");
}

function sectionId(index: number, title: string) {
 return `${index}-${title
  .trim()
  .toLocaleLowerCase("vi-VN")
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48)}`;
}

export function normalizeLessonOverviewMarkdown(value: string) {
 return normalizeLooseMarkdownHeadings(value).trim();
}

export function parseLessonOverviewMarkdownSections(
 markdown: string,
): LessonOverviewMarkdownSection[] {
 const normalized = normalizeLessonOverviewMarkdown(markdown);
 if (!normalized) return [];

 const lines = normalized.split("\n");
 const headings = lines.flatMap((line, index) => {
  const match = /^(#{1,6})\s+(.+)$/.exec(line.trim());
  if (!match) return [];

  return [
   {
    lineIndex: index,
    level: match[1].length as LessonOverviewMarkdownSection["level"],
    title: match[2].trim(),
   },
  ];
 });

 if (headings.length === 0) {
  return [
   {
    id: "0-noi-dung",
    title: "Nội dung",
    level: 2,
    content: normalized,
    startLine: 0,
    endLine: lines.length,
   },
  ];
 }

 const sections: LessonOverviewMarkdownSection[] = [];
 const firstHeading = headings[0];

 if (firstHeading && firstHeading.lineIndex > 0) {
  const intro = lines.slice(0, firstHeading.lineIndex).join("\n").trim();
  if (intro) {
   sections.push({
    id: "0-mo-dau",
    title: "Mở đầu",
    level: 2,
    content: intro,
    startLine: 0,
    endLine: firstHeading.lineIndex,
   });
  }
 }

 headings.forEach((heading, headingIndex) => {
  const endLine = headings[headingIndex + 1]?.lineIndex ?? lines.length;
  const title = heading.title;
  const content = lines.slice(heading.lineIndex + 1, endLine).join("\n").trim();

  sections.push({
   id: sectionId(sections.length, title),
   title,
   level: heading.level,
   content,
   startLine: heading.lineIndex,
   endLine,
   headingLine: lines[heading.lineIndex],
  });
 });

 return sections;
}

export function updateLessonOverviewMarkdownSection({
 markdown,
 sectionId: targetSectionId,
 nextContent,
}: {
 markdown: string;
 sectionId: string;
 nextContent: string;
}) {
 const normalized = normalizeLessonOverviewMarkdown(markdown);
 const sections = parseLessonOverviewMarkdownSections(normalized);
 const section = sections.find((item) => item.id === targetSectionId);

 if (!section) return normalized;

 const lines = normalized ? normalized.split("\n") : [];
 const replacement = section.headingLine
  ? [section.headingLine, ...nextContent.trim().split("\n")]
  : nextContent.trim().split("\n");

 return [
  ...lines.slice(0, section.startLine),
  ...replacement,
  ...lines.slice(section.endLine),
 ]
  .join("\n")
  .trim();
}

export function deleteLessonOverviewMarkdownSection({
 markdown,
 sectionId: targetSectionId,
}: {
 markdown: string;
 sectionId: string;
}) {
 const normalized = normalizeLessonOverviewMarkdown(markdown);
 const sections = parseLessonOverviewMarkdownSections(normalized);
 const section = sections.find((item) => item.id === targetSectionId);

 if (!section) return normalized;

 const lines = normalized ? normalized.split("\n") : [];

 return [...lines.slice(0, section.startLine), ...lines.slice(section.endLine)]
  .join("\n")
  .trim();
}
