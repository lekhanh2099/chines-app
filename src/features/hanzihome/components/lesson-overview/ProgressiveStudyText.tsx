"use client";

import { Button } from "@/components/ui/actions/button";
import {
 containsHanziText,
 PinyinText,
 ReaderHanziText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { useTTS } from "@/hooks/useTTS";
import { useMemo, useState, type MouseEvent } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useLessonAnnotationContext } from "@/features/hanzihome/annotations/LessonAnnotationProvider";
import type { ReaderAnnotationRow } from "@/features/reading/model/reading-annotation.schemas";
import {
 analyzeContextualPronunciation,
 formatContextualReadingPinyin,
 type ContextualPronunciationGlyph,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import {
 renderLearnerGrapheme,
 type LearnerGlyphModel,
} from "@/features/reader/components/learner-glyphs";

import type { LessonDisplayMode } from "./types";
import { getActiveCharacterIndex } from "./progressive-study-text-utils";
import {
 nextAvailableRevealStage,
 shouldAdvanceReveal,
 type RevealStage,
} from "./progressive-reveal";

const graphemeSegmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });
const noPronunciationGlyphs: ReadonlyMap<number, ContextualPronunciationGlyph> = new Map();

type ReadingPlayback = {
 canSpeak: boolean;
 isSpeaking: ReturnType<typeof useTTS>["isSpeaking"];
 progress: ReturnType<typeof useTTS>["progress"];
 speakingText: ReturnType<typeof useTTS>["speakingText"];
 speak: ReturnType<typeof useTTS>["speak"];
};

function hasActiveSelection(container: HTMLElement): boolean {
 const selection = window.getSelection();
 if (!selection || selection.isCollapsed || !selection.toString().trim()) return false;

 return !!(selection.anchorNode && container.contains(selection.anchorNode));
}

function isInteractiveChild(
 target: MouseEvent<HTMLDivElement>["target"],
 container: HTMLElement,
): boolean {
 if (!(target instanceof Element)) return false;
 const interactiveTarget = target.closest("button, a, input, textarea, select, [role='button']");
 return !!interactiveTarget && interactiveTarget !== container;
}

export function ProgressiveStudyText({
 zh,
 pinyin,
 vi,
 displayMode,
 className,
 annotationTarget,
 readerAnnotations = [],
 onOpenReaderAnnotation,
 readingPlayback,
 readingMode = false,
}: {
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode: LessonDisplayMode;
 className?: string;
 annotationTarget?: { lessonId: string; nodeType: string; nodeId: string };
 readerAnnotations?: readonly ReaderAnnotationRow[];
 onOpenReaderAnnotation?: (annotation: ReaderAnnotationRow, rect: DOMRect) => void;
 readingPlayback?: ReadingPlayback;
 readingMode?: boolean;
}) {
 const [stage, setStage] = useState<RevealStage>(0);
 const [speechText, setSpeechText] = useState("");
 const [speechStartIndex, setSpeechStartIndex] = useState(0);
 const annotationContext = useLessonAnnotationContext();
 const t = useTranslations("Reader.document.text");
 const graphemes = useMemo(() => [...graphemeSegmenter.segment(zh)], [zh]);
 const contextualPronunciation = useMemo(
  () => analyzeContextualPronunciation({ text: zh, sourcePinyin: pinyin ?? null }),
  [pinyin, zh],
 );
 const contextualPinyin = useMemo(
  () => formatContextualReadingPinyin(contextualPronunciation),
  [contextualPronunciation],
 );
 const displayPinyin = displayMode.autoDetectPinyin ? contextualPinyin : pinyin;
 const tapMode = displayMode.revealMode === "tap" && !readingMode;
 const characters = graphemes.map((grapheme) => grapheme.segment);
 const revealOptions = { hasPinyin: !!displayPinyin, hasMeaning: !!vi };
 const nextStage = nextAvailableRevealStage(stage, revealOptions);
 const revealActionLabel =
  nextStage === 0 ? "Hiện Hán tự" : nextStage === 1 ? "Hiện Pinyin" : "Hiện nghĩa";

 const advance = () => setStage((current) => nextAvailableRevealStage(current, revealOptions));

 const handleClick = (event: MouseEvent<HTMLDivElement>) => {
  if (
   !shouldAdvanceReveal({
    tapMode,
    hasSelection: hasActiveSelection(event.currentTarget),
    interactiveChild: isInteractiveChild(event.target, event.currentTarget),
   })
  )
   return;
  advance();
 };

 const handleSpeakFromCharacter = (index: number) => {
  if (!readingPlayback) return;

  const textFromCharacter = characters.slice(index).join("").trim();
  if (!textFromCharacter) return;

  setSpeechText(textFromCharacter);
  setSpeechStartIndex(index);
  void readingPlayback.speak(textFromCharacter);
 };
 let activeStartIndex = -1;
 let activeCharacterCount = 0;
 if (readingPlayback?.isSpeaking) {
  if (readingPlayback.speakingText === zh.trim()) {
   activeStartIndex = 0;
   activeCharacterCount = characters.length;
  } else if (speechText && readingPlayback.speakingText === speechText) {
   activeStartIndex = speechStartIndex;
   activeCharacterCount = characters.length - speechStartIndex;
  }
 }
 const activeCharacterIndex = getActiveCharacterIndex(
  characters.length,
  activeStartIndex,
  activeCharacterCount,
  readingPlayback?.progress ?? 0,
 );
 const annotations =
  annotationTarget && annotationContext
   ? annotationContext.getAnnotations(annotationTarget, zh)
   : [];
 const interactiveReading = readingMode && readingPlayback !== undefined;
 const glyphModel: LearnerGlyphModel = {
  graphemes,
  glyphByStart: noPronunciationGlyphs,
  rubyPinyin: false,
  pinyinInspectable: false,
  onInspectPinyin: () => undefined,
  labels: t,
  stateFor: (grapheme, index) => {
   const end = grapheme.index + grapheme.segment.length;
   const annotation = annotations.find(
    (candidate) =>
     candidate.resolvedStartOffset <= grapheme.index && candidate.resolvedEndOffset >= end,
   );
   const readerAnnotation = interactiveReading
    ? undefined
    : readerAnnotations.find(
       (candidate) =>
        candidate.start_offset !== null &&
        candidate.end_offset !== null &&
        candidate.start_offset <= grapheme.index &&
        candidate.end_offset >= end &&
        zh.slice(candidate.start_offset, candidate.end_offset) === candidate.selected_text,
      );
   const speakable =
    interactiveReading && readingPlayback.canSpeak && containsHanziText(grapheme.segment);
   return {
    highlighted: Boolean(annotation || readerAnnotation),
    highlightColor: readerAnnotation?.color || (annotation ? "yellow" : ""),
    active: interactiveReading && index === activeCharacterIndex,
    actionLabel: annotation
     ? t("openAnnotation", { text: annotation.selectedText })
     : readerAnnotation
       ? t("openAnnotation", { text: readerAnnotation.selected_text })
       : speakable
         ? t("playFromCharacter", { character: grapheme.segment })
         : "",
    onActivate: (element) => {
     if (annotation) {
      annotationContext?.openAnnotation(annotation);
      return;
     }
     if (readerAnnotation) {
      onOpenReaderAnnotation?.(readerAnnotation, element.getBoundingClientRect());
      return;
     }
     handleSpeakFromCharacter(index);
    },
    noteText: "",
   };
  },
 };
 const hanziContent = (
  <ReaderHanziText
   displayMode={displayMode}
   aria-hidden={tapMode && stage !== 0}
   tone="default"
   leading="learner"
   wrapping="preWrap"
   className={cn("min-w-0", tapMode && stage !== 0 && "invisible pointer-events-none")}
   data-reader-hanzi-content="true"
   data-no-inspector={readingMode || annotationTarget ? "true" : undefined}
   data-study-annotation-node={annotationTarget ? "true" : undefined}
   data-lesson-id={annotationTarget?.lessonId}
   data-node-type={annotationTarget?.nodeType}
   data-node-id={annotationTarget?.nodeId}
  >
   {interactiveReading || annotations.length > 0 || readerAnnotations.length > 0
    ? graphemes.map((grapheme, index) => renderLearnerGrapheme(glyphModel, grapheme, index))
    : zh}
  </ReaderHanziText>
 );

 return (
  <div
   className={cn(
    "grid min-w-0",
    !tapMode && "gap-1",
    tapMode && "cursor-pointer select-text gap-1",
    className,
   )}
   data-no-inspector={readingMode ? "true" : undefined}
   onClick={handleClick}
  >
   {tapMode ? (
    <>
     <div className="grid min-w-0 [&>*]:[grid-area:1/1]" aria-live="polite">
      {hanziContent}
      {displayPinyin ? (
       <PinyinText
        aria-hidden={stage !== 1}
        variant="bodySmall"
        tone="accent"
        weight="semibold"
        leading="relaxed"
        wrapping="preWrap"
        className={cn("min-w-0 self-start", stage !== 1 && "invisible pointer-events-none")}
       >
        {displayPinyin}
       </PinyinText>
      ) : null}
      {vi ? (
       <TranslationText
        aria-hidden={stage !== 2}
        variant="bodySmall"
        weight="medium"
        leading="relaxed"
        wrapping="preWrap"
        className={cn("min-w-0 self-start", stage !== 2 && "invisible pointer-events-none")}
       >
        {vi}
       </TranslationText>
      ) : null}
     </div>
     <Button
      type="button"
      variant="ghost"
      size="compact"
      align="start"
      onClick={(event) => {
       event.stopPropagation();
       advance();
      }}
     >
      {revealActionLabel}
     </Button>
    </>
   ) : (
    <>
     {hanziContent}
     {displayPinyin && displayMode.showPinyin ? (
      <PinyinText
       variant="bodySmall"
       tone="accent"
       weight="semibold"
       leading="relaxed"
       wrapping="preWrap"
       className="min-w-0"
      >
       {displayPinyin}
      </PinyinText>
     ) : null}
     {vi && displayMode.showMeaning ? (
      <TranslationText
       variant="bodySmall"
       tone="muted"
       weight="medium"
       leading="relaxed"
       wrapping="preWrap"
       className="min-w-0"
      >
       {vi}
      </TranslationText>
     ) : null}
    </>
   )}
  </div>
 );
}
