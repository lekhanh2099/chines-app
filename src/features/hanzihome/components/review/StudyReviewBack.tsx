"use client";

import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Lightbulb, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VocabWritingCue } from "@/features/hanzihome/components/VocabWritingCue";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

type StudyReviewBackProps = {
 item: ReviewItem;
 onOpenDetail: () => void;
 selectedWritingIndex: number;
 onSelectedWritingIndexChange: (index: number) => void;
};

export function StudyReviewBack({
 item,
 onOpenDetail,
 selectedWritingIndex,
 onSelectedWritingIndexChange,
}: StudyReviewBackProps) {
 if (item.type === "vocab") {
  const example = item.source.examples[0];

  return (
   <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left sm:p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid min-w-0 gap-1">
      <PinyinText as="p" variant="sectionTitle" tone="default" weight="black">
       {item.source.pinyin}
      </PinyinText>

      <StudyInstructionText tone="secondary" weight="bold">
       {item.source.meaning.hanviet} · {getVocabDisplayMeaning(item.source)}
      </StudyInstructionText>
     </div>

     <Button
      type="button"
      variant="outline"
      className="shrink-0"
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => {
       event.stopPropagation();
       onOpenDetail();
      }}
     >
      Xem chi tiết
      <kbd className="ml-2 rounded bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
       D
      </kbd>
     </Button>
    </div>

    <VocabWritingCue
     word={item.source}
     size={180}
     autoPlay
     selectedIndex={selectedWritingIndex}
     onSelectedIndexChange={onSelectedWritingIndexChange}
    />

    {example && (
     <div className="grid gap-1 rounded-xl border border-border-default bg-bg-card p-3 shadow-theme-sm sm:p-4">
      <HanziText as="p" size="inherit" variant="cardTitle" tone="default" weight="black">
       {example.zh}
      </HanziText>

      {example.pinyin && (
       <PinyinText as="p" tone="muted" weight="bold">
        {example.pinyin}
       </PinyinText>
      )}

      {example.vi && (
       <StudyInstructionText tone="secondary" weight="semibold">
        {example.vi}
       </StudyInstructionText>
      )}
     </div>
    )}
   </div>
  );
 }

 const example = item.source.examplesParsed[0];

 return (
  <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-3 text-left sm:p-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid min-w-0 flex-1 gap-2">
     <div className="exercise-answer-surface grid gap-2 rounded-xl border p-3">
      <div className="flex items-center gap-2">
       <Lightbulb className="h-4 w-4 text-primary" />
       <StudyInstructionText
        variant="overline"
        tone="primary"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        Ý nghĩa
       </StudyInstructionText>
      </div>
      <StudyInstructionText tone="default" weight="bold" leading="relaxed">
       {item.source.core || item.answer}
      </StudyInstructionText>
     </div>
    </div>

    <Button
     type="button"
     variant="outline"
     className="shrink-0"
     onMouseDown={(event) => event.stopPropagation()}
     onTouchStart={(event) => event.stopPropagation()}
     onClick={(event) => {
      event.stopPropagation();
      onOpenDetail();
     }}
    >
     Xem chi tiết
     <kbd className="ml-2 rounded bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
      D
     </kbd>
    </Button>
   </div>

   {item.source.structuresView[0] && (
    <div className="rounded-xl border border-info/30 bg-info-subtle p-3 grid gap-2">
     <div className="flex items-center gap-2">
      <Sigma className="h-4 w-4 text-info-text" />
      <StudyInstructionText
       variant="overline"
       tone="info"
       weight="black"
       tracking="wide"
       transform="uppercase"
      >
       Công thức
      </StudyInstructionText>
     </div>
     <StudyInstructionText variant="code" tone="info" weight="black">
      {item.source.structuresView[0]}
     </StudyInstructionText>
    </div>
   )}

   {example && (
    <div className="rounded-xl border border-border-default bg-bg-primary p-3 shadow-theme-sm sm:p-4">
     <HanziText as="p" size="inherit" variant="cardTitle" tone="default" weight="black">
      {example.zh}
     </HanziText>

     {example.vi && (
      <StudyInstructionText tone="secondary" weight="semibold">
       {example.vi}
      </StudyInstructionText>
     )}
    </div>
   )}
  </div>
 );
}
