"use client";

import { ReaderHanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { cn } from "@/lib/utils";

import type { ContextualPronunciationAnalysis } from "../pronunciation/contextual-pronunciation";

type ContextualReaderTextProps = {
 analysis: ContextualPronunciationAnalysis;
 displayMode: LessonDisplayMode;
 className?: string;
 showPinyin?: boolean;
 onGlyphClick?: (start: number, end: number) => void;
};

export function ContextualReaderText({
 analysis,
 displayMode,
 className,
 showPinyin = displayMode.showPinyin,
 onGlyphClick,
}: ContextualReaderTextProps) {
 const glyphByStart = new Map(analysis.glyphs.map((glyph) => [glyph.start, glyph]));
 const graphemes = [
  ...new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(analysis.normalizedText),
 ];

 return (
  <ReaderHanziText
   displayMode={displayMode}
   tone="default"
   leading="learner"
   wrapping="preWrap"
   className={cn("min-w-0", className)}
  >
   {graphemes.map((grapheme) => {
    const glyph = glyphByStart.get(grapheme.index);
    if (glyph === undefined || !showPinyin || glyph.spokenPinyin === null) {
     return <span key={`${grapheme.index}:${grapheme.segment}`}>{grapheme.segment}</span>;
    }
    const alternatives = glyph.alternatives.length > 1 ? glyph.alternatives.join(", ") : undefined;
    return (
     <ruby
      key={`${grapheme.index}:${grapheme.segment}`}
      className={cn(onGlyphClick && "cursor-pointer")}
      onClick={onGlyphClick ? () => onGlyphClick(glyph.start, glyph.end) : undefined}
      title={alternatives}
     >
      <span>{grapheme.segment}</span>
      <rt className="font-pinyin text-[0.45em] font-semibold text-accent-text">
       {glyph.spokenPinyin}
      </rt>
     </ruby>
    );
   })}
  </ReaderHanziText>
 );
}
