"use client";

import {
 HanziAwareText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { StructuredGrammarContent } from "@/features/hanzihome/components/grammar/StructuredGrammarContent";
import type { GrammarViewModel } from "@/features/hanzihome/types";

export function AllGrammarPointReader({ points }: { points: GrammarViewModel[] }) {
 return (
  <div className="grid gap-4">
   {points.map((point, index) => {
    return (
     <div key={point.id}>
      <article className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-theme-sm">
       <div className="grid gap-3">
        <div className="grid gap-1">
         <StudyInstructionText
          variant="overline"
          tone="muted"
          weight="black"
          tracking="wide"
          transform="uppercase"
         >
          Điểm ngữ pháp {index + 1}
         </StudyInstructionText>
         <HanziAwareText
          as="h2"
          text={point.cleanTitle}
          variant="sectionTitle"
          tone="default"
          weight="black"
         />
        </div>

        <StructuredGrammarContent point={point} exampleLimit={5} />
       </div>
      </article>
     </div>
    );
   })}
  </div>
 );
}
