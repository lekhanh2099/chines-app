"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 prefetchMandarinAudio,
 useFastMandarinSpeech,
} from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

import { AmbientPipFlashcardFooter } from "./AmbientPipFlashcardFooter";
import { AmbientPipFlashcardSurface } from "./AmbientPipFlashcardSurface";
import { usePipAutoAdvance } from "./usePipAutoAdvance";

type AmbientPipFlashcardProps = {
 readonly items: readonly HanziHomeVocabItem[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly isInline?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

const INTERVAL_OPTIONS: readonly number[] = [10, 15, 30, 60];

export function AmbientPipFlashcard({
 items,
 lessonTitle = "Ôn tập nhận diện",
 onClose,
 isFloatingInApp = false,
 isInline = false,
 extraHeaderActions,
}: AmbientPipFlashcardProps) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [isFlipped, setIsFlipped] = useState(false);
 const [isAutoPlay, setIsAutoPlay] = useState(true);
 const [isAutoSpeak, setIsAutoSpeak] = useState(true);
 const [intervalSeconds, setIntervalSeconds] = useState<number>(15);

 const { speak, stop } = useFastMandarinSpeech();
 const learning = useLearningState();

 const totalCount = items.length;
 const { remainingSeconds, resetRemaining, speakTracked, stopTracked } = usePipAutoAdvance({
  enabled: isAutoPlay && totalCount > 1,
  intervalSeconds,
  speak,
  stop,
  onAdvance: () => handleNext(),
  onHalfway: () => setIsFlipped(true),
 });
 const currentItem = items[currentIndex] ?? items[0];
 const customVocabList = learning.state.settings.customVocab ?? [];
 const isCurrentInVault = Boolean(
  currentItem && customVocabList.some((word) => word.hanzi.trim() === currentItem.hanzi.trim()),
 );

 const handleToggleCurrentVault = useCallback(() => {
  if (!currentItem) return;
  learning.toggleCustomVocabByHanzi({
   hanzi: currentItem.hanzi,
   pinyin: currentItem.pinyin,
   meaning: getVocabDisplayMeaning(currentItem),
   hanviet: currentItem.meaning.hanviet || undefined,
   exampleZh: currentItem.examples[0]?.zh,
   exampleVi: currentItem.examples[0]?.vi,
   note: lessonTitle,
  });
 }, [currentItem, learning, lessonTitle]);

 const handleNext = useCallback(() => {
  if (totalCount === 0) return;
  setCurrentIndex((prev) => (prev + 1) % totalCount);
  setIsFlipped(false);
  resetRemaining(intervalSeconds);
 }, [totalCount, intervalSeconds, resetRemaining]);

 const handlePrev = useCallback(() => {
  if (totalCount === 0) return;
  setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
  setIsFlipped(false);
  resetRemaining(intervalSeconds);
 }, [totalCount, intervalSeconds, resetRemaining]);

 const handleToggleFlip = useCallback(() => {
  setIsFlipped((prev) => !prev);
 }, []);

 const handleToggleAuto = useCallback(() => {
  setIsAutoPlay((prev) => !prev);
 }, []);

 const handleToggleAutoSpeak = useCallback(() => {
  setIsAutoSpeak((prev) => !prev);
 }, []);

 const handleCycleInterval = useCallback(() => {
  const idx = INTERVAL_OPTIONS.indexOf(intervalSeconds);
  const nextIdx = idx >= 0 && idx < INTERVAL_OPTIONS.length - 1 ? idx + 1 : 0;
  const nextSec = INTERVAL_OPTIONS[nextIdx] ?? 15;
  setIntervalSeconds(nextSec);
  resetRemaining(nextSec);
 }, [intervalSeconds, resetRemaining]);

 useEffect(() => {
  if (isAutoSpeak && currentItem?.hanzi) {
   const exampleZh = currentItem.examples[0]?.zh;
   const segments = exampleZh ? [currentItem.hanzi, exampleZh] : [currentItem.hanzi];
   speakTracked(segments);
  }
 }, [currentIndex, currentItem, isAutoSpeak, speakTracked]);

 // Proactive background prefetch for next card's audio
 useEffect(() => {
  if (totalCount === 0) return;
  const nextItem = items[(currentIndex + 1) % totalCount];
  if (nextItem) {
   prefetchMandarinAudio([nextItem.hanzi, nextItem.examples[0]?.zh]);
  }
 }, [currentIndex, items, totalCount]);

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
   {/* Window Title & Progress Bar */}
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
       aria-label={isAutoSpeak ? "Tắt tự động đọc từ" : "Bật tự động đọc từ"}
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

   {/* Card Interactive Surface */}
   <AmbientPipFlashcardSurface
    currentItem={currentItem}
    isFlipped={isFlipped}
    onToggleFlip={handleToggleFlip}
    speakTracked={speakTracked}
   />

   {/* Bottom Navigation Toolbar */}
   <AmbientPipFlashcardFooter
    handlePrev={handlePrev}
    handleToggleFlip={handleToggleFlip}
    handleNext={handleNext}
    isCurrentInVault={isCurrentInVault}
    handleToggleCurrentVault={handleToggleCurrentVault}
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
    className="fixed bottom-5 right-5 z-50 flex h-72 w-92 max-w-[calc(100vw-2.5rem)] flex-col justify-between overflow-hidden select-none"
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
