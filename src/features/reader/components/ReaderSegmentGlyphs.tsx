"use client";

import type { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { glyphActionClassName } from "@/components/ui/focus-ring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/utils";
import {
 formatContextualPinyinRange,
 formatContextualReadingUnitPinyin,
 shouldSeparatePinyinSyllables,
 type ContextualPronunciationAnalysis,
 type ContextualReadingUnit,
} from "@/lib/pronunciation/contextual-pronunciation";
import type { ReaderAnnotation } from "../runtime/reader-services";
import type {
 useReaderCommands,
 useReaderPlaybackStatus,
 useReaderSegment,
 useReaderServices,
} from "../runtime/reader-context";

/** Everything one Reader segment's grapheme/reading-unit renderers read during render. */
export type ReaderSegmentGlyphContext = {
 segment: NonNullable<ReturnType<typeof useReaderSegment>>;
 segmentId: string;
 graphemes: Intl.SegmentData[];
 glyphs: ReadonlyMap<number, ContextualPronunciationAnalysis["glyphs"][number]>;
 annotations: readonly ReaderAnnotation[];
 analysis?: ContextualPronunciationAnalysis;
 inlinePinyin: boolean;
 showPinyin: boolean;
 status: ReturnType<typeof useReaderPlaybackStatus>;
 progress: number;
 startOffset: number;
 services: ReturnType<typeof useReaderServices>;
 commands: ReturnType<typeof useReaderCommands>;
 textLabels: ReturnType<typeof useTranslations<"Reader.document.text">>;
};

export function renderReaderGrapheme(
 context: ReaderSegmentGlyphContext,
 grapheme: Intl.SegmentData,
 index: number,
 includePinyin = true,
) {
 const {
  segment,
  segmentId,
  glyphs,
  annotations,
  analysis,
  inlinePinyin,
  showPinyin,
  status,
  progress,
  startOffset,
  services,
  commands,
  textLabels,
 } = context;
 const glyph = glyphs.get(grapheme.index);
 const annotation = annotations.find(
  (item) =>
   item.start <= grapheme.index &&
   item.end >= grapheme.index + grapheme.segment.length &&
   segment.zh.slice(item.start, item.end) === item.text,
 );
 const playable =
  Boolean(annotation) || (Boolean(services.speech) && /\p{Script=Han}/u.test(grapheme.segment));
 const currentOffset = Math.min(
  segment.zh.length - 1,
  startOffset + (segment.zh.length - startOffset) * progress,
 );
 const highlighted =
  status !== "idle" &&
  grapheme.index <= currentOffset &&
  currentOffset < grapheme.index + grapheme.segment.length;
 const play = (element: HTMLElement, event?: React.SyntheticEvent) => {
  event?.stopPropagation();
  if (window.getSelection()?.isCollapsed === false) return;
  if (annotation) {
   services.annotations?.onOpen(annotation, element.getBoundingClientRect());
   return;
  }
  commands.playFromCharacter(segmentId, grapheme.index);
 };
 const hanzi = (
  <span
   key={grapheme.index}
   className={cn(
    playable && glyphActionClassName,
    playable && "select-text",
    highlighted && "reading-progress-highlight",
    annotation && "reading-highlight",
   )}
   data-color={annotation?.color}
   role={playable ? "button" : undefined}
   tabIndex={playable ? 0 : undefined}
   aria-label={
    annotation
     ? textLabels("openAnnotation", { text: annotation.text })
     : playable
       ? textLabels("playFromCharacter", { character: grapheme.segment })
       : undefined
   }
   aria-current={highlighted ? "true" : undefined}
   onClick={playable ? (event) => play(event.currentTarget, event) : undefined}
   onKeyDown={
    playable
     ? (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        play(event.currentTarget, event);
       }
     : undefined
   }
  >
   {grapheme.segment}
  </span>
 );
 const annotatedHanzi = annotation?.noteText.trim() ? (
  <Tooltip key={grapheme.index}>
   <TooltipTrigger asChild>{hanzi}</TooltipTrigger>
   <TooltipContent side="top">
    <Typography as="span" variant="caption" tone="inherit" wrapping="preWrap">
     {annotation.noteText}
    </Typography>
   </TooltipContent>
  </Tooltip>
 ) : (
  hanzi
 );
 if (!includePinyin || !inlinePinyin || !showPinyin || !glyph?.spokenPinyin || !analysis)
  return annotatedHanzi;
 const needsPronunciationReview = glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
 const inspect = (element: HTMLElement) =>
  services.pronunciationReview?.onInspect({
   segmentId,
   analysis,
   glyph,
   rect: element.getBoundingClientRect(),
  });
 return (
  <ruby key={grapheme.index}>
   {annotatedHanzi}
   <rt className="select-none font-pinyin text-[0.45em] font-medium text-text-secondary">
    <span
     role="button"
     tabIndex={0}
     className={cn(glyphActionClassName, needsPronunciationReview && "text-warning")}
     aria-label={textLabels(
      needsPronunciationReview ? "inspectUnconfirmedPinyin" : "inspectPinyin",
      { character: grapheme.segment },
     )}
     onClick={(event) => {
      event.stopPropagation();
      inspect(event.currentTarget);
     }}
     onKeyDown={(event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      inspect(event.currentTarget);
     }}
    >
     {glyph.spokenPinyin}
    </span>
   </rt>
  </ruby>
 );
}

export function renderReaderReadingUnit(
 context: ReaderSegmentGlyphContext,
 unit: ContextualReadingUnit,
) {
 const { segmentId, graphemes, glyphs, analysis, inlinePinyin, showPinyin, services, textLabels } =
  context;
 const unitGraphemes = graphemes.filter(
  (grapheme) => grapheme.index >= unit.start && grapheme.index < unit.end,
 );
 const unitPinyin =
  inlinePinyin && showPinyin && analysis && unit.type === "hanzi"
   ? formatContextualReadingUnitPinyin(analysis, unit)
   : null;
 if (unitPinyin === null || analysis === undefined) {
  return unitGraphemes.map((grapheme) =>
   renderReaderGrapheme(context, grapheme, graphemes.indexOf(grapheme)),
  );
 }

 let previousPinyin = "";
 return (
  <ruby key={unit.id} className="whitespace-nowrap">
   {unitGraphemes.map((grapheme) =>
    renderReaderGrapheme(context, grapheme, graphemes.indexOf(grapheme), false),
   )}
   <rt className="select-none font-pinyin text-[0.45em] font-medium text-text-secondary">
    {unitGraphemes.map((grapheme) => {
     const glyph = glyphs.get(grapheme.index);
     if (glyph === undefined) return null;
     const pinyin = formatContextualPinyinRange(analysis, glyph.start, glyph.end);
     const separator = shouldSeparatePinyinSyllables(previousPinyin, pinyin) ? "'" : "";
     previousPinyin = pinyin;
     const needsPronunciationReview =
      glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
     const inspect = (element: HTMLElement) =>
      services.pronunciationReview?.onInspect({
       segmentId,
       analysis,
       glyph,
       rect: element.getBoundingClientRect(),
      });
     return (
      <span
       key={`${glyph.start}:${glyph.end}`}
       role="button"
       tabIndex={0}
       className={cn(glyphActionClassName, needsPronunciationReview && "text-warning")}
       aria-label={textLabels(
        needsPronunciationReview ? "inspectUnconfirmedPinyin" : "inspectPinyin",
        { character: grapheme.segment },
       )}
       onClick={(event) => {
        event.stopPropagation();
        inspect(event.currentTarget);
       }}
       onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        event.stopPropagation();
        inspect(event.currentTarget);
       }}
      >
       {separator}
       {pinyin}
      </span>
     );
    })}
   </rt>
  </ruby>
 );
}
