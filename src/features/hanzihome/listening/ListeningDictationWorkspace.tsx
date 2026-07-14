"use client";

import { useMemo, useState } from "react";
import { Headphones, Keyboard, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { LessonReadingSettingsDialog } from "@/features/hanzihome/components/lesson-overview/LessonReadingSettings";
import { getHanziTypographyStyle } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import {
 LessonModuleFrame,
 LessonModuleSidebarRailItem,
} from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";

import { ListeningTranscriptBlock } from "./ListeningTranscriptBlock";
import { NativeMandarinTtsControls } from "./NativeMandarinTtsControls";
import { listeningCategoryLabels } from "./listening.labels";
import type { ListeningCategory } from "./listening.types";
import {
 itemsForListeningSection,
 transcriptsForListeningSection,
 type ListeningTranscriptEntry,
} from "./listening.view-model";
import { useHanziHomeListeningLesson } from "./useHanziHomeListeningLesson";
import { useNativeMandarinTts } from "./useNativeMandarinTts";
import type { MandarinSpeechSegment } from "./useNativeMandarinTts";

function normalizeDictationText(text: string) {
 return text
  .normalize("NFKC")
  .toLocaleLowerCase("zh-CN")
  .replace(/[\s\p{P}\p{S}]/gu, "");
}

function dictationText(entry: ListeningTranscriptEntry) {
 const spokenLines = entry.transcript.lines.map((line) => line.zh.trim()).filter(Boolean);
 return spokenLines.length > 0 ? spokenLines.join("\n") : entry.transcript.full.zh;
}

function editDistance(left: string, right: string) {
 const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

 for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
  const current = [leftIndex];
  for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
   current[rightIndex] = Math.min(
    (current[rightIndex - 1] ?? 0) + 1,
    (previous[rightIndex] ?? 0) + 1,
    (previous[rightIndex - 1] ?? 0) + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
   );
  }
  previous.splice(0, previous.length, ...current);
 }

 return previous[right.length] ?? 0;
}

function dictationScore(answer: string, expected: string) {
 const normalizedAnswer = normalizeDictationText(answer);
 const normalizedExpected = normalizeDictationText(expected);
 const length = Math.max(normalizedAnswer.length, normalizedExpected.length);
 if (length === 0) return 0;
 return Math.max(
  0,
  Math.round((1 - editDistance(normalizedAnswer, normalizedExpected) / length) * 100),
 );
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
 onSpeakSequence: (segments: MandarinSpeechSegment[]) => void;
}) {
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [checked, setChecked] = useState<Record<string, boolean>>({});
 const [revealed, setRevealed] = useState<Record<string, boolean>>({});

 return (
  <div className="grid gap-2.5">
   {entries.map((entry, index) => {
    const answer = answers[entry.id] ?? "";
    const isChecked = checked[entry.id] ?? false;
    const expectedText = dictationText(entry);
    const score = isChecked ? dictationScore(answer, expectedText) : null;
    const showTranscript = revealed[entry.id] ?? isChecked;

    return (
     <Card key={entry.id} variant="default" padding="md" className="grid gap-3 rounded-xl">
      <div className="flex min-w-0 items-center gap-2">
       <Badge
        variant={score === 100 ? "success" : "purple"}
        className="size-8 justify-center rounded-lg p-0"
       >
        {index + 1}
       </Badge>
       <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-text-primary">Câu {index + 1}</p>
        <p className="truncate text-xs font-semibold text-text-muted">Nghe → chép → kiểm tra</p>
       </div>
       <Button type="button" variant="surface" size="sm" onClick={() => onSpeak(expectedText)}>
        <Play data-icon="inline-start" />
        Nghe lại
       </Button>
      </div>

      <Textarea
       value={answer}
       rows={3}
       lang="zh-CN"
       className="min-h-20 rounded-xl bg-bg-subtle"
       aria-label={`Bài chép chính tả đoạn ${index + 1}`}
       placeholder="Nghe và chép lại bằng chữ Hán…"
       onChange={(event) => {
        const value = event.target.value;
        setAnswers((current) => ({ ...current, [entry.id]: value }));
        setChecked((current) => ({ ...current, [entry.id]: false }));
       }}
      />

      <div className="flex flex-wrap items-center gap-2">
       <Button
        type="button"
        size="sm"
        disabled={!answer.trim()}
        onClick={() => {
         setChecked((current) => ({ ...current, [entry.id]: true }));
         setRevealed((current) => ({ ...current, [entry.id]: true }));
        }}
       >
        Kiểm tra
       </Button>
       <Button
        type="button"
        variant="outline"
        size="sm"
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
 const actions = useHanziHomeFeatureActions();
 const displayMode = useHanziHomeFeatureSelector((state) => state.lessonTextDisplayMode);
 const tts = useNativeMandarinTts();
 const query = useHanziHomeListeningLesson(runtime.lesson.id);
 const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
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

 function updateDisplayMode(updates: Partial<typeof displayMode>) {
  const nextDisplayMode = { ...displayMode, ...updates };
  actions.setLessonTextDisplayMode(updates);
  runtime.updateLearningSettings({ lessonTextDisplayMode: nextDisplayMode });
 }

 if (query.isPending) {
  return (
   <Card variant="default" padding="lg" className="flex min-h-64 items-center justify-center gap-2">
    <Spinner />
    <span className="font-bold text-text-muted">Đang tải bài nghe chép…</span>
   </Card>
  );
 }

 if (query.isError || !bundle || !selectedSection) {
  return (
   <Card
    variant="default"
    padding="lg"
    className="grid min-h-64 place-content-center gap-2 text-center"
   >
    <p className="font-black text-text-primary">Không tải được bài nghe chép</p>
    <p className="text-sm text-text-muted">
     {query.error?.message ?? "Bài này chưa có dữ liệu nghe."}
    </p>
   </Card>
  );
 }

 const sidebar = (
  <div className="grid content-start gap-2">
   {(Object.keys(listeningCategoryLabels) as ListeningCategory[]).map((category) => {
    const sections = bundle.sections.filter((section) => section.category === category);
    if (sections.length === 0) return null;
    return (
     <div key={category} className="grid gap-1.5">
      <p className="px-1 pt-2 text-[0.65rem] font-black text-text-muted">
       {listeningCategoryLabels[category]}
      </p>
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
       icon={<span className="text-xs font-black">{index + 1}</span>}
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
    <NativeMandarinTtsControls text={playAllText} tts={tts} />

    <LessonReadingSettingsDialog displayMode={displayMode} onChange={updateDisplayMode} />

    <Card variant="glass" padding="md" className="grid gap-1.5 rounded-xl">
     <div className="flex items-start gap-2">
      <Headphones className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0">
       <Badge variant="purple" className="mb-1 w-fit">
        Bài nghe chép
       </Badge>
       <h2
        lang="zh-CN"
        className="leading-relaxed text-text-primary"
        style={getHanziTypographyStyle(displayMode, { size: "lg" })}
       >
        {selectedSection.titleZh}
       </h2>
       {selectedSection.titleVi ? (
        <p className="text-sm font-medium text-text-muted">{selectedSection.titleVi}</p>
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
     <Card variant="subtle" padding="lg" className="rounded-xl text-center">
      <p className="font-black text-text-primary">Phần này chưa có script để nghe chép.</p>
      <p className="mt-1 text-sm text-text-muted">Chọn đề mục khác có nội dung ghi âm.</p>
     </Card>
    )}
   </div>
  </LessonModuleFrame>
 );
}
