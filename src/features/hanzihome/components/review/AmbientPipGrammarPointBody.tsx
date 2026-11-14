"use client";

import type { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { PipGrammarPoint } from "./pip-grammar-adapter";
import type { usePipAutoAdvance } from "./usePipAutoAdvance";

/** Title, formula, explanation, collocations and the paged example sentence of one grammar point. */
export function AmbientPipGrammarPointBody({
 currentItem,
 exampleIndex,
 setExampleIndex,
 speakTracked,
}: {
 currentItem: PipGrammarPoint;
 exampleIndex: number;
 setExampleIndex: Dispatch<SetStateAction<number>>;
 speakTracked: ReturnType<typeof usePipAutoAdvance>["speakTracked"];
}) {
 const examples = currentItem.examples;
 const currentExample = examples[exampleIndex] ?? examples[0];

 return (
  <div className="flex flex-1 flex-col justify-start gap-2.5 overflow-y-auto px-4 py-3">
   {/* Title & Pattern */}
   <div className="flex items-start justify-between gap-2">
    <HanziText as="h3" size="card" weight="black" leading="snug" className="text-left">
     {currentItem.title}
    </HanziText>
    <Button
     type="button"
     variant="ghost"
     size="icon-xs"
     onClick={() => speakTracked(currentItem.title)}
     aria-label={`Phát âm ${currentItem.title}`}
     className="shrink-0"
    >
     <Volume2 className="size-3.5" />
    </Button>
   </div>

   {/* Formula Pill if present */}
   {currentItem.formula ? (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-left">
     <StudyInstructionText variant="caption" tone="accent" weight="bold">
      Công thức:
     </StudyInstructionText>{" "}
     <span className="text-xs font-semibold text-foreground">{currentItem.formula}</span>
    </div>
   ) : null}

   {/* Explanation / Cách dùng */}
   {currentItem.explanation ? (
    <div className="text-left">
     <StudyInstructionText variant="bodySmall" tone="secondary" leading="relaxed">
      {currentItem.explanation}
     </StudyInstructionText>
    </div>
   ) : null}

   {/* Common Collocations / Cụm từ thường gặp */}
   {currentItem.commonPhrases && currentItem.commonPhrases.length > 0 ? (
    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-left">
     <StudyInstructionText variant="caption" tone="muted" weight="bold">
      Cụm từ:
     </StudyInstructionText>
     {currentItem.commonPhrases.map((phrase) => (
      <Button
       key={phrase}
       type="button"
       variant="outline"
       size="compact"
       onClick={() => speakTracked(phrase)}
       title={`Bấm để nghe phát âm "${phrase}"`}
      >
       {phrase}
      </Button>
     ))}
    </div>
   ) : null}

   {/* Example Sentences */}
   {currentExample ? (
    <div className="mt-auto flex flex-col gap-1.5 rounded-xl border border-border-default/60 bg-surface-subtle p-2.5 text-left">
     <div className="flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1">
       <Badge variant="default" size="sm">
        {`Ví dụ ${exampleIndex + 1}/${examples.length}`}
       </Badge>
      </div>

      <div className="flex items-center gap-1">
       {examples.length > 1 ? (
        <>
         <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={exampleIndex === 0}
          onClick={() => setExampleIndex((prev) => prev - 1)}
          aria-label="Ví dụ trước"
         >
          <ChevronLeft className="size-3" />
         </Button>
         <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={exampleIndex >= examples.length - 1}
          onClick={() => setExampleIndex((prev) => prev + 1)}
          aria-label="Ví dụ sau"
         >
          <ChevronRight className="size-3" />
         </Button>
        </>
       ) : null}

       <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => speakTracked(currentExample.zh)}
        aria-label="Phát âm câu ví dụ"
       >
        <Volume2 className="size-3.5 text-primary" />
       </Button>
      </div>
     </div>

     <HanziText as="p" size="inherit" weight="semibold" leading="relaxed">
      {currentExample.zh}
     </HanziText>

     {currentExample.vi ? (
      <StudyInstructionText variant="caption" tone="secondary">
       {currentExample.vi}
      </StudyInstructionText>
     ) : null}
    </div>
   ) : null}
  </div>
 );
}
