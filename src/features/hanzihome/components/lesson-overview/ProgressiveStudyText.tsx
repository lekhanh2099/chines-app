"use client";

import {
 PinyinText,
 ReaderHanziText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useState, type KeyboardEvent, type MouseEvent } from "react";

import { cn } from "@/lib/utils";
import { useLessonAnnotationContext } from "@/features/hanzihome/annotations/LessonAnnotationProvider";
import type { ResolvedLessonTextAnnotation } from "@/features/hanzihome/annotations/types";

import type { LessonDisplayMode } from "./types";
import {
 nextAvailableRevealStage,
 shouldAdvanceReveal,
 type RevealStage,
} from "./progressive-reveal";

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
}: {
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode: LessonDisplayMode;
 className?: string;
 annotationTarget?: { lessonId: string; nodeType: string; nodeId: string };
}) {
 const [stage, setStage] = useState<RevealStage>(0);
 const annotationContext = useLessonAnnotationContext();
 const tapMode = displayMode.revealMode === "tap";

 const advance = () =>
  setStage((current) =>
   nextAvailableRevealStage(current, { hasPinyin: !!pinyin, hasMeaning: !!vi }),
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
   data-no-inspector={annotationTarget ? "true" : undefined}
   data-study-annotation-node={annotationTarget ? "true" : undefined}
   data-lesson-id={annotationTarget?.lessonId}
   data-node-type={annotationTarget?.nodeType}
   data-node-id={annotationTarget?.nodeId}
  >
   <AnnotatedText
    text={zh}
    annotations={annotations}
    onOpen={(annotation) => annotationContext?.openAnnotation(annotation)}
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
     {pinyin ? (
      <PinyinText
       aria-hidden={stage !== 1}
       variant="bodySmall"
       tone="accent"
       weight="semibold"
       leading="relaxed"
       wrapping="preWrap"
       className={cn("min-w-0 self-start", stage !== 1 && "invisible pointer-events-none")}
      >
       {pinyin}
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
     {pinyin && displayMode.showPinyin ? (
      <PinyinText
       variant="bodySmall"
       tone="accent"
       weight="semibold"
       leading="relaxed"
       wrapping="preWrap"
       className="min-w-0"
      >
       {pinyin}
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

function AnnotatedText({
 text,
 annotations,
 onOpen,
}: {
 text: string;
 annotations: ResolvedLessonTextAnnotation[];
 onOpen: (annotation: ResolvedLessonTextAnnotation) => void;
}) {
 if (!annotations.length) return text;

 const output: React.ReactNode[] = [];
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
