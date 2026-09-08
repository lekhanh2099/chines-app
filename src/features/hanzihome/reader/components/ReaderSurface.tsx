"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
 useCallback,
 useEffect,
 useMemo,
 useRef,
 useState,
 type KeyboardEvent,
 type ReactNode,
} from "react";

import { Card } from "@/components/ui/card";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { AnnotationAnchor } from "@/features/hanzihome/annotations/types";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

import type { ReaderDocumentModel } from "../model/reader-document.types";
import type { ReaderAnnotationRow } from "../reader.schemas";
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
 annotationNodeType?: AnnotationAnchor["nodeType"];
 readerAnnotations?: readonly ReaderAnnotationRow[];
 onOpenReaderAnnotation?: (annotation: ReaderAnnotationRow, rect: DOMRect) => void;
 renderSegment?: ReaderSurfaceRenderSegment;
 renderSection?: ReaderSurfaceRenderSection;
 analysisBySegmentId?: ReadonlyMap<string, ReaderPronunciationAnalysis>;
 onSelection?: (selection: ReaderSurfaceSelection) => void;
 onPronunciationInspect?: (target: ReaderSurfacePronunciationTarget) => void;
 onOpenShadowing?: () => void;
 toolbarStickyOffset?: ReaderToolbarStickyOffset;
 toolsMenuContent?: ReactNode;
 toolsSheetContent?: ReactNode;
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
  if (node instanceof Text && !node.parentElement?.closest("rt, rp")) {
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
 annotationNodeType,
 readerAnnotations,
 onOpenReaderAnnotation,
 renderSegment,
 renderSection,
 analysisBySegmentId,
 onSelection,
 onPronunciationInspect,
 onOpenShadowing,
 toolbarStickyOffset = "page",
 toolsMenuContent,
 toolsSheetContent,
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
  if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
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
   onCopy={(event) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return;
    const range = selection.getRangeAt(0);
    if (!event.currentTarget.contains(range.commonAncestorContainer)) return;
    const fragment = range.cloneContents();
    if (!fragment.querySelector("ruby, rt, [lang='zh-Latn-pinyin']")) return;
    fragment
     .querySelectorAll("rt, rp, [lang='zh-Latn-pinyin'], [aria-hidden='true']")
     .forEach((pinyin) => pinyin.remove());
    event.preventDefault();
    event.clipboardData.setData("text/plain", fragment.textContent ?? "");
   }}
  >
   <div
    className={
     focusMode
      ? "grid min-w-0 gap-3"
      : compact
        ? "grid min-w-0 gap-3"
        : "grid min-w-0 items-start gap-3 2xl:grid-cols-[minmax(0,1fr)_18rem]"
    }
   >
    {!focusMode && !compact ? (
     <div className="contents 2xl:sticky 2xl:top-0 2xl:col-start-2 2xl:row-start-1 2xl:grid 2xl:min-w-0 2xl:grid-cols-[minmax(0,1fr)] 2xl:content-start 2xl:gap-3">
      <ReaderCommandBar
       segmentCount={document.segments.length}
       onOpenOutline={() => setOutlineOpen(true)}
       onOpenShadowing={onOpenShadowing}
       stickyOffset={toolbarStickyOffset}
       compact={compact}
       sidebar
       displayMode={displayMode}
       onDisplayModeChange={displayMode ? updateDisplayMode : undefined}
       toolsMenuContent={toolsMenuContent}
       toolsSheetContent={toolsSheetContent}
       outlineMenu={(onNavigate) => (
        <ReaderOutlineContent document={document} onNavigate={onNavigate} />
       )}
      />
      <div className="hidden 2xl:block">
       <ReaderOutline document={document} />
      </div>
     </div>
    ) : (
     <ReaderCommandBar
      segmentCount={document.segments.length}
      onOpenOutline={() => setOutlineOpen(true)}
      onOpenShadowing={onOpenShadowing}
      stickyOffset={toolbarStickyOffset}
      compact={compact}
      displayMode={displayMode}
      onDisplayModeChange={displayMode ? updateDisplayMode : undefined}
      toolsMenuContent={toolsMenuContent}
      toolsSheetContent={toolsSheetContent}
      outlineMenu={(onNavigate) => (
       <ReaderOutlineContent document={document} onNavigate={onNavigate} />
      )}
     />
    )}

    <div
     className={
      focusMode
       ? "mx-auto grid w-full max-w-5xl gap-3"
       : compact
         ? "grid min-w-0 gap-3"
         : "grid min-w-0 gap-3 2xl:col-start-1 2xl:row-start-1"
     }
    >
     {error ? (
      <Typography as="p" variant="caption" tone="danger" role="alert">
       {error}
      </Typography>
     ) : null}
     <ReaderDocumentContent
      document={document}
      lessonId={lessonId}
      annotationNodeType={annotationNodeType}
      readerAnnotations={readerAnnotations}
      onOpenReaderAnnotation={onOpenReaderAnnotation}
      displayMode={displayMode}
      renderSegment={renderSegment}
      renderSection={renderSection}
      analysisBySegmentId={analysisBySegmentId}
      onSelection={onSelection}
      onPronunciationInspect={inspectPronunciation}
      setSegmentElement={setSegmentElement}
     />
    </div>
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
