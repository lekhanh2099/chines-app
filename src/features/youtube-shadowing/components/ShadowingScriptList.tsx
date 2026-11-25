"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, ClipboardPaste } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import {
 SegmentedControl,
 type SegmentedControlItem,
} from "@/components/ui/forms/segmented-control";
import { Card } from "@/components/ui/layout/card";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { generateSmartPinyin } from "@/lib/pronunciation/pinyin-engine";

import { formatTimestampMs } from "../model/time-format";
import type { TranscriptSegment } from "../model/youtube-transcript.schemas";

export const scriptDisplayModeSchema = z.enum(["hanzi", "pinyin", "hidden"]);
export type ScriptDisplayMode = z.infer<typeof scriptDisplayModeSchema>;

const USER_SCROLL_COOLDOWN_MS = 3000;

const ScriptRow = memo(function ScriptRow({
 index,
 isActive,
 marker,
 text,
 pinyin,
 displayMode,
 hiddenMask,
 dictationScore,
 isDictationMode,
 onSelect,
 onMountRow,
 onUnmountRow,
}: {
 index: number;
 isActive: boolean;
 marker: string;
 text: string;
 pinyin: string;
 displayMode: ScriptDisplayMode;
 hiddenMask: string;
 dictationScore: number;
 isDictationMode: boolean;
 onSelect: (index: number) => void;
 onMountRow: (index: number, node: HTMLButtonElement) => void;
 onUnmountRow: (index: number) => void;
}) {
 const showMasked = isDictationMode
  ? dictationScore < 0
  : displayMode === scriptDisplayModeSchema.enum.hidden;

 const scoreTone = dictationScore === 100 ? "success" : dictationScore >= 60 ? "warning" : "danger";

 return (
  <div role="listitem" className="min-w-0">
   <Button
    ref={(node) => {
     if (node) onMountRow(index, node);
     else onUnmountRow(index);
    }}
    type="button"
    variant={isActive ? "active" : "navigation"}
    size="touch"
    align="start"
    wrap="normal"
    layout="grid"
    aria-current={isActive ? "true" : undefined}
    className="w-full"
    onClick={() => onSelect(index)}
   >
    <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
     <Typography as="span" variant="caption" tone="muted">
      {marker}
     </Typography>
     <span className="grid min-w-0 gap-0.5">
      {showMasked ? (
       <Typography as="span" variant="bodySmall" tone="muted">
        {hiddenMask}
       </Typography>
      ) : (
       <>
        <HanziText as="span" size="large" wrapping="breakWords">
         {text}
        </HanziText>
        {!isDictationMode && displayMode === scriptDisplayModeSchema.enum.pinyin && pinyin ? (
         <PinyinText as="span" variant="bodySmall" tone="secondary" wrapping="breakWords">
          {pinyin}
         </PinyinText>
        ) : null}
       </>
      )}
     </span>
     {isDictationMode && dictationScore >= 0 ? (
      <Typography as="span" variant="caption" tone={scoreTone}>
       {`${dictationScore}%`}
      </Typography>
     ) : (
      <span aria-hidden="true" />
     )}
    </span>
   </Button>
  </div>
 );
});

export function ShadowingScriptList({
 segments,
 isTimed,
 language,
 activeIndex,
 isPlaying,
 displayMode,
 isDictationMode = false,
 dictationScores = [],
 onDisplayModeChange,
 onSelectSegment,
 onOpenManualDialog,
 onStepManual,
}: {
 segments: TranscriptSegment[];
 isTimed: boolean;
 language: string;
 activeIndex: number;
 isPlaying: boolean;
 displayMode: ScriptDisplayMode;
 isDictationMode?: boolean;
 dictationScores?: number[];
 onDisplayModeChange: (mode: ScriptDisplayMode) => void;
 onSelectSegment: (index: number) => void;
 onOpenManualDialog: () => void;
 onStepManual: (delta: number) => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const listPaneRef = useRef<HTMLDivElement>(null);
 const rowRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
 const lastUserScrollAtRef = useRef(0);

 const displayItems: SegmentedControlItem<ScriptDisplayMode>[] = useMemo(
  () => [
   { key: "hanzi", label: t("script.modeHanzi") },
   { key: "pinyin", label: t("script.modePinyin") },
   { key: "hidden", label: t("script.modeHidden") },
  ],
  [t],
 );

 const pinyinList = useMemo(() => {
  if (isDictationMode || displayMode !== scriptDisplayModeSchema.enum.pinyin) return [];
  return segments.map((segment) => generateSmartPinyin(segment.text).pinyin);
 }, [displayMode, isDictationMode, segments]);

 const handleMountRow = useCallback((index: number, node: HTMLButtonElement) => {
  rowRefs.current.set(index, node);
 }, []);

 const handleUnmountRow = useCallback((index: number) => {
  rowRefs.current.delete(index);
 }, []);

 useEffect(() => {
  const pane = listPaneRef.current;
  if (!pane) return;

  const markUserScroll = () => {
   lastUserScrollAtRef.current = Date.now();
  };

  pane.addEventListener("wheel", markUserScroll, { passive: true });
  pane.addEventListener("touchmove", markUserScroll, { passive: true });
  pane.addEventListener("pointerdown", markUserScroll, { passive: true });
  return () => {
   pane.removeEventListener("wheel", markUserScroll);
   pane.removeEventListener("touchmove", markUserScroll);
   pane.removeEventListener("pointerdown", markUserScroll);
  };
 }, []);

 useEffect(() => {
  if (activeIndex < 0) return;
  if (!isDictationMode && (!isTimed || !isPlaying)) return;
  if (!isDictationMode && Date.now() - lastUserScrollAtRef.current < USER_SCROLL_COOLDOWN_MS) {
   return;
  }

  const pane = listPaneRef.current;
  const activeRow = rowRefs.current.get(activeIndex);
  if (!pane || !activeRow) return;

  const prefersReducedMotion =
   typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targetTop = Math.max(
   0,
   activeRow.offsetTop - (pane.clientHeight - activeRow.offsetHeight) / 2,
  );
  pane.scrollTo({
   top: targetTop,
   behavior: prefersReducedMotion ? "auto" : "smooth",
  });
 }, [activeIndex, isDictationMode, isPlaying, isTimed]);

 const hiddenMask = t("script.hiddenMask");

 return (
  <Card
   variant="section"
   padding="sm"
   className="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden lg:gap-3"
  >
   <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2">
    {!isDictationMode ? (
     <div className="min-w-0">
      <SegmentedControl
       value={displayMode}
       items={displayItems}
       density="toolbar"
       layout="wrap"
       aria-label={t("script.displayModeAria")}
       onChange={onDisplayModeChange}
      />
     </div>
    ) : null}

    <div className="flex min-w-0 flex-wrap items-center gap-2">
     <Typography as="span" variant="caption" tone="muted">
      {t("script.segmentCount", { count: segments.length })}
     </Typography>
     {language ? (
      <Badge variant="default" size="sm" casing="natural">
       {language}
      </Badge>
     ) : null}
     <Button type="button" variant="outline" size="toolbar" onClick={onOpenManualDialog}>
      <ClipboardPaste data-icon="inline-start" aria-hidden="true" />
      {t("script.pasteAnother")}
     </Button>
    </div>
   </div>

   {!isTimed ? (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2">
     <Typography as="p" variant="caption" tone="muted">
      {t("script.untimedBanner")}
     </Typography>
     <div className="flex items-center gap-2">
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       disabled={activeIndex <= 0}
       onClick={() => onStepManual(-1)}
      >
       <ChevronLeft data-icon="inline-start" aria-hidden="true" />
       {t("script.previousSentence")}
      </Button>
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       disabled={activeIndex >= segments.length - 1}
       onClick={() => onStepManual(1)}
      >
       {t("script.nextSentence")}
       <ChevronRight data-icon="inline-end" aria-hidden="true" />
      </Button>
     </div>
    </div>
   ) : null}

   <div
    ref={listPaneRef}
    tabIndex={0}
    role="list"
    aria-label={t("script.listAria")}
    className="relative grid min-h-0 flex-1 content-start gap-1 overflow-y-auto overscroll-contain scrollbar-soft"
   >
    {segments.map((segment, index) => (
     <ScriptRow
      key={`${segment.startMs}-${index}`}
      index={index}
      isActive={index === activeIndex}
      marker={isTimed ? formatTimestampMs(segment.startMs) : `${index + 1}`}
      text={segment.text}
      pinyin={pinyinList[index] ?? ""}
      displayMode={displayMode}
      hiddenMask={hiddenMask}
      dictationScore={dictationScores[index] ?? -1}
      isDictationMode={isDictationMode}
      onSelect={onSelectSegment}
      onMountRow={handleMountRow}
      onUnmountRow={handleUnmountRow}
     />
    ))}
   </div>
  </Card>
 );
}
