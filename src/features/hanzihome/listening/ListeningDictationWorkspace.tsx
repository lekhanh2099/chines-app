"use client";

import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Headphones, Keyboard, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
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
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import { buildDictationDiff } from "../practice/dictation-comparison";
import { createDictationAttempt, type DictationAttempt } from "../practice/dictation-session";

import { ListeningTranscriptBlock } from "./ListeningTranscriptBlock";
import { MandarinTtsControls } from "./MandarinTtsControls";
import { useSharedMandarinTts } from "./MandarinTtsProvider";
import { listeningCategoryLabels } from "./listening.labels";
import { LISTENING_CATEGORIES } from "./listening.types";
import {
 itemsForListeningSection,
 transcriptsForListeningSection,
 type ListeningTranscriptEntry,
} from "./listening.view-model";
import { useHanziHomeListeningLesson } from "./useHanziHomeListeningLesson";

function dictationText(entry: ListeningTranscriptEntry) {
 const spokenLines = entry.transcript.lines.map((line) => line.zh.trim()).filter(Boolean);
 return spokenLines.length > 0 ? spokenLines.join("\n") : entry.transcript.full.zh;
}

function DictationCards({
 entries,
 displayMode,
 onSpeak,
 onSpeakSequence,
}: {
 entries: ListeningTranscriptEntry[];
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onSpeakSequence: (segments: string[]) => void;
}) {
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [attempts, setAttempts] = useState<Record<string, DictationAttempt>>({});
 const [revealed, setRevealed] = useState<Record<string, boolean>>({});
 const startedAtRef = useRef<Record<string, number>>({});

 return (
  <div className="grid gap-2.5">
   {entries.map((entry, index) => {
    const answer = answers[entry.id] ?? "";
    const attempt = attempts[entry.id];
    const isChecked = attempt !== undefined;
    const expectedText = dictationText(entry);
    const score = attempt?.score ?? null;
    const diff = isChecked ? buildDictationDiff(expectedText, answer) : [];
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
         Câu {index + 1}
        </StudyInstructionText>
        <StudyInstructionText variant="caption" tone="muted" weight="semibold" clamp="one">
         Nghe → chép → kiểm tra
        </StudyInstructionText>
       </div>
       <Button type="button" variant="surface" size="toolbar" onClick={() => onSpeak(expectedText)}>
        <Play data-icon="inline-start" />
        Nghe lại
       </Button>
      </div>

      <Textarea
       value={answer}
       rows={3}
       lang="zh-CN"
       density="compact"
       surface="field"
       aria-label={`Bài chép chính tả đoạn ${index + 1}`}
       placeholder="Nghe và chép lại bằng chữ Hán…"
       onChange={(event) => {
        const value = event.target.value;
        startedAtRef.current[entry.id] ??= Date.now();
        setAnswers((current) => ({ ...current, [entry.id]: value }));
        setAttempts((current) => {
         const next = { ...current };
         delete next[entry.id];
         return next;
        });
       }}
      />

      <div className="flex flex-wrap items-center gap-2">
       <Button
        type="button"
        size="toolbar"
        disabled={!answer.trim()}
        onClick={() => {
         const startedAt = startedAtRef.current[entry.id];
         const responseMs = startedAt === undefined ? null : Math.max(0, Date.now() - startedAt);
         const nextAttempt = createDictationAttempt(entry.id, expectedText, answer, responseMs);
         setAttempts((current) => ({ ...current, [entry.id]: nextAttempt }));
         setRevealed((current) => ({ ...current, [entry.id]: true }));
        }}
       >
        Kiểm tra
       </Button>
       <Button
        type="button"
        variant="outline"
        size="toolbar"
        onClick={() => setRevealed((current) => ({ ...current, [entry.id]: !current[entry.id] }))}
       >
        {showTranscript ? "Ẩn script" : "Xem script"}
       </Button>
       {score !== null ? (
        <Badge variant={score === 100 ? "success" : score >= 70 ? "warning" : "danger"}>
         {score === 100 ? "Chính xác" : `Đúng ${score}%`}
        </Badge>
       ) : null}
      </div>

      {score !== null && diff.length > 0 ? (
       <div className="grid gap-1 rounded-control border border-border bg-surface-muted p-3">
        <StudyInstructionText variant="caption" tone="muted" weight="black">
         So sánh câu trả lời
        </StudyInstructionText>
        <Typography as="p" variant="bodySmall" lang="zh-CN" className="flex flex-wrap gap-x-0.5">
         {diff.map((token, tokenIndex) => (
          <span
           data-dictation-diff={token.kind}
           key={`${token.kind}:${tokenIndex}:${token.value}`}
           title={
            token.expected && token.actual && token.expected !== token.actual
             ? `Đúng: ${token.expected}`
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
 const runtime = useHanziHomeRuntime();
 const displayMode = useHanziHomeFeatureSelector((state) => state.lessonTextDisplayMode);
 const tts = useSharedMandarinTts();
 const query = useHanziHomeListeningLesson(runtime.lesson.id);
 const [selectedSectionId, setSelectedSectionId] =
  useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
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
 const playAllText = transcriptEntries.map(dictationText).join("\n");

 if (query.isPending) {
  return (
   <Card variant="default" padding="lg" className="flex min-h-64 items-center justify-center gap-2">
    <Spinner />
    <StudyInstructionText as="span" tone="muted" weight="bold">
     Đang tải bài nghe chép…
    </StudyInstructionText>
   </Card>
  );
 }

 if (query.isError || !bundle || !selectedSection) {
  return (
   <Card variant="default" padding="lg" className="grid min-h-64 place-content-center gap-2">
    <div className="grid gap-1 text-center">
     <StudyInstructionText tone="default" weight="black">
      Không tải được bài nghe chép
     </StudyInstructionText>
     <StudyInstructionText variant="bodySmall" tone="muted">
      {query.error?.message ?? "Bài này chưa có dữ liệu nghe."}
     </StudyInstructionText>
    </div>
   </Card>
  );
 }

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
       {listeningCategoryLabels[category]}
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
   title="Nghe chép"
   subtitle="Nghe nhiều lần, chép lại bằng chữ Hán rồi đối chiếu với script."
   sidebarLabel="Đề mục"
   sidebarSummary={`${bundle.sections.length} nhóm`}
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
   actions={<Badge variant="purple">{transcriptEntries.length} đoạn</Badge>}
  >
   <div className="grid gap-2.5">
    <MandarinTtsControls text={playAllText} tts={tts} />

    <Card variant="section" padding="md" className="grid gap-1.5">
     <div className="flex items-start gap-2">
      <Headphones className="size-5 shrink-0 translate-y-0.5 text-primary" />
      <div className="grid min-w-0 gap-1">
       <Badge variant="purple" className="w-fit">
        Bài nghe chép
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
     />
    ) : (
     <Card variant="subtle" padding="lg">
      <div className="grid gap-1 text-center">
       <StudyInstructionText tone="default" weight="black">
        Phần này chưa có script để nghe chép.
       </StudyInstructionText>
       <StudyInstructionText variant="bodySmall" tone="muted">
        Chọn đề mục khác có nội dung ghi âm.
       </StudyInstructionText>
      </div>
     </Card>
    )}
   </div>
  </LessonModuleFrame>
 );
}
