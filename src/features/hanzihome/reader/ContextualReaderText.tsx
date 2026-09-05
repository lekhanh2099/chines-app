"use client";

import { useMemo, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { focusRingClassName } from "@/components/ui/focus-ring";
import {
 PinyinText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { cn } from "@/lib/utils";

import type {
 ContextualPronunciationAnalysis,
 ContextualPronunciationGlyph,
} from "../pronunciation/contextual-pronunciation";
import { formatContextualSpokenPinyin } from "../pronunciation/contextual-pronunciation";

const readerGraphemeSegmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });

type ContextualReaderTextProps = {
 analysis: ContextualPronunciationAnalysis;
 activeCharacterIndex?: number;
 displayMode: LessonDisplayMode;
 className?: string;
 showPinyin?: boolean;
 pinyinPresentation?: "ruby" | "paragraph";
 sourcePinyin?: string;
 onGlyphClick?: (start: number, end: number) => void;
 onGlyphInspect?: (glyph: ContextualPronunciationGlyph, rect: DOMRect) => void;
};

export function ContextualReaderText({
 analysis,
 activeCharacterIndex = -1,
 displayMode,
 className,
 showPinyin = displayMode.showPinyin,
 pinyinPresentation = "ruby",
 sourcePinyin,
 onGlyphClick,
 onGlyphInspect,
}: ContextualReaderTextProps) {
 const t = useTranslations("Reader.document.text");
 const glyphByStart = useMemo(
  () => new Map(analysis.glyphs.map((glyph) => [glyph.start, glyph])),
  [analysis.glyphs],
 );
 const graphemes = useMemo(
  () => [...readerGraphemeSegmenter.segment(analysis.normalizedText)],
  [analysis.normalizedText],
 );
 const hasManualOverride = analysis.glyphs.some((glyph) =>
  glyph.evidence.includes("manual-override"),
 );
 const sourcePinyinAvailable = Boolean(sourcePinyin?.trim());
 const resolvedPinyinPresentation =
  !displayMode.autoDetectPinyin &&
  sourcePinyinAvailable &&
  analysis.sourcePinyinStatus !== "aligned"
   ? "paragraph"
   : pinyinPresentation;

 const renderGrapheme = (grapheme: Intl.SegmentData, index: number) => {
  const glyph = glyphByStart.get(grapheme.index);
  if (glyph === undefined) {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(index === activeCharacterIndex && "reading-progress-highlight")}
     aria-current={index === activeCharacterIndex ? "true" : undefined}
    >
     {grapheme.segment}
    </span>
   );
  }

  const active = index === activeCharacterIndex;
  const hanziInteractive = Boolean(onGlyphClick);
  const pinyinInteractive = Boolean(onGlyphInspect);
  const activateHanzi = () => onGlyphClick?.(glyph.start, glyph.end);
  const activatePinyin = (element: HTMLElement) =>
   onGlyphInspect?.(glyph, element.getBoundingClientRect());
  const handleHanziKeyDown = (event: KeyboardEvent<HTMLElement>) => {
   if (event.key !== "Enter" && event.key !== " ") return;
   event.preventDefault();
   activateHanzi();
  };
  const handlePinyinKeyDown = (event: KeyboardEvent<HTMLElement>) => {
   if (event.key !== "Enter" && event.key !== " ") return;
   event.preventDefault();
   activatePinyin(event.currentTarget);
  };
  const hanziClassName = hanziInteractive
   ? cn("cursor-pointer rounded-sm", focusRingClassName)
   : undefined;
  const pinyinClassName = pinyinInteractive
   ? cn("cursor-pointer rounded-sm", focusRingClassName)
   : undefined;
  const needsPronunciationReview =
   glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
  const hanziActionLabel = hanziInteractive
   ? t("playFromCharacter", { character: grapheme.segment })
   : undefined;
  const pinyinActionLabel = pinyinInteractive
   ? needsPronunciationReview
    ? t("inspectUnconfirmedPinyin", { character: grapheme.segment })
    : t("inspectPinyin", { character: grapheme.segment })
   : undefined;

  if (resolvedPinyinPresentation === "paragraph") {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(hanziClassName, active && "reading-progress-highlight")}
     onClick={hanziInteractive ? activateHanzi : undefined}
     onKeyDown={hanziInteractive ? handleHanziKeyDown : undefined}
     role={hanziInteractive ? "button" : undefined}
     tabIndex={hanziInteractive ? 0 : undefined}
     aria-label={hanziActionLabel}
     aria-current={active ? "true" : undefined}
    >
     {grapheme.segment}
    </span>
   );
  }

  if (!showPinyin || glyph.spokenPinyin === null) {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(hanziClassName, active && "reading-progress-highlight")}
     onClick={hanziInteractive ? activateHanzi : undefined}
     onKeyDown={hanziInteractive ? handleHanziKeyDown : undefined}
     role={hanziInteractive ? "button" : undefined}
     tabIndex={hanziInteractive ? 0 : undefined}
     aria-label={hanziActionLabel}
     aria-current={active ? "true" : undefined}
    >
     {grapheme.segment}
    </span>
   );
  }

  const alternatives = glyph.alternatives.length > 1 ? glyph.alternatives.join(", ") : undefined;
  return (
   <ruby
    key={`${grapheme.index}:${grapheme.segment}`}
    className={cn(active && "reading-progress-highlight")}
    aria-current={active ? "true" : undefined}
   >
    <span
     className={hanziClassName}
     onClick={hanziInteractive ? activateHanzi : undefined}
     onKeyDown={hanziInteractive ? handleHanziKeyDown : undefined}
     role={hanziInteractive ? "button" : undefined}
     tabIndex={hanziInteractive ? 0 : undefined}
     aria-label={hanziActionLabel}
    >
     {grapheme.segment}
    </span>
    <rt className="font-pinyin text-[0.45em] font-semibold text-accent-text">
     {pinyinInteractive ? (
      <span
       className={cn(
        pinyinClassName,
        needsPronunciationReview && "text-warning underline decoration-dotted underline-offset-2",
       )}
       onClick={(event) => {
        event.stopPropagation();
        activatePinyin(event.currentTarget);
       }}
       onKeyDown={handlePinyinKeyDown}
       role="button"
       tabIndex={0}
       aria-label={pinyinActionLabel}
       title={alternatives}
      >
       {glyph.spokenPinyin}
      </span>
     ) : (
      glyph.spokenPinyin
     )}
    </rt>
   </ruby>
  );
 };

 return (
  <div className={cn("grid min-w-0 gap-1", className)}>
   <ReaderHanziText
    displayMode={displayMode}
    tone="default"
    leading="learner"
    wrapping="preWrap"
    className="min-w-0"
   >
    {graphemes.map(renderGrapheme)}
   </ReaderHanziText>
   {resolvedPinyinPresentation === "paragraph" && showPinyin ? (
    <PinyinText variant="bodySmall" tone="muted" wrapping="preWrap">
     {!displayMode.autoDetectPinyin && sourcePinyin && !hasManualOverride
      ? sourcePinyin
      : formatContextualSpokenPinyin(analysis)}
    </PinyinText>
   ) : null}
  </div>
 );
}
