"use client";

import { FileText, Focus, Layers, ListEnd, Play, Repeat2, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { scrollAppContentToElement } from "@/components/layout/app-scroll";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useVocabInspector } from "@/components/vocabulary/useVocabInspector";
import {
 HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { TextbookSectionCard } from "@/features/hanzihome/components/lesson-text/TextbookSectionCard";
import {
 LessonModuleFrame,
 LessonModuleSidebarRailItem,
} from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import { sectionIcons } from "@/features/hanzihome/components/lesson-overview/section-icons";
import {
 sectionSubtitle,
 sectionTitle,
} from "@/features/hanzihome/components/lesson-overview/utils";
import { useHanziHomeLessonSections } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import type { EditableNodePath } from "@/features/hanzihome/editing";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import { useLessonAnnotationContext } from "@/features/hanzihome/annotations/LessonAnnotationProvider";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import {
 emptyReaderSessionState,
 moveReaderParagraph,
 resolveReaderPlaybackEnd,
 toggleReaderAutoAdvance,
 toggleReaderLoop,
 type ReaderSessionState,
} from "@/features/hanzihome/reader/reader-session";
import { cn } from "@/lib/utils";

import { speechSegmentsForSections } from "./lesson-section-speech";

type LessonTextInlineEditorProps = {
 compact?: boolean;
 practiceOnly?: boolean;
 selectedSectionId: string;
 onSelectSection: (sectionId: string) => void;
};

const allSectionsId = "__all_lesson_sections__";
const practiceSectionTypes = new Set<Section["type"]>([
 "exercises",
 "reading",
 "communication",
 "character_writing",
]);

export function LessonTextInlineEditor({
 compact = false,
 practiceOnly = false,
 selectedSectionId,
 onSelectSection,
}: LessonTextInlineEditorProps) {
 const runtime = useHanziHomeRuntime();
 const { lesson } = runtime;
 const actions = useHanziHomeFeatureActions();
 const sectionResource = useHanziHomeLessonSections(lesson.id);
 const displayMode = useHanziHomeFeatureSelector((state) => state.lessonTextDisplayMode);
 const isSectionNavOpen = useHanziHomeFeatureSelector((state) => state.lessonTextSidebarOpen);
 const tts = useSharedMandarinTts();
 const { stop: stopTts } = tts;
 const { closeInspector } = useVocabInspector();
 const annotationContext = useLessonAnnotationContext();
 const [isReadingMode, setIsReadingMode] = useState(false);
 const [readerState, setReaderState] = useState<ReaderSessionState>(emptyReaderSessionState);
 const readerStateRef = useRef(readerState);
 const readerRunRef = useRef(0);
 const playReaderSegmentRef = useRef<(index: number, runId: number) => void>(() => undefined);
 const sourceSections = useMemo(() => {
  const sections =
   lesson.sourceLesson?.lesson.sections.slice().sort((a, b) => a.order - b.order) ??
   sectionResource?.sections ??
   [];

  return sections.filter((section) =>
   practiceOnly ? practiceSectionTypes.has(section.type) : !practiceSectionTypes.has(section.type),
  );
 }, [lesson.sourceLesson, practiceOnly, sectionResource]);
 const readingItems = useMemo(
  () => sourceSections.flatMap((section) => (section.type === "reading" ? section.items : [])),
  [sourceSections],
 );
 const readingSections = useMemo(
  () => sourceSections.filter((section) => section.type === "reading"),
  [sourceSections],
 );
 const selectedSection = sourceSections.find((section) => section.id === selectedSectionId) ?? null;
 const showAllSections = selectedSectionId === allSectionsId || !selectedSection;
 const visibleSpeechSegments = useMemo(
  () =>
   speechSegmentsForSections(
    showAllSections ? sourceSections : selectedSection ? [selectedSection] : [],
   ),
  [selectedSection, showAllSections, sourceSections],
 );
 const visibleSpeechText = visibleSpeechSegments.join("\n");
 const updateReaderState = useCallback(
  (next: ReaderSessionState | ((current: ReaderSessionState) => ReaderSessionState)) => {
   const resolved = typeof next === "function" ? next(readerStateRef.current) : next;
   readerStateRef.current = resolved;
   setReaderState(resolved);
  },
  [],
 );
 const scrollToReaderSegment = useCallback((text: string) => {
  const target = Array.from(
   document.querySelectorAll<HTMLElement>("[data-reader-segment-text]"),
  ).find((element) => element.dataset.readerSegmentText === text);
  scrollAppContentToElement(target ?? null, { behavior: "smooth", block: "center" });
 }, []);
 const playReaderSegment = useCallback(
  (index: number, runId: number) => {
   if (readerRunRef.current !== runId) return;
   const text = visibleSpeechSegments[index];
   if (!text) return;
   updateReaderState((current) =>
    moveReaderParagraph(current, index, visibleSpeechSegments.length),
   );
   scrollToReaderSegment(text);
   tts.speakSequence([text], () => {
    if (readerRunRef.current !== runId) return;
    const current = readerStateRef.current;
    if (current.loopCurrent) {
     playReaderSegmentRef.current(current.activeParagraphIndex, runId);
     return;
    }
    if (current.autoAdvance && current.activeParagraphIndex < visibleSpeechSegments.length - 1) {
     const nextIndex = current.activeParagraphIndex + 1;
     updateReaderState((state) =>
      moveReaderParagraph(state, nextIndex, visibleSpeechSegments.length),
     );
     playReaderSegmentRef.current(nextIndex, runId);
     return;
    }
    updateReaderState(resolveReaderPlaybackEnd(current, visibleSpeechSegments.length));
   });
  },
  [scrollToReaderSegment, tts, updateReaderState, visibleSpeechSegments],
 );
 useEffect(() => {
  playReaderSegmentRef.current = playReaderSegment;
 }, [playReaderSegment]);
 const stopReader = useCallback(() => {
  readerRunRef.current += 1;
  stopTts();
  setIsReadingMode(false);
  updateReaderState((current) => ({ ...current, completed: false }));
 }, [stopTts, updateReaderState]);
 const startReader = useCallback(
  (index = readerStateRef.current.activeParagraphIndex) => {
   if (visibleSpeechSegments.length === 0) return;
   readerRunRef.current += 1;
   const runId = readerRunRef.current;
   updateReaderState((current) => ({
    ...current,
    activeParagraphIndex: Math.min(index, visibleSpeechSegments.length - 1),
    completed: false,
   }));
   playReaderSegment(Math.min(index, visibleSpeechSegments.length - 1), runId);
  },
  [playReaderSegment, updateReaderState, visibleSpeechSegments.length],
 );
 const toggleReaderPlayback = useCallback(() => {
  if (tts.isSpeaking || tts.isLoading) stopReader();
  else startReader();
 }, [startReader, stopReader, tts.isLoading, tts.isSpeaking]);
 const activeReaderIndex = useMemo(() => {
  const speakingIndex = tts.speakingText ? visibleSpeechSegments.indexOf(tts.speakingText) : -1;
  return speakingIndex >= 0 ? speakingIndex : readerState.activeParagraphIndex;
 }, [readerState.activeParagraphIndex, tts.speakingText, visibleSpeechSegments]);
 useEffect(() => {
  readerStateRef.current = readerState;
 }, [readerState]);
 useEffect(() => {
  stopTts();
  readerRunRef.current += 1;
  updateReaderState(emptyReaderSessionState);
 }, [practiceOnly, selectedSectionId, stopTts, updateReaderState, visibleSpeechText]);
 useEffect(
  () => () => {
   readerRunRef.current += 1;
   stopTts();
  },
  [stopTts],
 );
 useEffect(() => {
  if (!isReadingMode || visibleSpeechSegments.length === 0) return;

  const handleKeyDown = (event: KeyboardEvent) => {
   const target = event.target;
   if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
   ) {
    return;
   }

   if (event.key === "Escape") {
    event.preventDefault();
    stopReader();
   } else if (event.key === " ") {
    event.preventDefault();
    toggleReaderPlayback();
   } else if (event.key === "ArrowRight") {
    event.preventDefault();
    const nextIndex = Math.min(visibleSpeechSegments.length - 1, activeReaderIndex + 1);
    updateReaderState((current) =>
     moveReaderParagraph(current, nextIndex, visibleSpeechSegments.length),
    );
    scrollToReaderSegment(visibleSpeechSegments[nextIndex]);
   } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    const nextIndex = Math.max(0, activeReaderIndex - 1);
    updateReaderState((current) =>
     moveReaderParagraph(current, nextIndex, visibleSpeechSegments.length),
    );
    scrollToReaderSegment(visibleSpeechSegments[nextIndex]);
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [
  activeReaderIndex,
  isReadingMode,
  scrollToReaderSegment,
  stopReader,
  toggleReaderPlayback,
  updateReaderState,
  visibleSpeechSegments,
 ]);
 const sectionPathFor = (section: Section): EditableNodePath => {
  const sourceIndex =
   lesson.sourceLesson?.lesson.sections.findIndex(
    (sourceSection) => sourceSection.id === section.id,
   ) ?? -1;

  return ["lesson", "sections", sourceIndex >= 0 ? sourceIndex : sourceSections.indexOf(section)];
 };

 const enterReadingMode = () => {
  closeInspector();
  annotationContext?.closeAnnotation();
  setIsReadingMode(true);
 };
 const readingControls = (
  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
   <Button
    type="button"
    variant={tts.isSpeaking || tts.isLoading ? "active" : "outline"}
    size="toolbar"
    disabled={!visibleSpeechText || !tts.selectedVoice}
    aria-pressed={tts.isSpeaking || tts.isLoading}
    onClick={() => {
     if (!isReadingMode) enterReadingMode();
     toggleReaderPlayback();
    }}
    title={tts.error ?? "Đọc toàn bộ nội dung tiếng Trung"}
   >
    {tts.isSpeaking || tts.isLoading ? (
     <Square data-icon="inline-start" />
    ) : (
     <Play data-icon="inline-start" />
    )}
    <span className={cn(compact && "hidden sm:inline")}>
     {tts.isSpeaking || tts.isLoading ? "Dừng" : "Đọc cả đoạn"}
    </span>
   </Button>
   {isReadingMode ? (
    <>
     <Button
      type="button"
      variant={readerState.loopCurrent ? "active" : "ghost"}
      size="icon-toolbar"
      aria-label="Lặp đoạn hiện tại"
      aria-pressed={readerState.loopCurrent}
      title="Lặp đoạn hiện tại"
      onClick={() => updateReaderState(toggleReaderLoop)}
     >
      <Repeat2 />
     </Button>
     <Button
      type="button"
      variant={readerState.autoAdvance ? "active" : "ghost"}
      size="icon-toolbar"
      aria-label="Tự chuyển đoạn"
      aria-pressed={readerState.autoAdvance}
      title="Tự chuyển đoạn"
      onClick={() => updateReaderState(toggleReaderAutoAdvance)}
     >
      <ListEnd />
     </Button>
     <Button
      type="button"
      variant={readerState.focusMode ? "active" : "ghost"}
      size="icon-toolbar"
      aria-label="Chế độ tập trung"
      aria-pressed={readerState.focusMode}
      title="Chế độ tập trung"
      onClick={() =>
       updateReaderState((current) => ({ ...current, focusMode: !current.focusMode }))
      }
     >
      <Focus />
     </Button>
    </>
   ) : null}
  </div>
 );

 const sidebar = (
  <div className="grid gap-2">
   <LessonModuleSidebarItem
    selected={showAllSections}
    title="Xem toàn bộ"
    subtitle={`${sourceSections.length} đề mục`}
    icon={<Layers className="h-4 w-4" />}
    onClick={() => onSelectSection(allSectionsId)}
   />

   <div className="grid max-h-[calc(100dvh-15rem)] gap-2 overflow-y-auto pr-1 scrollbar-soft">
    {sourceSections.map((section) => {
     const Icon = sectionIcons[section.type] ?? FileText;
     const active = !showAllSections && selectedSection?.id === section.id;

     return (
      <LessonModuleSidebarItem
       key={section.id}
       selected={active}
       title={`${section.order}. ${sectionTitle(section)}`}
       subtitle={sectionSubtitle(section)}
       icon={<Icon className="h-4 w-4" />}
       onClick={() => onSelectSection(section.id)}
      />
     );
    })}
   </div>
  </div>
 );
 const sidebarRail = (
  <>
   <LessonModuleSidebarRailItem
    icon={<Layers className="h-4 w-4" />}
    label={`Xem toàn bộ ${sourceSections.length} đề mục`}
    selected={showAllSections}
    onClick={() => onSelectSection(allSectionsId)}
   />
   {sourceSections.map((section) => {
    const Icon = sectionIcons[section.type] ?? FileText;
    const active = !showAllSections && selectedSection?.id === section.id;

    return (
     <LessonModuleSidebarRailItem
      key={section.id}
      icon={<Icon className="h-4 w-4" />}
      label={`${section.order}. ${sectionTitle(section)}`}
      selected={active}
      onClick={() => onSelectSection(section.id)}
     />
    );
   })}
  </>
 );

 return (
  <>
   {!compact ? (
    <HanziHomeCommandBarPortal targetId={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}>
     {readingControls}
    </HanziHomeCommandBarPortal>
   ) : null}
   <LessonModuleFrame
    title={practiceOnly ? "Bài tập và đọc hiểu" : "Bài khóa"}
    subtitle={
     showAllSections
      ? practiceOnly
       ? "Luyện tập, đọc hiểu và thực hành"
       : "Toàn bộ nội dung bài"
      : selectedSection
        ? sectionTitle(selectedSection)
        : "Chưa có nội dung"
    }
    sidebarLabel="Đề mục"
    sidebarSummary={`${sourceSections.length} mục`}
    sidebarOpen={isSectionNavOpen}
    onSidebarOpenChange={actions.setLessonTextSidebarOpen}
    sidebar={sidebar}
    sidebarRail={sidebarRail}
    sidebarSelectionKey={selectedSectionId}
    mobileNavigation={{
     label: "Đề mục",
     value: showAllSections ? allSectionsId : (selectedSection?.id ?? allSectionsId),
     items: [
      { value: allSectionsId, label: "Xem toàn bộ" },
      ...sourceSections.map((section) => ({
       value: section.id,
       label: `${section.order}. ${sectionTitle(section)}`,
      })),
     ],
     onChange: onSelectSection,
    }}
    compact={compact || (isReadingMode && readerState.focusMode)}
    actions={compact ? readingControls : null}
   >
    {sourceSections.length > 0 ? (
     <div
      className={cn(
       "grid min-w-0 gap-2.5",
       isReadingMode && readerState.focusMode && "mx-auto w-full max-w-4xl",
      )}
     >
      {showAllSections ? (
       sourceSections.map((section) => (
        <TextbookSectionCard
         key={section.id}
         lessonId={lesson.id}
         section={section}
         sectionPath={sectionPathFor(section)}
         displayMode={displayMode}
         readingItems={readingItems}
         readingSections={readingSections}
         interactiveReading={!practiceOnly}
         readingMode={isReadingMode}
        />
       ))
      ) : selectedSection ? (
       <TextbookSectionCard
        lessonId={lesson.id}
        section={selectedSection}
        sectionPath={sectionPathFor(selectedSection)}
        displayMode={displayMode}
        readingItems={readingItems}
        readingSections={readingSections}
        interactiveReading={!practiceOnly}
        readingMode={isReadingMode}
       />
      ) : null}
     </div>
    ) : (
     <Card variant="subtle" padding="md">
      <Typography as="p" variant="bodySmall" tone="muted" weight="semibold">
       {practiceOnly
        ? "Bài này chưa có bài tập hoặc nội dung đọc hiểu."
        : "Chưa có bài khóa trong JSON của bài này."}
      </Typography>
     </Card>
    )}
   </LessonModuleFrame>
  </>
 );
}
