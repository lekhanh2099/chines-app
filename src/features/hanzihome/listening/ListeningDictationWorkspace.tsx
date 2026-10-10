"use client";

import { useTranslations } from "next-intl";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Headphones, Keyboard, Play } from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Spinner } from "@/components/ui/feedback/spinner";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import {
 ReaderHanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import {
 LessonModuleFrame,
 LessonModuleSidebarRailItem,
} from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { lessonDisplaySettings } from "@/features/hanzihome/utils/learning-state";
import type { DictationAttempt } from "@/features/dictation/dictation-session";
import { useDictationAttempts } from "@/features/dictation/useDictationAttempts";
import { dictationEntryText } from "@/features/dictation/dictation-workspace-utils";

import { ListeningTranscriptBlock } from "./ListeningTranscriptBlock";
import { MandarinTtsControls } from "./MandarinTtsControls";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { LISTENING_CATEGORIES } from "./listening.types";
import {
 itemsForListeningSection,
 transcriptsForListeningSection,
 type ListeningTranscriptEntry,
} from "./listening.view-model";
import { useHanziHomeListeningLesson } from "./useHanziHomeListeningLesson";
import { useListeningDictationSession } from "./useListeningDictationSession";

export function DictationCards({
 entries,
 displayMode,
 onSpeak,
 onSpeakSequence,
 onAttempt,
 playbackMode,
 passageText,
 activeEntryId,
}: {
 entries: ListeningTranscriptEntry[];
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onSpeakSequence: (segments: string[]) => void;
 onAttempt: (attempt: DictationAttempt) => void;
 playbackMode: "sentence" | "paragraph" | "passage";
 passageText: string;
 activeEntryId?: string;
}) {
 const t = useTranslations("Listening");
 const [revealed, setRevealed] = useState<Record<string, boolean>>({});
 const { cards, playEntry, updateAnswer, checkAnswer } = useListeningDictationSession({
  entries,
  activeEntryId,
  playPassage: playbackMode === "passage",
  playParagraph: playbackMode === "paragraph",
  passageText,
  onSpeak,
  onSpeakSequence,
  onChecked: (entryId) => setRevealed((current) => ({ ...current, [entryId]: true })),
  onAttempt,
 });

 return (
  <div className="grid gap-2.5">
   {cards.map(({ entry, index, answer, history, isChecked, score, diff }) => {
    const showTranscript = revealed[entry.id] ?? isChecked;

    return (
     <Card key={entry.id} variant="default" padding="md" className="grid gap-3">
      <div className="flex min-w-0 items-center gap-2">
       <IconTile size="sm" tone={score === 100 ? "info" : "accent"}>
        <Typography variant="caption" weight="black">
         {index + 1}
        </Typography>
       </IconTile>
       <div className="min-w-0 flex-1">
        <StudyInstructionText variant="label" tone="default" weight="black">
         {t("question", { number: index + 1 })}
        </StudyInstructionText>
        <StudyInstructionText variant="caption" tone="muted" weight="semibold" clamp="one">
         {t("dictationSteps")}
        </StudyInstructionText>
       </div>
       <Button type="button" variant="surface" size="toolbar" onClick={() => playEntry(entry.id)}>
        <Play data-icon="inline-start" />
        {playbackMode === "sentence"
         ? t("listenSentence")
         : playbackMode === "paragraph"
           ? t("listenParagraph")
           : t("listenPassage")}
       </Button>
      </div>

      <Textarea
       value={answer}
       rows={3}
       lang="zh-CN"
       density="compact"
       surface="field"
       aria-label={t("dictationQuestion", { number: index + 1 })}
       placeholder={t("dictationPlaceholder")}
       onChange={(event) => {
        updateAnswer(entry.id, event.target.value);
       }}
      />

      <div className="flex flex-wrap items-center gap-2">
       <Button
        type="button"
        size="toolbar"
        disabled={!answer.trim()}
        onClick={() => checkAnswer(entry.id)}
       >
        {t("check")}
       </Button>
       <Button
        type="button"
        variant="outline"
        size="toolbar"
        onClick={() => setRevealed((current) => ({ ...current, [entry.id]: !current[entry.id] }))}
       >
        {showTranscript ? t("hideScript") : t("viewScript")}
       </Button>
       {score !== null ? (
        <div className="flex flex-wrap items-center gap-2">
         <Badge variant={score === 100 ? "success" : score >= 70 ? "warning" : "danger"}>
          {score === 100 ? t("exact") : t("score", { score })}
         </Badge>
         <Typography as="span" variant="caption" tone="muted">
          {t("attempt", { count: history.length })}
         </Typography>
         {history.length > 1 ? (
          <Typography as="span" variant="caption" tone="muted">
           {t("scores", { values: history.map((item) => `${item.score}%`).join(" → ") })}
          </Typography>
         ) : null}
        </div>
       ) : null}
      </div>

      {score !== null && diff.length > 0 ? (
       <div className="grid gap-1 rounded-control border border-border bg-surface-muted p-3">
        <StudyInstructionText variant="caption" tone="muted" weight="black">
         {t("comparison")}
        </StudyInstructionText>
        <Typography as="p" variant="bodySmall" lang="zh-CN" className="flex flex-wrap gap-x-0.5">
         {diff.map((token, tokenIndex) => (
          <span
           data-dictation-diff={token.kind}
           key={`${token.kind}:${tokenIndex}:${token.value}`}
           title={
            token.expected && token.actual && token.expected !== token.actual
             ? t("expected", { value: token.expected })
             : undefined
           }
           className={
            token.kind === "match"
             ? "text-success-text"
             : token.kind === "missing"
               ? "text-warning-text line-through"
               : "text-danger-text"
           }
          >
           {token.kind === "missing" ? `(${token.expected})` : token.value}
          </span>
         ))}
        </Typography>
       </div>
      ) : null}

      {showTranscript ? (
       <ListeningTranscriptBlock
        transcript={entry.transcript}
        displayMode={displayMode}
        onSpeak={onSpeak}
        onSpeakSequence={onSpeakSequence}
       />
      ) : null}
     </Card>
    );
   })}
  </div>
 );
}

export function ListeningDictationWorkspace() {
 const t = useTranslations("Listening");
 const runtime = useHanziHomeRuntime();
 const displayMode = lessonDisplaySettings(runtime.learningState, runtime.lesson);
 const tts = useSharedMandarinTts();
 const query = useHanziHomeListeningLesson(runtime.lesson.id);
 const [selectedSectionId, setSelectedSectionId] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const [playbackMode, setPlaybackMode] = useState<"sentence" | "passage">("sentence");
 const { persistAttempt, attemptSaveError } = useDictationAttempts();
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const bundle = query.data;
 const selectedSection =
  bundle?.sections.find((section) => section.id === selectedSectionId) ?? bundle?.sections[0];
 const selectedItems = useMemo(
  () => (bundle && selectedSection ? itemsForListeningSection(bundle, selectedSection.id) : []),
  [bundle, selectedSection],
 );
 const transcriptEntries = useMemo(
  () => (selectedSection ? transcriptsForListeningSection(selectedSection, selectedItems) : []),
  [selectedItems, selectedSection],
 );
 const playAllText = transcriptEntries.map(dictationEntryText).join("\n");

 if (query.isPending) {
  return (
   <Card variant="default" padding="lg" className="flex min-h-64 items-center justify-center gap-2">
    <Spinner />
    <StudyInstructionText as="span" tone="muted" weight="bold">
     {t("dictationLoading")}
    </StudyInstructionText>
   </Card>
  );
 }

 if (query.isError) {
  return (
   <QueryErrorCard
    title={t("loadError")}
    description={t("loadErrorHelp")}
    retryLabel={t("retry")}
    onRetry={() => {
     void query.refetch();
    }}
   />
  );
 }
 if (!bundle || !selectedSection) {
  return (
   <Card variant="default" padding="lg" className="grid min-h-64 place-content-center">
    <div className="grid gap-1 text-center">
     <StudyInstructionText tone="default" weight="black">
      {t("emptyTitle")}
     </StudyInstructionText>
     <StudyInstructionText variant="bodySmall" tone="muted">
      {t("empty")}
     </StudyInstructionText>
    </div>
   </Card>
  );
 }

 const categoryLabels = new Map([
  ["listening_comprehension", t("categories.listening_comprehension")],
  ["pronunciation", t("categories.pronunciation")],
  ["extra_practice", t("categories.extra_practice")],
 ]);
 const sidebar = (
  <div className="grid content-start gap-2">
   {LISTENING_CATEGORIES.map((category) => {
    const sections = bundle.sections.filter((section) => section.category === category);
    if (sections.length === 0) return null;
    return (
     <div key={category} className="grid gap-1.5">
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="black"
       scale="micro"
       className="px-1 pt-2"
      >
       {categoryLabels.get(category)}
      </StudyInstructionText>
      {sections.map((section, index) => (
       <LessonModuleSidebarItem
        key={section.id}
        selected={section.id === selectedSection.id}
        title={`${index + 1}. ${section.titleZh}`}
        subtitle={section.titleVi}
        icon={<Keyboard />}
        onClick={() => setSelectedSectionId(section.id)}
       />
      ))}
     </div>
    );
   })}
  </div>
 );

 return (
  <LessonModuleFrame
   title={t("dictation")}
   subtitle={t("dictationSubtitle")}
   sidebarLabel={t("sidebar")}
   sidebarSummary={t("groups", { count: bundle.sections.length })}
   sidebarOpen={sidebarOpen}
   onSidebarOpenChange={setSidebarOpen}
   sidebarSelectionKey={selectedSection.id}
   sidebar={sidebar}
   sidebarRail={
    <>
     {bundle.sections.map((section, index) => (
      <LessonModuleSidebarRailItem
       key={section.id}
       icon={
        <StudyInstructionText as="span" variant="caption" weight="black">
         {index + 1}
        </StudyInstructionText>
       }
       label={section.titleZh}
       selected={section.id === selectedSection.id}
       onClick={() => setSelectedSectionId(section.id)}
      />
     ))}
    </>
   }
   actions={<Badge variant="purple">{t("paragraphs", { count: transcriptEntries.length })}</Badge>}
  >
   <div className="grid gap-2.5">
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("playbackMode")}>
     <StudyInstructionText variant="caption" tone="muted" weight="black">
      {t("replayLabel")}
     </StudyInstructionText>
     <Button
      type="button"
      size="sm"
      variant={playbackMode === "sentence" ? "active" : "outline"}
      aria-pressed={playbackMode === "sentence"}
      onClick={() => setPlaybackMode("sentence")}
     >
      {t("sentenceMode")}
     </Button>
     <Button
      type="button"
      size="sm"
      variant={playbackMode === "passage" ? "active" : "outline"}
      aria-pressed={playbackMode === "passage"}
      onClick={() => setPlaybackMode("passage")}
     >
      {t("paragraphMode")}
     </Button>
    </div>
    <MandarinTtsControls text={playAllText} tts={tts} />
    {attemptSaveError ? (
     <StudyInstructionText variant="caption" tone="danger">
      {t("saveError")}
     </StudyInstructionText>
    ) : null}

    <Card variant="section" padding="md" className="grid">
     <div className="flex items-start gap-2">
      <Headphones className="size-5 shrink-0 translate-y-0.5 text-primary" />
      <div className="grid min-w-0 gap-1">
       <Badge variant="purple" className="justify-self-start">
        {t("dictationLesson")}
       </Badge>
       <ReaderHanziText as="h2" displayMode={displayMode} size="lg" leading="relaxed">
        {selectedSection.titleZh}
       </ReaderHanziText>
       {selectedSection.titleVi ? (
        <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
         {selectedSection.titleVi}
        </StudyInstructionText>
       ) : null}
      </div>
     </div>
    </Card>

    {transcriptEntries.length > 0 ? (
     <DictationCards
      key={selectedSection.id}
      entries={transcriptEntries}
      displayMode={displayMode}
      onSpeak={tts.speak}
      onSpeakSequence={tts.speakSequence}
      onAttempt={persistAttempt}
      playbackMode={playbackMode}
      passageText={playAllText}
     />
    ) : (
     <Card variant="subtle" padding="lg">
      <div className="grid gap-1 text-center">
       <StudyInstructionText tone="default" weight="black">
        {t("noDictationTranscript")}
       </StudyInstructionText>
       <StudyInstructionText variant="bodySmall" tone="muted">
        {t("chooseOther")}
       </StudyInstructionText>
      </div>
     </Card>
    )}
   </div>
  </LessonModuleFrame>
 );
}
