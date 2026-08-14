"use client";

import { Button } from "@/components/ui/button";
import {
 containsHanziText,
 PinyinText,
 ReaderHanziText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { useTTS } from "@/hooks/useTTS";
import { useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useLessonAnnotationContext } from "@/features/hanzihome/annotations/LessonAnnotationProvider";
import type { ResolvedLessonTextAnnotation } from "@/features/hanzihome/annotations/types";
import {
 analyzeContextualPronunciation,
 formatContextualSpokenPinyin,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";

import type { LessonDisplayMode } from "./types";
import {
 nextAvailableRevealStage,
 shouldAdvanceReveal,
 type RevealStage,
} from "./progressive-reveal";

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
 readingPlayback,
 readingMode = false,
}: {
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode: LessonDisplayMode;
 className?: string;
 annotationTarget?: { lessonId: string; nodeType: string; nodeId: string };
 readingPlayback?: ReadingPlayback;
 readingMode?: boolean;
}) {
 const [stage, setStage] = useState<RevealStage>(0);
 const [speechText, setSpeechText] = useState("");
 const [speechStartIndex, setSpeechStartIndex] = useState(0);
 const annotationContext = useLessonAnnotationContext();
 const contextualPronunciation = useMemo(
  () => analyzeContextualPronunciation({ text: zh, sourcePinyin: pinyin ?? null }),
  [pinyin, zh],
 );
 const contextualPinyin = useMemo(
  () => formatContextualSpokenPinyin(contextualPronunciation),
  [contextualPronunciation],
 );
 const displayPinyin = pinyin ?? contextualPinyin;
 const tapMode = displayMode.revealMode === "tap" && !readingMode;
 const characters = Array.from(zh);

 const advance = () =>
  setStage((current) =>
   nextAvailableRevealStage(current, { hasPinyin: !!displayPinyin, hasMeaning: !!vi }),
  );

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

 const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (
   !shouldAdvanceReveal({
    tapMode,
    hasSelection: false,
    interactiveChild: isInteractiveChild(event.target, event.currentTarget),
    key: event.key,
   })
  )
   return;
  event.preventDefault();
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
 const hanziContent = (
  <ReaderHanziText
   displayMode={displayMode}
   aria-hidden={tapMode && stage !== 0}
   tone="default"
   leading="learner"
   wrapping="preWrap"
   className={cn("min-w-0", tapMode && stage !== 0 && "invisible pointer-events-none")}
   data-no-inspector={readingMode || annotationTarget ? "true" : undefined}
   data-study-annotation-node={annotationTarget ? "true" : undefined}
   data-lesson-id={annotationTarget?.lessonId}
   data-node-type={annotationTarget?.nodeType}
   data-node-id={annotationTarget?.nodeId}
  >
   <AnnotatedText
    text={zh}
    annotations={annotations}
    onOpen={(annotation) => {
     annotationContext?.openAnnotation(annotation);
    }}
    readingMode={readingMode}
    readingPlayback={readingPlayback}
    activeCharacterIndex={activeCharacterIndex}
    onSpeakFrom={handleSpeakFromCharacter}
   />
  </ReaderHanziText>
 );

 return (
  <div
   className={cn(
    "grid min-w-0",
    !tapMode && "gap-1",
    tapMode && "cursor-pointer select-text",
    className,
   )}
   data-no-inspector={readingMode ? "true" : undefined}
   role={tapMode ? "button" : undefined}
   tabIndex={tapMode ? 0 : undefined}
   aria-label={tapMode ? "Hiển thị lần lượt Hán tự, Pinyin và nghĩa" : undefined}
   aria-live={tapMode ? "polite" : undefined}
   onClick={handleClick}
   onKeyDown={handleKeyDown}
  >
   {tapMode ? (
    <div className="grid min-w-0 [&>*]:[grid-area:1/1]">
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

export function getActiveCharacterIndex(
 characterCount: number,
 startIndex: number,
 activeCharacterCount: number,
 progress: number,
) {
 if (characterCount === 0 || startIndex < 0 || activeCharacterCount <= 0) return -1;

 const boundedProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
 const offset = Math.min(
  activeCharacterCount - 1,
  Math.floor(boundedProgress * activeCharacterCount),
 );

 return Math.min(characterCount - 1, startIndex + offset);
}

function AnnotatedText({
 text,
 annotations,
 onOpen,
 readingMode,
 readingPlayback,
 activeCharacterIndex,
 onSpeakFrom,
}: {
 text: string;
 annotations: ResolvedLessonTextAnnotation[];
 onOpen: (annotation: ResolvedLessonTextAnnotation) => void;
 readingMode: boolean;
 readingPlayback?: ReadingPlayback;
 activeCharacterIndex: number;
 onSpeakFrom: (index: number) => void;
}) {
 if (readingMode && readingPlayback) {
  return (
   <InteractiveReadingText
    text={text}
    annotations={annotations}
    onOpen={onOpen}
    readingPlayback={readingPlayback}
    activeCharacterIndex={activeCharacterIndex}
    onSpeakFrom={onSpeakFrom}
   />
  );
 }

 if (!annotations.length) return text;

 const output: ReactNode[] = [];
 let cursor = 0;
 for (const annotation of [...annotations].sort(
  (left, right) => left.resolvedStartOffset - right.resolvedStartOffset,
 )) {
  if (annotation.resolvedStartOffset < cursor) continue;
  output.push(text.slice(cursor, annotation.resolvedStartOffset));
  output.push(
   <mark
    key={annotation.id}
    role="button"
    tabIndex={0}
    className="reading-highlight cursor-pointer rounded-sm"
    onClick={(event) => {
     event.stopPropagation();
     onOpen(annotation);
    }}
    onKeyDown={(event) => {
     if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(annotation);
     }
    }}
   >
    {text.slice(annotation.resolvedStartOffset, annotation.resolvedEndOffset)}
   </mark>,
  );
  cursor = annotation.resolvedEndOffset;
 }
 output.push(text.slice(cursor));
 return output;
}

function InteractiveReadingText({
 text,
 annotations,
 onOpen,
 readingPlayback,
 activeCharacterIndex,
 onSpeakFrom,
}: {
 text: string;
 annotations: ResolvedLessonTextAnnotation[];
 onOpen: (annotation: ResolvedLessonTextAnnotation) => void;
 readingPlayback: ReadingPlayback;
 activeCharacterIndex: number;
 onSpeakFrom: (index: number) => void;
}) {
 const sortedAnnotations = [...annotations].sort(
  (left, right) => left.resolvedStartOffset - right.resolvedStartOffset,
 );
 let characterOffset = 0;

 return Array.from(text).map((character, index) => {
  const startOffset = characterOffset;
  characterOffset += character.length;
  const endOffset = characterOffset;
  const annotation = sortedAnnotations.find(
   (candidate) =>
    candidate.resolvedStartOffset <= startOffset && candidate.resolvedEndOffset >= endOffset,
  );
  const active = index === activeCharacterIndex;
  const className = cn(annotation && "reading-highlight", active && "reading-progress-highlight");

  if (!containsHanziText(character)) {
   return (
    <span key={`${character}-${index}`} className={className || undefined}>
     {character}
    </span>
   );
  }

  return (
   <Button
    key={`${character}-${index}`}
    type="button"
    variant="ghost"
    size="inline"
    className={className || undefined}
    disabled={!annotation && !readingPlayback.canSpeak}
    aria-current={active ? "true" : undefined}
    aria-label={annotation ? `Mở ghi chú cho ${character}` : `Đọc từ chữ ${character}`}
    onClick={(event) => {
     event.stopPropagation();
     if (annotation) {
      onOpen(annotation);
      return;
     }
     onSpeakFrom(index);
    }}
   >
    {character}
   </Button>
  );
 });
}
