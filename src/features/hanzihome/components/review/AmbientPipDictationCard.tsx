"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
 ChevronLeft,
 ChevronRight,
 Eye,
 EyeOff,
 RotateCcw,
 Shuffle,
 Trophy,
 Volume2,
 VolumeX,
 X,
} from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 DEFAULT_VIETNAMESE_VOICE,
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
import type { DictationAttempt } from "@/features/dictation/dictation-session";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { getVocabDisplayMeaning } from "@/features/hanzihome/utils/vocab-item";
import { cn } from "@/lib/utils";

export type DictationMode = "zh-to-zh" | "vi-to-zh";

export type AmbientPipDictationCardProps = {
 readonly items: readonly HanziHomeVocabItem[];
 readonly lessonTitle?: string;
 readonly initialMode?: DictationMode;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly isInline?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

type AttemptResult = Pick<DictationAttempt, "score" | "responseMs"> & {
 diff: DictationDiffToken[];
};

type SummaryStats = {
 accuracy: number;
 avgCpm: number;
 perfectCount: number;
 mistakes: HanziHomeVocabItem[];
};

export function AmbientPipDictationCard({
 items,
 lessonTitle = "Nghe chép từ vựng",
 initialMode,
 onClose,
 isFloatingInApp = false,
 isInline = false,
 extraHeaderActions,
}: AmbientPipDictationCardProps) {
 const [dictationMode, setDictationMode] = useState<DictationMode>(() => {
  if (initialMode) return initialMode;
  if (typeof window !== "undefined") {
   try {
    const saved = window.localStorage.getItem("hanzihome:pip-dictation-mode");
    if (saved === "vi-to-zh" || saved === "zh-to-zh") return saved;
   } catch {
    // Ignore storage errors
   }
  }
  return "zh-to-zh";
 });
 const [mistakesItems, setMistakesItems] = useState<readonly HanziHomeVocabItem[] | null>(null);
 const [shuffledIndices, setShuffledIndices] = useState<readonly number[] | null>(null);
 const [speechRate, setSpeechRate] = useState<number>(1.0);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [answer, setAnswer] = useState("");
 const [isChecked, setIsChecked] = useState(false);
 const [attempt, setAttempt] = useState<AttemptResult | null>(null);
 const [sessionAttempts, setSessionAttempts] = useState<Map<number, AttemptResult>>(
  () => new Map(),
 );
 const [isCompleted, setIsCompleted] = useState(false);
 const [isAutoSpeak, setIsAutoSpeak] = useState(true);
 const [showHint, setShowHint] = useState(false);

 const startTimeRef = useRef<number | null>(null);
 const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const rootRef = useRef<HTMLDivElement>(null);

 const { speak, stop } = useFastMandarinSpeech();

 const isRetryingMistakes = mistakesItems !== null;
 const baseItems = mistakesItems ?? items;
 const isShuffled = shuffledIndices !== null;

 const activeItems = useMemo<readonly HanziHomeVocabItem[]>(() => {
  if (shuffledIndices && shuffledIndices.length === baseItems.length) {
   return shuffledIndices.map((idx) => baseItems[idx] ?? baseItems[0]);
  }
  return baseItems;
 }, [baseItems, shuffledIndices]);

 const totalCount = activeItems.length;
 const currentItem = activeItems[currentIndex] ?? activeItems[0];

 const cancelAutoNext = useCallback(() => {
  if (autoNextTimerRef.current !== null) {
   clearTimeout(autoNextTimerRef.current);
   autoNextTimerRef.current = null;
  }
 }, []);

 const handleToggleDictationMode = useCallback(() => {
  cancelAutoNext();
  setDictationMode((prev) => {
   const next = prev === "zh-to-zh" ? "vi-to-zh" : "zh-to-zh";
   if (typeof window !== "undefined") {
    try {
     window.localStorage.setItem("hanzihome:pip-dictation-mode", next);
    } catch {
     // Ignore storage errors
    }
   }
   return next;
  });
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext]);

 const playCurrentAudio = useCallback(() => {
  if (!currentItem) return;
  if (dictationMode === "vi-to-zh") {
   const viMeaning = getVocabDisplayMeaning(currentItem);
   if (viMeaning) {
    speak(viMeaning, { rate: speechRate, lang: "vi-VN", voice: DEFAULT_VIETNAMESE_VOICE });
   }
  } else {
   if (currentItem.hanzi) {
    speak(currentItem.hanzi, { rate: speechRate, lang: "zh-CN" });
   }
  }
 }, [currentItem, dictationMode, speak, speechRate]);

 const playSecondaryAudio = useCallback(() => {
  if (!currentItem) return;
  if (dictationMode === "vi-to-zh") {
   if (currentItem.hanzi) {
    speak(currentItem.hanzi, { rate: speechRate, lang: "zh-CN" });
   }
  } else {
   const viMeaning = getVocabDisplayMeaning(currentItem);
   if (viMeaning) {
    speak(viMeaning, { rate: speechRate, lang: "vi-VN", voice: DEFAULT_VIETNAMESE_VOICE });
   }
  }
 }, [currentItem, dictationMode, speak, speechRate]);

 const handleNext = useCallback(() => {
  if (totalCount === 0) return;
  cancelAutoNext();

  if (currentIndex >= totalCount - 1) {
   setIsCompleted(true);
   return;
  }

  setCurrentIndex((prev) => prev + 1);
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext, currentIndex, totalCount]);

 const handlePrev = useCallback(() => {
  if (totalCount === 0) return;
  cancelAutoNext();

  if (isCompleted) {
   setIsCompleted(false);
   setCurrentIndex(totalCount - 1);
   return;
  }

  setCurrentIndex((prev) => Math.max(0, prev - 1));
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext, isCompleted, totalCount]);

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

  setSessionAttempts((prev) => {
   const next = new Map(prev);
   next.set(currentIndex, result);
   return next;
  });

  if (score === 100 && totalCount > 1) {
   cancelAutoNext();
   autoNextTimerRef.current = setTimeout(handleNext, 1500);
  }
 }, [answer, cancelAutoNext, currentItem, currentIndex, handleNext, totalCount]);

 const handleEditAgain = useCallback(() => {
  cancelAutoNext();
  setIsChecked(false);
  setAttempt(null);
  startTimeRef.current = Date.now();
  setTimeout(() => inputRef.current?.focus(), 50);
 }, [cancelAutoNext]);

 const handleCycleRate = useCallback(() => {
  setSpeechRate((prev) => {
   if (prev === 1.0) return 1.2;
   if (prev === 1.2) return 0.8;
   return 1.0;
  });
 }, []);

 const handleToggleShuffle = useCallback(() => {
  cancelAutoNext();
  setShuffledIndices((prev) => {
   if (prev !== null) {
    return null;
   }
   const indices = Array.from({ length: baseItems.length }, (_, i) => i);
   for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = indices[i];
    indices[i] = indices[j] ?? j;
    indices[j] = temp ?? i;
   }
   return indices;
  });
  setCurrentIndex(0);
  setSessionAttempts(new Map());
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [baseItems.length, cancelAutoNext]);

 const handleToggleAutoSpeak = useCallback(() => {
  setIsAutoSpeak((prev) => !prev);
 }, []);

 const handleToggleHint = useCallback(() => {
  setShowHint((prev) => !prev);
 }, []);

 // Summary stats calculation
 const summaryStats = useMemo<SummaryStats>(() => {
  const attemptsArray = Array.from(sessionAttempts.values());
  const attemptedCount = attemptsArray.length;
  if (attemptedCount === 0) {
   const emptyMistakes: HanziHomeVocabItem[] = [];
   return {
    accuracy: 100,
    avgCpm: 0,
    perfectCount: 0,
    mistakes: emptyMistakes,
   };
  }

  const totalScore = attemptsArray.reduce((acc, curr) => acc + curr.score, 0);
  const accuracy = Math.round(totalScore / attemptedCount);

  let totalCpm = 0;
  let cpmCount = 0;
  for (const [index, att] of sessionAttempts.entries()) {
   if (att.responseMs && att.responseMs > 0) {
    const chars = activeItems[index]?.hanzi.length ?? 0;
    if (chars === 0) continue;
    const cpm = Math.round((chars / (att.responseMs / 1000)) * 60);
    totalCpm += cpm;
    cpmCount++;
   }
  }
  const avgCpm = cpmCount > 0 ? Math.round(totalCpm / cpmCount) : 0;

  const mistakes: HanziHomeVocabItem[] = [];
  activeItems.forEach((item, idx) => {
   const res = sessionAttempts.get(idx);
   if (!res || res.score < 100) {
    mistakes.push(item);
   }
  });

  return {
   accuracy,
   avgCpm,
   perfectCount: attemptedCount - mistakes.length,
   mistakes,
  };
 }, [activeItems, sessionAttempts]);

 const handleRetryMistakes = useCallback(() => {
  if (summaryStats.mistakes.length === 0) return;
  cancelAutoNext();
  setMistakesItems(summaryStats.mistakes);
  setShuffledIndices(null);
  setSessionAttempts(new Map());
  setIsCompleted(false);
  setCurrentIndex(0);
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext, summaryStats.mistakes]);

 const handleRestartAll = useCallback(() => {
  cancelAutoNext();
  setMistakesItems(null);
  setShuffledIndices(null);
  setSessionAttempts(new Map());
  setIsCompleted(false);
  setCurrentIndex(0);
  setAnswer("");
  setIsChecked(false);
  setAttempt(null);
  setShowHint(false);
  startTimeRef.current = null;
 }, [cancelAutoNext]);

 const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.nativeEvent.isComposing) return;
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

 useEffect(() => {
  const targetWindow = rootRef.current?.ownerDocument.defaultView;
  if (!targetWindow) return;

  const handleWindowKeyDown = (event: KeyboardEvent) => {
   if (event.isComposing || isCompleted) return;

   const root = rootRef.current;
   if (
    root &&
    event.target instanceof targetWindow.Node &&
    event.target !== root.ownerDocument.body &&
    !root.contains(event.target)
   ) {
    return;
   }

   if (
    event.target instanceof targetWindow.HTMLInputElement ||
    event.target instanceof targetWindow.HTMLTextAreaElement ||
    event.target instanceof targetWindow.HTMLButtonElement ||
    event.target instanceof targetWindow.HTMLSelectElement ||
    event.target instanceof targetWindow.HTMLAnchorElement ||
    (event.target instanceof targetWindow.HTMLElement && event.target.isContentEditable)
   ) {
    return;
   }

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

  targetWindow.addEventListener("keydown", handleWindowKeyDown);
  return () => targetWindow.removeEventListener("keydown", handleWindowKeyDown);
 }, [handleCheck, handleEditAgain, handleNext, isChecked, isCompleted, playCurrentAudio]);

 // Focus input when card changes or when editing again
 useEffect(() => {
  if (!isChecked && !isCompleted) {
   inputRef.current?.focus();
  }
 }, [currentIndex, isChecked, isCompleted]);

 // Speak audio on word load
 useEffect(() => {
  if (isAutoSpeak && currentItem && !isCompleted) {
   if (dictationMode === "vi-to-zh") {
    const viMeaning = getVocabDisplayMeaning(currentItem);
    if (viMeaning) {
     speak(viMeaning, { rate: speechRate, lang: "vi-VN", voice: DEFAULT_VIETNAMESE_VOICE });
    }
   } else if (currentItem.hanzi) {
    speak(currentItem.hanzi, { rate: speechRate, lang: "zh-CN" });
   }
  }
 }, [currentIndex, currentItem, dictationMode, isAutoSpeak, isCompleted, speak, speechRate]);

 // Background prefetch upcoming audio
 useEffect(() => {
  if (totalCount === 0 || isCompleted) return;
  const upcoming = activeItems.slice(currentIndex + 1, currentIndex + 3);
  if (dictationMode === "vi-to-zh") {
   const viTexts = upcoming.map((it) => getVocabDisplayMeaning(it)).filter(Boolean);
   prefetchMandarinAudio(viTexts, DEFAULT_VIETNAMESE_VOICE, speechRate);
  } else {
   const zhTexts = upcoming.map((it) => it?.hanzi).filter(Boolean);
   prefetchMandarinAudio(zhTexts, undefined, speechRate);
  }
 }, [currentIndex, activeItems, totalCount, isCompleted, speechRate, dictationMode]);

 useEffect(() => {
  return () => {
   cancelAutoNext();
   stop();
  };
 }, [cancelAutoNext, stop]);

 if (!currentItem && !isCompleted) {
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
       {isCompleted ? "Xong" : `${currentIndex + 1}/${totalCount}`}
      </Badge>
      <StudyInstructionText tone="secondary" weight="bold" clamp="one">
       {isRetryingMistakes
        ? `${lessonTitle} (${dictationMode === "vi-to-zh" ? "Việt ➔ Hán" : "Trung ➔ Hán"}, Luyện từ sai)`
        : `${lessonTitle} (${dictationMode === "vi-to-zh" ? "Việt ➔ Hán" : "Trung ➔ Hán"})`}
      </StudyInstructionText>
     </div>

     <div className="flex shrink-0 items-center gap-1">
      {extraHeaderActions}

      <Button
       type="button"
       variant={dictationMode === "vi-to-zh" ? "active" : "ghost"}
       size="compact"
       onClick={handleToggleDictationMode}
       title={
        dictationMode === "vi-to-zh"
         ? "Đang chế độ: Nghe nghĩa tiếng Việt ➔ Chép chữ Hán (Bấm để đổi sang Nghe tiếng Trung)"
         : "Đang chế độ: Nghe tiếng Trung ➔ Chép chữ Hán (Bấm để đổi sang Nghe tiếng Việt)"
       }
       aria-label={`Chế độ nghe chép: ${dictationMode === "vi-to-zh" ? "Việt sang Hán" : "Trung sang Hán"}`}
      >
       <span className="text-xs font-semibold">
        {dictationMode === "vi-to-zh" ? "🇻🇳 Việt ➔ Hán" : "🇨🇳 Trung ➔ Hán"}
       </span>
      </Button>

      <Button
       type="button"
       variant="ghost"
       size="compact"
       onClick={handleCycleRate}
       title={`Tốc độ đọc: ${speechRate}x (Bấm để đổi 0.8x / 1.0x / 1.2x)`}
       aria-label={`Tốc độ đọc ${speechRate}x`}
      >
       <span>{`${speechRate}x`}</span>
      </Button>

      <Button
       type="button"
       variant={isShuffled ? "active" : "ghost"}
       size="toolbar"
       onClick={handleToggleShuffle}
       title={isShuffled ? "Đang xáo trộn (Bấm để theo thứ tự sách)" : "Xáo trộn từ vựng (Shuffle)"}
       aria-label={isShuffled ? "Tắt xáo trộn từ" : "Bật xáo trộn từ"}
      >
       <Shuffle className="size-3.5" />
      </Button>

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
    {isCompleted ? (
     <div className="grid gap-3 rounded-xl border border-border-default/60 bg-bg-subtle p-3.5 text-center">
      <div className="flex flex-col items-center justify-center gap-1">
       <div className="flex size-9 items-center justify-center rounded-full bg-success-subtle text-success-text">
        <Trophy className="size-5" />
       </div>
       <Typography as="h3" variant="cardTitle" weight="black">
        {isRetryingMistakes ? "Hoàn thành phần luyện lại!" : "Hoàn thành bài luyện!"}
       </Typography>
       <StudyInstructionText variant="caption" tone="muted">
        {`Đã hoàn thành ${activeItems.length} từ vựng`}
       </StudyInstructionText>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
       <Badge variant={summaryStats.accuracy >= 90 ? "success" : "warning"} casing="natural">
        {`Chính xác: ${summaryStats.accuracy}%`}
       </Badge>
       {summaryStats.avgCpm > 0 ? (
        <Badge casing="natural">
         <span aria-hidden="true">⚡</span>
         <span>{`${summaryStats.avgCpm} CPM`}</span>
        </Badge>
       ) : null}
       <Badge variant={summaryStats.mistakes.length === 0 ? "success" : "default"} casing="natural">
        {summaryStats.mistakes.length === 0
         ? "Đúng 100% tất cả"
         : `${summaryStats.mistakes.length} từ cần ôn`}
       </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
       {summaryStats.mistakes.length > 0 ? (
        <Button type="button" variant="default" size="compact" onClick={handleRetryMistakes}>
         <RotateCcw className="size-3.5" />
         <span>{`Luyện lại ${summaryStats.mistakes.length} từ sai`}</span>
        </Button>
       ) : null}

       <Button
        type="button"
        variant={summaryStats.mistakes.length > 0 ? "outline" : "default"}
        size="compact"
        onClick={handleRestartAll}
       >
        <RotateCcw className="size-3.5" />
        <span>Luyện lại tất cả</span>
       </Button>
      </div>
     </div>
    ) : (
     <div className="grid gap-2.5">
      {/* Audio Play Trigger & Hint Area */}
      <div className="flex items-center justify-between gap-2">
       <div className="flex items-center gap-1.5">
        <Button
         type="button"
         variant="outline"
         size="compact"
         onClick={playCurrentAudio}
         title={
          dictationMode === "vi-to-zh"
           ? "Nghe nghĩa tiếng Việt (Ctrl+R)"
           : "Nghe phát âm tiếng Trung (Ctrl+R)"
         }
        >
         <Volume2 className={cn("size-3.5", dictationMode === "vi-to-zh" && "text-primary")} />
         <span>
          {dictationMode === "vi-to-zh" ? "Nghe tiếng Việt (Ctrl+R)" : "Nghe lại (Ctrl+R)"}
         </span>
        </Button>

        <Button
         type="button"
         variant="ghost"
         size="compact"
         onClick={playSecondaryAudio}
         title={
          dictationMode === "vi-to-zh"
           ? "Nghe thêm phát âm tiếng Trung"
           : "Nghe thêm nghĩa tiếng Việt"
         }
         aria-label={
          dictationMode === "vi-to-zh"
           ? "Nghe thêm phát âm tiếng Trung"
           : "Nghe thêm nghĩa tiếng Việt"
         }
        >
         <span className="text-xs font-semibold">
          {dictationMode === "vi-to-zh" ? "🇨🇳 Trung" : "🇻🇳 Việt"}
         </span>
        </Button>
       </div>

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
        <div className="flex flex-wrap items-center justify-center gap-2">
         <StudyInstructionText tone="accent" weight="bold">
          {currentItem.pinyin}
         </StudyInstructionText>
         {currentItem.meaning.hanviet ? (
          <>
           <StudyInstructionText tone="muted">·</StudyInstructionText>
           <StudyInstructionText tone="secondary" weight="semibold">
            {`[${currentItem.meaning.hanviet}]`}
           </StudyInstructionText>
          </>
         ) : null}
         <StudyInstructionText tone="muted">·</StudyInstructionText>
         <StudyInstructionText tone="secondary" weight="semibold">
          {getVocabDisplayMeaning(currentItem)}
         </StudyInstructionText>
        </div>
       </div>
      ) : null}

      {/* Checked Result Diff & Speed */}
      {isChecked && attempt !== null ? (
       <div className="grid gap-2 rounded-xl border border-border-default/60 bg-bg-subtle p-3 text-center">
        {/* Large Hero Hanzi for recognition / visual imprint */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
         {attempt.score === 100 ? (
          <HanziText as="h2" size="review" weight="black" tone="success" leading="none">
           {currentItem.hanzi}
          </HanziText>
         ) : (
          attempt.diff.map((token, idx) => (
           <span
            key={`${idx}-${token.kind}-${token.value}`}
            className={cn(
             "font-hanzi text-3xl font-black",
             token.kind === "match" && "text-success-text",
             token.kind === "missing" && "line-through opacity-75 text-warning-text",
             (token.kind === "extra" || token.kind === "replace" || token.kind === "transpose") &&
              "text-danger-text",
            )}
           >
            {token.kind === "missing" ? `(${token.expected})` : token.value}
           </span>
          ))
         )}
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
         {attempt.score < 100 ? (
          <HanziText as="span" size="large" weight="black" tone="accent">
           {currentItem.hanzi}
          </HanziText>
         ) : null}
         <StudyInstructionText tone="accent" weight="bold">
          {currentItem.pinyin}
         </StudyInstructionText>
         {currentItem.meaning.hanviet ? (
          <>
           <StudyInstructionText tone="muted">·</StudyInstructionText>
           <StudyInstructionText tone="secondary" weight="bold">
            {`[${currentItem.meaning.hanviet}]`}
           </StudyInstructionText>
          </>
         ) : null}
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
         placeholder={
          dictationMode === "vi-to-zh"
           ? "Nghe nghĩa tiếng Việt, gõ chữ Hán..."
           : "Gõ chữ Hán rồi bấm Enter..."
         }
         aria-label={`Gõ chữ Hán cho từ số ${currentIndex + 1}`}
         onChange={(e) => handleAnswerChange(e.target.value)}
         onKeyDown={handleKeyDown}
        />
        <StudyInstructionText variant="caption" tone="muted" className="text-center">
         {dictationMode === "vi-to-zh"
          ? "Bấm Enter để kiểm tra · Ctrl+R nghe tiếng Việt"
          : "Bấm Enter để kiểm tra · Ctrl+R để nghe lại"}
        </StudyInstructionText>
       </div>
      )}
     </div>
    )}
   </div>

   {/* Bottom Navigation Toolbar */}
   <div className="flex items-center justify-between border-t border-border-default/40 bg-surface-muted/20 px-3 py-1.5 text-xs">
    <div className="flex items-center gap-1">
     <Button
      type="button"
      variant="ghost"
      size="compact"
      disabled={currentIndex === 0 && !isCompleted}
      onClick={handlePrev}
      aria-label="Từ trước đó"
     >
      <ChevronLeft className="size-3.5" />
      <span className="hidden sm:inline">Trước</span>
     </Button>

     {!isCompleted ? (
      isChecked ? (
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
      )
     ) : null}

     <Button
      type="button"
      variant="ghost"
      size="compact"
      disabled={isCompleted}
      onClick={handleNext}
      aria-label="Từ tiếp theo"
     >
      <span className="hidden sm:inline">Tiếp</span>
      <ChevronRight className="size-3.5" />
     </Button>
    </div>

    <div className="flex items-center gap-1">
     <StudyInstructionText variant="caption" tone="muted">
      {isCompleted ? "Đã xong:" : "Phần:"}
     </StudyInstructionText>
     <StudyInstructionText variant="caption" tone="secondary" weight="bold">
      {isCompleted ? `${totalCount}/${totalCount}` : `${currentIndex + 1}/${totalCount}`}
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
    <div ref={rootRef} className="contents">
     {content}
    </div>
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
