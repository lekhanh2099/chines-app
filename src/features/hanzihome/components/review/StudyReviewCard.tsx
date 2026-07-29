"use client";

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

 return (
  <div
   role="button"
   tabIndex={0}
   onClick={onReveal}
   onTouchStart={touchHandlers.onTouchStart}
   onTouchEnd={touchHandlers.onTouchEnd}
   className="grid min-h-80 w-full touch-pan-y select-none place-items-center rounded-xl border border-border-default bg-bg-primary p-3 text-center shadow-theme-sm transition-colors hover:border-accent-muted sm:p-4"
  >
   <div className="grid w-full max-w-3xl gap-3">
    {isGrammar ? <GrammarReviewFront item={item} /> : <VocabReviewFront item={item} />}

    {revealed ? (
     <StudyReviewBack
      item={item}
      onOpenDetail={onOpenDetail}
      selectedWritingIndex={selectedWritingIndex}
      onSelectedWritingIndexChange={onSelectedWritingIndexChange}
     />
    ) : (
     <StudyInstructionText tone="muted" weight="bold" className="rounded-xl bg-bg-subtle p-4">
      {isGrammar
       ? "Tự nhớ ý nghĩa, công thức và ví dụ trước khi mở đáp án."
       : "Bấm vào thẻ hoặc nhấn Space để lật đáp án."}
     </StudyInstructionText>
    )}
   </div>
  </div>
 );
}
