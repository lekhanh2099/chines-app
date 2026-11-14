"use client";

import { Volume2 } from "lucide-react";
import { ActionCard } from "@/components/ui/actions/action-card";
import { Button } from "@/components/ui/actions/button";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import type { usePipAutoAdvance } from "./usePipAutoAdvance";

function renderHighlightedZh(text: string, targetHanzi: string) {
 if (!targetHanzi || !text.includes(targetHanzi)) {
  return text;
 }
 const parts = text.split(targetHanzi);
 return (
  <>
   {parts.map((part, index) => (
    <span key={index}>
     {part}
     {index < parts.length - 1 ? (
      <StudyInstructionText as="span" tone="accent" weight="black">
       {targetHanzi}
      </StudyInstructionText>
     ) : null}
    </span>
   ))}
  </>
 );
}

/** Clickable flip surface: Hanzi + context sentence on the front, pinyin / meaning on the back. */
export function AmbientPipFlashcardSurface({
 currentItem,
 isFlipped,
 onToggleFlip,
 speakTracked,
}: {
 currentItem: HanziHomeVocabItem;
 isFlipped: boolean;
 onToggleFlip: () => void;
 speakTracked: ReturnType<typeof usePipAutoAdvance>["speakTracked"];
}) {
 const example = currentItem.examples[0];

 return (
  <div className="relative flex flex-1 flex-col justify-center px-4 py-2 text-center">
   <ActionCard
    padding="none"
    onClick={onToggleFlip}
    className="absolute inset-0 h-full w-full"
    aria-label="Lật thẻ xem phiên âm hoặc nghĩa"
   />

   <div className="pointer-events-none relative z-10 grid gap-2">
    {!isFlipped ? (
     /* Front: Hanzi Hero + Context Sentence */
     <div className="grid gap-2">
      <div className="flex items-center justify-center gap-2">
       <HanziText as="h3" size="card" weight="black" tracking="normal">
        {currentItem.hanzi}
       </HanziText>
       <div className="pointer-events-auto">
        <Button
         type="button"
         variant="ghost"
         size="icon-xs"
         onClick={(e) => {
          e.stopPropagation();
          speakTracked(currentItem.hanzi, { rate: 1.15 });
         }}
         aria-label={`Phát âm ${currentItem.hanzi}`}
        >
         <Volume2 className="size-3.5" />
        </Button>
       </div>
      </div>

      {example ? (
       <div className="mx-auto flex max-w-xs items-start gap-1.5 rounded-xl border border-border-default/50 bg-bg-subtle p-2 text-left">
        <div className="flex-1">
         <HanziText as="p" size="inherit" weight="semibold" leading="relaxed">
          {renderHighlightedZh(example.zh, currentItem.hanzi)}
         </HanziText>
        </div>
        <div className="pointer-events-auto shrink-0">
         <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
           e.stopPropagation();
           speakTracked(example.zh);
          }}
          aria-label="Phát âm câu ví dụ"
         >
          <Volume2 className="size-3 text-muted-foreground hover:text-primary" />
         </Button>
        </div>
       </div>
      ) : null}

      <StudyInstructionText variant="caption" tone="muted">
       Nhấn để xem phiên âm & nghĩa
      </StudyInstructionText>
     </div>
    ) : (
     /* Back: Pinyin, Hanviet, Meaning, Sentence Translation */
     <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
       <StudyInstructionText tone="accent" weight="bold">
        {currentItem.pinyin}
       </StudyInstructionText>
       <StudyInstructionText tone="muted">·</StudyInstructionText>
       <StudyInstructionText tone="default" weight="bold">
        {currentItem.meaning.hanviet}
       </StudyInstructionText>
      </div>

      <StudyInstructionText tone="secondary" weight="semibold">
       {getVocabDisplayMeaning(currentItem)}
      </StudyInstructionText>

      {example ? (
       <div className="mx-auto flex max-w-xs items-start gap-1.5 rounded-xl border border-border-default/50 bg-bg-subtle p-2 text-left">
        <div className="grid flex-1 gap-1">
         <HanziText as="p" size="inherit" weight="semibold" leading="relaxed">
          {renderHighlightedZh(example.zh, currentItem.hanzi)}
         </HanziText>
         {example.vi ? (
          <StudyInstructionText tone="secondary" variant="caption">
           {example.vi}
          </StudyInstructionText>
         ) : null}
        </div>
        <div className="pointer-events-auto shrink-0">
         <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
           e.stopPropagation();
           speakTracked(example.zh);
          }}
          aria-label="Phát âm câu ví dụ"
         >
          <Volume2 className="size-3 text-muted-foreground hover:text-primary" />
         </Button>
        </div>
       </div>
      ) : null}

      <StudyInstructionText variant="caption" tone="muted">
       Nhấn để quay lại mặt chữ Hán
      </StudyInstructionText>
     </div>
    )}
   </div>
  </div>
 );
}
