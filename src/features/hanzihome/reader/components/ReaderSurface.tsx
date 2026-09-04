"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Card } from "@/components/ui/card";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

import type { ReaderDocumentModel } from "../model/reader-document.types";
import { parseReaderSourceTarget, type ReaderSourceTarget } from "../reader-source-target";
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
import { useReaderPositionSync } from "../runtime/useReaderPositionSync";
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
 initialFocus?: ReaderSourceTarget | null;
 compact?: boolean;
 displayMode?: LessonDisplayMode;
};

type TextPoint = { node: Text; offset: number };

function textPointAt(root: HTMLElement, targetOffset: number): TextPoint | null {
 const walker = window.document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
 let traversed = 0;
 let node = walker.nextNode();
 let lastText: Text | null = null;

 while (node) {
  if (node instanceof Text) {
   lastText = node;
   const length = node.data.length;
   if (targetOffset <= traversed + length) {
    return { node, offset: Math.max(0, targetOffset - traversed) };
   }
   traversed += length;
  }
  node = walker.nextNode();
 }

 return lastText && targetOffset === traversed
  ? { node: lastText, offset: lastText.data.length }
  : null;
}

function selectSourceRange(root: HTMLElement, startOffset: number, endOffset: number) {
 if (endOffset <= startOffset) return;
 const start = textPointAt(root, startOffset);
 const end = textPointAt(root, endOffset);
 if (!start || !end) return;
 const range = window.document.createRange();
 range.setStart(start.node, start.offset);
 range.setEnd(end.node, end.offset);
 const selection = window.getSelection();
 if (!selection) return;
 selection.removeAllRanges();
 selection.addRange(range);
}

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
 initialFocus,
 compact = false,
 displayMode: initialDisplayMode,
}: ReaderSurfaceProps) {
 const t = useTranslations("Reader.study.chrome.surface");
 const isCoarsePointer = useCoarsePointer();
 const searchParams = useSearchParams();
 const searchParamsString = searchParams.toString();
 const routeFocus = useMemo(
  () => parseReaderSourceTarget(new URLSearchParams(searchParamsString)),
  [searchParamsString],
 );
 const resolvedInitialFocus = initialFocus ?? routeFocus;
 const [outlineOpen, setOutlineOpen] = useState(false);
 const [displayMode, setDisplayMode] = useState(initialDisplayMode);
 const [pronunciationPreview, setPronunciationPreview] =
  useState<ReaderSurfacePronunciationTarget | null>(null);
 const segmentElementsRef = useRef(new Map<string, HTMLElement>());
 const appliedInitialFocusRef = useRef<string | null>(null);
 const commands = useReaderRuntimeCommands();
 const actions = useReaderRuntimeActions();
 const pronunciationSessionActions = useReaderPronunciationSessionActions();
 const focusMode = useReaderRuntimeSelector((state) => state.focusMode);
 const playbackStatus = useReaderRuntimeSelector((state) => state.playbackStatus);
 const error = useReaderRuntimeSelector((state) => state.error);
 const updateDisplayMode = useCallback((updates: Partial<LessonDisplayMode>) => {
  setDisplayMode((current) => (current ? { ...current, ...updates } : current));
 }, []);

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

 const getSegmentElement = useCallback(
  (segmentId: string) => segmentElementsRef.current.get(segmentId) ?? null,
  [],
 );
 useReaderPositionSync({ document, getSegmentElement });

 useEffect(() => {
  if (
   !resolvedInitialFocus ||
   resolvedInitialFocus.documentId !== document.id ||
   resolvedInitialFocus.paragraphId === undefined
  ) {
   return;
  }
  const key = [
   resolvedInitialFocus.source,
   resolvedInitialFocus.documentId,
   resolvedInitialFocus.paragraphId,
   resolvedInitialFocus.startOffset ?? "",
   resolvedInitialFocus.endOffset ?? "",
  ].join(":");
  if (appliedInitialFocusRef.current === key) return;
  const index = document.segments.findIndex(
   (segment) => segment.id === resolvedInitialFocus.paragraphId,
  );
  if (index < 0) return;
  const element = segmentElementsRef.current.get(resolvedInitialFocus.paragraphId);
  if (!element) return;

  appliedInitialFocusRef.current = key;
  commands.selectIndex(index);
  if (
   resolvedInitialFocus.startOffset === undefined ||
   resolvedInitialFocus.endOffset === undefined
  ) {
   return;
  }

  const frame = requestAnimationFrame(() => {
   const hanziContainer = element.querySelector<HTMLElement>("[data-reader-hanzi-content]");
   if (!hanziContainer) return;
   selectSourceRange(
    hanziContainer,
    resolvedInitialFocus.startOffset ?? 0,
    resolvedInitialFocus.endOffset ?? 0,
   );
  });
  return () => cancelAnimationFrame(frame);
 }, [commands, document.id, document.segments, resolvedInitialFocus]);

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
     {t("empty")}
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
   aria-label={t("aria")}
  >
   <ReaderCommandBar
    segmentCount={document.segments.length}
    onOpenOutline={() => setOutlineOpen(true)}
    onOpenShadowing={onOpenShadowing}
    stickyOffset={toolbarStickyOffset}
    compact={compact}
    displayMode={displayMode}
    onDisplayModeChange={displayMode ? updateDisplayMode : undefined}
    outlineMenu={(onNavigate) => (
     <ReaderOutlineContent document={document} onNavigate={onNavigate} />
    )}
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
      : compact
        ? "grid min-w-0"
        : "grid min-w-0 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_18rem]"
    }
   >
    <div className={focusMode ? "mx-auto w-full max-w-5xl" : "min-w-0"}>
     <ReaderDocumentContent
      document={document}
      lessonId={lessonId}
      displayMode={displayMode}
      renderSegment={renderSegment}
      renderSection={renderSection}
      analysisBySegmentId={analysisBySegmentId}
      onSelection={onSelection}
      onPronunciationInspect={inspectPronunciation}
      setSegmentElement={setSegmentElement}
     />
    </div>
    {!focusMode && !compact ? (
     <div className="hidden min-w-0 2xl:block">
      <ReaderOutline document={document} />
     </div>
    ) : null}
   </div>

   {isCoarsePointer ? (
    <Sheet open={outlineOpen} onOpenChange={setOutlineOpen} side="right" className="sm:max-w-md">
     <SheetHeader title={t("outlineTitle")} onClose={() => setOutlineOpen(false)} />
     <SheetBody>
      <ReaderOutlineContent document={document} onNavigate={() => setOutlineOpen(false)} />
     </SheetBody>
    </Sheet>
   ) : null}

   {!onPronunciationInspect && pronunciationPreview ? (
    <ReaderPronunciationReviewPopover
     target={pronunciationPreview}
     confirmed={pronunciationPreviewConfirmed}
     saveScope="session"
     onClose={() => setPronunciationPreview(null)}
     onSave={saveLocalPronunciation}
     onReset={pronunciationPreviewConfirmed ? resetLocalPronunciation : undefined}
    />
   ) : null}
  </div>
 );
}
