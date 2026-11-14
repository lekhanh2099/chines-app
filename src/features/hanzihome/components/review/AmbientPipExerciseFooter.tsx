"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import type { useAmbientPipExerciseSession } from "./useAmbientPipExerciseSession";

/** Previous / check / retry / next navigation for the current question. */
export function AmbientPipExerciseFooter({
 session,
}: {
 session: ReturnType<typeof useAmbientPipExerciseSession>;
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
  <div className="flex items-center justify-between border-t border-border-default/40 bg-surface-muted/20 px-3 py-1.5 text-xs">
   <Button
    type="button"
    variant="ghost"
    size="compact"
    onClick={handlePrev}
    disabled={currentIndex === 0}
    aria-label="Câu trước"
   >
    <ChevronLeft className="size-3.5" />
    <span className="hidden sm:inline">Trước</span>
   </Button>

   <div className="flex items-center gap-1.5">
    {!isCurrentSubmitted ? (
     <Button
      type="button"
      variant="default"
      size="compact"
      onClick={handleCheckCurrent}
      disabled={!currentAnswer.trim()}
     >
      <span>Kiểm tra</span>
     </Button>
    ) : (
     <>
      {!currentEvaluation ? (
       <Button
        type="button"
        variant="outline"
        size="compact"
        onClick={handleRetryCurrent}
        aria-label="Làm lại câu này"
       >
        <RotateCcw className="size-3" />
        <span>Làm lại</span>
       </Button>
      ) : null}
      <Button type="button" variant="default" size="compact" onClick={handleNext}>
       <span>{currentIndex + 1 < totalCount ? "Tiếp" : "Hoàn thành"}</span>
       <ChevronRight className="size-3.5" />
      </Button>
     </>
    )}
   </div>
  </div>
 );
}
