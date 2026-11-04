"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle2, Trophy, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/layout/card";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { INTERACTION_REGISTRY } from "./exercise-interaction-registry";
import { evaluateUniversalAnswer } from "./universal-exercise-adapter";
import type { UniversalExerciseItem } from "./universal-exercise.types";

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
 const [retryingMistakes, setRetryingMistakes] = useState<readonly UniversalExerciseItem[] | null>(
  null,
 );
 const [prevRawItems, setPrevRawItems] = useState(rawItems);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [answers, setAnswers] = useState<ReadonlyMap<string, string>>(new Map());
 const [evaluations, setEvaluations] = useState<ReadonlyMap<string, boolean>>(new Map());
 const [isCompleted, setIsCompleted] = useState(false);

 if (rawItems !== prevRawItems) {
  setPrevRawItems(rawItems);
  setRetryingMistakes(null);
  setCurrentIndex(0);
  setAnswers(new Map());
  setEvaluations(new Map());
  setIsCompleted(false);
 }

 const activeItems = retryingMistakes ?? rawItems;

 const { speak, stop: stopSpeech } = useFastMandarinSpeech();

 const totalCount = activeItems.length;
 const currentItem = activeItems[currentIndex];
 const currentAnswer = currentItem ? (answers.get(currentItem.id) ?? "") : "";
 const currentEvaluation = currentItem ? evaluations.get(currentItem.id) : undefined;
 const isCurrentSubmitted = currentEvaluation !== undefined;

 const handleAnswerChange = useCallback(
  (value: string) => {
   if (!currentItem) return;
   setAnswers((prev) => new Map(prev).set(currentItem.id, value));
  },
  [currentItem],
 );

 const handleCheckCurrent = useCallback(() => {
  if (!currentItem) return;
  const isCorrect = evaluateUniversalAnswer(currentItem, currentAnswer);
  setEvaluations((prev) => new Map(prev).set(currentItem.id, isCorrect));

  // If correct, play audio for linguistic context
  if (isCorrect && currentItem.audioText) {
   speak(currentItem.audioText);
  }
 }, [currentAnswer, currentItem, speak]);

 const handleNext = useCallback(() => {
  stopSpeech();
  if (currentIndex + 1 < totalCount) {
   setCurrentIndex((prev) => prev + 1);
  } else {
   setIsCompleted(true);
   const correctCount = Array.from(evaluations.values()).filter(Boolean).length;
   onComplete?.({ total: totalCount, correct: correctCount });
  }
 }, [currentIndex, evaluations, onComplete, stopSpeech, totalCount]);

 const handlePrev = useCallback(() => {
  stopSpeech();
  if (currentIndex > 0) {
   setCurrentIndex((prev) => prev - 1);
  }
 }, [currentIndex, stopSpeech]);

 const handleRetryCurrent = useCallback(() => {
  if (!currentItem) return;
  stopSpeech();
  setEvaluations((prev) => {
   const next = new Map(prev);
   next.delete(currentItem.id);
   return next;
  });
 }, [currentItem, stopSpeech]);

 const handleRetryMistakes = useCallback(() => {
  stopSpeech();
  const mistakeItems = activeItems.filter((item) => evaluations.get(item.id) === false);
  if (mistakeItems.length > 0) {
   setRetryingMistakes(mistakeItems);
   setCurrentIndex(0);
   setAnswers(new Map());
   setEvaluations(new Map());
   setIsCompleted(false);
  }
 }, [activeItems, evaluations, stopSpeech]);

 const handleRestartAll = useCallback(() => {
  stopSpeech();
  setRetryingMistakes(null);
  setCurrentIndex(0);
  setAnswers(new Map());
  setEvaluations(new Map());
  setIsCompleted(false);
 }, [stopSpeech]);

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
   </Card>
  </div>
 );
}
