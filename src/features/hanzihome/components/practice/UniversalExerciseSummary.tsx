"use client";

import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { Card } from "@/components/ui/layout/card";
import type { UniversalExerciseRunnerProps } from "./UniversalExerciseRunner";
import type { useUniversalExerciseSession } from "./useUniversalExerciseSession";

type UniversalExerciseSession = ReturnType<typeof useUniversalExerciseSession>;

/** Summary screen: score, retry-mistakes, restart and close actions. */
export function UniversalExerciseSummary({
 evaluations,
 totalCount,
 description,
 onClose,
 handleRetryMistakes,
 handleRestartAll,
}: {
 evaluations: UniversalExerciseSession["evaluations"];
 totalCount: UniversalExerciseSession["totalCount"];
 description: string;
 onClose: UniversalExerciseRunnerProps["onClose"];
 handleRetryMistakes: UniversalExerciseSession["handleRetryMistakes"];
 handleRestartAll: UniversalExerciseSession["handleRestartAll"];
}) {
 const correctCount = Array.from(evaluations.values()).filter(Boolean).length;
 const percentage = Math.round((correctCount / totalCount) * 100);
 const mistakeCount = totalCount - correctCount;

 return (
  <Card
   variant="elevated"
   padding="lg"
   className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center"
  >
   <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
    <Trophy className="size-8" />
   </div>

   <div className="grid gap-1.5">
    <Typography as="h3" variant="sectionTitle" weight="black">
     Hoàn thành bài luyện tập!
    </Typography>
    <Typography variant="bodySmall" tone="secondary">
     {description}
    </Typography>
   </div>

   {/* Score Badge */}
   <div className="flex flex-wrap items-center justify-center gap-3">
    <Badge variant="accent" size="lg" casing="natural">
     {`Kết quả: ${correctCount}/${totalCount} câu đúng (${percentage}%)`}
    </Badge>
    {percentage === 100 ? (
     <Badge variant="success" size="lg" casing="natural">
      Xuất sắc! 🎉
     </Badge>
    ) : null}
   </div>

   {/* Summary Action Buttons */}
   <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
    {mistakeCount > 0 ? (
     <Button type="button" variant="default" size="sm" onClick={handleRetryMistakes}>
      <RotateCcw className="size-4" />
      <span>{`Làm lại ${mistakeCount} câu chưa đúng`}</span>
     </Button>
    ) : null}

    <Button type="button" variant="outline" size="sm" onClick={handleRestartAll}>
     Làm lại từ đầu
    </Button>

    {onClose ? (
     <Button type="button" variant="ghost" size="sm" onClick={onClose}>
      Đóng
     </Button>
    ) : null}
   </div>
  </Card>
 );
}
