"use client";

import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";

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
 hanziStyle,
 className,
 annotationTarget,
}: {
 zh: string;
 pinyin?: string;
 vi?: string;
 displayMode: LessonDisplayMode;
 hanziStyle?: CSSProperties;
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
  <p
   aria-hidden={tapMode && stage !== 0}
   className={cn(
    "min-w-0 whitespace-pre-wrap leading-[1.7] text-text-primary",
    tapMode && stage !== 0 && "invisible pointer-events-none",
   )}
   lang="zh-CN"
   style={hanziStyle}
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
  </p>
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
      <p
       aria-hidden={stage !== 1}
       className={cn(
        "min-w-0 self-start whitespace-pre-wrap text-sm font-semibold leading-relaxed text-accent-text break-words",
        stage !== 1 && "invisible pointer-events-none",
       )}
      >
       {pinyin}
      </p>
     ) : null}
     {vi ? (
      <p
       aria-hidden={stage !== 2}
       className={cn(
        "min-w-0 self-start whitespace-pre-wrap text-sm font-medium leading-relaxed text-text-muted break-words sm:text-base",
        stage !== 2 && "invisible pointer-events-none",
       )}
      >
       {vi}
      </p>
     ) : null}
    </div>
   ) : (
    <>
     {hanziContent}
     {pinyin && displayMode.showPinyin ? (
      <p className="min-w-0 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-accent-text break-words">
       {pinyin}
      </p>
     ) : null}
     {vi && displayMode.showMeaning ? (
      <p className="min-w-0 whitespace-pre-wrap text-sm font-medium leading-relaxed text-text-muted break-words sm:text-base">
       {vi}
      </p>
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
