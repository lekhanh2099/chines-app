"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
 CheckCircle2,
 ChevronLeft,
 ChevronRight,
 RotateCcw,
 Trophy,
 Volume2,
 X,
 XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { INTERACTION_REGISTRY } from "@/features/hanzihome/components/practice/exercise-interaction-registry";
import { evaluateUniversalAnswer } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import type { UniversalExerciseItem } from "@/features/hanzihome/components/practice/universal-exercise.types";

function getTargetAnswer(item: UniversalExerciseItem): string | undefined {
 const interaction = item.interaction;
 if (interaction.type === "cloze") {
  return interaction.expectedAnswer;
 }
 if (interaction.type === "choice") {
  const opt = interaction.options.find((o) => o.key === interaction.correctKey);
  return opt ? `${opt.key}. ${opt.label}` : interaction.correctKey;
 }
 if (interaction.type === "reorder") {
  return interaction.correctOrder.join(" ");
 }
 if (interaction.type === "open") {
  return interaction.suggestedAnswer;
 }
 return undefined;
}

export type AmbientPipExerciseRunnerProps = {
 readonly items: readonly UniversalExerciseItem[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

export function AmbientPipExerciseRunner({
 items: rawItems,
 lessonTitle = "Luyện tập bài tập",
 onClose,
 isFloatingInApp = false,
 extraHeaderActions,
}: AmbientPipExerciseRunnerProps) {
 const [retryingMistakes, setRetryingMistakes] = useState<readonly UniversalExerciseItem[] | null>(
  null,
 );
 const [prevRawItems, setPrevRawItems] = useState(rawItems);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [answers, setAnswers] = useState<ReadonlyMap<string, string>>(new Map());
 const [evaluations, setEvaluations] = useState<ReadonlyMap<string, boolean>>(new Map());
 const [isCompleted, setIsCompleted] = useState(false);
 const rootRef = useRef<HTMLDivElement>(null);

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
  }
 }, [currentIndex, stopSpeech, totalCount]);

 const handlePrev = useCallback(() => {
  stopSpeech();
  if (currentIndex > 0) {
   setCurrentIndex((prev) => prev - 1);
  }
 }, [currentIndex, stopSpeech]);

 const handleRetryCurrent = useCallback(() => {
  if (!currentItem) return;
  stopSpeech();
  setAnswers((prev) => {
   const next = new Map(prev);
   next.delete(currentItem.id);
   return next;
  });
  setEvaluations((prev) => {
   const next = new Map(prev);
   next.delete(currentItem.id);
   return next;
  });
 }, [currentItem, stopSpeech]);

 const handleRestartAll = useCallback(() => {
  stopSpeech();
  setRetryingMistakes(null);
  setAnswers(new Map());
  setEvaluations(new Map());
  setCurrentIndex(0);
  setIsCompleted(false);
 }, [stopSpeech]);

 const handleRetryMistakes = useCallback(() => {
  stopSpeech();
  const mistakes = activeItems.filter((item) => evaluations.get(item.id) === false);
  if (mistakes.length === 0) return;
  setRetryingMistakes(mistakes);
  setAnswers(new Map());
  setEvaluations(new Map());
  setCurrentIndex(0);
  setIsCompleted(false);
 }, [activeItems, evaluations, stopSpeech]);

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
       onClick={() => speak(currentItem.audioText || currentItem.prompt)}
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
    ) : null}
   </div>

   {/* Bottom Navigation Toolbar */}
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

 return (
  <div
   ref={rootRef}
   className="flex h-screen w-screen flex-col justify-between overflow-hidden select-none bg-surface"
  >
   {content}
  </div>
 );
}
