"use client";

import { cn } from "@/lib/utils";
import { MarkdownParagraph } from "./MarkdownParagraph";
import { renderMarkdownInline } from "./markdown-inline";
import { z } from "zod";

type MarkdownContentProps = {
 content: string;
 className?: string;
};

const MarkdownHeadingLevelSchema = z.union([z.literal(2), z.literal(3), z.literal(4)]);
const MarkdownBlockSchema = z.discriminatedUnion("type", [
 z.object({ type: z.literal("heading"), level: MarkdownHeadingLevelSchema, text: z.string() }),
 z.object({ type: z.literal("paragraph"), text: z.string() }),
 z.object({ type: z.literal("list"), ordered: z.boolean(), items: z.array(z.string()) }),
 z.object({ type: z.literal("blockquote"), text: z.string() }),
 z.object({ type: z.literal("table"), rows: z.array(z.array(z.string())) }),
 z.object({ type: z.literal("hr") }),
]);
type MarkdownBlock = z.infer<typeof MarkdownBlockSchema>;

function normalizeNewlines(value: string) {
 return value.replace(/\r\n/g, "\n");
}

function isHorizontalRule(line: string) {
 return /^[-*_]{3,}$/.test(line.trim());
}

function isHeading(line: string) {
 return /^#{1,6}\s+/.test(line.trim());
}

function isListItem(line: string) {
 return /^([-*+]\s+|\d+\.\s+)/.test(line.trim());
}

function isTableSeparator(line: string) {
 return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function isTableLikeLine(line: string) {
 return (
  line
   .split("|")
   .map((cell) => cell.trim())
   .filter(Boolean).length >= 2
 );
}

function isTableStart(lines: string[], index: number) {
 return (
  isTableLikeLine(lines[index] ?? "") &&
  lines[index + 1] !== undefined &&
  (isTableSeparator(lines[index + 1] ?? "") || isTableLikeLine(lines[index + 1] ?? ""))
 );
}

function parseTableRow(line: string) {
 return line
  .trim()
  .replace(/^\|/, "")
  .replace(/\|$/, "")
  .split("|")
  .map((cell) => cell.trim());
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
 const lines = normalizeNewlines(content).split("\n");
 const blocks: MarkdownBlock[] = [];
 let index = 0;

 while (index < lines.length) {
  const line = lines[index] ?? "";
  const trimmed = line.trim();

  if (!trimmed) {
   index += 1;
   continue;
  }

  if (isHorizontalRule(trimmed)) {
   blocks.push({ type: "hr" });
   index += 1;
   continue;
  }

  const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
  if (headingMatch) {
   const rawLevel = headingMatch[1]?.length ?? 2;
   const level = rawLevel <= 2 ? 2 : rawLevel === 3 ? 3 : 4;
   blocks.push({
    type: "heading",
    level,
    text: headingMatch[2]?.trim() ?? "",
   });
   index += 1;
   continue;
  }

  if (isTableStart(lines, index)) {
   const rows: string[][] = [parseTableRow(line)];
   index += isTableSeparator(lines[index + 1] ?? "") ? 2 : 1;

   while (index < lines.length) {
    const tableLine = lines[index] ?? "";
    if (!isTableLikeLine(tableLine)) break;
    rows.push(parseTableRow(tableLine));
    index += 1;
   }

   blocks.push({ type: "table", rows });
   continue;
  }

  const listMatch = /^(([-*+])\s+|(\d+)\.\s+)(.+)$/.exec(trimmed);
  if (listMatch) {
   const ordered = Boolean(listMatch[3]);
   const items: string[] = [];

   while (index < lines.length) {
    const itemMatch = /^(([-*+])\s+|(\d+)\.\s+)(.+)$/.exec((lines[index] ?? "").trim());
    if (!itemMatch || Boolean(itemMatch[3]) !== ordered) break;
    items.push(itemMatch[4]?.trim() ?? "");
    index += 1;
   }

   blocks.push({ type: "list", ordered, items });
   continue;
  }

  if (trimmed.startsWith(">")) {
   const quoteLines: string[] = [];

   while (index < lines.length) {
    const quoteLine = (lines[index] ?? "").trim();
    if (!quoteLine.startsWith(">")) break;
    quoteLines.push(quoteLine.replace(/^>\s?/, ""));
    index += 1;
   }

   blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
   continue;
  }

  const paragraphLines: string[] = [];
  while (index < lines.length) {
   const paragraphLine = lines[index] ?? "";
   const paragraphTrimmed = paragraphLine.trim();

   if (
    !paragraphTrimmed ||
    isHorizontalRule(paragraphTrimmed) ||
    isHeading(paragraphTrimmed) ||
    isListItem(paragraphTrimmed) ||
    paragraphTrimmed.startsWith(">") ||
    isTableStart(lines, index)
   ) {
    break;
   }

   paragraphLines.push(paragraphTrimmed);
   index += 1;
  }

  blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
 }

 return blocks;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
 const blocks = parseMarkdownBlocks(content);

 return (
  <div className={cn("grid min-w-0 gap-4", className)}>
   {blocks.map((block, index) => {
    if (block.type === "heading") {
     const headingClass =
      block.level === 2 ? "text-lg" : block.level === 3 ? "text-base" : "text-sm";
     const className = cn(
      "font-black leading-snug tracking-normal text-text-primary",
      headingClass,
     );

     if (block.level === 2) {
      return (
       <h2 key={`${index}-${block.text}`} className={className}>
        {renderMarkdownInline(block.text)}
       </h2>
      );
     }

     if (block.level === 3) {
      return (
       <h3 key={`${index}-${block.text}`} className={className}>
        {renderMarkdownInline(block.text)}
       </h3>
      );
     }

     return (
      <h4 key={`${index}-${block.text}`} className={className}>
       {renderMarkdownInline(block.text)}
      </h4>
     );
    }

    if (block.type === "paragraph") {
     return <MarkdownParagraph key={`${index}-${block.text}`} text={block.text} />;
    }

    if (block.type === "blockquote") {
     return (
      <blockquote
       key={`${index}-${block.text}`}
       className="rounded-xl border border-info/30 bg-info-subtle px-4 py-3  font-semibold leading-relaxed text-info-text"
      >
       <MarkdownParagraph text={block.text} />
      </blockquote>
     );
    }

    if (block.type === "list") {
     const ListTag = block.ordered ? "ol" : "ul";
     return (
      <ListTag
       key={`${index}-${block.items.join("|")}`}
       className={cn(
        "grid gap-2 ps-5  leading-relaxed text-text-secondary",
        block.ordered ? "list-decimal" : "list-disc",
       )}
      >
       {block.items.map((item, itemIndex) => (
        <li key={`${itemIndex}-${item}`}>{renderMarkdownInline(item)}</li>
       ))}
      </ListTag>
     );
    }

    if (block.type === "table") {
     const [headerRow, ...bodyRows] = block.rows;
     return (
      <div
       key={`${index}-${block.rows.length}`}
       className="max-w-full overflow-x-auto rounded-xl border border-border-default"
      >
       <table className="min-w-full border-collapse text-left text-sm">
        {headerRow && (
         <thead className="bg-bg-subtle text-text-primary">
          <tr>
           {headerRow.map((cell, cellIndex) => (
            <th
             key={`${cellIndex}-${cell}`}
             className="border-b border-border-default px-3 py-2 font-black"
            >
             {renderMarkdownInline(cell)}
            </th>
           ))}
          </tr>
         </thead>
        )}
        <tbody>
         {bodyRows.map((row, rowIndex) => (
          <tr key={`${rowIndex}-${row.join("|")}`}>
           {row.map((cell, cellIndex) => (
            <td
             key={`${cellIndex}-${cell}`}
             className="border-b border-border-subtle px-3 py-2 align-top text-text-secondary last:border-b-0"
            >
             {renderMarkdownInline(cell)}
            </td>
           ))}
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     );
    }

    return <hr key={`hr-${index}`} className="border-t border-border-subtle" />;
   })}
  </div>
 );
}
