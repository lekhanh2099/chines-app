"use client";

import { useMemo, type ComponentProps, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { focusRingClassName } from "@/components/ui/focus-ring";
import {
 PinyinText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { cn } from "@/lib/utils";
import { useLessonAnnotationContext } from "../annotations/LessonAnnotationProvider";
import type { ProgressiveStudyText } from "../components/lesson-overview/ProgressiveStudyText";
import type { ReaderAnnotationRow } from "./reader.schemas";

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
 annotationTarget?: ComponentProps<typeof ProgressiveStudyText>["annotationTarget"];
 readerAnnotations?: readonly ReaderAnnotationRow[];
 onOpenReaderAnnotation?: (annotation: ReaderAnnotationRow, rect: DOMRect) => void;
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
 annotationTarget,
 readerAnnotations = [],
 onOpenReaderAnnotation,
 onGlyphClick,
 onGlyphInspect,
}: ContextualReaderTextProps) {
 const t = useTranslations("Reader.document.text");
 const annotationContext = useLessonAnnotationContext();
 const annotations =
  annotationTarget && annotationContext
   ? annotationContext.getAnnotations(annotationTarget, analysis.normalizedText)
   : [];
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
  const annotation = annotations.find(
   (candidate) =>
    candidate.resolvedStartOffset <= grapheme.index &&
    candidate.resolvedEndOffset >= grapheme.index + grapheme.segment.length,
  );
  const readerAnnotation = readerAnnotations.find(
   (candidate) =>
    candidate.start_offset !== null &&
    candidate.end_offset !== null &&
    candidate.start_offset <= grapheme.index &&
    candidate.end_offset >= grapheme.index + grapheme.segment.length &&
    analysis.normalizedText.slice(candidate.start_offset, candidate.end_offset) ===
     candidate.selected_text,
  );
  if (glyph === undefined) {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(
      (annotation || readerAnnotation) && "reading-highlight",
      index === activeCharacterIndex && "reading-progress-highlight",
     )}
     aria-current={index === activeCharacterIndex ? "true" : undefined}
    >
     {grapheme.segment}
    </span>
   );
  }

  const active = index === activeCharacterIndex;
  const hanziInteractive = Boolean(annotation || readerAnnotation || onGlyphClick);
  const pinyinInteractive = Boolean(onGlyphInspect);
  const activateHanzi = (element: HTMLElement) => {
   if (window.getSelection()?.isCollapsed === false) return;
   if (annotation) annotationContext?.openAnnotation(annotation);
   else if (readerAnnotation)
    onOpenReaderAnnotation?.(readerAnnotation, element.getBoundingClientRect());
   else onGlyphClick?.(glyph.start, glyph.end);
  };
  const activatePinyin = (element: HTMLElement) =>
   onGlyphInspect?.(glyph, element.getBoundingClientRect());
  const handleHanziKeyDown = (event: KeyboardEvent<HTMLElement>) => {
   if (event.key !== "Enter" && event.key !== " ") return;
   event.preventDefault();
   activateHanzi(event.currentTarget);
  };
  const handlePinyinKeyDown = (event: KeyboardEvent<HTMLElement>) => {
   if (event.key !== "Enter" && event.key !== " ") return;
   event.preventDefault();
   activatePinyin(event.currentTarget);
  };
  const hanziClassName = hanziInteractive
   ? cn(
      "cursor-pointer rounded-sm",
      focusRingClassName,
      (annotation || readerAnnotation) && "reading-highlight",
     )
   : undefined;
  const pinyinClassName = pinyinInteractive
   ? cn("cursor-pointer rounded-sm", focusRingClassName)
   : undefined;
  const needsPronunciationReview =
   glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
  const hanziActionLabel = annotation
   ? t("openAnnotation", { text: annotation.selectedText })
   : readerAnnotation
     ? t("openAnnotation", { text: readerAnnotation.selected_text })
     : hanziInteractive
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
     onClick={hanziInteractive ? (event) => activateHanzi(event.currentTarget) : undefined}
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
     onClick={hanziInteractive ? (event) => activateHanzi(event.currentTarget) : undefined}
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
     onClick={hanziInteractive ? (event) => activateHanzi(event.currentTarget) : undefined}
     onKeyDown={hanziInteractive ? handleHanziKeyDown : undefined}
     role={hanziInteractive ? "button" : undefined}
     tabIndex={hanziInteractive ? 0 : undefined}
     aria-label={hanziActionLabel}
    >
     {grapheme.segment}
    </span>
    <rt className="select-none font-pinyin text-[0.45em] font-semibold text-accent-text">
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
    data-reader-hanzi-content="true"
    data-study-annotation-node={annotationTarget ? "true" : undefined}
    data-lesson-id={annotationTarget?.lessonId}
    data-node-type={annotationTarget?.nodeType}
    data-node-id={annotationTarget?.nodeId}
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
