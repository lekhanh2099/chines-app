"use client";

import { Separator } from "@/components/ui/separator";
import {
 HanziAwareText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
  <section className="grid gap-3 py-1">
   <HanziAwareText
    as="h4"
    text={cleanGrammarDisplayLine(section.title)}
    variant="cardTitle"
    tone="default"
    weight="black"
   />

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
        <HanziAwareText
         text={cleanGrammarDisplayLine(parts.value)}
         variant="code"
         tone="default"
         weight="black"
         leading="relaxed"
        />
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
  </section>
 );
}
