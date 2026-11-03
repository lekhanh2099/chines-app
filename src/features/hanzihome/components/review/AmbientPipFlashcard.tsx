"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, X, RotateCw } from "lucide-react";
import { ActionCard } from "@/components/ui/actions/action-card";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { MandarinSpeakButton } from "@/features/hanzihome/listening/MandarinSpeakButton";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

export type AmbientPipFlashcardProps = {
 readonly items: readonly HanziHomeVocabItem[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
};

const INTERVAL_OPTIONS: readonly number[] = [10, 15, 30, 60];

export function AmbientPipFlashcard({
 items,
 lessonTitle = "Ôn tập nhận diện",
 onClose,
 isFloatingInApp = false,
}: AmbientPipFlashcardProps) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [isFlipped, setIsFlipped] = useState(false);
 const [isAutoPlay, setIsAutoPlay] = useState(true);
 const [intervalSeconds, setIntervalSeconds] = useState<number>(15);
 const [remainingSeconds, setRemainingSeconds] = useState<number>(15);

 const totalCount = items.length;
 const currentItem = items[currentIndex] ?? items[0];

 const handleNext = useCallback(() => {
  if (totalCount === 0) return;
  setCurrentIndex((prev) => (prev + 1) % totalCount);
  setIsFlipped(false);
  setRemainingSeconds(intervalSeconds);
 }, [totalCount, intervalSeconds]);

 const handlePrev = useCallback(() => {
  if (totalCount === 0) return;
  setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
  setIsFlipped(false);
  setRemainingSeconds(intervalSeconds);
 }, [totalCount, intervalSeconds]);

 const handleToggleFlip = useCallback(() => {
  setIsFlipped((prev) => !prev);
 }, []);

 const handleToggleAuto = useCallback(() => {
  setIsAutoPlay((prev) => !prev);
 }, []);

 const handleCycleInterval = useCallback(() => {
  setIntervalSeconds((prev) => {
   const idx = INTERVAL_OPTIONS.indexOf(prev);
   const nextIdx = idx >= 0 && idx < INTERVAL_OPTIONS.length - 1 ? idx + 1 : 0;
   const nextSec = INTERVAL_OPTIONS[nextIdx] ?? 15;
   setRemainingSeconds(nextSec);
   return nextSec;
  });
 }, []);

 useEffect(() => {
  if (!isAutoPlay || totalCount <= 1) return;

  const timer = setInterval(() => {
   setRemainingSeconds((prev) => {
    if (prev <= 1) {
     handleNext();
     return intervalSeconds;
    }

    if (prev === Math.floor(intervalSeconds / 2) && !isFlipped) {
     setIsFlipped(true);
    }

    return prev - 1;
   });
  }, 1000);

  return () => clearInterval(timer);
 }, [handleNext, intervalSeconds, isAutoPlay, isFlipped, totalCount]);

 if (!currentItem) {
  return null;
 }

 const example = currentItem.examples[0];
 const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / intervalSeconds) * 100));

 return (
  <Card
   variant="elevated"
   padding="none"
   className={[
    "flex flex-col justify-between overflow-hidden select-none",
    isFloatingInApp
     ? "fixed bottom-5 right-5 z-50 w-92 max-w-[calc(100vw-2.5rem)]"
     : "h-full w-full min-h-[220px]",
   ].join(" ")}
  >
   {/* Window Title & Progress Bar */}
   <div className="border-b border-border-default/40 bg-surface-muted/30 px-3.5 py-2">
    <div className="flex items-center justify-between gap-2">
     <div className="flex min-w-0 items-center gap-1.5">
      <Badge variant="accent" size="sm" casing="natural">
       {`${currentIndex + 1}/${totalCount}`}
      </Badge>
      <StudyInstructionText tone="secondary" weight="bold" clamp="one">
       {lessonTitle}
      </StudyInstructionText>
     </div>

     <div className="flex items-center gap-1">
      <Button
       type="button"
       variant="ghost"
       size="toolbar"
       onClick={handleToggleAuto}
       title={isAutoPlay ? "Tạm dừng lướt tự động" : "Tiếp tục lướt tự động"}
       aria-label={isAutoPlay ? "Tạm dừng" : "Tiếp tục"}
      >
       {isAutoPlay ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </Button>

      {onClose ? (
       <Button
        type="button"
        variant="ghost"
        size="toolbar"
        onClick={onClose}
        title="Đóng cửa sổ nổi"
        aria-label="Đóng"
       >
        <X className="size-3.5" />
       </Button>
      ) : null}
     </div>
    </div>
   </div>

   {/* Timer progress bar */}
   {isAutoPlay ? (
    <div className="h-0.5 w-full overflow-hidden bg-border-default/30" aria-hidden="true">
     <div
      className="h-full bg-primary transition-all duration-1000 ease-linear"
      style={{ inlineSize: `${progressPercent}%` }}
     />
    </div>
   ) : null}

   {/* Card Interactive Surface */}
   <div className="relative flex flex-1 flex-col justify-center px-4 py-3 text-center">
    <ActionCard
     padding="none"
     onClick={handleToggleFlip}
     className="absolute inset-0 h-full w-full"
     aria-label="Lật thẻ xem phiên âm hoặc nghĩa"
    />

    <div className="pointer-events-none relative z-10 grid gap-2">
     {!isFlipped ? (
      /* Front: Hanzi Hero + Context Sentence */
      <div className="grid gap-2">
       <div className="flex items-center justify-center gap-2">
        <HanziText as="h3" size="card" weight="black" tracking="normal">
         {currentItem.hanzi}
        </HanziText>
        <div className="pointer-events-auto">
         <MandarinSpeakButton text={currentItem.hanzi} touchTarget />
        </div>
       </div>

       {example ? (
        <div className="mx-auto max-w-xs rounded-xl border border-border-default/50 bg-bg-subtle p-2 text-left">
         <HanziText as="p" size="inherit" weight="bold" leading="relaxed">
          {example.zh}
         </HanziText>
        </div>
       ) : null}

       <StudyInstructionText variant="overline" tone="muted">
        Nhấn để xem phiên âm và nghĩa
       </StudyInstructionText>
      </div>
     ) : (
      /* Back: Pinyin, Hanviet, Meaning, Sentence Translation */
      <div className="grid gap-1.5">
       <div className="flex flex-wrap items-center justify-center gap-1.5">
        <StudyInstructionText tone="accent" weight="bold">
         {currentItem.pinyin}
        </StudyInstructionText>
        <StudyInstructionText tone="muted">·</StudyInstructionText>
        <StudyInstructionText tone="default" weight="bold">
         {currentItem.meaning.hanviet}
        </StudyInstructionText>
       </div>

       <StudyInstructionText tone="secondary" weight="semibold">
        {getVocabDisplayMeaning(currentItem)}
       </StudyInstructionText>

       {example ? (
        <div className="mx-auto max-w-xs grid gap-1 rounded-xl border border-border-default/50 bg-bg-subtle p-2 text-left">
         <HanziText as="p" size="inherit" weight="bold" leading="relaxed">
          {example.zh}
         </HanziText>
         {example.vi ? (
          <StudyInstructionText tone="secondary" variant="caption">
           {example.vi}
          </StudyInstructionText>
         ) : null}
        </div>
       ) : null}

       <StudyInstructionText variant="overline" tone="muted">
        Nhấn để quay lại mặt chữ Hán
       </StudyInstructionText>
      </div>
     )}
    </div>
   </div>

   {/* Bottom Navigation Toolbar */}
   <div className="flex items-center justify-between border-t border-border-default/40 bg-surface-muted/20 px-3 py-1.5 text-xs">
    <div className="flex items-center gap-1">
     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handlePrev}
      title="Từ trước đó"
      aria-label="Từ trước đó"
     >
      <ChevronLeft className="size-3.5" />
      <span className="hidden sm:inline">Trước</span>
     </Button>

     <Button
      type="button"
      variant="outline"
      size="compact"
      onClick={handleToggleFlip}
      title="Lật thẻ"
      aria-label="Lật thẻ"
     >
      <RotateCw className="size-3" />
      <span>Lật thẻ</span>
     </Button>

     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handleNext}
      title="Từ tiếp theo"
      aria-label="Từ tiếp theo"
     >
      <span className="hidden sm:inline">Tiếp</span>
      <ChevronRight className="size-3.5" />
     </Button>
    </div>

    <div className="flex items-center gap-1">
     <StudyInstructionText variant="overline" tone="muted">
      Chu kỳ
     </StudyInstructionText>
     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handleCycleInterval}
      title="Nhấp để đổi chu kỳ tự đổi từ"
      aria-label={`Chu kỳ đổi từ: ${intervalSeconds} giây`}
     >
      {`${intervalSeconds}s`}
     </Button>
    </div>
   </div>
  </Card>
 );
}
