"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import {
 getScrollContainerForTarget,
 scrollAppContentToElement,
} from "@/components/layout/app-scroll";
import { Card } from "@/components/ui/card";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";

import type { ReaderDocumentModel } from "../model/reader-document.types";
import {
 ReaderPronunciationSessionProvider,
 useReaderPronunciationSessionActions,
} from "../runtime/reader-pronunciation-session";
import {
 ReaderRuntimeProvider,
 useReaderRuntimeActions,
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";
import { ReaderCommandBar, type ReaderToolbarStickyOffset } from "./ReaderCommandBar";
import {
 ReaderDocumentContent,
 type ReaderPronunciationAnalysis,
 type ReaderSurfacePronunciationTarget,
 type ReaderSurfaceRenderSection,
 type ReaderSurfaceRenderSegment,
 type ReaderSurfaceSelection,
} from "./ReaderDocumentContent";
import { ReaderOutline, ReaderOutlineContent } from "./ReaderOutline";
import {
 ReaderPronunciationReviewPopover,
 type ReaderPronunciationSaveInput,
} from "./ReaderPronunciationReviewPopover";

export type {
 ReaderPronunciationAnalysis,
 ReaderSurfacePronunciationTarget,
 ReaderSurfaceRenderSection,
 ReaderSurfaceRenderSegment,
 ReaderSurfaceSelection,
};

export type ReaderSurfaceProps = {
 document: ReaderDocumentModel;
 lessonId?: string;
 renderSegment?: ReaderSurfaceRenderSegment;
 renderSection?: ReaderSurfaceRenderSection;
 analysisBySegmentId?: ReadonlyMap<string, ReaderPronunciationAnalysis>;
 onSelection?: (selection: ReaderSurfaceSelection) => void;
 onPronunciationInspect?: (target: ReaderSurfacePronunciationTarget) => void;
 onOpenShadowing?: () => void;
 toolbarStickyOffset?: ReaderToolbarStickyOffset;
};

export function ReaderSurface(props: ReaderSurfaceProps) {
 return (
  <ReaderRuntimeProvider document={props.document}>
   <ReaderSurfaceView {...props} />
  </ReaderRuntimeProvider>
 );
}

export function ReaderSurfaceView(props: ReaderSurfaceProps) {
 return (
  <ReaderPronunciationSessionProvider key={props.document.id}>
   <ReaderSurfaceViewContent {...props} />
  </ReaderPronunciationSessionProvider>
 );
}

function ReaderSurfaceViewContent({
 document,
 lessonId,
 renderSegment,
 renderSection,
 analysisBySegmentId,
 onSelection,
 onPronunciationInspect,
 onOpenShadowing,
 toolbarStickyOffset = "page",
}: ReaderSurfaceProps) {
 const [outlineOpen, setOutlineOpen] = useState(false);
 const [pronunciationPreview, setPronunciationPreview] =
  useState<ReaderSurfacePronunciationTarget | null>(null);
 const segmentElementsRef = useRef(new Map<string, HTMLElement>());
 const commands = useReaderRuntimeCommands();
 const actions = useReaderRuntimeActions();
 const pronunciationSessionActions = useReaderPronunciationSessionActions();
 const { openInspector } = useVocabInspector();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const positionSource = useReaderRuntimeSelector((state) => state.positionSource);
 const focusMode = useReaderRuntimeSelector((state) => state.focusMode);
 const playbackStatus = useReaderRuntimeSelector((state) => state.playbackStatus);
 const error = useReaderRuntimeSelector((state) => state.error);

 const setSegmentElement = useCallback((segmentId: string, element: HTMLElement | null) => {
  if (element) segmentElementsRef.current.set(segmentId, element);
  else segmentElementsRef.current.delete(segmentId);
 }, []);
 const inspectPronunciation = useCallback(
  (target: ReaderSurfacePronunciationTarget) => {
   if (onPronunciationInspect) onPronunciationInspect(target);
   else setPronunciationPreview(target);
  },
  [onPronunciationInspect],
 );
 const openPreviewInspector = useCallback(
  (text: string, rect: DOMRect) => {
   setPronunciationPreview(null);
   void openInspector(text, { lessonId, anchorRect: rect });
  },
  [lessonId, openInspector],
 );
 const saveLocalPronunciation = useCallback(
  (input: ReaderPronunciationSaveInput) => {
   if (!pronunciationPreview) return;
   pronunciationSessionActions.upsert(
    pronunciationPreview.segment.id,
    pronunciationPreview.segment.zh,
    input,
   );
   setPronunciationPreview(null);
  },
  [pronunciationPreview, pronunciationSessionActions],
 );
 const resetLocalPronunciation = useCallback(() => {
  if (!pronunciationPreview) return;
  const token = pronunciationPreview.analysis.tokens.find(
   (item) =>
    item.type === "hanzi" &&
    item.start <= pronunciationPreview.glyph.start &&
    item.end >= pronunciationPreview.glyph.end,
  );
  pronunciationSessionActions.remove(
   pronunciationPreview.segment.id,
   token?.start ?? pronunciationPreview.glyph.start,
   token?.end ?? pronunciationPreview.glyph.end,
  );
  setPronunciationPreview(null);
 }, [pronunciationPreview, pronunciationSessionActions]);
 const pronunciationPreviewConfirmed =
  pronunciationPreview?.glyph.evidence.includes("manual-override") ?? false;

 useEffect(() => {
  if (positionSource !== "command" && positionSource !== "playback") return;
  const segment = document.segments[activeIndex];
  if (!segment) return;
  scrollAppContentToElement(segmentElementsRef.current.get(segment.id) ?? null, {
   behavior: "smooth",
   block: "center",
  });
 }, [activeIndex, document.segments, positionSource]);

 useEffect(() => {
  const firstSegment = document.segments[0];
  const firstElement = firstSegment
   ? (segmentElementsRef.current.get(firstSegment.id) ?? null)
   : null;
  const container = getScrollContainerForTarget(firstElement);
  if (!container || document.segments.length === 0) return;
  let animationFrame = 0;
  const updatePosition = () => {
   cancelAnimationFrame(animationFrame);
   animationFrame = requestAnimationFrame(() => {
    const containerRect = container.getBoundingClientRect();
    const readingLine = containerRect.top + Math.min(160, containerRect.height * 0.25);
    let closestId: string | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const segment of document.segments) {
     const element = segmentElementsRef.current.get(segment.id);
     if (!element) continue;
     const rect = element.getBoundingClientRect();
     if (rect.bottom < containerRect.top || rect.top > containerRect.bottom) continue;
     const distance = Math.abs(rect.top - readingLine);
     if (distance < closestDistance) {
      closestDistance = distance;
      closestId = segment.id;
     }
    }
    if (closestId) actions.selectSegment(closestId, "scroll");
   });
  };
  container.addEventListener("scroll", updatePosition, { passive: true });
  updatePosition();
  return () => {
   cancelAnimationFrame(animationFrame);
   container.removeEventListener("scroll", updatePosition);
  };
 }, [actions, document.segments]);

 const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  const target = event.target;
  if (
   target instanceof Element &&
   target.closest("button, a, input, textarea, select, [role='menuitem'], [contenteditable='true']")
  ) {
   return;
  }
  if (event.key === " ") {
   event.preventDefault();
   if (playbackStatus === "playing") commands.pause();
   else if (playbackStatus === "paused") commands.resume();
   else if (playbackStatus === "loading") commands.stop();
   else commands.playCurrent();
  } else if (event.key === "ArrowLeft") {
   event.preventDefault();
   commands.previous();
  } else if (event.key === "ArrowRight") {
   event.preventDefault();
   commands.next();
  } else if (event.key === "Escape" && focusMode) {
   event.preventDefault();
   actions.toggleFocus();
  }
 };

 if (document.segments.length === 0) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     Nội dung này chưa có đoạn tiếng Trung để đọc.
    </Typography>
   </Card>
  );
 }

 return (
  <div
   className="grid min-w-0 gap-3 outline-none"
   tabIndex={0}
   role="region"
   onKeyDown={handleKeyDown}
   aria-label="Trình đọc tiếng Trung"
  >
   <ReaderCommandBar
    segmentCount={document.segments.length}
    onOpenOutline={() => setOutlineOpen(true)}
    onOpenShadowing={onOpenShadowing}
    stickyOffset={toolbarStickyOffset}
   />
   {error ? (
    <Typography as="p" variant="caption" tone="danger" role="alert">
     {error}
    </Typography>
   ) : null}

   <div
    className={
     focusMode
      ? "grid min-w-0"
      : "grid min-w-0 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]"
    }
   >
    <div className={focusMode ? "mx-auto w-full max-w-5xl" : "min-w-0"}>
     <ReaderDocumentContent
      document={document}
      lessonId={lessonId}
      renderSegment={renderSegment}
      renderSection={renderSection}
      analysisBySegmentId={analysisBySegmentId}
      onSelection={onSelection}
      onPronunciationInspect={inspectPronunciation}
      setSegmentElement={setSegmentElement}
     />
    </div>
    {!focusMode ? (
     <div className="hidden min-w-0 2xl:block">
      <ReaderOutline document={document} />
     </div>
    ) : null}
   </div>

   <Sheet open={outlineOpen} onOpenChange={setOutlineOpen} side="right" className="sm:max-w-md">
    <SheetHeader title="Mục lục bài đọc" onClose={() => setOutlineOpen(false)} />
    <SheetBody>
     <ReaderOutlineContent document={document} onNavigate={() => setOutlineOpen(false)} />
    </SheetBody>
   </Sheet>

   {!onPronunciationInspect && pronunciationPreview ? (
    <ReaderPronunciationReviewPopover
     target={pronunciationPreview}
     confirmed={pronunciationPreviewConfirmed}
     saveScope="session"
     onClose={() => setPronunciationPreview(null)}
     onSave={saveLocalPronunciation}
     onReset={pronunciationPreviewConfirmed ? resetLocalPronunciation : undefined}
     onOpenInspector={openPreviewInspector}
    />
   ) : null}
  </div>
 );
}
