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
import { useLessonAnnotationContext } from "@/features/hanzihome/annotations/LessonAnnotationProvider";
import type { ProgressiveStudyText } from "@/features/hanzihome/components/lesson-overview/ProgressiveStudyText";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";

import type {
 ContextualPronunciationAnalysis,
 ContextualPronunciationGlyph,
 ContextualReadingUnit,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import {
 formatContextualPinyinRange,
 formatContextualReadingPinyin,
 formatContextualReadingUnitPinyin,
 formatContextualSpokenPinyin,
 getContextualReadingUnits,
 shouldSeparatePinyinSyllables,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";

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
 paragraphId?: string;
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
 paragraphId,
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
 const readingUnits = useMemo(
  () => (displayMode.autoDetectPinyin ? getContextualReadingUnits(analysis) : []),
  [analysis, displayMode.autoDetectPinyin],
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

 const renderGrapheme = (grapheme: Intl.SegmentData, index: number, includePinyin = true) => {
  const glyph = glyphByStart.get(grapheme.index);
  const annotation = annotations.find(
   (candidate) =>
    candidate.resolvedStartOffset <= grapheme.index &&
    candidate.resolvedEndOffset >= grapheme.index + grapheme.segment.length,
  );
  const readerAnnotation = readerAnnotations.find(
   (candidate) =>
    (paragraphId === undefined ||
     candidate.paragraph_id === null ||
     candidate.paragraph_id === paragraphId) &&
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
      "select-text",
      (annotation || readerAnnotation) && "reading-highlight",
      index === activeCharacterIndex && "reading-progress-highlight",
     )}
     data-color={readerAnnotation?.color || (annotation ? "yellow" : undefined)}
     aria-current={index === activeCharacterIndex ? "true" : undefined}
    >
     {grapheme.segment}
    </span>
   );
  }

  const active = index === activeCharacterIndex;
  const hanziInteractive = Boolean(annotation || readerAnnotation || onGlyphClick);
  const pinyinInteractive = Boolean(onGlyphInspect);
  const activateHanzi = (element: HTMLElement, event?: React.SyntheticEvent) => {
   event?.stopPropagation();
   if (window.getSelection()?.isCollapsed === false) return;
   if (annotation) {
    annotationContext?.openAnnotation(annotation);
    return;
   }
   if (readerAnnotation) {
    onOpenReaderAnnotation?.(readerAnnotation, element.getBoundingClientRect());
    return;
   }
   onGlyphClick?.(glyph.start, glyph.end);
  };
  const activatePinyin = (element: HTMLElement, event?: React.SyntheticEvent) => {
   event?.stopPropagation();
   onGlyphInspect?.(glyph, element.getBoundingClientRect());
  };
  const handleHanziKeyDown = (event: KeyboardEvent<HTMLElement>) => {
   if (event.key !== "Enter" && event.key !== " ") return;
   event.preventDefault();
   activateHanzi(event.currentTarget, event);
  };
  const handlePinyinKeyDown = (event: KeyboardEvent<HTMLElement>) => {
   if (event.key !== "Enter" && event.key !== " ") return;
   event.preventDefault();
   activatePinyin(event.currentTarget, event);
  };
  const hanziClassName = hanziInteractive
   ? cn(
      "cursor-pointer rounded-sm select-text",
      focusRingClassName,
      (annotation || readerAnnotation) && "reading-highlight",
     )
   : "select-text";
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

  const annotationColor = readerAnnotation?.color || (annotation ? "yellow" : undefined);

  if (resolvedPinyinPresentation === "paragraph") {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(hanziClassName, active && "reading-progress-highlight")}
     data-color={annotationColor}
     onClick={hanziInteractive ? (event) => activateHanzi(event.currentTarget, event) : undefined}
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

  if (!includePinyin || !showPinyin || glyph.spokenPinyin === null) {
   return (
    <span
     key={`${grapheme.index}:${grapheme.segment}`}
     className={cn(hanziClassName, active && "reading-progress-highlight")}
     data-color={annotationColor}
     onClick={hanziInteractive ? (event) => activateHanzi(event.currentTarget, event) : undefined}
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
     data-color={annotationColor}
     onClick={hanziInteractive ? (event) => activateHanzi(event.currentTarget, event) : undefined}
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
 const renderReadingUnit = (unit: ContextualReadingUnit) => {
  const unitGraphemes = graphemes.filter(
   (grapheme) => grapheme.index >= unit.start && grapheme.index < unit.end,
  );
  const unitPinyin =
   unit.type === "hanzi" && resolvedPinyinPresentation !== "paragraph" && showPinyin
    ? formatContextualReadingUnitPinyin(analysis, unit)
    : null;
  if (unitPinyin === null) {
   return unitGraphemes.map((grapheme) => renderGrapheme(grapheme, graphemes.indexOf(grapheme)));
  }

  let previousPinyin = "";
  return (
   <ruby key={unit.id}>
    {unitGraphemes.map((grapheme) => renderGrapheme(grapheme, graphemes.indexOf(grapheme), false))}
    <rt className="select-none font-pinyin text-[0.45em] font-semibold text-accent-text">
     {unitGraphemes.map((grapheme) => {
      const glyph = glyphByStart.get(grapheme.index);
      if (glyph === undefined) return null;
      const pinyin = formatContextualPinyinRange(analysis, glyph.start, glyph.end);
      const separator = shouldSeparatePinyinSyllables(previousPinyin, pinyin) ? "'" : "";
      previousPinyin = pinyin;
      const needsPronunciationReview =
       glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
      const pinyinInteractive = Boolean(onGlyphInspect);
      const activatePinyin = (element: HTMLElement, event?: React.SyntheticEvent) => {
       event?.stopPropagation();
       onGlyphInspect?.(glyph, element.getBoundingClientRect());
      };
      const handlePinyinKeyDown = (event: KeyboardEvent<HTMLElement>) => {
       if (event.key !== "Enter" && event.key !== " ") return;
       event.preventDefault();
       activatePinyin(event.currentTarget, event);
      };
      return pinyinInteractive ? (
       <span
        key={`${glyph.start}:${glyph.end}`}
        className={cn(
         "cursor-pointer rounded-sm",
         focusRingClassName,
         needsPronunciationReview && "text-warning underline decoration-dotted underline-offset-2",
        )}
        onClick={(event) => {
         event.stopPropagation();
         activatePinyin(event.currentTarget);
        }}
        onKeyDown={handlePinyinKeyDown}
        role="button"
        tabIndex={0}
        aria-label={t(needsPronunciationReview ? "inspectUnconfirmedPinyin" : "inspectPinyin", {
         character: grapheme.segment,
        })}
        title={glyph.alternatives.length > 1 ? glyph.alternatives.join(", ") : undefined}
       >
        {separator}
        {pinyin}
       </span>
      ) : (
       <span key={`${glyph.start}:${glyph.end}`}>
        {separator}
        {pinyin}
       </span>
      );
     })}
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
    {readingUnits.length > 0
     ? readingUnits.map(renderReadingUnit)
     : graphemes.map((grapheme, index) => renderGrapheme(grapheme, index))}
   </ReaderHanziText>
   {resolvedPinyinPresentation === "paragraph" && showPinyin ? (
    <PinyinText variant="bodySmall" tone="muted" wrapping="preWrap">
     {!displayMode.autoDetectPinyin && sourcePinyin && !hasManualOverride
      ? sourcePinyin
      : displayMode.autoDetectPinyin
        ? formatContextualReadingPinyin(analysis)
        : formatContextualSpokenPinyin(analysis)}
    </PinyinText>
   ) : null}
  </div>
 );
}
