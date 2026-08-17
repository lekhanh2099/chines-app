"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
 PinyinText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { focusRingClassName } from "@/components/ui/focus-ring";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { cn } from "@/lib/utils";

import type { ContextualPronunciationAnalysis } from "../pronunciation/contextual-pronunciation";
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
  const activateGlyph = () => onGlyphClick?.(glyph.start, glyph.end);
  const handleGlyphKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
   if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    activateGlyph();
   }
  };
  const playLabel = onGlyphClick ? t("playFromCharacter", { character: grapheme.segment }) : undefined;
  if (pinyinPresentation === "paragraph") {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(
      onGlyphClick && cn("cursor-pointer rounded-sm", focusRingClassName),
      active && "reading-progress-highlight",
     )}
     onClick={onGlyphClick ? activateGlyph : undefined}
     onKeyDown={onGlyphClick ? handleGlyphKeyDown : undefined}
     role={onGlyphClick ? "button" : undefined}
     tabIndex={onGlyphClick ? 0 : undefined}
     aria-label={playLabel}
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
     className={cn(
      onGlyphClick && cn("cursor-pointer rounded-sm", focusRingClassName),
      active && "reading-progress-highlight",
     )}
     onClick={onGlyphClick ? activateGlyph : undefined}
     onKeyDown={onGlyphClick ? handleGlyphKeyDown : undefined}
     role={onGlyphClick ? "button" : undefined}
     tabIndex={onGlyphClick ? 0 : undefined}
     aria-label={playLabel}
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
    className={cn(
     onGlyphClick && cn("cursor-pointer rounded-sm", focusRingClassName),
     active && "reading-progress-highlight",
    )}
    onClick={onGlyphClick ? activateGlyph : undefined}
    onKeyDown={onGlyphClick ? handleGlyphKeyDown : undefined}
    role={onGlyphClick ? "button" : undefined}
    tabIndex={onGlyphClick ? 0 : undefined}
    aria-label={playLabel}
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
