"use client";

import {
 HanziText,
 PinyinText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Lightbulb, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
   <Card variant="subtle" padding="md" className="grid gap-3 text-left">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid min-w-0 gap-1">
      <PinyinText as="p" variant="sectionTitle" tone="default" weight="black">
       {item.source.pinyin}
      </PinyinText>

      <StudyInstructionText tone="secondary" weight="bold">
       {item.source.meaning.hanviet} · {getVocabDisplayMeaning(item.source)}
      </StudyInstructionText>
     </div>

     <DetailButton onOpenDetail={onOpenDetail} />
    </div>

    <VocabWritingCue
     word={item.source}
     size={180}
     autoPlay
     selectedIndex={selectedWritingIndex}
     onSelectedIndexChange={onSelectedWritingIndexChange}
    />

    {example ? (
     <>
      <Separator />
      <section className="grid gap-1" aria-label="Ví dụ">
       <HanziText as="p" size="inherit" variant="cardTitle" tone="default" weight="black">
        {example.zh}
       </HanziText>

       {example.pinyin ? (
        <PinyinText as="p" tone="muted" weight="bold">
         {example.pinyin}
        </PinyinText>
       ) : null}

       {example.vi ? (
        <StudyInstructionText tone="secondary" weight="semibold">
         {example.vi}
        </StudyInstructionText>
       ) : null}
      </section>
     </>
    ) : null}
   </Card>
  );
 }

 const example = item.source.examplesParsed[0];

 return (
  <Card variant="subtle" padding="md" className="grid gap-3 text-left">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <section className="grid min-w-0 flex-1 gap-2" aria-label="Ý nghĩa">
     <div className="flex items-center gap-2">
      <Lightbulb className="size-4 text-primary" />
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
    </section>

    <DetailButton onOpenDetail={onOpenDetail} />
   </div>

   {item.source.structuresView[0] ? (
    <>
     <Separator />
     <section className="grid gap-2" aria-label="Công thức">
      <div className="flex items-center gap-2">
       <Sigma className="size-4 text-info-text" />
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
     </section>
    </>
   ) : null}

   {example ? (
    <>
     <Separator />
     <section className="grid gap-1" aria-label="Ví dụ">
      <HanziText as="p" size="inherit" variant="cardTitle" tone="default" weight="black">
       {example.zh}
      </HanziText>
      {example.vi ? (
       <StudyInstructionText tone="secondary" weight="semibold">
        {example.vi}
       </StudyInstructionText>
      ) : null}
     </section>
    </>
   ) : null}
  </Card>
 );
}

function DetailButton({ onOpenDetail }: { onOpenDetail: () => void }) {
 return (
  <Button
   type="button"
   variant="outline"
   size="toolbar"
   className="shrink-0"
   onMouseDown={(event) => event.stopPropagation()}
   onTouchStart={(event) => event.stopPropagation()}
   onClick={(event) => {
    event.stopPropagation();
    onOpenDetail();
   }}
  >
   Xem chi tiết
   <kbd className="rounded-md bg-bg-subtle px-1.5 py-0.5 text-[0.65rem] font-black text-text-muted">
    D
   </kbd>
  </Button>
 );
}
