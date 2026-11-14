"use client";

import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Typography } from "@/components/ui/display/typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { ReaderNotes } from "@/features/reading/components/ReaderStudyModules";
import { businessChinesePronunciationAnalyses } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import { DailyReadingNoteCard } from "@/features/daily-reading/components/DailyReadingNoteCard";
import { useMandarinReaderSpeechService } from "@/features/speech/MandarinTtsProvider";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { useReaderSessionPronunciation } from "@/features/reading/hooks/useReaderSessionPronunciation";
import { DailyReadingLearningSupportPanel } from "@/features/daily-reading/components/DailyReadingLearningSupportPanel";
import { DailyReadingReaderTab } from "@/features/daily-reading/components/DailyReadingReaderTab";
import { DailyReadingQuestions } from "@/features/daily-reading/components/DailyReadingQuestions";
import { DailyReadingViewHeader } from "@/features/daily-reading/components/DailyReadingViewHeader";
import { DailyReadingVocabPip } from "@/features/daily-reading/components/DailyReadingVocabPip";
import { DailyReadingVocabularyTab } from "@/features/daily-reading/components/DailyReadingVocabularyTab";
import {
 DailyReadingGrammarList,
 DailyReadingSourcePanel,
 DailyReadingTranslationProgressNotice,
} from "@/features/daily-reading/components/DailyReadingDetailPanels";
import {
 analyzeDailyReadingText,
 availableTabs,
 type DailyReadingTab,
 emptyReaderDocument,
 fallbackTabs,
 filterDailyReadingVocabItems,
 findDailyReading,
 tabLabelKey,
} from "@/features/daily-reading/components/daily-reading-library-utils";
import { useDailyReadingAnnotations } from "@/features/daily-reading/hooks/useDailyReadingAnnotations";
import { useDailyReadingHeaderBreadcrumb } from "@/features/daily-reading/hooks/useDailyReadingHeaderBreadcrumb";
import { useDailyReadingPip } from "@/features/daily-reading/hooks/useDailyReadingPip";
import { useDailyReadingTranslationProgress } from "@/features/daily-reading/hooks/useDailyReadingTranslationProgress";
import { useDailyReadingLibrary } from "@/features/daily-reading/services/daily-reading.client";
import { buildDailyReadingReaderDocument } from "@/features/daily-reading/model/daily-reading-view-model";

export function DailyReadingView({ id, onBack }: { id: string; onBack(): void }) {
 const t = useTranslations("DailyReading");
 const locale = useLocale();
 const library = useDailyReadingLibrary();
 const learningState = useLearningState();
 const speech = useMandarinReaderSpeechService();
 const { openInspector } = useVocabInspector();
 const displayMode =
  learningState.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const reading = findDailyReading(library.items, id);
 const [tab, setTab] = useState<DailyReadingTab>("reader");
 const tabs = reading === null ? fallbackTabs : availableTabs(reading);
 const tabItems = tabs.map((key) => ({ key, label: t(tabLabelKey(key)) }));
 const translation =
  reading?.enrichment.translation.status === "ready" ? reading.enrichment.translation.data : null;
 const translationRun = library.enrichmentRuns.find(
  (run) =>
   reading !== null &&
   run.articleId === reading.id &&
   run.articleFingerprint === reading.article.fingerprint &&
   run.module === "translation",
 );
 const translationProgressEvents = useDailyReadingTranslationProgress({
  translationRunId: translationRun?.runId ?? "",
  translationWorkflowRunId:
   translationRun?.status === "pending" || translationRun?.status === "failed"
    ? translationRun.workflowRunId
    : "",
  streamArticleId: reading?.id ?? "",
  streamArticleFingerprint: reading?.article.fingerprint ?? "",
 });
 const transientTranslationParagraphs = translationProgressEvents.flatMap(
  (event) => event.paragraphs,
 );
 const latestTranslationProgress = translationProgressEvents.at(-1);
 const readerDocument =
  reading === null
   ? null
   : buildDailyReadingReaderDocument(reading, transientTranslationParagraphs);
 const titlePronunciation =
  reading === null ? null : analyzeDailyReadingText(reading.article.titleZh);
 const pronunciation = useReaderSessionPronunciation(readerDocument?.segments ?? [], true);
 const dateFormatter = useMemo(
  () =>
   new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
   }),
  [locale],
 );

 const readerVocabulary: ReaderDocumentResource["vocabulary"] =
  reading && reading.enrichment.vocabulary.status === "ready"
   ? reading.enrichment.vocabulary.data.items.map((item) => ({
      id: item.id,
      word: item.hanzi,
      pinyin: "",
      meaning: item.meaningVi,
     }))
   : [];

 const analysisBySegmentId = readerDocument
  ? businessChinesePronunciationAnalyses(readerDocument)
  : new Map();

 const { annotationsQuery, selection } = useDailyReadingAnnotations({
  reading,
  selectionOptions: {
   document: readerDocument ?? emptyReaderDocument,
   vocabulary: readerVocabulary,
   stateOwner: "daily",
   analysisBySegmentId,
   selectSegment: () => {},
   stop: () => speech.stop(),
  },
 });

 const [vocabSearchQuery, setVocabSearchQuery] = useState("");
 const pip = useDailyReadingPip();

 const rawVocabItems =
  reading?.enrichment.vocabulary.status === "ready"
   ? reading.enrichment.vocabulary.data.items
   : null;
 const vocabItems = rawVocabItems ?? [];
 const filteredVocabItems = filterDailyReadingVocabItems(vocabItems, vocabSearchQuery);

 useDailyReadingHeaderBreadcrumb(reading);

 if (reading === null || readerDocument === null) {
  return (
   <Card variant="subtle" padding="lg" className="grid gap-3">
    <Typography tone="danger">{t("generated.notFound")}</Typography>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     className="justify-self-start"
     onClick={onBack}
    >
     <ArrowLeft data-icon="inline-start" />
     {t("document.back")}
    </Button>
   </Card>
  );
 }

 const effectiveTab = tabs.includes(tab) ? tab : "reader";
 return (
  <div className="grid min-w-0 gap-4">
   <DailyReadingViewHeader
    reading={reading}
    showTitle={effectiveTab !== "reader"}
    displayMode={displayMode}
    titlePronunciation={titlePronunciation}
    dateFormatter={dateFormatter}
   />

   <Tabs
    value={effectiveTab}
    items={tabItems}
    onValueChange={setTab}
    actions={
     <div className="flex shrink-0 items-center gap-1.5">
      <Button
       type="button"
       variant="ghost"
       size="compact"
       className="gap-1.5 shrink-0"
       onClick={onBack}
       title={t("document.back")}
      >
       <ArrowLeft className="size-3.5" />
       <span className="hidden sm:inline">{t("document.back")}</span>
      </Button>
     </div>
    }
    listClassName="hanzihome-liquid-toolbar flex sticky top-0 z-30 bg-background/95 backdrop-blur-md"
    aria-label={t("tabs.aria")}
   >
    <TabsContent value="reader" className="grid gap-3 pt-4">
     {latestTranslationProgress !== undefined && translation === null ? (
      <DailyReadingTranslationProgressNotice
       failed={translationRun?.status === "failed"}
       progress={latestTranslationProgress}
      />
     ) : null}
     <DailyReadingReaderTab
      readerDocument={readerDocument}
      pronunciation={pronunciation}
      titlePronunciation={titlePronunciation}
      display={{
       value: displayMode,
       onChange: (value) =>
        learningState.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...value } }),
      }}
      speech={speech}
      annotations={annotationsQuery.data}
      selection={selection}
      openInspector={openInspector}
     />
    </TabsContent>

    <TabsContent value="notes" className="grid gap-4 pt-4">
     {annotationsQuery.data && annotationsQuery.data.length > 0 ? (
      <ReaderNotes annotations={annotationsQuery.data} onRemove={selection.removeAnnotation} />
     ) : null}
     <DailyReadingNoteCard reading={reading} />
    </TabsContent>

    <TabsContent value="support" className="pt-4">
     <DailyReadingLearningSupportPanel reading={reading} />
    </TabsContent>

    <TabsContent value="questions" className="pt-4">
     <DailyReadingQuestions reading={reading} />
    </TabsContent>

    <TabsContent value="vocabulary" className="pt-4">
     {reading.enrichment.vocabulary.status === "ready" ? (
      <DailyReadingVocabularyTab
       vocabItems={vocabItems}
       filteredVocabItems={filteredVocabItems}
       vocabSearchQuery={vocabSearchQuery}
       onVocabSearchQueryChange={setVocabSearchQuery}
       displayMode={displayMode}
       isPipActive={pip.isPipOpen || pip.isInAppFloatingOpen}
       pipMode={pip.pipMode}
       onTogglePip={(mode) => void pip.handleTogglePip(mode)}
      />
     ) : null}
    </TabsContent>

    <TabsContent value="grammar" className="pt-4">
     <DailyReadingGrammarList reading={reading} />
    </TabsContent>

    <TabsContent value="source" className="pt-4">
     <DailyReadingSourcePanel reading={reading} dateFormatter={dateFormatter} />
    </TabsContent>
   </Tabs>
   <DailyReadingVocabPip reading={reading} vocabItems={vocabItems} pip={pip} />
  </div>
 );
}
