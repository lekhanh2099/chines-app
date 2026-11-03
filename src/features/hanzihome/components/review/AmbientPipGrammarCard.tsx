"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import type { PipGrammarPoint } from "./pip-grammar-adapter";

export type AmbientPipGrammarCardProps = {
 readonly items: readonly PipGrammarPoint[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

const INTERVAL_OPTIONS: readonly number[] = [15, 30, 60];

export function AmbientPipGrammarCard({
 items,
 lessonTitle = "Ngữ pháp trọng điểm",
 onClose,
 isFloatingInApp = false,
 extraHeaderActions,
}: AmbientPipGrammarCardProps) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [exampleIndex, setExampleIndex] = useState(0);
 const [isAutoPlay, setIsAutoPlay] = useState(false);
 const [isAutoSpeak, setIsAutoSpeak] = useState(true);
 const [intervalSeconds, setIntervalSeconds] = useState<number>(20);
 const [remainingSeconds, setRemainingSeconds] = useState<number>(20);

 const { speak, stop } = useFastMandarinSpeech();

 const totalCount = items.length;
 const currentItem = items[currentIndex] ?? items[0];

 const handleNext = useCallback(() => {
  if (totalCount === 0) return;
  stop();
  setCurrentIndex((prev) => (prev + 1) % totalCount);
  setExampleIndex(0);
  setRemainingSeconds(intervalSeconds);
 }, [totalCount, intervalSeconds, stop]);

 const handlePrev = useCallback(() => {
  if (totalCount === 0) return;
  stop();
  setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
  setExampleIndex(0);
  setRemainingSeconds(intervalSeconds);
 }, [totalCount, intervalSeconds, stop]);

 const handleToggleAuto = useCallback(() => {
  setIsAutoPlay((prev) => !prev);
 }, []);

 const handleToggleAutoSpeak = useCallback(() => {
  setIsAutoSpeak((prev) => !prev);
 }, []);

 const handleCycleInterval = useCallback(() => {
  setIntervalSeconds((prev) => {
   const idx = INTERVAL_OPTIONS.indexOf(prev);
   const nextIdx = idx >= 0 && idx < INTERVAL_OPTIONS.length - 1 ? idx + 1 : 0;
   const nextSec = INTERVAL_OPTIONS[nextIdx] ?? 20;
   setRemainingSeconds(nextSec);
   return nextSec;
  });
 }, []);

 // Auto-play timer
 useEffect(() => {
  if (!isAutoPlay || totalCount <= 1) return;

  const timer = setInterval(() => {
   setRemainingSeconds((prev) => {
    if (prev <= 1) {
     handleNext();
     return intervalSeconds;
    }
    return prev - 1;
   });
  }, 1000);

  return () => clearInterval(timer);
 }, [handleNext, intervalSeconds, isAutoPlay, totalCount]);

 // Auto-speak current grammar item
 useEffect(() => {
  if (isAutoSpeak && currentItem) {
   const segments: string[] = [];
   if (currentItem.title) segments.push(currentItem.title);
   const firstEx = currentItem.examples[0];
   if (firstEx?.zh) segments.push(firstEx.zh);
   if (segments.length > 0) {
    speak(segments);
   }
  }
 }, [currentIndex, currentItem, isAutoSpeak, speak]);

 // Keyboard navigation: Left/Right arrow keys
 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
   }
   if (e.key === "ArrowLeft") {
    e.preventDefault();
    handlePrev();
   } else if (e.key === "ArrowRight") {
    e.preventDefault();
    handleNext();
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [handleNext, handlePrev]);

 useEffect(() => {
  return () => {
   stop();
  };
 }, [stop]);

 if (!currentItem) {
  return null;
 }

 const examples = currentItem.examples;
 const currentExample = examples[exampleIndex] ?? examples[0];
 const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / intervalSeconds) * 100));

 const content = (
  <>
   {/* Top Bar */}
   <div className="border-b border-border-default/40 bg-surface-muted/30 px-3 py-1.5">
    <div className="flex items-center justify-between gap-2">
     <div className="flex min-w-0 items-center gap-1.5">
      <Badge variant="accent" size="sm" casing="natural">
       {`${currentIndex + 1}/${totalCount}`}
      </Badge>
      <StudyInstructionText tone="secondary" weight="bold" clamp="one">
       {lessonTitle}
      </StudyInstructionText>
     </div>

     <div className="flex items-center gap-0.5">
      {extraHeaderActions}

      <Button
       type="button"
       variant="ghost"
       size="toolbar"
       onClick={handleToggleAutoSpeak}
       aria-label={isAutoSpeak ? "Tắt tự động đọc ngữ pháp" : "Bật tự động đọc ngữ pháp"}
      >
       {isAutoSpeak ? (
        <Volume2 className="size-3.5 text-primary" />
       ) : (
        <VolumeX className="size-3.5" />
       )}
      </Button>

      <Button
       type="button"
       variant="ghost"
       size="toolbar"
       onClick={handleToggleAuto}
       aria-label={isAutoPlay ? "Tạm dừng lướt tự động" : "Tiếp tục lướt tự động"}
      >
       {isAutoPlay ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
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

   {/* Timer progress bar */}
   <div className="h-0.5 w-full overflow-hidden bg-border-default/30" aria-hidden="true">
    <div
     className="h-full bg-primary transition-all duration-1000 ease-linear"
     style={{
      inlineSize: `${progressPercent}%`,
      opacity: isAutoPlay ? 1 : 0.4,
     }}
    />
   </div>

   {/* Main Grammar Point Content Surface */}
   <div className="flex flex-1 flex-col justify-start gap-2.5 overflow-y-auto px-4 py-3">
    {/* Title & Pattern */}
    <div className="flex items-start justify-between gap-2">
     <HanziText as="h3" size="card" weight="black" leading="snug" className="text-left">
      {currentItem.title}
     </HanziText>
     <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={() => speak(currentItem.title)}
      aria-label={`Phát âm ${currentItem.title}`}
      className="shrink-0"
     >
      <Volume2 className="size-3.5" />
     </Button>
    </div>

    {/* Formula Pill if present */}
    {currentItem.formula ? (
     <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-left">
      <StudyInstructionText variant="caption" tone="accent" weight="bold">
       Công thức:
      </StudyInstructionText>{" "}
      <span className="text-xs font-semibold text-foreground">{currentItem.formula}</span>
     </div>
    ) : null}

    {/* Explanation / Cách dùng */}
    {currentItem.explanation ? (
     <div className="text-left">
      <StudyInstructionText variant="bodySmall" tone="secondary" leading="relaxed">
       {currentItem.explanation}
      </StudyInstructionText>
     </div>
    ) : null}

    {/* Common Collocations / Cụm từ thường gặp */}
    {currentItem.commonPhrases && currentItem.commonPhrases.length > 0 ? (
     <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-left">
      <StudyInstructionText variant="caption" tone="muted" weight="bold">
       Cụm từ:
      </StudyInstructionText>
      {currentItem.commonPhrases.map((phrase) => (
       <Button
        key={phrase}
        type="button"
        variant="outline"
        size="compact"
        onClick={() => speak(phrase)}
        title={`Bấm để nghe phát âm "${phrase}"`}
       >
        {phrase}
       </Button>
      ))}
     </div>
    ) : null}

    {/* Example Sentences */}
    {currentExample ? (
     <div className="mt-auto flex flex-col gap-1.5 rounded-xl border border-border-default/60 bg-surface-subtle p-2.5 text-left">
      <div className="flex items-center justify-between gap-1.5">
       <div className="flex items-center gap-1">
        <Badge variant="default" size="sm">
         {`Ví dụ ${exampleIndex + 1}/${examples.length}`}
        </Badge>
       </div>

       <div className="flex items-center gap-1">
        {examples.length > 1 ? (
         <>
          <Button
           type="button"
           variant="ghost"
           size="icon-xs"
           disabled={exampleIndex === 0}
           onClick={() => setExampleIndex((prev) => prev - 1)}
           aria-label="Ví dụ trước"
          >
           <ChevronLeft className="size-3" />
          </Button>
          <Button
           type="button"
           variant="ghost"
           size="icon-xs"
           disabled={exampleIndex >= examples.length - 1}
           onClick={() => setExampleIndex((prev) => prev + 1)}
           aria-label="Ví dụ sau"
          >
           <ChevronRight className="size-3" />
          </Button>
         </>
        ) : null}

        <Button
         type="button"
         variant="ghost"
         size="icon-xs"
         onClick={() => speak(currentExample.zh)}
         aria-label="Phát âm câu ví dụ"
        >
         <Volume2 className="size-3.5 text-primary" />
        </Button>
       </div>
      </div>

      <HanziText as="p" size="inherit" weight="semibold" leading="relaxed">
       {currentExample.zh}
      </HanziText>

      {currentExample.vi ? (
       <StudyInstructionText variant="caption" tone="secondary">
        {currentExample.vi}
       </StudyInstructionText>
      ) : null}
     </div>
    ) : null}
   </div>

   {/* Bottom Navigation Toolbar */}
   <div className="flex items-center justify-between border-t border-border-default/40 bg-surface-muted/20 px-3 py-1.5 text-xs">
    <div className="flex items-center gap-1">
     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handlePrev}
      aria-label="Điểm ngữ pháp trước"
     >
      <ChevronLeft className="size-3.5" />
      <span className="hidden sm:inline">Trước</span>
     </Button>

     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handleNext}
      aria-label="Điểm ngữ pháp tiếp theo"
     >
      <span className="hidden sm:inline">Tiếp</span>
      <ChevronRight className="size-3.5" />
     </Button>
    </div>

    <div className="flex items-center gap-1">
     <StudyInstructionText variant="caption" tone="muted">
      Chu kỳ:
     </StudyInstructionText>
     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handleCycleInterval}
      aria-label={`Chu kỳ đổi ngữ pháp: ${intervalSeconds} giây`}
     >
      {`${intervalSeconds}s`}
     </Button>
    </div>
   </div>
  </>
 );

 if (isFloatingInApp) {
  return (
   <Card
    variant="elevated"
    padding="none"
    className="fixed bottom-5 right-5 z-50 flex h-80 w-96 max-w-[calc(100vw-2.5rem)] flex-col justify-between overflow-hidden select-none"
   >
    {content}
   </Card>
  );
 }

 return (
  <div className="flex h-screen w-screen flex-col justify-between overflow-hidden select-none bg-surface">
   {content}
  </div>
 );
}
