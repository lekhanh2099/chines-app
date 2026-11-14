"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { AmbientPipGrammarFooter } from "./AmbientPipGrammarFooter";
import { AmbientPipGrammarPointBody } from "./AmbientPipGrammarPointBody";
import type { PipGrammarPoint } from "./pip-grammar-adapter";
import { usePipAutoAdvance } from "./usePipAutoAdvance";

type AmbientPipGrammarCardProps = {
 readonly items: readonly PipGrammarPoint[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly isInline?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

const INTERVAL_OPTIONS: readonly number[] = [15, 30, 60];

export function AmbientPipGrammarCard({
 items,
 lessonTitle = "Ngữ pháp trọng điểm",
 onClose,
 isFloatingInApp = false,
 isInline = false,
 extraHeaderActions,
}: AmbientPipGrammarCardProps) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [exampleIndex, setExampleIndex] = useState(0);
 const [isAutoPlay, setIsAutoPlay] = useState(false);
 const [isAutoSpeak, setIsAutoSpeak] = useState(true);
 const [intervalSeconds, setIntervalSeconds] = useState<number>(20);

 const { speak, stop } = useFastMandarinSpeech();

 const totalCount = items.length;
 const { remainingSeconds, resetRemaining, speakTracked, stopTracked } = usePipAutoAdvance({
  enabled: isAutoPlay && totalCount > 1,
  intervalSeconds,
  speak,
  stop,
  onAdvance: () => handleNext(),
 });
 const currentItem = items[currentIndex] ?? items[0];

 const handleNext = useCallback(() => {
  if (totalCount === 0) return;
  stopTracked();
  setCurrentIndex((prev) => (prev + 1) % totalCount);
  setExampleIndex(0);
  resetRemaining(intervalSeconds);
 }, [totalCount, intervalSeconds, resetRemaining, stopTracked]);

 const handlePrev = useCallback(() => {
  if (totalCount === 0) return;
  stopTracked();
  setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
  setExampleIndex(0);
  resetRemaining(intervalSeconds);
 }, [totalCount, intervalSeconds, resetRemaining, stopTracked]);

 const handleToggleAuto = useCallback(() => {
  setIsAutoPlay((prev) => !prev);
 }, []);

 const handleToggleAutoSpeak = useCallback(() => {
  setIsAutoSpeak((prev) => !prev);
 }, []);

 const handleCycleInterval = useCallback(() => {
  const idx = INTERVAL_OPTIONS.indexOf(intervalSeconds);
  const nextIdx = idx >= 0 && idx < INTERVAL_OPTIONS.length - 1 ? idx + 1 : 0;
  const nextSec = INTERVAL_OPTIONS[nextIdx] ?? 20;
  setIntervalSeconds(nextSec);
  resetRemaining(nextSec);
 }, [intervalSeconds, resetRemaining]);

 // Auto-speak current grammar item
 useEffect(() => {
  if (isAutoSpeak && currentItem) {
   const firstEx = currentItem.examples[0];
   if (firstEx?.zh) {
    speakTracked(firstEx.zh, { lang: "zh-CN" });
   } else if (currentItem.title && /[\u4e00-\u9fff]/u.test(currentItem.title)) {
    speakTracked(currentItem.title, { lang: "zh-CN" });
   }
  }
 }, [currentIndex, currentItem, isAutoSpeak, speakTracked]);

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
   stopTracked();
  };
 }, [stopTracked]);

 if (!currentItem) {
  return null;
 }

 const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / intervalSeconds) * 100));

 const content = (
  <>
   {/* Top Bar */}
   <div className="border-b border-border-default/40 bg-surface-muted/30 px-3 py-1.5">
    <div className="flex items-center justify-between gap-2">
     <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
      <Badge variant="accent" size="sm" casing="natural" className="shrink-0">
       {`${currentIndex + 1}/${totalCount}`}
      </Badge>
      <StudyInstructionText tone="secondary" weight="bold" clamp="one">
       {lessonTitle}
      </StudyInstructionText>
     </div>

     <div className="flex shrink-0 items-center gap-1">
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
   <AmbientPipGrammarPointBody
    currentItem={currentItem}
    exampleIndex={exampleIndex}
    setExampleIndex={setExampleIndex}
    speakTracked={speakTracked}
   />

   {/* Bottom Navigation Toolbar */}
   <AmbientPipGrammarFooter
    handlePrev={handlePrev}
    handleNext={handleNext}
    handleCycleInterval={handleCycleInterval}
    intervalSeconds={intervalSeconds}
   />
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

 if (isInline) {
  return (
   <div className="flex h-96 w-full flex-col justify-between overflow-hidden rounded-xl border border-border-default/60 bg-surface select-none">
    {content}
   </div>
  );
 }

 return (
  <div className="flex h-screen w-screen flex-col justify-between overflow-hidden select-none bg-surface">
   {content}
  </div>
 );
}
