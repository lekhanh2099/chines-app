"use client";

import { useTranslations } from "next-intl";
import { memo, useMemo, useState, type ReactNode } from "react";

import { useUnsavedDraftGuard } from "@/components/layout/navigation/UnsavedDraftNavigationGuard";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 formatContextualReadingPinyin,
 getContextualReadingUnits,
} from "@/lib/pronunciation/contextual-pronunciation";

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
import { ReaderHeaderContextBridge } from "@/features/reading/components/ReaderHeaderContextBridge";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import { useReaderPronunciationReview } from "@/features/reading/hooks/useReaderPronunciationReview";
import { useReaderSelectionActions } from "@/features/reading/hooks/useReaderSelectionActions";
import { useReaderTranslationPractice } from "@/features/reading/hooks/useReaderTranslationPractice";
import {
 useReaderStudyState,
 type ReaderProgressOwner,
} from "@/features/reading/hooks/useReaderStudyState";
import { ShadowingPracticePanel } from "@/features/reading/components/ShadowingPracticePanel";
import { useReaderWorkspaceTabs } from "@/features/reading/hooks/useReaderWorkspaceTabs";
import {
 metadataString,
 readerSurfaceAnnotations,
} from "@/features/reading/workspaces/reader-document-study-model";
import {
 ReaderCompletionControl,
 ReaderDocumentStudyHeading,
} from "@/features/reading/workspaces/ReaderDocumentStudyHeading";
import { ReaderDocumentStudyTabs } from "@/features/reading/workspaces/ReaderDocumentStudyTabs";

export const ReaderDocumentStudy = memo(function ReaderDocumentStudy({
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
});

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
 const commands = useReaderCommands();
 const { actions } = useReaderStore();
 const services = useReaderServices();
 const activeIndex = useReaderSelector((state) => state.navigation.activeIndex);
 const focusMode = useReaderSelector((state) => state.ui.focusMode);
 const [shadowingOpen, setShadowingOpen] = useState(false);
 // A shadowing session pins the panel to its paragraph until the learner navigates or closes
 // it; following scroll-driven active-paragraph changes would remount the panel and silently
 // drop the recording or its attempts. -1 = follow the active paragraph.
 const [pinnedShadowingIndex, setPinnedShadowingIndex] = useState(-1);
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const paragraphById = useMemo(
  () => new Map(resource.paragraphs.map((paragraph) => [paragraph.id, paragraph])),
  [resource.paragraphs],
 );
 const activeSegment = study.documentModel.segments[activeIndex];
 const shadowingIndex = pinnedShadowingIndex >= 0 ? pinnedShadowingIndex : activeIndex;
 const moveShadowingParagraph = (offset: number) => {
  const target = study.documentModel.segments[shadowingIndex + offset];
  setPinnedShadowingIndex(-1);
  if (target) commands.selectSegment(target.id);
 };
 const shadowingSegment = study.documentModel.segments[shadowingIndex];
 const shadowingParagraph = shadowingSegment ? paragraphById.get(shadowingSegment.id) : undefined;
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
 const translation = useReaderTranslationPractice({
  paragraphs: resource.paragraphs,
  activeSegmentId: activeSegment?.id,
  commands,
  setSaveError: study.setSaveError,
 });
 const requestNavigation = useUnsavedDraftGuard(translation.hasUncheckedDraft);
 const { workspaceTabsEnabled, activeWorkspaceTab, setWorkspaceTab, tabGroups } =
  useReaderWorkspaceTabs({
   resource,
   study,
   stateOwner,
   translationSegmentCount: translation.translationSegments.length,
  });
 const readerUnitNumber = resource.document.unit_id?.replace(/^U/u, "") ?? "";
 const readerLessonLabel =
  metadataString(resource, "reading_label_vi") ??
  (resource.document.reading_number === null
   ? t("chrome.defaultReading")
   : `Bài ${resource.document.reading_number}`);
 const toolbarStickyOffset = workspaceTabsEnabled || stickyParentTabs ? "tabs" : "page";
 useReadingSourceTarget(focusMode || activeWorkspaceTab === "reader");
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
     onClick={() => {
      setPinnedShadowingIndex(-1);
      setShadowingOpen((current) => !current);
     }}
    >
     {t("chrome.tools.shadowing")}
    </Button>
   ),
  },
  annotations: {
   items: readerSurfaceAnnotations(study.annotations),
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
   {shadowingOpen && shadowingParagraph ? (
    <ShadowingPracticePanel
     key={shadowingParagraph.id}
     paragraph={shadowingParagraph}
     activeIndex={shadowingIndex}
     onSessionStart={() => setPinnedShadowingIndex(shadowingIndex)}
     total={study.documentModel.segments.length}
     onPrevious={() => moveShadowingParagraph(-1)}
     onNext={() => moveShadowingParagraph(1)}
    />
   ) : null}
  </>
 );
 const completionControl = (
  <ReaderCompletionControl
   completed={study.featureState.completed}
   onMarkCompleted={study.markCompleted}
  />
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
   <ReaderDocumentStudyHeading
    resource={resource}
    lessonLabel={readerLessonLabel}
    unitNumber={readerUnitNumber}
    showTitle={activeWorkspaceTab !== "reader"}
   />
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
    <ReaderDocumentStudyTabs
     resource={resource}
     study={study}
     tabGroups={tabGroups}
     activeWorkspaceTab={activeWorkspaceTab}
     requestNavigation={requestNavigation}
     onWorkspaceTabChange={setWorkspaceTab}
     readerSurface={readerSurface}
     translation={translation}
     displayMode={displayMode}
     activeAnnotations={activeAnnotations}
     onRemoveAnnotation={selection.removeAnnotation}
    />
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
