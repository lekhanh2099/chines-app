"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Play, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import {
 SegmentedControl,
 type SegmentedControlItem,
} from "@/components/ui/forms/segmented-control";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DictationDiffView } from "@/features/hanzihome/practice/DictationDiffView";
import {
 buildDictationDiff,
 summarizeDictationDiff,
} from "@/features/hanzihome/practice/dictation-comparison";

import type { PlaybackRateKey } from "./ShadowingPlayerPanel";

export type DictationKeyEventLike = {
 key: string;
 isComposing: boolean;
};

export function shouldSubmitDictationEnter(event: DictationKeyEventLike): boolean {
 return event.key === "Enter" && !event.isComposing;
}

export function VideoDictationPanel({
 currentIndex,
 totalSegments,
 expectedText,
 draft,
 checked,
 currentScore,
 attemptedCount,
 averageScore,
 playbackRate,
 hasPlayerError,
 onDraftChange,
 onCheck,
 onRetry,
 onListen,
 onPrevious,
 onNext,
 onPlaybackRateChange,
}: {
 currentIndex: number;
 totalSegments: number;
 expectedText: string;
 draft: string;
 checked: boolean;
 currentScore: number;
 attemptedCount: number;
 averageScore: number;
 playbackRate: PlaybackRateKey;
 hasPlayerError: boolean;
 onDraftChange: (value: string) => void;
 onCheck: () => void;
 onRetry: () => void;
 onListen: () => void;
 onPrevious: () => void;
 onNext: () => void;
 onPlaybackRateChange: (rate: PlaybackRateKey) => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const inputRef = useRef<HTMLInputElement>(null);
 const nextButtonRef = useRef<HTMLButtonElement>(null);

 const buttonSize = "toolbar";
 const iconButtonSize = "icon-toolbar";
 const isFirst = currentIndex <= 0;
 const isLast = currentIndex >= totalSegments - 1;
 const canSubmit = draft.trim().length > 0 && expectedText.length > 0;

 const speedItems: SegmentedControlItem<PlaybackRateKey>[] = useMemo(
  () => [
   { key: "0.5", label: t("controls.speed05") },
   { key: "0.75", label: t("controls.speed075") },
   { key: "1", label: t("controls.speed1") },
  ],
  [t],
 );

 const diff = useMemo(
  () => (checked ? buildDictationDiff(expectedText, draft) : []),
  [checked, draft, expectedText],
 );
 const diffSummary = useMemo(() => summarizeDictationDiff(diff), [diff]);

 useEffect(() => {
  if (checked && !isLast) {
   nextButtonRef.current?.focus();
  }
 }, [checked, isLast]);

 const scoreTone = currentScore === 100 ? "success" : currentScore >= 60 ? "warning" : "danger";

 const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key !== "Enter") return;
  if (
   !shouldSubmitDictationEnter({
    key: event.key,
    isComposing: event.nativeEvent.isComposing,
   })
  ) {
   event.preventDefault();
   return;
  }
  event.preventDefault();
  if (canSubmit) onCheck();
 };

 const handleAdvanceAndFocus = () => {
  onNext();
  queueMicrotask(() => {
   inputRef.current?.focus();
  });
 };

 const handleRetryAndFocus = () => {
  onRetry();
  queueMicrotask(() => {
   inputRef.current?.focus();
  });
 };

 return (
  <div className="grid min-w-0 gap-2">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
    <Typography as="span" variant="caption" weight="semibold">
     {t("dictationMode.sentenceCounter", {
      current: totalSegments > 0 ? currentIndex + 1 : 0,
      total: totalSegments,
     })}
    </Typography>
    <Typography as="span" variant="caption" tone="muted">
     {t("dictationMode.sessionSummary", {
      attempted: attemptedCount,
      average: averageScore,
     })}
    </Typography>
   </div>

   <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
    <div className="flex min-w-0 items-center gap-1.5">
     <Button
      type="button"
      variant="default"
      size={buttonSize}
      disabled={hasPlayerError || totalSegments === 0}
      onClick={onListen}
     >
      <Play data-icon="inline-start" aria-hidden="true" />
      {t("dictationMode.listenSentence")}
     </Button>

     <Button
      type="button"
      variant="outline"
      size={iconButtonSize}
      disabled={isFirst || totalSegments === 0}
      aria-label={t("dictationMode.previousSentence")}
      title={t("dictationMode.previousSentence")}
      onClick={onPrevious}
     >
      <ChevronLeft aria-hidden="true" />
     </Button>

     <Button
      type="button"
      variant="outline"
      size={iconButtonSize}
      disabled={isLast || totalSegments === 0}
      aria-label={t("dictationMode.nextSentence")}
      title={t("dictationMode.nextSentence")}
      onClick={onNext}
     >
      <ChevronRight aria-hidden="true" />
     </Button>
    </div>

    <div className="min-w-0">
     <SegmentedControl
      value={playbackRate}
      items={speedItems}
      density="toolbar"
      layout="wrap"
      aria-label={t("controls.speedAria")}
      onChange={onPlaybackRateChange}
     />
    </div>
   </div>

   {checked ? (
    <div className="grid min-w-0 gap-2">
     <div className="flex min-w-0 items-center justify-between gap-2">
      <Typography as="span" variant="caption" tone="secondary">
       {t("dictationMode.resultLabel")}
      </Typography>
      <Typography as="span" variant="bodySmall" weight="bold" tone={scoreTone}>
       {`${currentScore}%`}
      </Typography>
     </div>

     <DictationDiffView
      diff={diff}
      summary={diffSummary}
      keyPrefix={`video-dictation-${currentIndex}`}
     />

     <div className="grid min-w-0 gap-0.5">
      <Typography as="span" variant="caption" tone="muted">
       {t("dictationMode.answerLabel")}
      </Typography>
      <HanziText as="p" size="large" wrapping="breakWords">
       {expectedText}
      </HanziText>
     </div>

     <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size={buttonSize} onClick={handleRetryAndFocus}>
       <RotateCcw data-icon="inline-start" aria-hidden="true" />
       {t("dictationMode.retry")}
      </Button>
      <Button
       ref={nextButtonRef}
       type="button"
       variant="default"
       size={buttonSize}
       disabled={isLast}
       onClick={handleAdvanceAndFocus}
      >
       {t("dictationMode.nextSentence")}
       <ChevronRight data-icon="inline-end" aria-hidden="true" />
      </Button>
     </div>

     {isLast ? (
      <Typography as="p" variant="caption" tone="secondary" aria-live="polite">
       {t("dictationMode.lastSentenceSummary", {
        attempted: attemptedCount,
        total: totalSegments,
        average: averageScore,
       })}
      </Typography>
     ) : null}
    </div>
   ) : (
    <form
     className="flex min-w-0 items-center gap-2"
     onSubmit={(event) => {
      event.preventDefault();
      if (canSubmit) onCheck();
     }}
    >
     <Input
      ref={inputRef}
      type="text"
      lang="zh-CN"
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      enterKeyHint="done"
      value={draft}
      placeholder={t("dictationMode.inputPlaceholder")}
      aria-label={t("dictationMode.inputAria")}
      className="min-w-0 flex-1"
      onChange={(event) => onDraftChange(event.target.value)}
      onKeyDown={handleInputKeyDown}
     />
     <Button type="submit" variant="default" size={buttonSize} disabled={!canSubmit}>
      {t("dictationMode.check")}
     </Button>
    </form>
   )}
  </div>
 );
}
