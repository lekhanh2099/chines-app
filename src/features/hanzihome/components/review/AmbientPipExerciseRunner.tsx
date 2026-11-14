"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { INTERACTION_REGISTRY } from "@/features/hanzihome/components/practice/exercise-interaction-registry";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";
import { AmbientPipExerciseFeedback } from "./AmbientPipExerciseFeedback";
import { AmbientPipExerciseFooter } from "./AmbientPipExerciseFooter";
import { AmbientPipExerciseSummary } from "./AmbientPipExerciseSummary";
import { useAmbientPipExerciseSession } from "./useAmbientPipExerciseSession";

export type AmbientPipExerciseRunnerProps = {
 readonly items: readonly UniversalExerciseItem[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly isInline?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

export function AmbientPipExerciseRunner({
 items: rawItems,
 lessonTitle = "Luyện tập bài tập",
 onClose,
 isFloatingInApp = false,
 isInline = false,
 extraHeaderActions,
}: AmbientPipExerciseRunnerProps) {
 const session = useAmbientPipExerciseSession(rawItems);
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
  stopSpeech,
  handleAnswerChange,
  handleCheckCurrent,
  handleNext,
  handlePrev,
  handleRestartAll,
  handleRetryMistakes,
 } = session;
 const rootRef = useRef<HTMLDivElement>(null);

 // Keyboard navigation: Enter to submit or next, Left/Right for prev/next
 useEffect(() => {
  const targetWindow = rootRef.current?.ownerDocument.defaultView;
  if (!targetWindow) return;

  const handleKeyDown = (e: KeyboardEvent) => {
   if (
    e.target instanceof targetWindow.HTMLInputElement ||
    e.target instanceof targetWindow.HTMLTextAreaElement
   ) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
     e.preventDefault();
     if (!isCurrentSubmitted) {
      handleCheckCurrent();
     } else {
      handleNext();
     }
    }
    return;
   }

   if (e.key === "Enter") {
    e.preventDefault();
    if (!isCurrentSubmitted) {
     handleCheckCurrent();
    } else {
     handleNext();
    }
   } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    handlePrev();
   } else if (e.key === "ArrowRight") {
    e.preventDefault();
    handleNext();
   }
  };

  targetWindow.addEventListener("keydown", handleKeyDown);
  return () => targetWindow.removeEventListener("keydown", handleKeyDown);
 }, [handleCheckCurrent, handleNext, handlePrev, isCurrentSubmitted]);

 useEffect(() => {
  return () => {
   stopSpeech();
  };
 }, [stopSpeech]);

 if (totalCount === 0) {
  return (
   <div className="flex h-full w-full items-center justify-center p-4 text-center">
    <StudyInstructionText tone="secondary">
     Không có bài tập nào trong bài học này.
    </StudyInstructionText>
   </div>
  );
 }

 if (isCompleted) {
  return (
   <AmbientPipExerciseSummary
    evaluations={evaluations}
    totalCount={totalCount}
    onClose={onClose}
    handleRetryMistakes={handleRetryMistakes}
    handleRestartAll={handleRestartAll}
   />
  );
 }

 if (!currentItem) {
  return null;
 }

 const InteractionComponent = INTERACTION_REGISTRY[currentItem.interaction.type];

 const content = (
  <>
   {/* Top Bar */}
   <div className="border-b border-border-default/40 bg-surface-muted/30 px-3 py-1.5">
    <div className="flex items-center justify-between gap-2">
     <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
      <Badge variant="accent" size="sm" casing="natural" className="shrink-0">
       {`Câu ${currentIndex + 1}/${totalCount}`}
      </Badge>
      <StudyInstructionText tone="secondary" weight="bold" clamp="one">
       {currentItem.title || lessonTitle}
      </StudyInstructionText>
     </div>

     <div className="flex shrink-0 items-center gap-1">
      {extraHeaderActions}

      <Button
       type="button"
       variant="ghost"
       size="toolbar"
       onClick={() => {
        const shouldSpeakPrompt =
         !isCurrentSubmitted &&
         currentItem.interaction.type === "choice" &&
         !/[\u4e00-\u9fff]/u.test(currentItem.prompt);
        if (shouldSpeakPrompt) {
         speak(currentItem.prompt, { lang: "vi-VN" });
         return;
        }
        speak(currentItem.audioText || currentItem.prompt);
       }}
       aria-label="Phát âm câu hỏi"
      >
       <Volume2 className="size-3.5 text-primary" />
      </Button>

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
    </div>
   </div>

   {/* Interactive Body */}
   <div className="flex flex-1 flex-col justify-start gap-2.5 overflow-y-auto px-4 py-3">
    {/* Prompt */}
    <div className="text-left">
     <HanziText as="p" size="inherit" weight="bold" leading="relaxed">
      {currentItem.prompt}
     </HanziText>
     {currentItem.promptTranslation ? (
      <StudyInstructionText variant="caption" tone="secondary">
       {currentItem.promptTranslation}
      </StudyInstructionText>
     ) : null}
    </div>

    {/* Interaction Component */}
    <div className="text-left">
     <InteractionComponent
      item={currentItem}
      value={currentAnswer}
      onChange={handleAnswerChange}
      isSubmitted={isCurrentSubmitted}
      isCorrect={currentEvaluation}
      onSubmit={handleCheckCurrent}
     />
    </div>

    {/* Evaluation Feedback Banner */}
    {isCurrentSubmitted ? (
     <AmbientPipExerciseFeedback currentItem={currentItem} currentEvaluation={currentEvaluation} />
    ) : null}
   </div>

   {/* Bottom Navigation Toolbar */}
   <AmbientPipExerciseFooter session={session} />
  </>
 );

 if (isFloatingInApp) {
  return (
   <Card
    ref={rootRef}
    variant="elevated"
    padding="none"
    className="fixed bottom-5 right-5 z-50 flex h-84 w-96 max-w-[calc(100vw-2.5rem)] flex-col justify-between overflow-hidden select-none"
   >
    {content}
   </Card>
  );
 }

 if (isInline) {
  return (
   <div
    ref={rootRef}
    className="flex h-96 w-full flex-col justify-between overflow-hidden rounded-xl border border-border-default/60 bg-surface select-none"
   >
    {content}
   </div>
  );
 }

 return (
  <div
   ref={rootRef}
   className="flex h-screen w-screen flex-col justify-between overflow-hidden select-none bg-surface"
  >
   {content}
  </div>
 );
}
