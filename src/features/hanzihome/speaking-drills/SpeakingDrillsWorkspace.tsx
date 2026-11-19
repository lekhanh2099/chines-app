"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Typography } from "@/components/ui/display/typography";
import { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { BusinessChineseWorkspaceNavMenu } from "@/features/hanzihome/components/business-chinese/BusinessChineseWorkspaceNavMenu";
import {
 splitWorkspaceTabs,
 useWorkspaceTabCapacity,
} from "@/features/hanzihome/components/business-chinese/useWorkspaceTabOverflow";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { ReaderPronunciationSessionProvider } from "@/features/hanzihome/reader-adapters/reader-pronunciation-session";
import { Reader } from "@/features/reader/components/Reader";
import { useReaderCommands } from "@/features/reader/runtime/reader-context";
import { useReaderSessionPronunciation } from "@/features/reading/hooks/useReaderSessionPronunciation";
import { useMandarinReaderSpeechService } from "@/features/speech/MandarinTtsProvider";
import { useRouter } from "@/i18n/navigation";

import type { SpeakingDrillVersion, SpeakingDrillsTab } from "./speaking-drills.schemas";
import type { SpeakingDrillSelection, SpeakingDrillsCatalogBook } from "./speaking-drills.types";
import { buildSpeakingDrillReaderDocument } from "./speaking-drills-reader.adapter";
import {
 adjacentSpeakingDrillTopics,
 buildDoubaoPracticeText,
 speakingDrillsHref,
} from "./speaking-drills-utils";
import { SpeakingDrillBrief } from "./SpeakingDrillBrief";
import { SpeakingDrillComparison } from "./SpeakingDrillComparison";
import { SpeakingDrillMaterials } from "./SpeakingDrillMaterials";
import { SpeakingDrillVoiceMenu } from "./SpeakingDrillVoiceMenu";
import { SpeakingDrillsHeaderBreadcrumb } from "./SpeakingDrillsHeaderBreadcrumb";
import { useWideSpeakingDrillsLayout } from "./useWideSpeakingDrillsLayout";

export function SpeakingDrillsWorkspace({
 catalog,
 selection,
}: {
 catalog: SpeakingDrillsCatalogBook[];
 selection: SpeakingDrillSelection;
}) {
 const t = useTranslations("SpeakingDrills");
 const router = useRouter();
 const learningState = useLearningState();
 const { openInspector } = useVocabInspector();
 const tabCapacity = useWorkspaceTabCapacity();
 const wideLayout = useWideSpeakingDrillsLayout();
 const [tab, setTab] = useState<SpeakingDrillsTab>("dialogue");
 const [version, setVersion] = useState<SpeakingDrillVersion>("v2");
 const [copiedText, setCopiedText] = useState("");
 const speech = useMandarinReaderSpeechService();
 const { topic, lesson } = selection;
 const displayMode =
  learningState.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const book = catalog.find((candidate) => candidate.id === selection.bookId) ?? catalog[0];
 const adjacent = adjacentSpeakingDrillTopics(book, topic.id);
 const readerDocument = useMemo(
  () => buildSpeakingDrillReaderDocument(selection, version),
  [selection, version],
 );
 const pronunciation = useReaderSessionPronunciation(readerDocument.segments, true);
 const doubaoText = buildDoubaoPracticeText(
  selection,
  version === "v1" ? topic.v1Lines : topic.v2Lines,
 );
 const versionLabel = version === "v1" ? t("versionOriginal") : t("versionOptimized");
 const tabKeys: SpeakingDrillsTab[] = ["dialogue", "materials", "compare", "prompt"];
 const tabItems = tabKeys.map((key) => ({
  key,
  label: t(`tabs.${key}`, { count: topic.changes.length }),
 }));
 const { visibleTabs, overflowTabs } = splitWorkspaceTabs(tabItems, tab, tabCapacity);

 useEffect(() => {
  if (!copiedText) return;
  const timeout = window.setTimeout(() => setCopiedText(""), 2000);
  return () => window.clearTimeout(timeout);
 }, [copiedText]);

 const openTopic = useCallback(
  (topicId: string) => router.push(speakingDrillsHref(topicId), { scroll: false }),
  [router],
 );
 const copy = (value: string) => {
  void navigator.clipboard.writeText(value).then(() => setCopiedText(value));
 };
 const copyButton = (value: string, label: string, variant: "default" | "outline") => (
  <Button type="button" size="toolbar" variant={variant} onClick={() => copy(value)}>
   {copiedText === value ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
   {copiedText === value ? t("copied") : label}
  </Button>
 );

 return (
  <div className="grid min-w-0 gap-3">
   <SpeakingDrillsHeaderBreadcrumb
    catalog={catalog}
    selection={selection}
    onSelectTopic={openTopic}
   />
   <Typography as="h1" variant="pageTitle" className="sr-only">
    {book.name} · {t("topicHeading", { lesson: lesson.no, topic: topic.no })} · {topic.titleVi}
   </Typography>

   <ReaderPronunciationSessionProvider>
    <Reader
     data={{ ...readerDocument, segments: pronunciation.segments }}
     display={{
      value: displayMode,
      onChange: (value) =>
       learningState.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...value } }),
     }}
     services={{
      speech,
      compactContent: true,
      placeToolbarInLayout: tab === "dialogue",
      toolbar: {
       hidePinyinToggle: true,
       hideTranslationToggle: true,
      },
      lookup: (target) => {
       void openInspector(target.text, { anchorRect: target.rect });
      },
      pronunciationReview: pronunciation.service,
      renderReader: ({ content, toolbar }) => (
       <>
        <StopPlaybackWhenHidden hidden={tab !== "dialogue"} />
        <Tabs
         value={tab}
         items={visibleTabs}
         onValueChange={setTab}
         overflow={
          <BusinessChineseWorkspaceNavMenu
           tabs={overflowTabs}
           activeView={tab}
           onActiveViewChange={(view) => {
            const next = tabKeys.find((key) => key === view);
            if (next) setTab(next);
           }}
           compact={tabCapacity < tabItems.length}
          />
         }
         actions={toolbar}
         listClassName="hanzihome-liquid-toolbar flex sticky top-0 z-30 bg-background/95 backdrop-blur-md"
         aria-label={t("tabsAria")}
        >
         <TabsContent value="dialogue" className="pt-3">
          <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:items-start">
           <aside className="min-w-0 2xl:sticky 2xl:top-16 2xl:order-last">
            <SpeakingDrillBrief
             topic={topic}
             displayMode={displayMode}
             notesOpen={wideLayout}
             footer={
              <>
               <div className="flex flex-wrap items-center gap-2">
                {copyButton(doubaoText, t("copyForDoubao"), "default")}
                <Button
                 type="button"
                 size="toolbar"
                 variant="ghost"
                 onClick={() => setTab("prompt")}
                >
                 {t("viewPrompt")}
                </Button>
               </div>
               <StudyInstructionText variant="caption" tone="muted">
                {t("copyForDoubaoHint", { version: versionLabel })}
               </StudyInstructionText>
              </>
             }
            />
           </aside>
           <div className="grid min-w-0 gap-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
             <div className="min-w-0">
              <SegmentedControl
               value={version}
               items={[
                { key: "v2", label: t("versionOptimized") },
                { key: "v1", label: t("versionOriginal") },
               ]}
               onChange={setVersion}
               aria-label={t("versionAria")}
              />
             </div>
             <SpeakingDrillVoiceMenu />
            </div>
            {content}
            <nav aria-label={t("topicPagerAria")} className="grid gap-2 sm:grid-cols-2">
             {adjacent.previous.map((previous) => (
              <Button
               key={previous.id}
               type="button"
               variant="outline"
               size="menu"
               align="start"
               wrap="normal"
               onClick={() => openTopic(previous.id)}
              >
               <ChevronLeft data-icon="inline-start" />
               <span className="grid min-w-0 gap-0.5">
                <Typography as="span" variant="caption" tone="muted">
                 {t("previousTopic")}
                </Typography>
                <Typography as="span" variant="label" className="truncate">
                 {previous.titleVi}
                </Typography>
               </span>
              </Button>
             ))}
             {adjacent.next.map((next) => (
              <Button
               key={next.id}
               type="button"
               variant="outline"
               size="menu"
               align="between"
               wrap="normal"
               className="sm:col-start-2"
               onClick={() => openTopic(next.id)}
              >
               <span className="grid min-w-0 gap-0.5 text-right">
                <Typography as="span" variant="caption" tone="muted">
                 {t("nextTopic")}
                </Typography>
                <Typography as="span" variant="label" className="truncate">
                 {next.titleVi}
                </Typography>
               </span>
               <ChevronRight data-icon="inline-end" />
              </Button>
             ))}
            </nav>
           </div>
          </div>
         </TabsContent>

         <TabsContent value="materials" className="pt-3">
          <SpeakingDrillMaterials lesson={lesson} displayMode={displayMode} />
         </TabsContent>

         <TabsContent value="compare" className="pt-3">
          <SpeakingDrillComparison topic={topic} />
         </TabsContent>

         <TabsContent value="prompt" className="pt-3">
          <Card variant="section" padding="md" className="grid gap-3">
           <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid min-w-0 flex-1 gap-1">
             <Typography as="h2" variant="cardTitle">
              {t("promptTitle", { book: book.name })}
             </Typography>
             <Typography as="p" variant="bodySmall" tone="muted">
              {t("promptDescription")}
             </Typography>
            </div>
            <div className="flex flex-wrap gap-2">
             {copyButton(selection.generalPrompt, t("copyPrompt"), "outline")}
             {copyButton(doubaoText, t("copyForDoubao"), "default")}
            </div>
           </div>
           <Card variant="subtle" padding="md">
            <StudyInstructionText
             lang="zh-CN"
             variant="bodySmall"
             tone="default"
             className="whitespace-pre-line"
            >
             {selection.generalPrompt}
            </StudyInstructionText>
           </Card>
          </Card>
         </TabsContent>
        </Tabs>
       </>
      ),
     }}
    />
    {pronunciation.popover}
   </ReaderPronunciationSessionProvider>
  </div>
 );
}

/** The Reader stays mounted under every tab; leaving the dialogue must not keep audio playing without controls. */
function StopPlaybackWhenHidden({ hidden }: { hidden: boolean }) {
 const commands = useReaderCommands();
 useEffect(() => {
  if (hidden) commands.stop();
 }, [commands, hidden]);
 return null;
}
