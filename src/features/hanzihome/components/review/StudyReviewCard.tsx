"use client";

import { ActionCard } from "@/components/ui/action-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { useFlashcardControls } from "@/features/hanzihome/hooks/useFlashcardControls";
import type { ReviewItem } from "@/features/hanzihome/hooks/useVocabReviewSession";
import { GrammarReviewFront } from "./GrammarReviewFront";
import { StudyReviewBack } from "./StudyReviewBack";
import { VocabReviewFront } from "./VocabReviewFront";

type StudyReviewCardProps = {
 item: ReviewItem;
 revealed: boolean;
 onReveal: () => void;
 onOpenDetail: () => void;
 selectedWritingIndex: number;
 onSelectedWritingIndexChange: (index: number) => void;
 touchHandlers: ReturnType<typeof useFlashcardControls>;
};

export function StudyReviewCard({
 item,
 revealed,
 onReveal,
 onOpenDetail,
 selectedWritingIndex,
 onSelectedWritingIndexChange,
 touchHandlers,
}: StudyReviewCardProps) {
 const isGrammar = item.type === "grammar";
 const front = isGrammar ? <GrammarReviewFront item={item} /> : <VocabReviewFront item={item} />;

 if (!revealed) {
  return (
   <ActionCard
    padding="md"
    onClick={onReveal}
    onTouchStart={touchHandlers.onTouchStart}
    onTouchEnd={touchHandlers.onTouchEnd}
    className="grid min-h-80 w-full touch-pan-y select-none place-items-center text-center"
    aria-label="Lật thẻ để xem đáp án"
   >
    <span className="grid w-full max-w-3xl gap-3">
     {front}
     <StudyInstructionText tone="muted" weight="bold">
      {isGrammar
       ? "Tự nhớ ý nghĩa, công thức và ví dụ trước khi mở đáp án."
       : "Bấm vào thẻ hoặc nhấn Enter / Space để lật đáp án."}
     </StudyInstructionText>
    </span>
   </ActionCard>
  );
 }

 return (
  <Card
   variant="section"
   padding="md"
   className="grid min-h-80 w-full touch-pan-y select-none place-items-center text-center"
   onTouchStart={touchHandlers.onTouchStart}
   onTouchEnd={touchHandlers.onTouchEnd}
  >
   <div className="grid w-full max-w-3xl gap-3">
    {front}
    <StudyReviewBack
     item={item}
     onOpenDetail={onOpenDetail}
     selectedWritingIndex={selectedWritingIndex}
     onSelectedWritingIndexChange={onSelectedWritingIndexChange}
    />
    <div className="flex justify-end">
     <Button type="button" variant="ghost" size="toolbar" onClick={onReveal}>
      Ẩn đáp án
     </Button>
    </div>
   </div>
  </Card>
 );
}
