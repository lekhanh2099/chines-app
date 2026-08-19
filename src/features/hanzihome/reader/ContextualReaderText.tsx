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
  const interactive = Boolean(onGlyphInspect || onGlyphClick);
  const activateGlyph = (element: HTMLElement) => {
   if (onGlyphInspect) {
    onGlyphInspect(glyph, element.getBoundingClientRect());
    return;
   }
   onGlyphClick?.(glyph.start, glyph.end);
  };
  const handleGlyphKeyDown = (event: KeyboardEvent<HTMLElement>) => {
   if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    activateGlyph(event.currentTarget);
   }
  };
  const actionLabel = onGlyphInspect
   ? `Kiểm tra cách đọc chữ ${grapheme.segment}`
   : onGlyphClick
     ? t("playFromCharacter", { character: grapheme.segment })
     : undefined;
  const interactiveClassName = interactive
   ? cn(
      "cursor-pointer rounded-sm underline decoration-dotted underline-offset-[0.22em]",
      focusRingClassName,
     )
   : undefined;

  if (pinyinPresentation === "paragraph") {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(interactiveClassName, active && "reading-progress-highlight")}
     onClick={interactive ? (event) => activateGlyph(event.currentTarget) : undefined}
     onKeyDown={interactive ? handleGlyphKeyDown : undefined}
     role={interactive ? "button" : undefined}
     tabIndex={interactive ? 0 : undefined}
     aria-label={actionLabel}
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
     className={cn(interactiveClassName, active && "reading-progress-highlight")}
     onClick={interactive ? (event) => activateGlyph(event.currentTarget) : undefined}
     onKeyDown={interactive ? handleGlyphKeyDown : undefined}
     role={interactive ? "button" : undefined}
     tabIndex={interactive ? 0 : undefined}
     aria-label={actionLabel}
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
    className={cn(interactiveClassName, active && "reading-progress-highlight")}
    onClick={interactive ? (event) => activateGlyph(event.currentTarget) : undefined}
    onKeyDown={interactive ? handleGlyphKeyDown : undefined}
    role={interactive ? "button" : undefined}
    tabIndex={interactive ? 0 : undefined}
    aria-label={actionLabel}
    title={alternatives}
    aria-current={active ? "true" : undefined}
   >
    <span>{grapheme.segment}</span>
    <rt className="font-pinyin text-[0.45em] font-semibold text-accent-text">
     {glyph.spokenPinyin}
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
   {pinyinPresentation === "paragraph" && showPinyin ? (
    <PinyinText variant="bodySmall" tone="muted" wrapping="preWrap">
     {analysis.sourcePinyinStatus === "aligned" && sourcePinyin
      ? sourcePinyin
      : formatContextualSpokenPinyin(analysis)}
    </PinyinText>
   ) : null}
  </div>
 );
}
