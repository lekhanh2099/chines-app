"use client";

import { RotateCcw, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { AmbientPipExerciseRunnerProps } from "./AmbientPipExerciseRunner";
import type { useAmbientPipExerciseSession } from "./useAmbientPipExerciseSession";

type AmbientPipExerciseSession = ReturnType<typeof useAmbientPipExerciseSession>;

/** Completion screen: score, retry-mistakes and restart actions. */
export function AmbientPipExerciseSummary({
 evaluations,
 totalCount,
 onClose,
 handleRetryMistakes,
 handleRestartAll,
}: {
 evaluations: AmbientPipExerciseSession["evaluations"];
 totalCount: AmbientPipExerciseSession["totalCount"];
 onClose: AmbientPipExerciseRunnerProps["onClose"];
 handleRetryMistakes: AmbientPipExerciseSession["handleRetryMistakes"];
 handleRestartAll: AmbientPipExerciseSession["handleRestartAll"];
}) {
 const correctCount = Array.from(evaluations.values()).filter(Boolean).length;
 const mistakeCount = totalCount - correctCount;
 const percent = Math.round((correctCount / totalCount) * 100);

 return (
  <div className="flex h-full w-full flex-col justify-between overflow-hidden p-4 text-center bg-surface select-none">
   <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
    <Badge variant="accent" size="sm">
     Hoàn thành
    </Badge>
    {onClose ? (
     <Button
      type="button"
      variant="ghost"
      size="toolbar"
      onClick={onClose}
      aria-label="Đóng cửa sổ nổi"
     >
      <X className="size-3.5" />
     </Button>
    ) : null}
   </div>

   <div className="flex flex-col items-center justify-center gap-2 py-4">
    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
     <Trophy className="size-6" />
    </div>
    <HanziText as="h3" size="card" weight="bold">
     {percent >= 80 ? "Xuất sắc! 🎉" : "Đã xong lượt luyện tập"}
    </HanziText>
    <StudyInstructionText tone="secondary" weight="semibold">
     {`Đúng ${correctCount}/${totalCount} câu (${percent}%)`}
    </StudyInstructionText>
   </div>

   <div className="flex items-center justify-center gap-2 border-t border-border-default/40 pt-3">
    {mistakeCount > 0 ? (
     <Button type="button" variant="default" size="compact" onClick={handleRetryMistakes}>
      <RotateCcw className="size-3.5" />
      <span>{`Luyện lại câu sai (${mistakeCount})`}</span>
     </Button>
    ) : null}
    <Button type="button" variant="outline" size="compact" onClick={handleRestartAll}>
     <span>Luyện lại từ đầu</span>
    </Button>
   </div>
  </div>
 );
}
