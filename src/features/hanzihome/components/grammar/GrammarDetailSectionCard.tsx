"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
  <Card variant="section" padding="md" className="grid gap-3">
   <Typography as="h4" variant="cardTitle" tone="default" weight="black">
    {cleanGrammarDisplayLine(section.title)}
   </Typography>

   {importantLines.length > 0 ? (
    <div className="grid gap-3">
     {importantLines.map((line, index) => {
      const parts = splitImportantGrammarLine(line);

      return (
       <section key={`${section.id}-important-line-${index}`} className="grid gap-1">
        {index > 0 ? <Separator /> : null}
        {parts.label ? (
         <StudyInstructionText
          variant="overline"
          tone="info"
          weight="black"
          tracking="loose"
          transform="uppercase"
         >
          {parts.label}
         </StudyInstructionText>
        ) : null}
        <StudyInstructionText variant="code" tone="default" weight="black" leading="relaxed">
         {cleanGrammarDisplayLine(parts.value)}
        </StudyInstructionText>
       </section>
      );
     })}
    </div>
   ) : null}

   {bodyLines.length > 0 ? (
    <>
     {importantLines.length > 0 ? <Separator /> : null}
     <MarkdownContent
      content={bodyLines.map(cleanGrammarDisplayLine).join("\n")}
      className="gap-2"
     />
    </>
   ) : null}
  </Card>
 );
}
