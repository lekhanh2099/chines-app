"use client";

import {
 BookOpenText,
 Check,
 Info,
 Keyboard,
 Languages,
 List,
 NotebookPen,
 Type,
 type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { PinyinText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { savePracticeAttempt } from "@/features/hanzihome/practice/practice-attempt-api";
import {
 formatContextualReadingPinyin,
 getContextualReadingUnits,
} from "@/lib/pronunciation/contextual-pronunciation";
import {
 createTranslationAttempt,
 scoreTranslationAttempt,
 translationReferenceText,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";

import { Reader } from "@/features/reader/components/Reader";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import {
 ReaderServicesContext,
 useReaderCommands,
 useReaderSelector,
 useReaderServices,
 useReaderStore,
} from "@/features/reader/runtime/reader-context";
import { useMandarinReaderSpeechService } from "@/features/speech/MandarinTtsProvider";
import { useReadingSourceTarget } from "@/features/reading/hooks/useReadingSourceTarget";
import {
 ReaderAnalysis,
 ReaderDictation,
 ReaderNotes,
 ReaderOverview,
 ReaderSummary,
} from "@/features/reading/components/ReaderStudyModules";
import { ReaderExercisePanel } from "@/features/reading/components/ReaderExercisePanel";
import { ReaderHeaderContextBridge } from "@/features/reading/components/ReaderHeaderContextBridge";
import { ReaderTranslationPracticePanel } from "@/features/reading/components/ReaderTranslationPracticePanel";
import { ReaderVocabularyPanel } from "@/features/reading/components/ReaderVocabularyPanel";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import { useReaderPronunciationReview } from "@/features/reading/hooks/useReaderPronunciationReview";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import {
 useReaderStudyState,
 type ReaderProgressOwner,
} from "@/features/reading/hooks/useReaderStudyState";
import { ShadowingPracticePanel } from "@/features/reading/components/ShadowingPracticePanel";

type ReaderWorkspaceTab =
 | "reader"
 | "overview"
 | "exercises"
 | "vocabulary"
 | "translation"
 | "dictation"
 | "analysis"
 | "summary"
 | "notes";

function metadataString(resource: ReaderDocumentResource, key: string) {
 const value = resource.document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

export function ReaderDocumentStudy({
 resource,
 stateOwner = "reader",
 backHref = "/reader",
 backLabel,
 navigationDocuments = [],
 stickyParentTabs = false,
}: {
 resource: ReaderDocumentResource;
 stateOwner?: ReaderProgressOwner;
 backHref?: string;
 backLabel?: string;
 navigationDocuments?: ReadonlyArray<ReaderDocumentRow>;
 stickyParentTabs?: boolean;
}) {
 const study = useReaderStudyState(resource, stateOwner);
 const speech = useMandarinReaderSpeechService();
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const data = useMemo(
  () =>
   displayMode.autoDetectPinyin
    ? {
       ...study.documentModel,
       segments: study.documentModel.segments.map((segment) => {
        const analysis = study.analysisBySegmentId.get(segment.id);
        return analysis ? { ...segment, pinyin: formatContextualReadingPinyin(analysis) } : segment;
       }),
      }
    : study.documentModel,
  [displayMode.autoDetectPinyin, study.analysisBySegmentId, study.documentModel],
 );
 return (
  <Reader
   data={data}
   display={{
    value: {
     showPinyin: displayMode.showPinyin,
     showMeaning: displayMode.showMeaning,
     hanziFont: displayMode.hanziFont,
     hanziSize: displayMode.hanziSize,
     revealMode: displayMode.revealMode,
    },
    onChange: (value) =>
     learning.updateSettings({
      lessonTextDisplayMode: { ...displayMode, ...value },
     }),
   }}
   services={{
    speech,
    renderReader: ({ content }) => (
     <ReaderDocumentStudyContent
      resource={resource}
      stateOwner={stateOwner}
      backHref={backHref}
      backLabel={backLabel}
      navigationDocuments={navigationDocuments}
      stickyParentTabs={stickyParentTabs}
      study={study}
      readerContent={content}
     />
    ),
   }}
  />
 );
}

function ReaderDocumentStudyContent({
 resource,
 stateOwner,
 backHref,
 backLabel,
 navigationDocuments,
 stickyParentTabs,
 study,
 readerContent,
}: {
 resource: ReaderDocumentResource;
 stateOwner: ReaderProgressOwner;
 backHref: string;
 backLabel: string | undefined;
 navigationDocuments: ReadonlyArray<ReaderDocumentRow>;
 stickyParentTabs: boolean;
 study: ReturnType<typeof useReaderStudyState>;
 readerContent: ReactNode;
}) {
 const t = useTranslations("Reader.study");
 const readerWorkspaceTabs = useMemo<
  ReadonlyArray<{ id: ReaderWorkspaceTab; label: string; icon: LucideIcon }>
 >(
  () => [
   { id: "overview", label: t("chrome.tabs.overview"), icon: Info },
   { id: "reader", label: t("chrome.tabs.reader"), icon: BookOpenText },
   { id: "exercises", label: t("chrome.tabs.exercises"), icon: Check },
   { id: "vocabulary", label: t("chrome.tabs.vocabulary"), icon: Type },
   { id: "translation", label: t("chrome.tabs.translation"), icon: Languages },
   { id: "dictation", label: t("chrome.tabs.dictation"), icon: Keyboard },
   { id: "analysis", label: t("chrome.tabs.analysis"), icon: List },
   { id: "summary", label: t("chrome.tabs.summary"), icon: List },
   { id: "notes", label: t("chrome.tabs.notes"), icon: NotebookPen },
  ],
  [t],
 );
 const commands = useReaderCommands();
 const { actions } = useReaderStore();
 const services = useReaderServices();
 const activeIndex = useReaderSelector((state) => state.navigation.activeIndex);
 const focusMode = useReaderSelector((state) => state.ui.focusMode);
 const [workspaceTab, setWorkspaceTab] = useState<ReaderWorkspaceTab>("reader");
 const [shadowingOpen, setShadowingOpen] = useState(false);
 const [translationDirection, setTranslationDirection] = useState<TranslationDirection>("zh-vi");
 const [translationDrafts, setTranslationDrafts] = useState<Record<string, string>>({});
 const [translationChecked, setTranslationChecked] = useState<Record<string, boolean>>({});
 const [translationStartedAt, setTranslationStartedAt] = useState<Record<string, number>>({});
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const paragraphById = useMemo(
  () => new Map(resource.paragraphs.map((paragraph) => [paragraph.id, paragraph])),
  [resource.paragraphs],
 );
 const activeSegment = study.documentModel.segments[activeIndex];
 const activeParagraph = activeSegment ? paragraphById.get(activeSegment.id) : undefined;
 const activeAnnotations = activeSegment
  ? study.annotations.filter((annotation) => annotation.paragraph_id === activeSegment.id)
  : [];
 const selection = useReaderSelectionActions({
  selectSegment: actions.selectSegment,
  stop: commands.stop,
  playFromCharacter: commands.playFromCharacter,
  document: study.documentModel,
  vocabulary: resource.vocabulary,
  stateOwner,
  analysisBySegmentId: study.analysisBySegmentId,
  setSaveError: study.setSaveError,
 });
 const pronunciation = useReaderPronunciationReview({
  resource,
  stateOwner,
  pronunciationOverrides: study.pronunciationOverrides,
  setSaveError: study.setSaveError,
 });
 const translationSegments = useMemo(
  () =>
   resource.paragraphs
    .filter((paragraph) => paragraph.zh.trim().length > 0 && paragraph.vi.trim().length > 0)
    .map((paragraph, index) => ({
     id: paragraph.id,
     order: index + 1,
     sourceLabel: "Bài đọc",
     zh: paragraph.zh,
     pinyin: paragraph.pinyin,
     vi: paragraph.vi,
    })),
  [resource.paragraphs],
 );
 const translationActiveIndex = Math.max(
  0,
  translationSegments.findIndex((segment) => segment.id === activeSegment?.id),
 );
 const translationSegment = translationSegments[translationActiveIndex] ?? translationSegments[0];
 const translationKey = translationSegment
  ? `${translationSegment.id}:${translationDirection}`
  : "";
 const translationDraft = translationKey ? (translationDrafts[translationKey] ?? "") : "";
 const translationIsChecked = translationKey ? translationChecked[translationKey] === true : false;
 const translationScore =
  translationSegment && translationIsChecked
   ? scoreTranslationAttempt(translationSegment, translationDirection, translationDraft)
   : null;
 const workspaceTabsEnabled = stateOwner !== "daily";
 const availableTabs = useMemo(
  () =>
   workspaceTabsEnabled
    ? readerWorkspaceTabs.filter((tab) => {
       if (tab.id === "exercises") return resource.exerciseItems.length > 0;
       if (tab.id === "vocabulary") return resource.vocabulary.length > 0;
       if (tab.id === "translation") return translationSegments.length > 0;
       if (tab.id === "analysis") return study.documentModel.capabilities.includes("analysis");
       if (tab.id === "summary") return study.documentModel.capabilities.includes("summary");
       return true;
      })
    : [],
  [
   readerWorkspaceTabs,
   resource.exerciseItems.length,
   resource.vocabulary.length,
   study.documentModel.capabilities,
   translationSegments.length,
   workspaceTabsEnabled,
  ],
 );
 const activeWorkspaceTab = availableTabs.some((tab) => tab.id === workspaceTab)
  ? workspaceTab
  : "reader";
 const readerUnitNumber = resource.document.unit_id?.replace(/^U/u, "") ?? "";
 const readerLessonLabel =
  metadataString(resource, "reading_label_vi") ??
  (resource.document.reading_number === null
   ? t("chrome.defaultReading")
   : `Bài ${resource.document.reading_number}`);
 const toolbarStickyOffset = workspaceTabsEnabled || stickyParentTabs ? "tabs" : "page";
 useReadingSourceTarget(focusMode || activeWorkspaceTab === "reader");

 const checkTranslation = () => {
  if (!translationSegment || !translationKey || !translationDraft.trim()) return;
  const startedAt = translationStartedAt[translationKey];
  const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
  const attempt = createTranslationAttempt(
   translationSegment,
   translationDirection,
   translationDraft,
   responseMs,
  );
  setTranslationStartedAt((current) => {
   const next = { ...current };
   delete next[translationKey];
   return next;
  });
  setTranslationChecked((current) => ({ ...current, [translationKey]: true }));
  void savePracticeAttempt({
   surface: "translation",
   contentId: translationSegment.id,
   direction: translationDirection,
   answer: {
    answer: attempt.answer,
    reference: translationReferenceText(translationSegment, translationDirection),
   },
   scorePercent: attempt.score,
   responseMs: attempt.responseMs,
  }).catch((error: Error) => study.setSaveError(error.message));
 };
 const updateTranslationDraft = (value: string) => {
  if (!translationKey) return;
  if (value.trim() && translationStartedAt[translationKey] === undefined) {
   setTranslationStartedAt((current) => ({
    ...current,
    [translationKey]: Date.now(),
   }));
  }
  setTranslationDrafts((current) => ({ ...current, [translationKey]: value }));
  setTranslationChecked((current) => ({ ...current, [translationKey]: false }));
 };
 const selectTranslationSegment = (segmentId: string) => {
  commands.selectSegment(segmentId);
 };
 const moveTranslation = (offset: number) => {
  const next = translationSegments[translationActiveIndex + offset];
  if (next) selectTranslationSegment(next.id);
 };
 const readingUnitsBySegmentId = useMemo(() => {
  const result = new Map<string, ReturnType<typeof getContextualReadingUnits>>();
  if (!displayMode.autoDetectPinyin) return result;
  for (const [segmentId, analysis] of study.analysisBySegmentId) {
   result.set(segmentId, getContextualReadingUnits(analysis));
  }
  return result;
 }, [displayMode.autoDetectPinyin, study.analysisBySegmentId]);

 const readerServices: ReaderServices = {
  ...services,
  toolbar: {
   stickyOffset: toolbarStickyOffset,
   actions: (
    <Button
     type="button"
     size="toolbar"
     variant="outline"
     aria-expanded={shadowingOpen}
     onClick={() => setShadowingOpen((current) => !current)}
    >
     {t("chrome.tools.shadowing")}
    </Button>
   ),
  },
  annotations: {
   items: study.annotations.flatMap((annotation) =>
    annotation.paragraph_id !== null &&
    annotation.start_offset !== null &&
    annotation.end_offset !== null &&
    annotation.end_offset > annotation.start_offset &&
    annotation.selected_text.length > 0
     ? [
        {
         id: annotation.id,
         segmentId: annotation.paragraph_id,
         text: annotation.selected_text,
         start: annotation.start_offset,
         end: annotation.end_offset,
        },
       ]
     : [],
   ),
   onSelection: (target) => {
    const index = study.documentModel.segments.findIndex(
     (segment) => segment.id === target.segmentId,
    );
    const segment = study.documentModel.segments[index];
    if (segment) selection.handleSelection({ ...target, segment, index });
   },
   onOpen: (target, rect) => {
    const annotation = study.annotations.find((item) => item.id === target.id);
    if (annotation) selection.handleOpenAnnotation(annotation, rect);
   },
  },
  pronunciationReview: {
   analyses: study.analysisBySegmentId,
   readingUnitsBySegmentId,
   onInspect: (target) => {
    const index = study.documentModel.segments.findIndex(
     (segment) => segment.id === target.segmentId,
    );
    const segment = study.documentModel.segments[index];
    if (segment) pronunciation.handleInspect({ ...target, segment, index });
   },
  },
 };
 const readerSurface = (
  <>
   <ReaderServicesContext.Provider value={readerServices}>
    {readerContent}
   </ReaderServicesContext.Provider>
   {shadowingOpen && activeParagraph ? (
    <ShadowingPracticePanel
     key={activeParagraph.id}
     paragraph={activeParagraph}
     activeIndex={activeIndex}
     total={study.documentModel.segments.length}
     onPrevious={commands.previous}
     onNext={commands.next}
    />
   ) : null}
  </>
 );
 const completionControl = (
  <div className="flex flex-wrap items-center gap-2">
   <Badge variant={study.featureState.completed ? "success" : "default"} casing="natural">
    {study.featureState.completed ? t("completion.done") : t("completion.pending")}
   </Badge>
   {!study.featureState.completed ? (
    <Button type="button" size="toolbar" variant="outline" onClick={study.markCompleted}>
     <Check />
     {t("completion.markDone")}
    </Button>
   ) : null}
  </div>
 );

 if (focusMode) {
  return (
   <div className="mx-auto grid min-w-0 max-w-5xl gap-3">
    {readerSurface}
    {completionControl}
    {selection.popover}
    {pronunciation.popover}
   </div>
  );
 }

 return (
  <div className="grid min-w-0 gap-3">
   <ReaderHeaderContextBridge
    backHref={backHref}
    backLabel={backLabel ?? t("chrome.backToReader")}
    navigationDocuments={navigationDocuments}
    selectedDocument={resource.document}
   />
   <div className="grid min-w-0 gap-2 border-b border-border-default pb-4 sm:pb-5">
    <div className="flex flex-wrap gap-2">
     <Badge variant="success" casing="natural">
      {readerLessonLabel}
     </Badge>
     {readerUnitNumber ? (
      <Badge variant="accent" casing="natural">
       {t("chrome.unit", { unit: readerUnitNumber })}
      </Badge>
     ) : null}
    </div>
    {activeWorkspaceTab !== "reader" ? (
     <>
      <Typography as="h1" variant="sectionTitle" weight="black" clamp="two">
       {resource.document.title_zh}
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       {resource.document.title_pinyin ? (
        <PinyinText as="span" variant="caption" tone="accent">
         {resource.document.title_pinyin}
        </PinyinText>
       ) : null}
       {resource.document.title_pinyin ? " · " : ""}
       {resource.document.title_vi || resource.document.genre_vi || t("chrome.defaultReading")}
      </Typography>
     </>
    ) : null}
   </div>
   {study.pending ? (
    <Typography variant="caption" tone="muted">
     {t("chrome.progressLoading")}
    </Typography>
   ) : null}
   {study.error ? (
    <Card variant="subtle" padding="sm">
     <Typography variant="caption" tone="warning">
      {t("chrome.progressUnavailable")}
     </Typography>
    </Card>
   ) : null}
   {completionControl}

   {workspaceTabsEnabled ? (
    <Tabs
     value={activeWorkspaceTab}
     items={availableTabs.map((tab) => ({
      key: tab.id,
      label: tab.label,
      icon: tab.icon,
     }))}
     onValueChange={setWorkspaceTab}
     listClassName="sticky top-0 z-30 border border-border-default bg-bg-subtle/95 backdrop-blur"
     aria-label={t("chrome.tabsAria")}
    >
     <TabsContent value={activeWorkspaceTab} className="pt-4 sm:pt-5">
      {activeWorkspaceTab === "reader" ? readerSurface : null}
      {activeWorkspaceTab === "overview" ? <ReaderOverview resource={resource} /> : null}
      {activeWorkspaceTab === "exercises" ? (
       <ReaderExercisePanel
        resource={resource}
        answers={study.featureState.answers}
        onAnswer={study.saveExerciseAnswer}
       />
      ) : null}
      {activeWorkspaceTab === "vocabulary" ? (
       <ReaderVocabularyPanel vocabulary={resource.vocabulary} />
      ) : null}
      {activeWorkspaceTab === "translation" ? (
       <ReaderTranslationPracticePanel
        activeIndex={translationActiveIndex}
        checked={translationIsChecked}
        completedCount={
         translationSegments.filter(
          (candidate) => translationChecked[`${candidate.id}:${translationDirection}`] === true,
         ).length
        }
        direction={translationDirection}
        displayMode={displayMode}
        draft={translationDraft}
        score={translationScore}
        segment={translationSegment}
        segments={translationSegments}
        onCheck={checkTranslation}
        onDirectionChange={setTranslationDirection}
        onDraftChange={updateTranslationDraft}
        onNext={() => moveTranslation(1)}
        onPrevious={() => moveTranslation(-1)}
        onSelect={selectTranslationSegment}
       />
      ) : null}
      {activeWorkspaceTab === "dictation" ? <ReaderDictation resource={resource} /> : null}
      {activeWorkspaceTab === "analysis" ? (
       <ReaderAnalysis resource={resource} analysisBySegmentId={study.analysisBySegmentId} />
      ) : null}
      {activeWorkspaceTab === "summary" ? <ReaderSummary resource={resource} /> : null}
      {activeWorkspaceTab === "notes" ? (
       <ReaderNotes annotations={activeAnnotations} onRemove={selection.removeAnnotation} />
      ) : null}
     </TabsContent>
    </Tabs>
   ) : (
    readerSurface
   )}
   {selection.popover}
   {pronunciation.popover}
   {study.saveError ? (
    <Typography as="p" variant="caption" tone="danger">
     {study.saveError}
    </Typography>
   ) : null}
  </div>
 );
}
