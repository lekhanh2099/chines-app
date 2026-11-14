"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import type { useUniversalExerciseSession } from "./useUniversalExerciseSession";

/** Previous / check / retry / next actions under the current question. */
export function UniversalExerciseActionBar({
 session,
}: {
 session: ReturnType<typeof useUniversalExerciseSession>;
}) {
 const {
  currentIndex,
  totalCount,
  currentAnswer,
  currentEvaluation,
  isCurrentSubmitted,
  handlePrev,
  handleCheckCurrent,
  handleRetryCurrent,
  handleNext,
 } = session;

 return (
  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default/50 pt-3">
   <Button
    type="button"
    variant="ghost"
    size="compact"
    disabled={currentIndex === 0}
    onClick={handlePrev}
    aria-label="Câu trước đó"
   >
    <ChevronLeft className="size-4" />
    <span>Trước</span>
   </Button>

   <div className="flex items-center gap-2">
    {!isCurrentSubmitted ? (
     <Button
      type="button"
      variant="default"
      size="compact"
      disabled={!currentAnswer.trim()}
      onClick={handleCheckCurrent}
     >
      <span>Kiểm tra</span>
      <span className="hidden text-xs opacity-70 sm:inline">(Enter)</span>
     </Button>
    ) : (
     <>
      {currentEvaluation === false ? (
       <Button type="button" variant="outline" size="compact" onClick={handleRetryCurrent}>
        <RotateCcw className="size-3.5" />
        <span>Thử lại</span>
       </Button>
      ) : null}

      <Button type="button" variant="default" size="compact" onClick={handleNext}>
       <span>{currentIndex + 1 === totalCount ? "Hoàn thành" : "Tiếp theo"}</span>
       <ChevronRight className="size-4" />
      </Button>
     </>
    )}
   </div>
  </div>
 );
}
