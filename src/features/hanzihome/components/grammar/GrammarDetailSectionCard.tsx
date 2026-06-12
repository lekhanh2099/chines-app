"use client";

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
   <h4 className="text-base font-black text-text-primary">
    {cleanGrammarDisplayLine(section.title)}
   </h4>

   {importantLines.length > 0 && (
    <div className="grid gap-2">
     {importantLines.map((line) => {
      const parts = splitImportantGrammarLine(line);

      return (
       <div
        key={line}
        className="rounded-xl border border-info/30 bg-bg-primary px-3 py-2 shadow-theme-sm"
       >
        {parts.label && (
         <p className="text-xs font-black uppercase tracking-[0.16em] text-info-text">
          {parts.label}
         </p>
        )}
        <p className="mt-1 font-mono font-black leading-relaxed text-text-primary sm:text-base">
         {cleanGrammarDisplayLine(parts.value)}
        </p>
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
