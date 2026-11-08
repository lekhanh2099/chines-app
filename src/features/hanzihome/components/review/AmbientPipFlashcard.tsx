"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
 Play,
 Pause,
 ChevronLeft,
 ChevronRight,
 X,
 RotateCw,
 Volume2,
 VolumeX,
 BookmarkPlus,
 Check,
} from "lucide-react";
import { ActionCard } from "@/components/ui/actions/action-card";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 prefetchMandarinAudio,
 useFastMandarinSpeech,
} from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";

export type AmbientPipFlashcardProps = {
 readonly items: readonly HanziHomeVocabItem[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly isInline?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

const INTERVAL_OPTIONS: readonly number[] = [10, 15, 30, 60];

function renderHighlightedZh(text: string, targetHanzi: string) {
 if (!targetHanzi || !text.includes(targetHanzi)) {
  return text;
 }
 const parts = text.split(targetHanzi);
 return (
  <>
   {parts.map((part, index) => (
    <span key={index}>
     {part}
     {index < parts.length - 1 ? (
      <StudyInstructionText as="span" tone="accent" weight="black">
       {targetHanzi}
      </StudyInstructionText>
     ) : null}
    </span>
   ))}
  </>
 );
}

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
 const [remainingSeconds, setRemainingSeconds] = useState<number>(15);

 const { speak, stop } = useFastMandarinSpeech();
 const learning = useLearningState();

 const totalCount = items.length;
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

 const handleToggleAutoSpeak = useCallback(() => {
  setIsAutoSpeak((prev) => !prev);
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

 useEffect(() => {
  if (isAutoSpeak && currentItem?.hanzi) {
   const exampleZh = currentItem.examples[0]?.zh;
   const segments = exampleZh ? [currentItem.hanzi, exampleZh] : [currentItem.hanzi];
   speak(segments);
  }
 }, [currentIndex, currentItem, isAutoSpeak, speak]);

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
   stop();
  };
 }, [stop]);

 if (!currentItem) {
  return null;
 }

 const example = currentItem.examples[0];
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
   <div className="relative flex flex-1 flex-col justify-center px-4 py-2 text-center">
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
         <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
           e.stopPropagation();
           speak(currentItem.hanzi, { rate: 1.15 });
          }}
          aria-label={`Phát âm ${currentItem.hanzi}`}
         >
          <Volume2 className="size-3.5" />
         </Button>
        </div>
       </div>

       {example ? (
        <div className="mx-auto flex max-w-xs items-start gap-1.5 rounded-xl border border-border-default/50 bg-bg-subtle p-2 text-left">
         <div className="flex-1">
          <HanziText as="p" size="inherit" weight="semibold" leading="relaxed">
           {renderHighlightedZh(example.zh, currentItem.hanzi)}
          </HanziText>
         </div>
         <div className="pointer-events-auto shrink-0">
          <Button
           type="button"
           variant="ghost"
           size="icon-xs"
           onClick={(e) => {
            e.stopPropagation();
            speak(example.zh);
           }}
           aria-label="Phát âm câu ví dụ"
          >
           <Volume2 className="size-3 text-muted-foreground hover:text-primary" />
          </Button>
         </div>
        </div>
       ) : null}

       <StudyInstructionText variant="caption" tone="muted">
        Nhấn để xem phiên âm & nghĩa
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
        <div className="mx-auto flex max-w-xs items-start gap-1.5 rounded-xl border border-border-default/50 bg-bg-subtle p-2 text-left">
         <div className="grid flex-1 gap-1">
          <HanziText as="p" size="inherit" weight="semibold" leading="relaxed">
           {renderHighlightedZh(example.zh, currentItem.hanzi)}
          </HanziText>
          {example.vi ? (
           <StudyInstructionText tone="secondary" variant="caption">
            {example.vi}
           </StudyInstructionText>
          ) : null}
         </div>
         <div className="pointer-events-auto shrink-0">
          <Button
           type="button"
           variant="ghost"
           size="icon-xs"
           onClick={(e) => {
            e.stopPropagation();
            speak(example.zh);
           }}
           aria-label="Phát âm câu ví dụ"
          >
           <Volume2 className="size-3 text-muted-foreground hover:text-primary" />
          </Button>
         </div>
        </div>
       ) : null}

       <StudyInstructionText variant="caption" tone="muted">
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
      aria-label="Từ tiếp theo"
     >
      <span className="hidden sm:inline">Tiếp</span>
      <ChevronRight className="size-3.5" />
     </Button>
    </div>

    <div className="flex items-center gap-1">
     <Button
      type="button"
      variant={isCurrentInVault ? "active" : "ghost"}
      size="compact"
      onClick={handleToggleCurrentVault}
      title={
       isCurrentInVault
        ? "Đã lưu trong Kho riêng (nhấn để gỡ)"
        : "Thêm từ này vào Kho từ vựng riêng"
      }
      aria-label={isCurrentInVault ? "Đã lưu trong Kho riêng" : "Thêm vào Kho riêng"}
     >
      {isCurrentInVault ? <Check className="size-3.5" /> : <BookmarkPlus className="size-3.5" />}
      <span className="hidden sm:inline">{isCurrentInVault ? "Trong kho" : "Kho riêng"}</span>
     </Button>
     <StudyInstructionText variant="caption" tone="muted">
      Chu kỳ:
     </StudyInstructionText>
     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handleCycleInterval}
      aria-label={`Chu kỳ đổi từ: ${intervalSeconds} giây`}
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
