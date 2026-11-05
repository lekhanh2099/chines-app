"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
 ChevronLeft,
 ChevronRight,
 Eye,
 EyeOff,
 RotateCcw,
 Volume2,
 VolumeX,
 X,
} from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 prefetchMandarinAudio,
 useFastMandarinSpeech,
} from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import {
 buildDictationDiff,
 type DictationDiffToken,
} from "@/features/hanzihome/practice/dictation-comparison";
import { calculateChineseAccuracy } from "@/features/hanzihome/practice/text-comparison";
import {
 dictationResponseMs,
 formatDictationSpeed,
} from "@/features/dictation/dictation-workspace-utils";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { cn } from "@/lib/utils";

export type AmbientPipDictationCardProps = {
 readonly items: readonly HanziHomeVocabItem[];
 readonly lessonTitle?: string;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

type AttemptResult = {
 score: number;
 responseMs: number | null;
 diff: DictationDiffToken[];
};

export function AmbientPipDictationCard({
 items,
 lessonTitle = "Nghe chép từ vựng",
 onClose,
 isFloatingInApp = false,
 extraHeaderActions,
}: AmbientPipDictationCardProps) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [answer, setAnswer] = useState("");
 const [isChecked, setIsChecked] = useState(false);
 const [attempt, setAttempt] = useState<AttemptResult | null>(null);
 const [isAutoSpeak, setIsAutoSpeak] = useState(true);
 const [showHint, setShowHint] = useState(false);

 const startTimeRef = useRef<number | null>(null);
 const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 const { speak, stop } = useFastMandarinSpeech();

 const totalCount = items.length;
 const currentItem = items[currentIndex] ?? items[0];

 const cancelAutoNext = useCallback(() => {
  if (autoNextTimerRef.current !== null) {
   clearTimeout(autoNextTimerRef.current);
   autoNextTimerRef.current = null;
  }
 }, []);

 const playCurrentAudio = useCallback(() => {
  if (!currentItem?.hanzi) return;
  speak(currentItem.hanzi, { rate: 1.0 });
 }, [currentItem, speak]);

 const handleNext = useCallback(() => {
  if (totalCount === 0) return;
  cancelAutoNext();
  setCurrentIndex((prev) => (prev + 1) % totalCount);
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext, totalCount]);

 const handlePrev = useCallback(() => {
  if (totalCount === 0) return;
  cancelAutoNext();
  setCurrentIndex((prev) => (prev - 1 + totalCount) % totalCount);
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext, totalCount]);

 const handleAnswerChange = (value: string) => {
  if (!isChecked && startTimeRef.current === null && value.trim().length > 0) {
   startTimeRef.current = Date.now();
  }
  setAnswer(value);
 };

 const handleCheck = useCallback(() => {
  if (!currentItem) return;
  if (!answer.trim()) return;

  const now = Date.now();
  const responseMs = dictationResponseMs(now, startTimeRef.current ?? undefined);
  const score = calculateChineseAccuracy(currentItem.hanzi, answer);
  const diff = buildDictationDiff(currentItem.hanzi, answer);

  const result: AttemptResult = { score, responseMs, diff };
  setAttempt(result);
  setIsChecked(true);

  if (score === 100 && totalCount > 1) {
   cancelAutoNext();
   autoNextTimerRef.current = setTimeout(handleNext, 900);
  }
 }, [answer, cancelAutoNext, currentItem, handleNext, totalCount]);

 const handleEditAgain = useCallback(() => {
  cancelAutoNext();
  setIsChecked(false);
  setAttempt(null);
  startTimeRef.current = Date.now();
  setTimeout(() => inputRef.current?.focus(), 50);
 }, [cancelAutoNext]);

 const handleToggleAutoSpeak = useCallback(() => {
  setIsAutoSpeak((prev) => !prev);
 }, []);

 const handleToggleHint = useCallback(() => {
  setShowHint((prev) => !prev);
 }, []);

 const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "Enter") {
   event.preventDefault();
   if (isChecked) {
    handleNext();
   } else {
    handleCheck();
   }
   return;
  }
  if (event.key === "Escape" && isChecked) {
   event.preventDefault();
   handleEditAgain();
   return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
   event.preventDefault();
   playCurrentAudio();
  }
 };

 // Focus input when card changes or when editing again
 useEffect(() => {
  if (!isChecked) {
   inputRef.current?.focus();
  }
 }, [currentIndex, isChecked]);

 // Speak audio on word load
 useEffect(() => {
  if (isAutoSpeak && currentItem?.hanzi) {
   speak(currentItem.hanzi, { rate: 1.0 });
  }
 }, [currentIndex, currentItem, isAutoSpeak, speak]);

 // Background prefetch upcoming audio
 useEffect(() => {
  if (totalCount === 0) return;
  const upcoming = items
   .slice(currentIndex, currentIndex + 4)
   .map((it) => it?.hanzi)
   .filter(Boolean);
  prefetchMandarinAudio(upcoming);
 }, [currentIndex, items, totalCount]);

 useEffect(() => {
  return () => {
   cancelAutoNext();
   stop();
  };
 }, [cancelAutoNext, stop]);

 if (!currentItem) {
  return null;
 }

 const speed = attempt ? formatDictationSpeed(attempt.responseMs, currentItem.hanzi.length) : null;

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

   {/* Main Interactive Practice Surface */}
   <div className="relative flex flex-1 flex-col justify-center px-4 py-2">
    <div className="grid gap-2.5">
     {/* Audio Play Trigger & Hint Area */}
     <div className="flex items-center justify-between gap-2">
      <Button
       type="button"
       variant="outline"
       size="compact"
       onClick={playCurrentAudio}
       aria-label={`Nghe lại ${currentItem.hanzi}`}
      >
       <Volume2 className="size-3.5" />
       <span>Nghe lại (Ctrl+R)</span>
      </Button>

      <Button
       type="button"
       variant="ghost"
       size="compact"
       onClick={handleToggleHint}
       aria-label={showHint ? "Ẩn gợi ý nghĩa" : "Hiện gợi ý nghĩa"}
      >
       {showHint ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
       <span>{showHint ? "Ẩn gợi ý" : "Gợi ý"}</span>
      </Button>
     </div>

     {/* Hint Display (if toggled or if checked) */}
     {showHint && !isChecked ? (
      <div className="rounded-lg border border-border-default/50 bg-bg-subtle p-2 text-center">
       <div className="flex items-center justify-center gap-2">
        <StudyInstructionText tone="accent" weight="bold">
         {currentItem.pinyin}
        </StudyInstructionText>
        <StudyInstructionText tone="muted">·</StudyInstructionText>
        <StudyInstructionText tone="secondary" weight="semibold">
         {getVocabDisplayMeaning(currentItem)}
        </StudyInstructionText>
       </div>
      </div>
     ) : null}

     {/* Checked Result Diff & Speed */}
     {isChecked && attempt !== null ? (
      <div className="grid gap-2 rounded-xl border border-border-default/60 bg-bg-subtle p-2.5 text-center">
       {/* Hanzi Diff Tokens */}
       <div className="flex flex-wrap items-center justify-center gap-1">
        {attempt.diff.map((token, idx) => (
         <span
          key={`${idx}-${token.kind}-${token.value}`}
          className={cn(
           "text-base font-bold",
           token.kind === "match" && "text-success-text",
           token.kind === "missing" && "line-through opacity-75 text-warning-text",
           (token.kind === "extra" || token.kind === "replace" || token.kind === "transpose") &&
            "text-danger-text",
          )}
         >
          {token.kind === "missing" ? `(${token.expected})` : token.value}
         </span>
        ))}
       </div>

       {/* Score and Speed Badges */}
       <div className="flex items-center justify-center gap-2">
        <Badge
         variant={attempt.score === 100 ? "success" : attempt.score >= 70 ? "warning" : "danger"}
         casing="natural"
        >
         {attempt.score}%
        </Badge>
        {speed ? (
         <Badge casing="natural">
          <span aria-hidden="true">⚡</span>
          <span>{speed.durationSeconds}s</span>
          <span>·</span>
          <span>{speed.cpm} CPM</span>
         </Badge>
        ) : null}
       </div>

       {/* Correct Pinyin & Meaning */}
       <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <HanziText as="span" size="inherit" weight="black" tone="accent">
         {currentItem.hanzi}
        </HanziText>
        <StudyInstructionText tone="accent" weight="bold">
         {currentItem.pinyin}
        </StudyInstructionText>
        <StudyInstructionText tone="muted">·</StudyInstructionText>
        <StudyInstructionText tone="secondary" weight="semibold">
         {getVocabDisplayMeaning(currentItem)}
        </StudyInstructionText>
       </div>
      </div>
     ) : (
      /* Input Field */
      <div className="grid gap-1.5">
       <Input
        ref={inputRef}
        type="text"
        value={answer}
        density="compact"
        surface="field"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Gõ chữ Hán rồi bấm Enter..."
        aria-label={`Gõ chữ Hán cho từ số ${currentIndex + 1}`}
        onChange={(e) => handleAnswerChange(e.target.value)}
        onKeyDown={handleKeyDown}
       />
       <StudyInstructionText variant="caption" tone="muted" className="text-center">
        Bấm Enter để kiểm tra · Ctrl+R để nghe lại
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

     {isChecked ? (
      <Button
       type="button"
       variant="outline"
       size="compact"
       onClick={handleEditAgain}
       aria-label="Sửa lại từ này"
      >
       <RotateCcw className="size-3" />
       <span>Sửa lại (Esc)</span>
      </Button>
     ) : (
      <Button
       type="button"
       variant="default"
       size="compact"
       disabled={!answer.trim()}
       onClick={handleCheck}
       aria-label="Kiểm tra kết quả"
      >
       <span>Kiểm tra (↵)</span>
      </Button>
     )}

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
     <StudyInstructionText variant="caption" tone="muted">
      Phần:
     </StudyInstructionText>
     <StudyInstructionText variant="caption" tone="secondary" weight="bold">
      {`${currentIndex + 1}/${totalCount}`}
     </StudyInstructionText>
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

 return (
  <div className="flex h-screen w-screen flex-col justify-between overflow-hidden select-none bg-surface">
   {content}
  </div>
 );
}
