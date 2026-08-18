"use client";

import { ChevronLeft, ChevronRight, List, Pause, Play, RotateCcw, Square } from "lucide-react";
import {
 useCallback,
 useEffect,
 useMemo,
 useRef,
 useState,
 type KeyboardEvent,
 type ReactNode,
} from "react";

import { getAppScrollContainer, scrollAppContentToElement } from "@/components/layout/app-scroll";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import {
 PinyinText,
 ReaderHanziText,
 StudyInstructionText,
 TranslationText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import {
 ProgressiveStudyText,
 getActiveCharacterIndex,
} from "@/features/hanzihome/components/lesson-overview/ProgressiveStudyText";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 analyzeContextualPronunciation,
 formatContextualSpokenPinyin,
} from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import { ContextualReaderText } from "../ContextualReaderText";
import type {
 ReaderDocumentModel,
 ReaderSection,
 ReaderSegment,
} from "../model/reader-document.types";
import {
 ReaderRuntimeProvider,
 useReaderRuntimeActions,
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";
import { ReaderTools } from "./ReaderTools";

const readerRateOptions: readonly number[] = [0.75, 0.9, 1, 1.1, 1.25];

export type ReaderSurfaceRenderSegment = (input: {
 segment: ReaderSegment;
 index: number;
 content: ReactNode;
}) => ReactNode;

export type ReaderSurfaceRenderSection = (input: {
 section: ReaderSection;
 content: ReactNode;
}) => ReactNode;

export function ReaderSurface({
 document,
 lessonId,
 renderSegment,
 renderSection,
 onOpenShadowing,
}: {
 document: ReaderDocumentModel;
 lessonId?: string;
 renderSegment?: ReaderSurfaceRenderSegment;
 renderSection?: ReaderSurfaceRenderSection;
 onOpenShadowing?: () => void;
}) {
 return (
  <ReaderRuntimeProvider document={document}>
   <ReaderSurfaceContent
    document={document}
    lessonId={lessonId}
    renderSegment={renderSegment}
    renderSection={renderSection}
    onOpenShadowing={onOpenShadowing}
   />
  </ReaderRuntimeProvider>
 );
}

function ReaderSurfaceContent({
 document,
 lessonId,
 renderSegment,
 renderSection,
 onOpenShadowing,
}: {
 document: ReaderDocumentModel;
 lessonId?: string;
 renderSegment?: ReaderSurfaceRenderSegment;
 renderSection?: ReaderSurfaceRenderSection;
 onOpenShadowing?: () => void;
}) {
 const [outlineOpen, setOutlineOpen] = useState(false);
 const segmentElementsRef = useRef(new Map<string, HTMLElement>());
 const commands = useReaderRuntimeCommands();
 const actions = useReaderRuntimeActions();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const positionSource = useReaderRuntimeSelector((state) => state.positionSource);
 const focusMode = useReaderRuntimeSelector((state) => state.focusMode);
 const playbackStatus = useReaderRuntimeSelector((state) => state.playbackStatus);
 const error = useReaderRuntimeSelector((state) => state.error);
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;

 const setSegmentElement = useCallback((segmentId: string, element: HTMLElement | null) => {
  if (element) segmentElementsRef.current.set(segmentId, element);
  else segmentElementsRef.current.delete(segmentId);
 }, []);

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
  const container = getAppScrollContainer();
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
      displayMode={displayMode}
      renderSegment={renderSegment}
      renderSection={renderSection}
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
  </div>
 );
}

function ReaderCommandBar({
 segmentCount,
 onOpenOutline,
 onOpenShadowing,
}: {
 segmentCount: number;
 onOpenOutline: () => void;
 onOpenShadowing?: () => void;
}) {
 const commands = useReaderRuntimeCommands();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const playbackStatus = useReaderRuntimeSelector((state) => state.playbackStatus);
 const rate = useReaderRuntimeSelector((state) => state.rate);
 const isFirst = activeIndex <= 0;
 const isLast = activeIndex >= segmentCount - 1;
 const isIdle = playbackStatus === "idle";

 const togglePlayback = () => {
  if (playbackStatus === "playing") commands.pause();
  else if (playbackStatus === "paused") commands.resume();
  else if (playbackStatus === "loading") commands.stop();
  else commands.playCurrent();
 };
 const playbackLabel =
  playbackStatus === "playing"
   ? "Tạm dừng"
   : playbackStatus === "paused"
     ? "Tiếp tục"
     : playbackStatus === "loading"
       ? "Dừng"
       : "Nghe bài";
 const PlaybackIcon =
  playbackStatus === "playing" ? Pause : playbackStatus === "loading" ? Square : Play;

 return (
  <Card variant="section" padding="sm">
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <Typography variant="caption" tone="muted" weight="black" className="mr-auto">
     Đoạn {activeIndex + 1} / {segmentCount}
    </Typography>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isFirst}
     aria-label="Đoạn trước"
     onClick={commands.previous}
    >
     <ChevronLeft />
    </Button>
    <Button
     type="button"
     variant={isIdle ? "default" : "active"}
     size="toolbar"
     aria-label={playbackLabel}
     onClick={togglePlayback}
    >
     <PlaybackIcon data-icon="inline-start" />
     {playbackLabel}
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label="Nghe lại đoạn"
     title="Nghe lại đoạn"
     onClick={commands.restartCurrent}
    >
     <RotateCcw />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isIdle}
     aria-label="Dừng đọc"
     title="Dừng đọc"
     onClick={commands.stop}
    >
     <Square />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isLast}
     aria-label="Đoạn sau"
     onClick={commands.next}
    >
     <ChevronRight />
    </Button>
    <Select value={String(rate)} onValueChange={(value) => commands.setRate(Number(value))}>
     <SelectTrigger size="sm" aria-label="Tốc độ đọc">
      <SelectValue />
     </SelectTrigger>
     <SelectContent align="end">
      {readerRateOptions.map((option) => (
       <SelectItem key={option} value={String(option)}>
        {option.toFixed(2)}x
       </SelectItem>
      ))}
     </SelectContent>
    </Select>
    <div className="2xl:hidden">
     <Button
      type="button"
      variant="outline"
      size="icon-toolbar"
      aria-label="Mở mục lục đoạn"
      title="Mục lục đoạn"
      onClick={onOpenOutline}
     >
      <List />
     </Button>
    </div>
    <ReaderTools onOpenShadowing={onOpenShadowing} />
   </div>
  </Card>
 );
}

function ReaderDocumentContent({
 document,
 lessonId,
 displayMode,
 renderSegment,
 renderSection,
 setSegmentElement,
}: {
 document: ReaderDocumentModel;
 lessonId?: string;
 displayMode: LessonDisplayMode;
 renderSegment?: ReaderSurfaceRenderSegment;
 renderSection?: ReaderSurfaceRenderSection;
 setSegmentElement: (segmentId: string, element: HTMLElement | null) => void;
}) {
 const segmentById = useMemo(
  () => new Map(document.segments.map((segment) => [segment.id, segment])),
  [document.segments],
 );
 const indexById = useMemo(
  () => new Map(document.segments.map((segment, index) => [segment.id, index])),
  [document.segments],
 );
 const sectionSegmentIds = useMemo(
  () => new Set(document.sections.flatMap((section) => [...section.segmentIds])),
  [document.sections],
 );
 const unsectioned = document.segments.filter((segment) => !sectionSegmentIds.has(segment.id));

 return (
  <Card variant="section" padding="lg">
   <div className="grid min-w-0 gap-5">
    {document.sections.map((section, sectionIndex) => {
     const segments = section.segmentIds
      .map((segmentId) => segmentById.get(segmentId))
      .filter((segment): segment is ReaderSegment => segment !== undefined);
     if (segments.length === 0) return null;
     const content = (
      <section className="grid min-w-0 gap-4">
       <div className="grid gap-1">
        <StudyInstructionText
         variant="overline"
         tone="muted"
         weight="black"
         tracking="wide"
         transform="uppercase"
        >
         Phần {sectionIndex + 1}
        </StudyInstructionText>
        <Typography as="h3" variant="cardTitle" weight="black">
         {section.title}
        </Typography>
       </div>
       <div className="grid min-w-0 gap-5">
        {segments.map((segment, localIndex) => {
         const index = indexById.get(segment.id) ?? localIndex;
         return (
          <ReaderSegmentRow
           key={segment.id}
           segment={segment}
           index={index}
           lessonId={lessonId}
           displayMode={displayMode}
           renderSegment={renderSegment}
           setSegmentElement={setSegmentElement}
           showSeparator={localIndex > 0}
          />
         );
        })}
       </div>
      </section>
     );
     return (
      <div key={section.id} className="grid gap-5">
       {sectionIndex > 0 ? <Separator /> : null}
       {renderSection ? renderSection({ section, content }) : content}
      </div>
     );
    })}

    {unsectioned.length > 0 ? (
     <div className="grid min-w-0 gap-5">
      {unsectioned.map((segment, localIndex) => (
       <ReaderSegmentRow
        key={segment.id}
        segment={segment}
        index={indexById.get(segment.id) ?? localIndex}
        lessonId={lessonId}
        displayMode={displayMode}
        renderSegment={renderSegment}
        setSegmentElement={setSegmentElement}
        showSeparator={document.sections.length > 0 || localIndex > 0}
       />
      ))}
     </div>
    ) : null}
   </div>
  </Card>
 );
}

function ReaderSegmentRow({
 segment,
 index,
 lessonId,
 displayMode,
 renderSegment,
 setSegmentElement,
 showSeparator,
}: {
 segment: ReaderSegment;
 index: number;
 lessonId?: string;
 displayMode: LessonDisplayMode;
 renderSegment?: ReaderSurfaceRenderSegment;
 setSegmentElement: (segmentId: string, element: HTMLElement | null) => void;
 showSeparator: boolean;
}) {
 const active = useReaderRuntimeSelector((state) => state.activeSegmentId === segment.id);
 const { openInspector } = useVocabInspector();
 const content = <ReaderSegmentText segment={segment} active={active} displayMode={displayMode} />;
 const rendered = renderSegment ? renderSegment({ segment, index, content }) : content;

 const captureSelection = (element: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
  const text = selection.toString().trim();
  if (!text) return;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.commonAncestorContainer)) return;
  void openInspector(text, { lessonId, anchorRect: range.getBoundingClientRect() });
 };

 return (
  <div
   ref={(element) => setSegmentElement(segment.id, element)}
   data-reader-segment-id={segment.id}
   data-no-inspector="true"
   className="grid min-w-0 gap-5"
   onMouseUp={(event) => captureSelection(event.currentTarget)}
   onTouchEnd={(event) => captureSelection(event.currentTarget)}
  >
   {showSeparator ? <Separator /> : null}
   {rendered}
  </div>
 );
}

function ReaderSegmentText({
 segment,
 active,
 displayMode,
}: {
 segment: ReaderSegment;
 active: boolean;
 displayMode: LessonDisplayMode;
}) {
 const playbackProgress = useReaderRuntimeSelector((state) =>
  state.playbackSegmentId === segment.id && state.playbackStatus !== "idle" ? state.progress : -1,
 );
 const analysis = useMemo(() => {
  if (segment.zh.length > 2_000) return null;
  const sourcePinyin = segment.pinyin && segment.pinyin.length <= 8_000 ? segment.pinyin : null;
  return analyzeContextualPronunciation({ text: segment.zh, sourcePinyin });
 }, [segment.pinyin, segment.zh]);
 const characterCount = Array.from(segment.zh).length;
 const activeCharacterIndex =
  playbackProgress >= 0
   ? getActiveCharacterIndex(characterCount, 0, characterCount, playbackProgress)
   : -1;
 const contextualPinyin = useMemo(
  () => (analysis ? formatContextualSpokenPinyin(analysis) : segment.pinyin),
  [analysis, segment.pinyin],
 );

 return (
  <article className="grid min-w-0 gap-2">
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <StudyInstructionText
     variant="overline"
     tone={active ? "accent" : "muted"}
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     {segment.kind === "dialogue-turn" ? `Lượt ${segment.speaker?.label ?? "thoại"}` : "Đoạn đọc"}
    </StudyInstructionText>
    {segment.role ? (
     <StudyInstructionText variant="caption" tone="muted" weight="semibold">
      {segment.role}
     </StudyInstructionText>
    ) : null}
   </div>

   {displayMode.revealMode === "tap" ? (
    <ProgressiveStudyText
     zh={segment.zh}
     pinyin={contextualPinyin}
     vi={segment.vi}
     displayMode={displayMode}
    />
   ) : analysis ? (
    <div className="grid min-w-0 gap-1.5">
     <ContextualReaderText
      analysis={analysis}
      displayMode={displayMode}
      activeCharacterIndex={activeCharacterIndex}
      showPinyin={displayMode.showPinyin}
      pinyinPresentation="ruby"
      sourcePinyin={segment.pinyin}
     />
     {segment.vi && displayMode.showMeaning ? (
      <TranslationText tone="muted" weight="medium" leading="relaxed" wrapping="preWrap">
       {segment.vi}
      </TranslationText>
     ) : null}
    </div>
   ) : (
    <div className="grid min-w-0 gap-1.5">
     <ReaderHanziText
      displayMode={displayMode}
      tone="default"
      leading="learner"
      wrapping="preWrap"
      className="min-w-0"
     >
      {segment.zh}
     </ReaderHanziText>
     {segment.pinyin && displayMode.showPinyin ? (
      <PinyinText tone="accent" weight="semibold" leading="relaxed" wrapping="preWrap">
       {segment.pinyin}
      </PinyinText>
     ) : null}
     {segment.vi && displayMode.showMeaning ? (
      <TranslationText tone="muted" weight="medium" leading="relaxed" wrapping="preWrap">
       {segment.vi}
      </TranslationText>
     ) : null}
    </div>
   )}
  </article>
 );
}

function ReaderOutline({ document }: { document: ReaderDocumentModel }) {
 return (
  <Card variant="section" padding="md" className="sticky top-3">
   <ReaderOutlineContent document={document} />
  </Card>
 );
}

function ReaderOutlineContent({
 document,
 onNavigate,
}: {
 document: ReaderDocumentModel;
 onNavigate?: () => void;
}) {
 const commands = useReaderRuntimeCommands();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const activeSegment = document.segments[activeIndex];
 const indexById = useMemo(
  () => new Map(document.segments.map((segment, index) => [segment.id, index])),
  [document.segments],
 );

 return (
  <div className="grid gap-4">
   <div className="grid gap-2">
    <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
     Mục lục đoạn
    </Typography>
    <nav aria-label="Mục lục bài đọc" className="grid gap-1">
     {document.sections.length > 0
      ? document.sections.map((section, index) => {
         const firstSegmentId = section.segmentIds[0];
         const targetIndex = firstSegmentId ? indexById.get(firstSegmentId) : undefined;
         const selected = Boolean(
          activeSegment?.sectionId && activeSegment.sectionId === section.id,
         );
         return targetIndex === undefined ? null : (
          <Button
           key={section.id}
           type="button"
           variant={selected ? "active" : "ghost"}
           size="menu"
           align="start"
           className="w-full"
           onClick={() => {
            commands.selectIndex(targetIndex);
            onNavigate?.();
           }}
          >
           <span className="tabular-nums">{index + 1}</span>
           <span className="min-w-0 truncate">{section.title}</span>
          </Button>
         );
        })
      : document.segments.map((segment, index) => (
         <Button
          key={segment.id}
          type="button"
          variant={activeIndex === index ? "active" : "ghost"}
          size="menu"
          align="start"
          className="w-full"
          onClick={() => {
           commands.selectIndex(index);
           onNavigate?.();
          }}
         >
          <span className="tabular-nums">{index + 1}</span>
          <span>Đoạn {index + 1}</span>
         </Button>
        ))}
    </nav>
   </div>

   {document.metadata.length > 0 ? (
    <>
     <Separator />
     <div className="grid gap-3">
      <Typography variant="overline" tone="muted" weight="black" transform="uppercase">
       Thông tin bài
      </Typography>
      <dl className="grid gap-3">
       {document.metadata.map((item) => (
        <div key={item.id} className="grid gap-0.5">
         <Typography as="dt" variant="caption" tone="muted">
          {item.label}
         </Typography>
         <Typography as="dd" variant="bodySmall" tone="default">
          {item.value}
         </Typography>
        </div>
       ))}
      </dl>
     </div>
    </>
   ) : null}
  </div>
 );
}
