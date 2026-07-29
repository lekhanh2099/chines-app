"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import {
 cleanGrammarDisplayLine,
 isImportantGrammarLine,
 splitImportantGrammarLine,
 type GrammarDetailSection,
} from "./grammar-display";

export function GrammarDetailSectionCard({ section }: { section: GrammarDetailSection }) {
 const importantLines = section.lines.filter(isImportantGrammarLine);
 const bodyLines = section.lines.filter((line) => !isImportantGrammarLine(line));

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 sm:p-4">
   <Typography as="h4" variant="cardTitle" tone="default" weight="black">
    {cleanGrammarDisplayLine(section.title)}
   </Typography>

   {importantLines.length > 0 && (
    <div className="grid gap-2">
     {importantLines.map((line, index) => {
      const parts = splitImportantGrammarLine(line);

      return (
       <div
        key={`${section.id}-important-line-${index}`}
        className="rounded-xl border border-info/30 bg-bg-primary px-3 py-2 shadow-theme-sm"
       >
        {parts.label && (
         <StudyInstructionText
          variant="overline"
          tone="info"
          weight="black"
          tracking="loose"
          transform="uppercase"
         >
          {parts.label}
         </StudyInstructionText>
        )}
        <StudyInstructionText
         variant="code"
         tone="default"
         weight="black"
         leading="relaxed"
         className="mt-1"
        >
         {cleanGrammarDisplayLine(parts.value)}
        </StudyInstructionText>
       </div>
      );
     })}
    </div>
   )}

   {bodyLines.length > 0 && (
    <MarkdownContent
     content={bodyLines.map(cleanGrammarDisplayLine).join("\n")}
     className="gap-2"
    />
   )}
  </div>
 );
}
