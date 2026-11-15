"use client";

import { BookOpenText, Check, NotebookPen } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentProps, ReactNode } from "react";

import type { useUnsavedDraftGuard } from "@/components/layout/navigation/UnsavedDraftNavigationGuard";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import {
 ReaderAnalysis,
 ReaderDictation,
 ReaderNotes,
 ReaderOverview,
 ReaderSummary,
} from "@/features/reading/components/ReaderStudyModules";
import { ReaderExercisePanel } from "@/features/reading/components/ReaderExercisePanel";
import { ReaderTranslationPracticePanel } from "@/features/reading/components/ReaderTranslationPracticePanel";
import { ReaderVocabularyPanel } from "@/features/reading/components/ReaderVocabularyPanel";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { useReaderStudyState } from "@/features/reading/hooks/useReaderStudyState";
import type { useReaderTranslationPractice } from "@/features/reading/hooks/useReaderTranslationPractice";
import type {
 groupReaderWorkspaceTabs,
 ReaderWorkspaceTab,
} from "@/features/reading/workspaces/reader-document-study-model";

/** Grouped Reader study tabs (reading / practice / resources) and the active panel. */
export function ReaderDocumentStudyTabs({
 resource,
 study,
 tabGroups,
 activeWorkspaceTab,
 requestNavigation,
 onWorkspaceTabChange,
 readerSurface,
 translation,
 displayMode,
 activeAnnotations,
 onRemoveAnnotation,
}: {
 resource: ReaderDocumentResource;
 study: ReturnType<typeof useReaderStudyState>;
 tabGroups: ReturnType<typeof groupReaderWorkspaceTabs>;
 activeWorkspaceTab: ReaderWorkspaceTab;
 requestNavigation: ReturnType<typeof useUnsavedDraftGuard>;
 onWorkspaceTabChange: (tab: ReaderWorkspaceTab) => void;
 readerSurface: ReactNode;
 translation: ReturnType<typeof useReaderTranslationPractice>;
 displayMode: ComponentProps<typeof ReaderTranslationPracticePanel>["displayMode"];
 activeAnnotations: ComponentProps<typeof ReaderNotes>["annotations"];
 onRemoveAnnotation: ComponentProps<typeof ReaderNotes>["onRemove"];
}) {
 const t = useTranslations("Reader.study");
 const { readingTabs, practiceTabs, resourceTabs, activeGroup, activeGroupTabs } = tabGroups;

 return (
  <Tabs
   value={activeGroup}
   items={[
    { key: "reader", label: t("chrome.groups.reading"), icon: BookOpenText },
    { key: "exercises", label: t("chrome.groups.practice"), icon: Check },
    { key: "vocabulary", label: t("chrome.groups.resources"), icon: NotebookPen },
   ]}
   onValueChange={(group) => {
    const nextTab =
     group === "reader"
      ? readingTabs[0]
      : group === "exercises"
        ? practiceTabs[0]
        : resourceTabs[0];
    if (nextTab) {
     requestNavigation(() => onWorkspaceTabChange(nextTab.id));
    }
   }}
   listClassName="sticky top-0 z-30 border border-border-default bg-bg-subtle/95 backdrop-blur"
   aria-label={t("chrome.tabsAria")}
  >
   <TabsContent value={activeGroup} className="grid gap-3 pt-3">
    {activeGroupTabs.length > 1 ? (
     <SegmentedControl<ReaderWorkspaceTab>
      value={activeWorkspaceTab}
      items={activeGroupTabs.map((tab) => ({ key: tab.id, label: tab.label, icon: tab.icon }))}
      onChange={(nextTab) => {
       requestNavigation(() => onWorkspaceTabChange(nextTab));
      }}
      layout="wrap"
      aria-label={t("chrome.subtabsAria")}
     />
    ) : null}
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
      activeIndex={translation.translationActiveIndex}
      checked={translation.translationIsChecked}
      completedCount={
       translation.translationSegments.filter(
        (candidate) =>
         translation.translationChecked[`${candidate.id}:${translation.translationDirection}`] ===
         true,
       ).length
      }
      direction={translation.translationDirection}
      displayMode={displayMode}
      draft={translation.translationDraft}
      score={translation.translationScore}
      segment={translation.translationSegment}
      segments={translation.translationSegments}
      onCheck={translation.checkTranslation}
      onDirectionChange={translation.setTranslationDirection}
      onDraftChange={translation.updateTranslationDraft}
      onNext={() => translation.moveTranslation(1)}
      onPrevious={() => translation.moveTranslation(-1)}
      onSelect={translation.selectTranslationSegment}
     />
    ) : null}
    {activeWorkspaceTab === "dictation" ? <ReaderDictation resource={resource} /> : null}
    {activeWorkspaceTab === "analysis" ? (
     <ReaderAnalysis resource={resource} analysisBySegmentId={study.analysisBySegmentId} />
    ) : null}
    {activeWorkspaceTab === "summary" ? <ReaderSummary resource={resource} /> : null}
    {activeWorkspaceTab === "notes" ? (
     <ReaderNotes annotations={activeAnnotations} onRemove={onRemoveAnnotation} />
    ) : null}
   </TabsContent>
  </Tabs>
 );
}
