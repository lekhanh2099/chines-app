"use client";

import { useEffect, type ReactNode } from "react";
import { CheckCircle2, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/layout/card";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { INTERACTION_REGISTRY } from "./exercise-interaction-registry";
import { UniversalExerciseActionBar } from "./UniversalExerciseActionBar";
import { UniversalExerciseSummary } from "./UniversalExerciseSummary";
import type { UniversalExerciseItem } from "./universal-exercise.types";
import { useUniversalExerciseSession } from "./useUniversalExerciseSession";

export type UniversalExerciseRunnerProps = {
 readonly items: readonly UniversalExerciseItem[];
 readonly title?: string;
 readonly description?: string;
 readonly onClose?: () => void;
 readonly onComplete?: (score: { total: number; correct: number }) => void;
 readonly extraActions?: ReactNode;
};

export function UniversalExerciseRunner({
 items: rawItems,
 title = "Luyện tập bài học",
 description = "Hoàn thành từng câu hỏi để củng cố kiến thức ngữ pháp và từ vựng",
 onClose,
 onComplete,
 extraActions,
}: UniversalExerciseRunnerProps) {
 const session = useUniversalExerciseSession({ rawItems, onComplete });
 const {
  totalCount,
  currentIndex,
  currentItem,
  currentAnswer,
  currentEvaluation,
  isCurrentSubmitted,
  evaluations,
  isCompleted,
  speak,
  handleAnswerChange,
  handleCheckCurrent,
  handleNext,
  handlePrev,
  handleRetryMistakes,
  handleRestartAll,
 } = session;

 // Keyboard shortcuts (Enter to check/next, Left/Right arrows)
 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   // Skip if inside an open textarea without modifier
   if (e.target instanceof HTMLTextAreaElement && !e.ctrlKey && !e.metaKey) {
    return;
   }

   if (e.key === "Enter" && !e.isComposing) {
    e.preventDefault();
    if (!isCurrentSubmitted) {
     if (currentAnswer.trim()) {
      handleCheckCurrent();
     }
    } else {
     handleNext();
    }
    return;
   }

   // Arrow keys navigation when not actively typing in an input
   if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
   }

   if (e.key === "ArrowLeft" && currentIndex > 0) {
    e.preventDefault();
    handlePrev();
   } else if (e.key === "ArrowRight" && currentIndex + 1 < totalCount) {
    e.preventDefault();
    handleNext();
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [
  currentAnswer,
  currentIndex,
  handleCheckCurrent,
  handleNext,
  handlePrev,
  isCurrentSubmitted,
  totalCount,
 ]);

 if (totalCount === 0) {
  return (
   <Card variant="subtle" padding="lg" className="text-center">
    <Typography variant="body" tone="secondary">
     Không có câu hỏi luyện tập nào trong bài học này.
    </Typography>
   </Card>
  );
 }

 // Summary Screen
 if (isCompleted) {
  return (
   <UniversalExerciseSummary
    evaluations={evaluations}
    totalCount={totalCount}
    description={description}
    onClose={onClose}
    handleRetryMistakes={handleRetryMistakes}
    handleRestartAll={handleRestartAll}
   />
  );
 }

 if (!currentItem) return null;

 const InteractionView = INTERACTION_REGISTRY[currentItem.interaction.type];
 const progressPercent = ((currentIndex + 1) / totalCount) * 100;
 const correctCount = Array.from(evaluations.values()).filter(Boolean).length;

 return (
  <div className="grid gap-4">
   {/* Optional Runner Title Header */}
   {title ? (
    <div className="grid gap-0.5 pb-0.5">
     <Typography as="h3" variant="sectionTitle" weight="bold">
      {title}
     </Typography>
     {description ? (
      <Typography variant="bodySmall" tone="secondary">
       {description}
      </Typography>
     ) : null}
    </div>
   ) : null}

   {/* Header & Progress Bar */}
   <div className="grid gap-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div className="flex min-w-0 items-center gap-2">
      <Badge variant="accent" size="md" casing="natural">
       {`Câu ${currentIndex + 1} / ${totalCount}`}
      </Badge>
      {currentItem.title ? (
       <StudyInstructionText tone="secondary" weight="bold">
        {currentItem.title}
       </StudyInstructionText>
      ) : null}
     </div>

     <div className="flex items-center gap-2">
      {evaluations.size > 0 ? (
       <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-success" />
        <span>{`${correctCount}/${evaluations.size} đúng`}</span>
       </div>
      ) : null}
      {extraActions}
     </div>
    </div>

    {/* Linear progress bar */}
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-default/40">
     <div
      className="h-full bg-primary transition-all duration-300 ease-out"
      style={{ inlineSize: `${progressPercent}%` }}
     />
    </div>
   </div>

   {/* Main Interactive Question Card */}
   <Card variant="default" padding="md" className="grid gap-4">
    {/* Prompt Area */}
    <div className="grid gap-2">
     <div className="flex items-start justify-between gap-2">
      <div className="grid gap-1 flex-1">
       <HanziText as="h3" size="large" weight="bold" leading="relaxed">
        {currentItem.prompt}
       </HanziText>
       {currentItem.promptTranslation ? (
        <StudyInstructionText tone="secondary" variant="bodySmall">
         {currentItem.promptTranslation}
        </StudyInstructionText>
       ) : null}
      </div>

      {currentItem.audioText ? (
       <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => {
         if (currentItem.audioText) speak(currentItem.audioText);
        }}
        aria-label="Phát âm câu hỏi"
       >
        <Volume2 className="size-4 text-muted-foreground hover:text-primary" />
       </Button>
      ) : null}
     </div>

     {currentItem.hint ? (
      <div className="flex items-center gap-1.5 pt-0.5">
       <Badge variant="default" size="sm" casing="natural">
        {`Gợi ý: ${currentItem.hint}`}
       </Badge>
      </div>
     ) : null}
    </div>

    {/* Render the interaction component via Registry without any switch or if/else */}
    <div className="pt-1">
     <InteractionView
      item={currentItem}
      value={currentAnswer}
      isSubmitted={isCurrentSubmitted}
      isCorrect={currentEvaluation}
      onChange={handleAnswerChange}
      onSubmit={handleCheckCurrent}
     />
    </div>

    {/* Question Action Toolbar */}
    <UniversalExerciseActionBar session={session} />
   </Card>
  </div>
 );
}
