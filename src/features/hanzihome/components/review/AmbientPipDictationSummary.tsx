"use client";

import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { AmbientPipDictationSession } from "./useAmbientPipDictationSession";

/** Completion summary with accuracy / speed badges and retry actions. */
export function AmbientPipDictationSummary({ session }: { session: AmbientPipDictationSession }) {
 const { isRetryingMistakes, activeItems, summaryStats, handleRetryMistakes, handleRestartAll } =
  session;
 return (
  <div className="grid gap-3 rounded-xl border border-border-default/60 bg-bg-subtle p-3.5 text-center">
   <div className="flex flex-col items-center justify-center gap-1">
    <div className="flex size-9 items-center justify-center rounded-full bg-success-subtle text-success-text">
     <Trophy className="size-5" />
    </div>
    <Typography as="h3" variant="cardTitle" weight="black">
     {isRetryingMistakes ? "Hoàn thành phần luyện lại!" : "Hoàn thành bài luyện!"}
    </Typography>
    <StudyInstructionText variant="caption" tone="muted">
     {`Đã hoàn thành ${activeItems.length} từ vựng`}
    </StudyInstructionText>
   </div>

   <div className="flex flex-wrap items-center justify-center gap-1.5">
    <Badge variant={summaryStats.accuracy >= 90 ? "success" : "warning"} casing="natural">
     {`Chính xác: ${summaryStats.accuracy}%`}
    </Badge>
    {summaryStats.avgCpm > 0 ? (
     <Badge casing="natural">
      <span aria-hidden="true">⚡</span>
      <span>{`${summaryStats.avgCpm} CPM`}</span>
     </Badge>
    ) : null}
    <Badge variant={summaryStats.mistakes.length === 0 ? "success" : "default"} casing="natural">
     {summaryStats.mistakes.length === 0
      ? "Đúng 100% tất cả"
      : `${summaryStats.mistakes.length} từ cần ôn`}
    </Badge>
   </div>

   <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
    {summaryStats.mistakes.length > 0 ? (
     <Button type="button" variant="default" size="compact" onClick={handleRetryMistakes}>
      <RotateCcw className="size-3.5" />
      <span>{`Luyện lại ${summaryStats.mistakes.length} từ sai`}</span>
     </Button>
    ) : null}

    <Button
     type="button"
     variant={summaryStats.mistakes.length > 0 ? "outline" : "default"}
     size="compact"
     onClick={handleRestartAll}
    >
     <RotateCcw className="size-3.5" />
     <span>Luyện lại tất cả</span>
    </Button>
   </div>
  </div>
 );
}
