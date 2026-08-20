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
import { useMemo, useState } from "react";

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
 createTranslationAttempt,
 scoreTranslationAttempt,
 translationReferenceText,
 type TranslationDirection,
} from "@/features/hanzihome/practice/translation-practice";

import { ReaderSurfaceView } from "./components/ReaderSurface";
import {
 ReaderAnalysis,
 ReaderDictation,
 ReaderNotes,
 ReaderOverview,
 ReaderSummary,
} from "./components/ReaderStudyModules";
import { ReaderExercisePanel } from "./ReaderExercisePanel";
import { ReaderHeaderContextBridge } from "./ReaderHeaderContextBridge";
import { ReaderTranslationPracticePanel } from "./ReaderTranslationPracticePanel";
import { ReaderVocabularyPanel } from "./ReaderVocabularyPanel";
import type { ReaderDocumentResource } from "./reader-content-api";
import type { ReaderDocumentRow } from "./reader.schemas";
import {
 ReaderRuntimeProvider,
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "./runtime/ReaderRuntimeProvider";
import { useReaderPronunciationReview } from "./runtime/useReaderPronunciationReview";
import { useReaderSelectionActions } from "./runtime/useReaderSelectionActions";
import { useReaderStudyState, type ReaderProgressOwner } from "./runtime/useReaderStudyState";
import { ShadowingPracticePanel } from "./ShadowingPracticePanel";

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
 return (
  <ReaderRuntimeProvider document={study.documentModel}>
   <ReaderDocumentStudyContent
    resource={resource}
    stateOwner={stateOwner}
    backHref={backHref}
    backLabel={backLabel}
    navigationDocuments={navigationDocuments}
    stickyParentTabs={stickyParentTabs}
    study={study}
   />
  </ReaderRuntimeProvider>
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
}: {
 resource: ReaderDocumentResource;
 stateOwner: ReaderProgressOwner;
 backHref: string;
 backLabel: string | undefined;
 navigationDocuments: ReadonlyArray<ReaderDocumentRow>;
 stickyParentTabs: boolean;
 study: ReturnType<typeof useReaderStudyState>;
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
 const commands = useReaderRuntimeCommands();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const focusMode = useReaderRuntimeSelector((state) => state.focusMode);
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
  resource,
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
 const isHskDocument = resource.document.kind === "hsk";
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
   setTranslationStartedAt((current) => ({ ...current, [translationKey]: Date.now() }));
  }
  setTranslationDrafts((current) => ({ ...current, [translationKey]: value }));
  setTranslationChecked((current) => ({ ...current, [translationKey]: false }));
 };
 const selectTranslationSegment = (segmentId: string) => {
  const index = study.documentModel.segments.findIndex((segment) => segment.id === segmentId);
  if (index >= 0) commands.selectIndex(index);
 };
 const moveTranslation = (offset: number) => {
  const next = translationSegments[translationActiveIndex + offset];
  if (next) selectTranslationSegment(next.id);
 };

 const readerSurface = (
  <>
   <ReaderSurfaceView
    document={study.documentModel}
    analysisBySegmentId={study.analysisBySegmentId}
    onSelection={selection.handleSelection}
    onPronunciationInspect={pronunciation.handleInspect}
    onOpenShadowing={() => setShadowingOpen((current) => !current)}
    toolbarStickyOffset={toolbarStickyOffset}
   />
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
   {stateOwner === "reader" && !isHskDocument ? (
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
    </div>
   ) : null}
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
     items={availableTabs.map((tab) => ({ key: tab.id, label: tab.label, icon: tab.icon }))}
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
