"use client";

import { Fragment, type KeyboardEvent, type MouseEvent } from "react";
import type { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { glyphActionClassName } from "@/components/ui/focus-ring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/utils";
import { isPinyinSelectionActive, selectablePinyinAttribute } from "../runtime/pinyin-selection";
import {
 formatContextualPinyinRange,
 formatContextualReadingUnitPinyin,
 shouldSeparatePinyinSyllables,
 type ContextualPronunciationAnalysis,
 type ContextualPronunciationGlyph,
 type ContextualReadingUnit,
} from "@/lib/pronunciation/contextual-pronunciation";

/** What one grapheme shows and does; each learner text surface resolves it from its own annotations and playback. */
export type LearnerGlyphState = {
 /** The grapheme is inside an annotation. */
 highlighted: boolean;
 /** Annotation highlight color; empty for the default highlight. */
 highlightColor: string;
 /** The grapheme is the current playback position. */
 active: boolean;
 /** Accessible name of the grapheme action; empty when the grapheme is not interactive. */
 actionLabel: string;
 onActivate: (element: HTMLElement) => void;
 /** Annotation note shown in a tooltip; empty for none. */
 noteText: string;
};

/** Shared rendering inputs for one line of learner Hanzi with optional ruby Pinyin. */
export type LearnerGlyphModel = {
 graphemes: readonly Intl.SegmentData[];
 glyphByStart: ReadonlyMap<number, ContextualPronunciationGlyph>;
 /** Render Pinyin as ruby above each glyph instead of as a separate line. */
 rubyPinyin: boolean;
 stateFor: (grapheme: Intl.SegmentData, index: number) => LearnerGlyphState;
 pinyinInspectable: boolean;
 onInspectPinyin: (glyph: ContextualPronunciationGlyph, element: HTMLElement) => void;
 labels: ReturnType<typeof useTranslations<"Reader.document.text">>;
};

const rubyTextClassName = "font-pinyin text-[0.45em] font-medium text-text-secondary";

function activateFromClick(
 event: MouseEvent<HTMLElement>,
 activate: (element: HTMLElement) => void,
) {
 event.stopPropagation();
 if (window.getSelection()?.isCollapsed === false) return;
 activate(event.currentTarget);
}

function activateFromKey(
 event: KeyboardEvent<HTMLElement>,
 activate: (element: HTMLElement) => void,
) {
 if (event.key !== "Enter" && event.key !== " ") return;
 event.preventDefault();
 event.stopPropagation();
 activate(event.currentTarget);
}

function renderPinyin(
 model: LearnerGlyphModel,
 glyph: ContextualPronunciationGlyph,
 character: string,
 text: string,
) {
 if (!model.pinyinInspectable) {
  return <span key={`${glyph.start}:${glyph.end}`}>{text}</span>;
 }
 const needsPronunciationReview = glyph.isPolyphonic && !glyph.evidence.includes("manual-override");
 const inspect = (element: HTMLElement) => model.onInspectPinyin(glyph, element);
 return (
  <span
   key={`${glyph.start}:${glyph.end}`}
   role="button"
   tabIndex={0}
   className={cn(glyphActionClassName, needsPronunciationReview && "text-warning")}
   aria-label={model.labels(
    needsPronunciationReview ? "inspectUnconfirmedPinyin" : "inspectPinyin",
    { character },
   )}
   title={glyph.alternatives.length > 1 ? glyph.alternatives.join(", ") : undefined}
   onClick={(event) => {
    event.stopPropagation();
    // A drag that selected Pinyin ends in a click; it must not open the inspector.
    if (isPinyinSelectionActive() && window.getSelection()?.isCollapsed === false) return;
    inspect(event.currentTarget);
   }}
   onKeyDown={(event) => activateFromKey(event, inspect)}
  >
   {text}
  </span>
 );
}

/** One grapheme: interactive/highlighted Hanzi, an optional note tooltip and optional ruby Pinyin. */
export function renderLearnerGrapheme(
 model: LearnerGlyphModel,
 grapheme: Intl.SegmentData,
 index: number,
 includePinyin = true,
) {
 const state = model.stateFor(grapheme, index);
 const interactive = state.actionLabel !== "";
 const hanzi = (
  <span
   key={grapheme.index}
   className={cn(
    "select-text",
    interactive && glyphActionClassName,
    state.highlighted && "reading-highlight",
    state.active && "reading-progress-highlight",
   )}
   data-color={state.highlightColor || undefined}
   role={interactive ? "button" : undefined}
   tabIndex={interactive ? 0 : undefined}
   aria-label={interactive ? state.actionLabel : undefined}
   aria-current={state.active ? "true" : undefined}
   onClick={interactive ? (event) => activateFromClick(event, state.onActivate) : undefined}
   onKeyDown={interactive ? (event) => activateFromKey(event, state.onActivate) : undefined}
  >
   {grapheme.segment}
  </span>
 );
 const annotatedHanzi = state.noteText.trim() ? (
  <Tooltip key={grapheme.index}>
   <TooltipTrigger asChild>{hanzi}</TooltipTrigger>
   <TooltipContent side="top">
    <Typography as="span" variant="caption" tone="inherit" wrapping="preWrap">
     {state.noteText}
    </Typography>
   </TooltipContent>
  </Tooltip>
 ) : (
  hanzi
 );
 const glyph = model.glyphByStart.get(grapheme.index);
 if (!includePinyin || !model.rubyPinyin || !glyph?.spokenPinyin) return annotatedHanzi;
 return (
  <ruby key={grapheme.index}>
   {annotatedHanzi}
   <rt className={rubyTextClassName} {...selectablePinyinAttribute}>
    {renderPinyin(model, glyph, grapheme.segment, glyph.spokenPinyin)}
   </rt>
  </ruby>
 );
}

/** One contextual reading unit: its graphemes under a single ruby with joined unit Pinyin. */
export function renderLearnerReadingUnit(
 model: LearnerGlyphModel,
 analysis: ContextualPronunciationAnalysis,
 unit: ContextualReadingUnit,
) {
 const unitGraphemes = model.graphemes.filter(
  (grapheme) => grapheme.index >= unit.start && grapheme.index < unit.end,
 );
 const unitPinyin =
  model.rubyPinyin && unit.type === "hanzi"
   ? formatContextualReadingUnitPinyin(analysis, unit)
   : null;
 if (unitPinyin === null) {
  return unitGraphemes.map((grapheme) =>
   renderLearnerGrapheme(model, grapheme, model.graphemes.indexOf(grapheme)),
  );
 }

 let previousPinyin = "";
 return (
  <Fragment key={unit.id}>
   <wbr />
   <ruby className="whitespace-nowrap">
    {unitGraphemes.map((grapheme) =>
     renderLearnerGrapheme(model, grapheme, model.graphemes.indexOf(grapheme), false),
    )}
    <rt className={rubyTextClassName} {...selectablePinyinAttribute}>
     {unitGraphemes.map((grapheme) => {
      const glyph = model.glyphByStart.get(grapheme.index);
      if (glyph === undefined) return null;
      const pinyin = formatContextualPinyinRange(analysis, glyph.start, glyph.end);
      const separator = shouldSeparatePinyinSyllables(previousPinyin, pinyin) ? "'" : "";
      previousPinyin = pinyin;
      return renderPinyin(model, glyph, grapheme.segment, `${separator}${pinyin}`);
     })}
    </rt>
   </ruby>
  </Fragment>
 );
}
