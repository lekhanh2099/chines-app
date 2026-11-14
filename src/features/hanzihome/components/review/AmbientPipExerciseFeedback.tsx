"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import { getTargetAnswer } from "./pip-exercise-utils";
import type { useAmbientPipExerciseSession } from "./useAmbientPipExerciseSession";

/** Correct / incorrect banner shown after the current question is checked. */
export function AmbientPipExerciseFeedback({
 currentItem,
 currentEvaluation,
}: {
 currentItem: UniversalExerciseItem;
 currentEvaluation: ReturnType<typeof useAmbientPipExerciseSession>["currentEvaluation"];
}) {
 return (
  <div
   className={`grid gap-1 rounded-xl border p-2 text-left text-xs ${
    currentEvaluation
     ? "border-success/30 bg-success-subtle text-success-text"
     : "border-danger/30 bg-danger-subtle text-danger-text"
   }`}
  >
   <div className="flex items-center gap-1.5 font-bold">
    {currentEvaluation ? (
     <>
      <CheckCircle2 className="size-3.5 text-success" />
      <span>Chính xác!</span>
     </>
    ) : (
     <>
      <XCircle className="size-3.5 text-danger" />
      <span>Chưa chính xác</span>
     </>
    )}
   </div>
   {!currentEvaluation && getTargetAnswer(currentItem) ? (
    <div>
     <span className="font-semibold">Đáp án đúng: </span>
     <span className="font-bold underline">{getTargetAnswer(currentItem)}</span>
    </div>
   ) : null}
   {currentItem.hint ? (
    <StudyInstructionText variant="caption" tone="muted">
     {currentItem.hint}
    </StudyInstructionText>
   ) : null}
  </div>
 );
}
