"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, ClipboardPaste } from "lucide-react";
import { useTranslations } from "next-intl";
import { z } from "zod";

import {
 getAppScrollContainer,
 scrollAppContentToElement,
} from "@/components/layout/scroll/app-scroll";
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

export function ShadowingScriptList({
 segments,
 isTimed,
 language,
 activeIndex,
 isPlaying,
 displayMode,
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
 onDisplayModeChange: (mode: ScriptDisplayMode) => void;
 onSelectSegment: (index: number) => void;
 onOpenManualDialog: () => void;
 onStepManual: (delta: number) => void;
}) {
 const t = useTranslations("YoutubeShadowing");
 const rowRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
 const lastUserScrollAtRef = useRef(0);

 const displayItems: SegmentedControlItem<ScriptDisplayMode>[] = [
  { key: "hanzi", label: t("script.modeHanzi") },
  { key: "pinyin", label: t("script.modePinyin") },
  { key: "hidden", label: t("script.modeHidden") },
 ];

 const pinyinList = useMemo(() => {
  if (displayMode !== scriptDisplayModeSchema.enum.pinyin) return [];
  return segments.map((segment) => generateSmartPinyin(segment.text).pinyin);
 }, [displayMode, segments]);

 useEffect(() => {
  const scrollContainer = getAppScrollContainer();
  if (!scrollContainer) return;

  const markUserScroll = () => {
   lastUserScrollAtRef.current = Date.now();
  };

  scrollContainer.addEventListener("wheel", markUserScroll, { passive: true });
  scrollContainer.addEventListener("touchmove", markUserScroll, { passive: true });
  scrollContainer.addEventListener("pointerdown", markUserScroll, { passive: true });
  return () => {
   scrollContainer.removeEventListener("wheel", markUserScroll);
   scrollContainer.removeEventListener("touchmove", markUserScroll);
   scrollContainer.removeEventListener("pointerdown", markUserScroll);
  };
 }, []);

 useEffect(() => {
  if (!isTimed || !isPlaying || activeIndex < 0) return;
  if (Date.now() - lastUserScrollAtRef.current < USER_SCROLL_COOLDOWN_MS) return;

  const activeRow = rowRefs.current.get(activeIndex);
  if (!activeRow) return;

  const prefersReducedMotion =
   typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scrollAppContentToElement(activeRow, {
   block: "center",
   behavior: prefersReducedMotion ? "auto" : "smooth",
  });
 }, [activeIndex, isPlaying, isTimed]);

 return (
  <Card variant="section" padding="md" className="grid min-w-0 gap-3">
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
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
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
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

   <div className="grid min-w-0 gap-1" role="list" aria-label={t("script.listAria")}>
    {segments.map((segment, index) => {
     const isActive = index === activeIndex;
     const marker = isTimed ? formatTimestampMs(segment.startMs) : `${index + 1}`;
     const pinyin = pinyinList[index] ?? "";

     return (
      <div key={`${segment.startMs}-${index}`} role="listitem" className="min-w-0">
       <Button
        ref={(node) => {
         if (node) rowRefs.current.set(index, node);
         else rowRefs.current.delete(index);
        }}
        type="button"
        variant={isActive ? "active" : "navigation"}
        size="touch"
        align="start"
        wrap="normal"
        layout="grid"
        aria-current={isActive ? "true" : undefined}
        className="w-full"
        onClick={() => onSelectSegment(index)}
       >
        <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
         <Typography as="span" variant="caption" tone="muted">
          {marker}
         </Typography>
         <span className="grid min-w-0 gap-0.5">
          {displayMode === scriptDisplayModeSchema.enum.hidden ? (
           <Typography as="span" variant="bodySmall" tone="muted">
            {t("script.hiddenMask")}
           </Typography>
          ) : (
           <>
            <HanziText as="span" size="medium" wrapping="breakWords">
             {segment.text}
            </HanziText>
            {displayMode === scriptDisplayModeSchema.enum.pinyin && pinyin ? (
             <PinyinText as="span" variant="bodySmall" tone="secondary" wrapping="breakWords">
              {pinyin}
             </PinyinText>
            ) : null}
           </>
          )}
         </span>
        </span>
       </Button>
      </div>
     );
    })}
   </div>
  </Card>
 );
}
