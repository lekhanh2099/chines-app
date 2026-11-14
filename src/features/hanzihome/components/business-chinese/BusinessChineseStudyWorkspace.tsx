"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { scrollAppContentToElement } from "@/components/layout/scroll/app-scroll";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Input } from "@/components/ui/forms/input";
import { Card } from "@/components/ui/layout/card";
import { Separator } from "@/components/ui/layout/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/overlays/sheet";
import {
 Bookmark,
 BookOpen,
 CloudCheck,
 DownloadCloud,
 PictureInPicture2,
 Search,
 Sparkles,
 Volume2,
} from "lucide-react";
import { createPortal } from "react-dom";
import {
 UniversalAmbientPip,
 type UniversalPipMode,
} from "@/features/hanzihome/components/review/UniversalAmbientPip";
import { adaptTextbookGrammarToPip } from "@/features/hanzihome/components/review/pip-grammar-adapter";
import { useDocumentPip } from "@/features/hanzihome/hooks/useDocumentPip";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { type SegmentedControlItem } from "@/components/ui/forms/segmented-control";
import { Typography } from "@/components/ui/display/typography";
import { BusinessChineseContextualDrills } from "./BusinessChineseContextualDrills";
import { UniversalExerciseRunner } from "@/features/hanzihome/components/practice/UniversalExerciseRunner";
import { adaptAllLessonExercises } from "@/features/hanzihome/components/practice/universal-exercise-adapter";
import { HanziHomeWorkspaceLoading } from "@/features/hanzihome/components/layout/HanziHomeWorkspaceLoading";
import { WorkspaceToolbar } from "@/features/hanzihome/components/layout/WorkspaceToolbar";
import { defaultTextbookDisplaySettings } from "@/features/hanzihome/utils/learning-state";
import { BusinessChineseWorkspaceNavMenu } from "./BusinessChineseWorkspaceNavMenu";
import {
 DesktopSectionNavigation,
 CompactSectionNavigation,
 GrammarSectionNavigation,
} from "./BusinessChineseSectionNavigation";
import { TranslationText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { VocabPreviewRow } from "@/features/hanzihome/components/lesson-overview/overview/VocabPreviewRow";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { MandarinTtsProvider } from "@/features/speech/MandarinTtsProvider";
import {
 buildBusinessChineseReaderDocument,
 buildTextbookHref,
 lessonDisplayTitle,
 splitTrailingTranslation,
} from "@/features/hanzihome/reader-adapters/business-chinese.adapter";
import { parseReaderSourceTarget } from "@/features/reading/model/reading-source-target";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { useIsLessonCached } from "@/features/hanzihome/hooks/useHanziHomeLessonResources";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import { ReaderPronunciationSessionProvider } from "@/features/hanzihome/reader-adapters/reader-pronunciation-session";
import {
 ReaderServicesContext,
 useReaderServices,
 useReaderCommands,
 useReaderDisplay,
 useReaderStore,
 useReaderSelector,
} from "@/features/reader/runtime/reader-context";
import {
 getTextbookCatalogForBookKeys,
 getTextbookLesson,
 type TextbookBookSummary,
 type TextbookLesson,
} from "@/features/hanzihome/static-json/business-chinese-static-content";
import { FastSpeechSuspendedContext } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { TextbookNoteAccessCard } from "./TextbookNoteAccessCard";
import { LessonTranslationWorkspace } from "@/features/hanzihome/practice/LessonTranslationWorkspace";
import { LessonDictationWorkspace } from "@/features/hanzihome/practice/LessonDictationWorkspace";
import { OfflineAudioSettingsDialog } from "@/features/speech/OfflineAudioSettingsDialog";
import {
 dictationSourcesFromTextbook,
 translationSegmentsFromTextbook,
} from "@/features/hanzihome/practice/translation-practice";
import { usePathname, useRouter as useLocalizedRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
 BusinessChineseAnnotationsContext,
 type BusinessChineseAnnotationsContextValue,
} from "./business-chinese-annotations-context";
import { BusinessChineseHeaderContextBridge } from "./BusinessChineseHeaderContextBridge";
import { BusinessChineseReader } from "./BusinessChineseReader";
import { BusinessChineseSection } from "./BusinessChineseSection";
import { BusinessChineseText, SpeakableBusinessChineseText } from "./BusinessChineseText";
import { TextbookVocabularyPreview } from "./TextbookVocabularyPreview";

import {
 businessChineseContentSections,
 businessChineseSourceSections,
 businessChineseTabAvailable,
 businessChineseVocabularyTableIds,
 businessChineseVisibleSections,
 businessChineseReaderVocabulary,
 businessChinesePronunciationAnalyses,
 businessChineseSectionDocuments,
 businessChineseReaderAnnotations,
 businessChineseDictationCount,
 pairedTextbookTranslations,
 textbookLessonToReviewLesson,
 generateContextualVocabDrills,
} from "./business-chinese-study-utils";

import { useBusinessChineseReaderAnnotations } from "./useBusinessChineseReaderAnnotations";

export function BusinessChineseStudyWorkspace({
 books: initialBooks,
 lesson: initialLesson,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
}) {
 const t = useTranslations("BusinessChinese");
 const searchParams = useSearchParams();
 const sourceTarget = parseReaderSourceTarget(new URLSearchParams(searchParams.toString()));
 const router = useLocalizedRouter();
 const learning = useLearningState();
 const learningState = learning.state;
 const { toggleBookmark } = learning;

 const currentPath = usePathname();
 const detectedBookKey: TextbookLesson["bookKey"] = currentPath.includes("/khau-ngu-tc1")
  ? "khau-ngu"
  : currentPath.includes("/doc-hieu")
    ? "doc-hieu"
    : currentPath.includes("/han-thuong-mai")
      ? "tm3"
      : currentPath.includes("/nhip-cau")
        ? "nhip-cau"
        : initialLesson.bookKey;

 const requestedLessonNumber =
  typeof searchParams.get("lesson") === "string" ? Number(searchParams.get("lesson")) : null;

 const lesson = useMemo(() => {
  const targetNumber =
   requestedLessonNumber && Number.isInteger(requestedLessonNumber)
    ? requestedLessonNumber
    : detectedBookKey !== initialLesson.bookKey
      ? 1
      : initialLesson.number;

  if (detectedBookKey !== initialLesson.bookKey || targetNumber !== initialLesson.number) {
   const resolved = getTextbookLesson(detectedBookKey, targetNumber);
   if (resolved) return resolved;
  }
  return initialLesson;
 }, [detectedBookKey, initialLesson, requestedLessonNumber]);

 const books = useMemo(() => {
  if (initialBooks.some((b) => b.key === lesson.bookKey)) return initialBooks;
  return getTextbookCatalogForBookKeys([lesson.bookKey]);
 }, [initialBooks, lesson.bookKey]);

 const book = books.find((item) => item.key === lesson.bookKey);
 const bookKey = `static:${book?.id ?? lesson.bookKey}`;
 const resume = learningState.settings.bookResume?.[bookKey];
 const resumeLesson = book?.lessons.find((item) => item.id === resume?.lessonId);
 const shouldRestoreLesson =
  !searchParams.has("lesson") &&
  !learning.isLoading &&
  Boolean(resumeLesson && resumeLesson.id !== lesson.id);
 const globalPinyin = learningState.settings.lessonTextDisplayMode?.showPinyin;
 const bookDisplay = learningState.settings.bookDisplayModes?.[bookKey];
 const displayMode: LessonDisplayMode = useMemo(
  () => ({
   ...defaultTextbookDisplaySettings,
   ...(bookDisplay ?? {}),
   ...(bookDisplay?.showPinyin === undefined && globalPinyin !== undefined
    ? { showPinyin: globalPinyin }
    : {}),
  }),
  [bookDisplay, globalPinyin],
 );
 const isLessonBookmarked = (learningState.bookmarks.lessons ?? []).includes(lesson.id);
 const lastBookmarkClickRef = useRef(0);
 const handleToggleCurrentLessonBookmark = useCallback(() => {
  const now = Date.now();
  if (now - lastBookmarkClickRef.current < 400) return;
  lastBookmarkClickRef.current = now;
  toggleBookmark("lessons", lesson.id);
 }, [lesson.id, toggleBookmark]);

 const contentSections = useMemo(
  () => businessChineseContentSections(lesson.sections),
  [lesson.sections],
 );

 const dictationSources = useMemo(() => dictationSourcesFromTextbook(lesson), [lesson]);

 const tabs = useMemo<SegmentedControlItem<string>[]>(
  () =>
   [
    { key: "all", label: t("tabs.all") },
    { key: "overview", label: t("tabs.overview") },
    { key: "core", label: t("tabs.core") },
    { key: "text", label: t("tabs.text") },
    { key: "notes", label: t("tabs.notes") },
    { key: "translation", label: t("tabs.translation") },
    { key: "dictation", label: t("tabs.dictation") },
    { key: "vocab", label: t("tabs.vocab") },
    { key: "review", label: t("tabs.review") },
    { key: "grammar", label: t("tabs.grammar") },
    { key: "practice", label: t("tabs.practice") },
   ].filter((tab) =>
    businessChineseTabAvailable(
     tab.key,
     contentSections,
     dictationSources.length,
     lesson.vocab.length,
    ),
   ),
  [contentSections, dictationSources.length, lesson.vocab.length, t],
 );

 const [optimisticTab, setOptimisticTab] = useState<string | null>(null);
 const activeTabParam = optimisticTab ?? searchParams.get("tab");
 const requestedView =
  activeTabParam ??
  (sourceTarget?.documentId === `${lesson.id}:text`
   ? "text"
   : !searchParams.has("lesson") && resume?.lessonId === lesson.id
     ? resume.module
     : "all");
 const activeView = tabs.find((item) => item.key === requestedView)?.key ?? "all";
 const [hasWideToolbar, setHasWideToolbar] = useState(false);
 useEffect(() => {
  const query = window.matchMedia("(min-width: 80rem)");
  const updateToolbar = () => setHasWideToolbar(query.matches);
  updateToolbar();
  query.addEventListener("change", updateToolbar);
  return () => query.removeEventListener("change", updateToolbar);
 }, []);
 const placeToolbarInLayout = activeView === "text" && hasWideToolbar;
 const readerDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, activeView),
  [activeView, lesson],
 );
 const setActiveView = useCallback(
  (value: string) => {
   setOptimisticTab(value);
   const params = new URLSearchParams(searchParams.toString());
   params.set("lesson", String(lesson.number));
   params.set("tab", value);
   if (currentPath.endsWith("/offline")) {
    window.history.pushState(null, "", `?${params.toString()}`);
    return;
   }
   router.push(`${buildTextbookHref(lesson.bookKey, lesson.number).split("?")[0]}?${params}`, {
    scroll: false,
   });
  },
  [currentPath, lesson.bookKey, lesson.number, router, searchParams],
 );
 useEffect(() => {
  if (learning.isLoading) return;
  if (shouldRestoreLesson && resumeLesson) {
   if (currentPath.endsWith("/offline")) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lesson", String(resumeLesson.number));
    params.set("tab", searchParams.get("tab") ?? resume?.module ?? "all");
    window.history.replaceState(null, "", `?${params.toString()}`);
    return;
   }
   router.replace(
    `${buildTextbookHref(lesson.bookKey, resumeLesson.number)}&tab=${encodeURIComponent(searchParams.get("tab") ?? resume?.module ?? "all")}`,
   );
   return;
  }
  if (resume?.lessonId !== lesson.id || resume.module !== activeView) {
   learning.updateSettings({
    bookResume: { [bookKey]: { lessonId: lesson.id, module: activeView } },
   });
  }
 }, [
  learning,
  shouldRestoreLesson,
  resumeLesson,
  resume,
  router,
  lesson,
  activeView,
  bookKey,
  searchParams,
  currentPath,
 ]);

 const toolbarNavMenu = useMemo(
  () => (
   <BusinessChineseWorkspaceNavMenu
    tabs={tabs}
    activeView={activeView}
    onActiveViewChange={setActiveView}
    isLessonBookmarked={isLessonBookmarked}
    onToggleLessonBookmark={handleToggleCurrentLessonBookmark}
    bookmarkLabel={t("bookmarkLesson")}
    bookmarkedLabel={t("bookmarked")}
    offlineReadyLabel={t("offlineReady")}
    offlineDescription={t("offlineDescription")}
    menuLabel={t("tabsLabel")}
    className="xl:hidden"
   />
  ),
  [tabs, activeView, setActiveView, isLessonBookmarked, handleToggleCurrentLessonBookmark, t],
 );

 const workspaceReaderServices = useMemo<ReaderServices>(
  () => ({
   placeToolbarInLayout,
   toolbar: {
    actions: toolbarNavMenu,
    hidePinyinToggle: !placeToolbarInLayout,
    hideTranslationToggle: !placeToolbarInLayout,
   },
   renderReader: ({ content, toolbar }) => (
    <BusinessChineseStudyWorkspaceContent
     books={books}
     lesson={lesson}
     activeView={activeView}
     onActiveViewChange={setActiveView}
     tabs={tabs}
     isLessonBookmarked={isLessonBookmarked}
     onToggleLessonBookmark={handleToggleCurrentLessonBookmark}
     readerContent={content}
     readerToolbar={toolbar}
     hasWideToolbar={hasWideToolbar}
     bookKey={bookKey}
     displayMode={displayMode}
    />
   ),
  }),
  [
   placeToolbarInLayout,
   toolbarNavMenu,
   books,
   lesson,
   activeView,
   setActiveView,
   tabs,
   isLessonBookmarked,
   handleToggleCurrentLessonBookmark,
   hasWideToolbar,
   bookKey,
   displayMode,
  ],
 );

 if (shouldRestoreLesson) return <HanziHomeWorkspaceLoading />;

 return (
  <MandarinTtsProvider>
   <ReaderPronunciationSessionProvider key={lesson.id}>
    <BusinessChineseReader
     key={readerDocument.id}
     document={readerDocument}
     bookKey={bookKey}
     services={workspaceReaderServices}
    />
   </ReaderPronunciationSessionProvider>
  </MandarinTtsProvider>
 );
}

function BusinessChineseStudyWorkspaceContent({
 books,
 lesson,
 activeView,
 onActiveViewChange,
 tabs,
 isLessonBookmarked,
 onToggleLessonBookmark,
 readerContent,
 readerToolbar,
 hasWideToolbar,
 bookKey,
 displayMode,
}: {
 books: TextbookBookSummary[];
 lesson: TextbookLesson;
 activeView: string;
 onActiveViewChange: (value: string) => void;
 tabs: SegmentedControlItem<string>[];
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 readerContent: ReactNode;
 readerToolbar: ReactNode;
 hasWideToolbar: boolean;
 bookKey: string;
 displayMode: LessonDisplayMode;
}) {
 const t = useTranslations("BusinessChinese");
 const common = useTranslations("Common");
 const shellHeader = useTranslations("Shell.header");
 const reviewLesson = useMemo(() => textbookLessonToReviewLesson(lesson), [lesson]);
 const isReviewView = activeView === "review";
 const contextualDrills = useMemo(
  () => (isReviewView ? generateContextualVocabDrills(lesson) : []),
  [isReviewView, lesson],
 );
 const {
  isSupported: isPipSupported,
  isOpen: isPipOpen,
  pipWindow,
  openPip,
  closePip,
 } = useDocumentPip();
 const [isInAppFloatingOpen, setIsInAppFloatingOpen] = useState(false);
 const [pipMode, setPipMode] = useState<UniversalPipMode>("vocab");
 const [reviewMode, setReviewMode] = useState<"flashcard" | "dictation" | "drills">("flashcard");
 const [isInteractivePracticeOpen, setIsInteractivePracticeOpen] = useState(false);
 const [isGrammarNavigationOpen, setIsGrammarNavigationOpen] = useState(false);
 const grammarNavigationTriggerRef = useRef<HTMLButtonElement>(null);
 const grammarNavigationPanelRef = useRef<HTMLElement>(null);
 const [vocabSearchQuery, setVocabSearchQuery] = useState("");
 const filteredVocab = useMemo(() => {
  if (!vocabSearchQuery.trim()) return lesson.vocab;
  const q = vocabSearchQuery.trim().toLowerCase();
  return lesson.vocab.filter(
   (w) =>
    w.hanzi.toLowerCase().includes(q) ||
    w.pinyin.toLowerCase().includes(q) ||
    w.meaning.toLowerCase().includes(q) ||
    w.hanviet.toLowerCase().includes(q),
  );
 }, [lesson.vocab, vocabSearchQuery]);

 const handleTogglePip = useCallback(
  async (targetMode: UniversalPipMode = "vocab") => {
   setPipMode(targetMode);
   if (isPipOpen) {
    if (pipMode === targetMode) {
     closePip();
    }
    return;
   }
   if (isInAppFloatingOpen) {
    if (pipMode === targetMode) {
     setIsInAppFloatingOpen(false);
    }
    return;
   }
   if (isPipSupported) {
    const win = await openPip({ width: 440, height: 380 });
    if (!win) {
     setIsInAppFloatingOpen(true);
    }
   } else {
    setIsInAppFloatingOpen(true);
   }
  },
  [closePip, isInAppFloatingOpen, isPipOpen, isPipSupported, openPip, pipMode],
 );
 const isLessonOfflineReady = useIsLessonCached(lesson.id);
 const textReaderDocument = useMemo(
  () => buildBusinessChineseReaderDocument(lesson, "text"),
  [lesson],
 );
 const [annotationError, setAnnotationError] = useState("");
 const annotationsQuery = useBusinessChineseReaderAnnotations(textReaderDocument.id);
 const readerVocabulary = useMemo(
  () => businessChineseReaderVocabulary(lesson.vocab),
  [lesson.vocab],
 );
 const analysisBySegmentId = useMemo(
  () => businessChinesePronunciationAnalyses(textReaderDocument),
  [textReaderDocument],
 );
 const readerCommands = useReaderCommands();
 const { value: readerDisplay } = useReaderDisplay();
 const { actions: readerActions } = useReaderStore();
 const parentServices = useReaderServices();
 const {
  handleOpenAnnotation,
  handleSelection,
  popover: selectionPopover,
 } = useReaderSelectionActions({
  selectSegment: readerActions.selectSegment,
  stop: readerCommands.stop,
  playFromCharacter: readerCommands.playFromCharacter,
  document: textReaderDocument,
  vocabulary: readerVocabulary,
  stateOwner: "personal",
  analysisBySegmentId,
  setSaveError: setAnnotationError,
 });
 const focusMode = useReaderSelector((state) => state.ui.focusMode);

 const sectionDocuments = useMemo(
  () => businessChineseSectionDocuments(textReaderDocument),
  [textReaderDocument],
 );

 const renderReaderSection = useCallback(
  ({ section: readerSection, content }: { section: { id: string }; content: ReactNode }) => (
   <div id={readerSection.id}>{content}</div>
  ),
  [],
 );

 const annotationServices: ReaderServices = useMemo(
  () => ({
   annotations: {
    items: businessChineseReaderAnnotations(annotationsQuery.data ?? []),
    onOpen: (annotation, rect) => {
     const source = annotationsQuery.data?.find((item) => item.id === annotation.id);
     if (source) handleOpenAnnotation(source, rect);
    },
    onSelection: (target) => {
     const index = textReaderDocument.segments.findIndex(
      (segment) => segment.id === target.segmentId,
     );
     const segment = textReaderDocument.segments[index];
     if (segment) handleSelection({ ...target, segment, index });
    },
   },
  }),
  [annotationsQuery.data, handleOpenAnnotation, handleSelection, textReaderDocument],
 );

 const annotationsContextValue = useMemo<BusinessChineseAnnotationsContextValue>(
  () => ({
   readerAnnotations: annotationsQuery.data ?? [],
   onOpenReaderAnnotation: handleOpenAnnotation,
  }),
  [annotationsQuery.data, handleOpenAnnotation],
 );
 const readerServicesValue = useMemo<ReaderServices>(
  () => ({ ...parentServices, ...annotationServices }),
  [parentServices, annotationServices],
 );

 const pairedTranslations = useMemo(
  () => pairedTextbookTranslations(lesson.sections),
  [lesson.sections],
 );
 const sourceSections = useMemo(
  () => businessChineseSourceSections(lesson.sections),
  [lesson.sections],
 );
 const contentSections = useMemo(
  () => businessChineseContentSections(sourceSections),
  [sourceSections],
 );
 const canonicalVocabularyTableIds = useMemo(
  () => businessChineseVocabularyTableIds(contentSections, lesson.vocab),
  [contentSections, lesson.vocab],
 );
 const visibleSections = useMemo(
  () => businessChineseVisibleSections(contentSections, activeView),
  [activeView, contentSections],
 );
 const showGrammarNavigation = activeView === "grammar" && visibleSections.length > 0;
 const showCompactGrammarToolbar = showGrammarNavigation && !hasWideToolbar;
 const showWideGrammarNavigation = showGrammarNavigation && hasWideToolbar;
 const showDesktopSectionNavigation =
  !showGrammarNavigation && !focusMode && visibleSections.length > 1;
 const effectiveDisplayMode: LessonDisplayMode = useMemo(
  () => ({
   ...displayMode,
   showPinyin: readerDisplay?.showPinyin ?? displayMode.showPinyin,
   showMeaning: readerDisplay?.showMeaning ?? displayMode.showMeaning,
  }),
  [displayMode, readerDisplay?.showMeaning, readerDisplay?.showPinyin],
 );
 const translationSegments = useMemo(() => translationSegmentsFromTextbook(lesson), [lesson]);
 const dictationSources = useMemo(() => dictationSourcesFromTextbook(lesson), [lesson]);
 const intro = lesson.intro.join(" ");
 const needsPracticeItems =
  activeView === "practice" || isReviewView || isPipOpen || isInAppFloatingOpen;
 const universalTextbookPracticeItems = useMemo(
  () => (needsPracticeItems ? adaptAllLessonExercises(lesson) : []),
  [lesson, needsPracticeItems],
 );
 const textbookGrammarPoints = useMemo(
  () => adaptTextbookGrammarToPip(lesson.sections),
  [lesson.sections],
 );
 const lessonTitle = splitTrailingTranslation(lessonDisplayTitle(lesson.title));
 const book = books.find((item) => item.key === lesson.bookKey);
 const sequentialLessons = book?.lessons.every((item, index) => item.number === index + 1);
 const selectSection = useCallback((sectionId: string) => {
  scrollAppContentToElement(document.getElementById(sectionId), {
   behavior: "smooth",
   block: "start",
   allowViewport: true,
  });
 }, []);

 const toolbarNavMenu = useMemo(
  () => (
   <BusinessChineseWorkspaceNavMenu
    tabs={tabs}
    activeView={activeView}
    onActiveViewChange={onActiveViewChange}
    isLessonBookmarked={isLessonBookmarked}
    onToggleLessonBookmark={onToggleLessonBookmark}
    bookmarkLabel={t("bookmarkLesson")}
    bookmarkedLabel={t("bookmarked")}
    offlineReadyLabel={t("offlineReady")}
    offlineDescription={t("offlineDescription")}
    menuLabel={t("tabsLabel")}
    className={!focusMode ? "xl:hidden" : undefined}
   />
  ),
  [tabs, activeView, onActiveViewChange, isLessonBookmarked, onToggleLessonBookmark, t, focusMode],
 );

 const firstSectionServices = useMemo<ReaderServices>(
  () => ({
   ...annotationServices,
   toolbar: {
    hidePinyinToggle: true,
    hideTranslationToggle: true,
    leadingActions:
     visibleSections.length > 1 ? (
      <CompactSectionNavigation
       sections={visibleSections}
       onSelect={selectSection}
       className={!focusMode ? "2xl:hidden" : undefined}
      />
     ) : undefined,
    actions: toolbarNavMenu,
   },
   renderSection: renderReaderSection,
  }),
  [
   annotationServices,
   visibleSections,
   selectSection,
   focusMode,
   toolbarNavMenu,
   renderReaderSection,
  ],
 );

 const otherSectionServices = useMemo<ReaderServices>(
  () => ({
   ...annotationServices,
   renderSection: renderReaderSection,
  }),
  [annotationServices, renderReaderSection],
 );

 const grammarNavigationSummary = (
  <>
   <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
    <Badge variant="default" size="sm">
     {`${visibleSections.length} điểm ngữ pháp`}
    </Badge>
    {textbookGrammarPoints.length > 0 ? (
     <Button
      type="button"
      size="compact"
      variant={(isPipOpen || isInAppFloatingOpen) && pipMode === "grammar" ? "active" : "outline"}
      onClick={() => {
       setIsGrammarNavigationOpen(false);
       void handleTogglePip("grammar");
      }}
      title="Mở cửa sổ nổi PiP để ôn tập ngữ pháp"
     >
      <PictureInPicture2 className="size-3.5" />
      <span>
       {(isPipOpen || isInAppFloatingOpen) && pipMode === "grammar"
        ? "Đang mở PiP"
        : "Cửa sổ nổi (PiP)"}
      </span>
     </Button>
    ) : null}
   </div>
   <Typography variant="bodySmall" tone="secondary">
    Cấu trúc ngữ pháp và câu ví dụ kèm phiên âm
   </Typography>
  </>
 );

 const desktopTabActions = (
  <>
   {readerToolbar}
   {showCompactGrammarToolbar ? (
    <Button
     ref={grammarNavigationTriggerRef}
     type="button"
     variant="outline"
     size="toolbar"
     aria-label={t("tocLabel")}
     aria-haspopup="dialog"
     aria-expanded={isGrammarNavigationOpen}
     title={t("tocLabel")}
     onClick={() => setIsGrammarNavigationOpen(true)}
    >
     <BookOpen data-icon="inline-start" />
     <span>{t("tocLabel")}</span>
    </Button>
   ) : null}
   <OfflineAudioSettingsDialog
    lesson={lesson}
    trigger={
     showCompactGrammarToolbar ? (
      <Button
       type="button"
       variant="outline"
       size="icon-toolbar"
       aria-label={shellHeader("voiceSettings")}
       title={shellHeader("voiceSettings")}
      >
       <DownloadCloud />
      </Button>
     ) : undefined
    }
   />
   <div className="flex shrink-0 items-center gap-1.5">
    <Button
     variant="ghost"
     size="sm"
     className="gap-1.5 shrink-0"
     onClick={onToggleLessonBookmark}
     title={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
     aria-label={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
    >
     <Bookmark
      className={cn(
       "size-3.5",
       isLessonBookmarked ? "fill-warning text-warning" : "text-muted-foreground",
      )}
     />
     <span
      className={cn("hidden sm:inline", isLessonBookmarked && "font-semibold text-warning-text")}
     >
      {isLessonBookmarked ? t("bookmarked") : t("bookmarkLesson")}
     </span>
    </Button>
    {isLessonOfflineReady ? (
     <Badge
      variant="success"
      size="sm"
      casing="natural"
      className="cursor-default gap-1 shrink-0 hidden md:inline-flex"
      title={t("offlineDescription")}
     >
      <CloudCheck data-icon="inline-start" />
      <span>{t("offlineReady")}</span>
     </Badge>
    ) : null}
   </div>
   {showCompactGrammarToolbar ? toolbarNavMenu : null}
  </>
 );

 return (
  <BusinessChineseAnnotationsContext.Provider value={annotationsContextValue}>
   <ReaderServicesContext.Provider value={readerServicesValue}>
    <BusinessChineseHeaderContextBridge books={books} lesson={lesson} />
    <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
     <div className="hanzihome-workspace-shell flex w-full max-w-full flex-col gap-2.5">
      <Typography as="h1" variant="pageTitle" className="sr-only">
       {lesson.bookLabel} ·{" "}
       {sequentialLessons ? (
        <>
         {t("lessonPosition", { lesson: lesson.number, count: book?.lessons.length ?? 0 })}
         {" · "}
        </>
       ) : null}
       {lesson.title}
      </Typography>
      {activeView !== "text" && activeView !== "all" && !showGrammarNavigation ? (
       <div className="shrink-0 xl:hidden">
        <WorkspaceToolbar>
         <div className="flex min-w-0 flex-1 items-center gap-2">
          <Typography variant="bodySmall" weight="bold" clamp="one">
           {tabs.find((tab) => tab.key === activeView)?.label ?? t("tabsLabel")}
          </Typography>
         </div>
         <div className="flex shrink-0 items-center gap-1.5">
          <Button
           variant={isLessonBookmarked ? "warning" : "ghost"}
           size="icon-toolbar"
           onClick={onToggleLessonBookmark}
           title={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
           aria-label={isLessonBookmarked ? t("unbookmarkLesson") : t("bookmarkLesson")}
          >
           <Bookmark
            className={cn(
             "size-4",
             isLessonBookmarked ? "fill-current text-warning" : "text-muted-foreground",
            )}
           />
          </Button>
          {toolbarNavMenu}
         </div>
        </WorkspaceToolbar>
       </div>
      ) : null}
      <Tabs
       value={activeView}
       items={showCompactGrammarToolbar ? tabs.filter((tab) => tab.key === activeView) : tabs}
       onValueChange={onActiveViewChange}
       actions={desktopTabActions}
       aria-label={t("tabsLabel")}
       className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden"
       listClassName="hanzihome-liquid-toolbar flex"
      >
       <TabsContent
        value={activeView}
        className={cn(
         "min-h-0 overflow-hidden",
         showWideGrammarNavigation &&
          "grid grid-cols-[15rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-3",
        )}
       >
        {showWideGrammarNavigation ? (
         <Card
          asChild
          variant="section"
          padding="sm"
          className="max-h-full min-w-0 self-start overflow-y-auto scrollbar-soft"
         >
          <aside ref={grammarNavigationPanelRef} tabIndex={-1} aria-label={t("tocLabel")}>
           <div className="grid min-w-0 gap-2">
            <Typography variant="overline" tone="muted">
             {t("tocLabel")}
            </Typography>
            {grammarNavigationSummary}
            <GrammarSectionNavigation sections={visibleSections} onSelect={selectSection} />
           </div>
          </aside>
         </Card>
        ) : null}
        <div className="relative h-full min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1 scrollbar-soft">
         <div className="grid min-w-0 gap-3 pb-4">
          {annotationError || annotationsQuery.error ? (
           <Typography variant="bodySmall" tone="danger" role="alert">
            {annotationError || annotationsQuery.error?.message}
           </Typography>
          ) : null}
          {activeView === "overview" ? (
           <Card variant="section" padding="md">
            <div className="grid min-w-0 gap-2">
             <BusinessChineseText
              pronunciationId={`${lesson.id}:title`}
              text={lessonTitle.source}
              displayMode={displayMode}
              variant="pageTitle"
              weight="black"
             />
             {lessonTitle.translation && displayMode.showMeaning ? (
              <TranslationText variant="sectionTitle" tone="secondary" weight="black">
               {lessonTitle.translation}
              </TranslationText>
             ) : null}
             {intro ? (
              <Typography variant="bodySmall" tone="secondary">
               {intro}
              </Typography>
             ) : null}
             <Typography variant="caption" tone="muted">
              {t("lessonMeta", {
               sections: contentSections.length,
               vocab: lesson.vocab.length,
              })}
             </Typography>
            </div>
           </Card>
          ) : null}

          {activeView === "text" ? (
           <div data-textbook-document className="min-w-0">
            {readerContent}
           </div>
          ) : null}

          {activeView === "notes" ? <TextbookNoteAccessCard lesson={lesson} /> : null}

          {activeView === "translation" ? (
           <LessonTranslationWorkspace segments={translationSegments} displayMode={displayMode} />
          ) : null}

          {activeView === "dictation" ? (
           <LessonDictationWorkspace
            lesson={lesson}
            sources={dictationSources}
            titleVi={lesson.title}
            titleZh={lesson.bookLabel}
            onOpenPip={() => handleTogglePip("dictation")}
            isPipActive={(isPipOpen || isInAppFloatingOpen) && pipMode === "dictation"}
           />
          ) : null}

          {activeView === "review" ? (
           <div data-textbook-document className="mx-auto grid w-full max-w-4xl min-w-0 gap-4">
            <Card
             variant="subtle"
             padding="sm"
             className="flex min-w-0 flex-wrap items-center justify-between gap-3"
            >
             <div className="flex min-w-0 items-center gap-2">
              <Typography variant="overline" tone="muted" weight="black" tracking="wide">
               {t("vocabReview.eyebrow")}
              </Typography>
              <Badge variant="accent" size="sm" casing="natural">
               {t("vocabReview.title", { count: lesson.vocab.length })}
              </Badge>
             </div>

             <div className="flex shrink-0 items-center gap-1.5">
              <Button
               type="button"
               size="compact"
               variant={reviewMode === "flashcard" ? "active" : "ghost"}
               onClick={() => setReviewMode("flashcard")}
              >
               {t("vocabReview.modeFlashcard")}
              </Button>
              <Button
               type="button"
               size="compact"
               variant={reviewMode === "dictation" ? "active" : "ghost"}
               onClick={() => setReviewMode("dictation")}
              >
               Chép từ
              </Button>
              {contextualDrills.length > 0 ? (
               <Button
                type="button"
                size="compact"
                variant={reviewMode === "drills" ? "active" : "ghost"}
                onClick={() => setReviewMode("drills")}
               >
                {t("vocabReview.modeDrills")}
               </Button>
              ) : null}

              <Button
               type="button"
               variant={isPipOpen || isInAppFloatingOpen ? "active" : "outline"}
               size="compact"
               onClick={() =>
                handleTogglePip(
                 reviewMode === "dictation"
                  ? "dictation"
                  : reviewMode === "drills"
                    ? "practice"
                    : "vocab",
                )
               }
               title={t("vocabReview.pipTooltip")}
              >
               <PictureInPicture2 className="size-3.5" />
               <span>
                {isPipOpen || isInAppFloatingOpen
                 ? t("vocabReview.pipActive")
                 : t("vocabReview.pipButton")}
               </span>
              </Button>
             </div>
            </Card>

            {reviewMode === "drills" && contextualDrills.length > 0 ? (
             <BusinessChineseContextualDrills drills={contextualDrills} />
            ) : (
             <>
              <div hidden={isPipOpen || isInAppFloatingOpen}>
               {/* Kept mounted to preserve progress, but muted while the same deck
                   runs in the PiP/floating window so the two never read at once. */}
               <FastSpeechSuspendedContext.Provider value={isPipOpen || isInAppFloatingOpen}>
                <UniversalAmbientPip
                 key={reviewMode}
                 initialMode={reviewMode === "dictation" ? "dictation" : "vocab"}
                 lessonTitle={lesson.title}
                 vocabItems={reviewLesson.vocab}
                 grammarItems={textbookGrammarPoints}
                 practiceItems={universalTextbookPracticeItems}
                 isInline
                />
               </FastSpeechSuspendedContext.Provider>
              </div>
              {isPipOpen || isInAppFloatingOpen ? (
               <Card
                variant="subtle"
                padding="lg"
                className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center"
               >
                <IconTile size="lg" tone="accent" className="mx-auto">
                 <PictureInPicture2 />
                </IconTile>
                <div className="grid gap-1">
                 <Typography variant="sectionTitle" weight="black">
                  {t("vocabReview.pipActiveTitle")}
                 </Typography>
                 <Typography variant="bodySmall" tone="muted" className="max-w-md">
                  {t("vocabReview.pipActiveDescription")}
                 </Typography>
                </div>
                <Button
                 type="button"
                 variant="outline"
                 size="compact"
                 onClick={() => {
                  if (isPipOpen) closePip();
                  if (isInAppFloatingOpen) setIsInAppFloatingOpen(false);
                 }}
                >
                 {t("vocabReview.pipReturn")}
                </Button>
               </Card>
              ) : null}
             </>
            )}
           </div>
          ) : null}

          {activeView === "vocab" ? (
           <div data-textbook-document className="grid min-w-0 gap-3">
            {lesson.vocab.length > 0 ? (
             <Card
              variant="subtle"
              padding="sm"
              className="flex min-w-0 flex-wrap items-center justify-between gap-2"
             >
              <div className="flex min-w-0 items-center gap-2">
               <Typography
                variant="caption"
                tone="muted"
                weight="bold"
                tracking="wide"
                transform="uppercase"
                className="hidden sm:inline"
               >
                {t("vocabularyPreview.eyebrow")}
               </Typography>
               <Badge variant="default" casing="natural">
                {lesson.vocab.length} từ
               </Badge>
               <div className="relative min-w-[140px] sm:min-w-[180px]">
                <Input
                 type="search"
                 density="compact"
                 adornment="start"
                 value={vocabSearchQuery}
                 onChange={(e) => setVocabSearchQuery(e.target.value)}
                 placeholder="Tìm từ vựng..."
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
               </div>
               {vocabSearchQuery ? (
                <Typography variant="caption" tone="secondary">
                 ({filteredVocab.length} kết quả)
                </Typography>
               ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
               <Button
                type="button"
                size="compact"
                variant="default"
                onClick={() => onActiveViewChange("review")}
               >
                {t("vocabReview.startReview")}
               </Button>
               <Button
                type="button"
                size="compact"
                variant={
                 (isPipOpen || isInAppFloatingOpen) && pipMode === "dictation"
                  ? "active"
                  : "outline"
                }
                onClick={() => handleTogglePip("dictation")}
                title="Mở cửa sổ nổi nghe chép từ vựng (hỗ trợ nghe tiếng Trung hoặc nghe tiếng Việt)"
               >
                <Volume2 className="size-3.5" />
                <span>Chép từ vựng</span>
               </Button>
               <Button
                type="button"
                size="compact"
                variant={
                 (isPipOpen || isInAppFloatingOpen) && pipMode === "vocab" ? "active" : "outline"
                }
                onClick={() => handleTogglePip("vocab")}
                title={t("vocabReview.pipTooltip")}
               >
                <PictureInPicture2 className="size-3.5" />
                <span>{t("vocabReview.pipButton")}</span>
               </Button>
              </div>
             </Card>
            ) : null}

            {filteredVocab.length === 0 && vocabSearchQuery ? (
             <Card variant="subtle" padding="lg" className="text-center">
              <Typography variant="bodySmall" tone="muted">
               Không tìm thấy từ vựng nào khớp với &ldquo;{vocabSearchQuery}&rdquo;
              </Typography>
             </Card>
            ) : null}

            {filteredVocab.length > 0 && canonicalVocabularyTableIds.length === 0 ? (
             <div className="grid gap-2 sm:grid-cols-2">
              {filteredVocab.map((word) => (
               <VocabPreviewRow
                key={word.id}
                hanzi={word.hanzi}
                pinyin={word.pinyin}
                hanviet={effectiveDisplayMode.showMeaning ? word.hanviet : ""}
                category={word.pos}
                meaning={effectiveDisplayMode.showMeaning ? word.meaning : ""}
                rawMeaning={word.meaning}
                rawHanviet={word.hanviet}
                header={
                 <SpeakableBusinessChineseText
                  pronunciationId={word.id}
                  text={word.hanzi}
                  sourcePinyin={word.pinyin}
                  displayMode={effectiveDisplayMode}
                  variant="body"
                 />
                }
               />
              ))}
             </div>
            ) : null}

            {visibleSections.map((section) => (
             <BusinessChineseSection
              key={section.id}
              section={section}
              displayMode={effectiveDisplayMode}
              translations={pairedTranslations}
              canonicalVocabularyTableIds={canonicalVocabularyTableIds}
              vocabularyPreview={
               section.blocks.some((block) => block.id === canonicalVocabularyTableIds[0]) ? (
                <TextbookVocabularyPreview
                 vocabulary={filteredVocab}
                 displayMode={effectiveDisplayMode}
                />
               ) : undefined
              }
             />
            ))}
           </div>
          ) : null}

          {activeView !== "text" &&
          activeView !== "notes" &&
          activeView !== "translation" &&
          activeView !== "dictation" &&
          activeView !== "review" &&
          activeView !== "vocab" ? (
           <div
            className={cn(
             "grid min-w-0 gap-3",
             showDesktopSectionNavigation && "2xl:grid-cols-[15rem_minmax(0,1fr)]",
            )}
           >
            {showDesktopSectionNavigation ? (
             <DesktopSectionNavigation sections={visibleSections} onSelect={selectSection} />
            ) : null}
            <div className="grid min-w-0 gap-3">
             <Card
              variant="section"
              padding="lg"
              data-textbook-document
              className="grid min-w-0 gap-6"
             >
              {lesson.vocab.length > 0 &&
              canonicalVocabularyTableIds.length === 0 &&
              activeView === "all" ? (
               <TextbookVocabularyPreview
                vocabulary={lesson.vocab}
                displayMode={displayMode}
                onOpenVocabulary={() => onActiveViewChange("vocab")}
               />
              ) : null}
              {activeView === "practice" &&
              (translationSegments.length > 0 ||
               dictationSources.length > 0 ||
               universalTextbookPracticeItems.length > 0) ? (
               <Card
                variant="subtle"
                padding="sm"
                className="flex min-w-0 flex-wrap items-center gap-2"
               >
                {universalTextbookPracticeItems.length > 0 ? (
                 <Button
                  type="button"
                  size="compact"
                  variant={isInteractivePracticeOpen ? "outline" : "default"}
                  onClick={() => setIsInteractivePracticeOpen((prev) => !prev)}
                 >
                  <Sparkles className="size-3.5" />
                  <span>
                   {isInteractivePracticeOpen
                    ? "Đóng chế độ từng câu"
                    : `Luyện tập từng câu (${universalTextbookPracticeItems.length} câu)`}
                  </span>
                 </Button>
                ) : null}
                {universalTextbookPracticeItems.length > 0 ? (
                 <Button
                  type="button"
                  size="compact"
                  variant={
                   (isPipOpen || isInAppFloatingOpen) && pipMode === "practice"
                    ? "active"
                    : "outline"
                  }
                  onClick={() => handleTogglePip("practice")}
                  title="Mở cửa sổ nổi PiP để luyện tập bài tập"
                 >
                  <PictureInPicture2 className="size-3.5" />
                  <span>
                   {(isPipOpen || isInAppFloatingOpen) && pipMode === "practice"
                    ? "Đang mở PiP"
                    : "Cửa sổ nổi (PiP)"}
                  </span>
                 </Button>
                ) : null}
                {translationSegments.length > 0 ? (
                 <Button
                  type="button"
                  size="compact"
                  variant="outline"
                  title={t("practice.translation.description")}
                  onClick={() => onActiveViewChange("translation")}
                 >
                  {t("practice.translation.open", { count: translationSegments.length })}
                 </Button>
                ) : null}
                {dictationSources.length > 0 ? (
                 <Button
                  type="button"
                  size="compact"
                  variant="outline"
                  title={t("practice.dictation.description")}
                  onClick={() => onActiveViewChange("dictation")}
                 >
                  {t("practice.dictation.open", {
                   count: businessChineseDictationCount(dictationSources),
                  })}
                 </Button>
                ) : null}
               </Card>
              ) : null}
              {activeView === "practice" &&
              isInteractivePracticeOpen &&
              universalTextbookPracticeItems.length > 0 ? (
               <UniversalExerciseRunner
                items={universalTextbookPracticeItems}
                title={`Luyện tập bài học: ${lesson.title}`}
                onClose={() => setIsInteractivePracticeOpen(false)}
               />
              ) : null}
              {visibleSections.map((section, index) => {
               // Grammar jumps need the measured height of the preceding sections.
               const content = (
                <BusinessChineseSection
                 section={section}
                 displayMode={displayMode}
                 translations={pairedTranslations}
                 canonicalVocabularyTableIds={canonicalVocabularyTableIds}
                 deferLayout={!showGrammarNavigation}
                 vocabularyPreview={
                  section.blocks.some((block) => block.id === canonicalVocabularyTableIds[0]) ? (
                   <TextbookVocabularyPreview
                    vocabulary={lesson.vocab}
                    displayMode={displayMode}
                    onOpenVocabulary={
                     activeView === "all" ? () => onActiveViewChange("vocab") : undefined
                    }
                   />
                  ) : undefined
                 }
                />
               );
               return (
                <Fragment key={section.id}>
                 {section.category === "text" ? (
                  <div className="content-auto">
                   <BusinessChineseReader
                    bookKey={bookKey}
                    document={sectionDocuments.get(section.id) ?? textReaderDocument}
                    services={index === 0 ? firstSectionServices : otherSectionServices}
                   />
                  </div>
                 ) : (
                  content
                 )}
                 {index < visibleSections.length - 1 ? <Separator /> : null}
                </Fragment>
               );
              })}
             </Card>
            </div>
           </div>
          ) : null}
         </div>
        </div>
       </TabsContent>
      </Tabs>
      {showCompactGrammarToolbar ? (
       <Sheet
        open={isGrammarNavigationOpen}
        onOpenChange={setIsGrammarNavigationOpen}
        side="bottom"
        onCloseAutoFocus={(event) => {
         event.preventDefault();
         setIsGrammarNavigationOpen(false);
         const focusTarget =
          grammarNavigationTriggerRef.current ?? grammarNavigationPanelRef.current;
         focusTarget?.focus({ preventScroll: true });
        }}
       >
        <SheetHeader
         title={t("tocLabel")}
         onClose={() => setIsGrammarNavigationOpen(false)}
         closeLabel={common("actions.close")}
        />
        <SheetBody className="grid content-start gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
         {grammarNavigationSummary}
         <GrammarSectionNavigation
          sections={visibleSections}
          onSelect={(sectionId) => {
           setIsGrammarNavigationOpen(false);
           selectSection(sectionId);
          }}
         />
        </SheetBody>
       </Sheet>
      ) : null}
      {selectionPopover}
      {isPipOpen && pipWindow
       ? createPortal(
          <UniversalAmbientPip
           key={pipMode}
           initialMode={pipMode}
           lessonTitle={lesson.title}
           vocabItems={reviewLesson.vocab}
           grammarItems={textbookGrammarPoints}
           practiceItems={universalTextbookPracticeItems}
           onClose={closePip}
          />,
          pipWindow.document.body,
         )
       : null}
      {isInAppFloatingOpen ? (
       <UniversalAmbientPip
        key={pipMode}
        initialMode={pipMode}
        lessonTitle={lesson.title}
        vocabItems={reviewLesson.vocab}
        grammarItems={textbookGrammarPoints}
        practiceItems={universalTextbookPracticeItems}
        onClose={() => setIsInAppFloatingOpen(false)}
        isFloatingInApp
       />
      ) : null}
     </div>
    </div>
   </ReaderServicesContext.Provider>
  </BusinessChineseAnnotationsContext.Provider>
 );
}
