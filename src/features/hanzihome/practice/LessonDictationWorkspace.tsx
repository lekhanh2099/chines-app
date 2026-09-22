"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { useListeningHotkeys } from "@/features/hanzihome/listening/useListeningHotkeys";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import type { HanyuLesson } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import type { DictationAttempt } from "@/features/dictation/dictation-session";
import { StudioDictationPracticePanel } from "@/features/dictation/StudioDictationPracticePanel";
import { StudioDictationReferencePanel } from "@/features/dictation/StudioDictationReferencePanel";
import type { StudioDictationScriptMode } from "@/features/dictation/StudioDictationSettingsMenu";
import { dictationSourcesFromLesson, type DictationSource } from "./translation-practice";

export type LessonDictationWorkspaceProps = {
 sourceLesson?: HanyuLesson;
 sources?: DictationSource[];
 titleVi?: string;
 titleZh?: string;
};

export function LessonDictationWorkspace({
 sourceLesson,
 sources: explicitSources,
 titleVi,
 titleZh,
}: LessonDictationWorkspaceProps) {
 const tts = useSharedMandarinTts();
 const { stop } = tts;
 const sources = useMemo(
  () => explicitSources ?? dictationSourcesFromLesson(sourceLesson),
  [explicitSources, sourceLesson],
 );
 const [selectedSourceId, setSelectedSourceId] = useState("");
 const [activeIndex, setActiveIndex] = useState(0);
 const [checkedEntryIds, setCheckedEntryIds] = useState<Set<string>>(() => new Set());
 const [loopCurrent, setLoopCurrent] = useState(false);
 const [autoAdvance, setAutoAdvance] = useState(false);
 const [scriptMode, setScriptMode] = useState<StudioDictationScriptMode>("hidden");
 const loopCurrentRef = useRef(false);
 const autoAdvanceRef = useRef(false);
 const selectedSource = sources.find((source) => source.id === selectedSourceId) ?? sources[0];
 const entries = useMemo<ListeningTranscriptEntry[]>(
  () =>
   selectedSource
    ? selectedSource.entries.map((entry) => ({
       id: entry.id,
       title: selectedSource.label,
       transcript: {
        mode: "monologue",
        speakers: [
         { id: "lesson-dictation", labelZh: "练习", labelVi: "Bài luyện", voice: "neutral" },
        ],
        lines: [
         {
          order: 1,
          speakerId: "lesson-dictation",
          zh: entry.zh,
          pinyin: entry.pinyin,
          ...(entry.vi ? { vi: entry.vi } : {}),
         },
        ],
        full: {
         zh: entry.zh,
         pinyin: entry.pinyin,
         ...(entry.vi ? { vi: entry.vi } : {}),
        },
       },
      }))
    : [],
  [selectedSource],
 );
 const effectiveActiveIndex = Math.min(Math.max(0, activeIndex), Math.max(0, entries.length - 1));

 useEffect(() => () => stop(), [stop]);

 const selectSource = (sourceId: string) => {
  tts.stop();
  loopCurrentRef.current = false;
  autoAdvanceRef.current = false;
  setSelectedSourceId(sourceId);
  setActiveIndex(0);
  setCheckedEntryIds(new Set());
  setLoopCurrent(false);
  setAutoAdvance(false);
  setScriptMode("hidden");
 };

 const selectEntry = (index: number) => {
  if (!entries[index]) return;
  tts.stop();
  setActiveIndex(index);
 };

 const playEntry = (index: number) => {
  const entry = entries[index];
  if (!entry) return;
  const text = entry.transcript.lines
   .map((line) => line.zh.trim())
   .filter(Boolean)
   .join("\n");
  if (!text) return;

  tts.speakSequence([text], () => {
   if (loopCurrentRef.current) {
    playEntry(index);
    return;
   }
   if (autoAdvanceRef.current && index < entries.length - 1) {
    const nextIndex = index + 1;
    setActiveIndex(nextIndex);
    playEntry(nextIndex);
   }
  });
 };

 const togglePlayback = () => {
  if (tts.isLoading) return;
  if (tts.isPaused) {
   tts.resume();
   return;
  }
  if (tts.isSpeaking) {
   tts.pause();
   return;
  }
  playEntry(effectiveActiveIndex);
 };

 const changeLoopCurrent = (next: boolean) => {
  loopCurrentRef.current = next;
  setLoopCurrent(next);
  if (next) {
   autoAdvanceRef.current = false;
   setAutoAdvance(false);
  }
 };

 const changeAutoAdvance = (next: boolean) => {
  autoAdvanceRef.current = next;
  setAutoAdvance(next);
  if (next) {
   loopCurrentRef.current = false;
   setLoopCurrent(false);
  }
 };

 const recordAttempt = (attempt: DictationAttempt) => {
  setCheckedEntryIds((current) => new Set(current).add(attempt.entryId));
 };

 useListeningHotkeys({
  enabled: entries.length > 0,
  onPrevious: () => selectEntry(Math.max(0, effectiveActiveIndex - 1)),
  onPlayToggle: togglePlayback,
  onRepeat: () => playEntry(effectiveActiveIndex),
  onNext: () => selectEntry(Math.min(entries.length - 1, effectiveActiveIndex + 1)),
  onToggleLoop: () => changeLoopCurrent(!loopCurrentRef.current),
  onStop: tts.stop,
 });

 if (!selectedSource) {
  return (
   <Card variant="section" padding="lg">
    <Typography variant="bodySmall" tone="muted">
     Bài này chưa có Bài khóa, Bài đọc thêm hoặc đáp án bài tập để luyện nghe chép.
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
     <div className="grid gap-1">
      <Typography variant="overline" tone="accent" weight="black">
       NGHE CHÉP
      </Typography>
      <Typography as="h2" variant="sectionTitle" weight="black">
       {selectedSource.label}
      </Typography>
      <Typography variant="bodySmall" tone="muted">
       Chọn phần cần luyện, rồi nghe và chép lại từng câu.
      </Typography>
     </div>
     <Badge casing="natural">{entries.length} phần</Badge>
    </div>
    <Select value={selectedSource.id} onValueChange={selectSource}>
     <SelectTrigger width="full" aria-label="Chọn nội dung luyện nghe chép">
      <SelectValue placeholder="Chọn phần của bài" />
     </SelectTrigger>
     <SelectContent>
      <SelectGroup>
       {sources.map((source) => (
        <SelectItem key={source.id} value={source.id}>
         {source.label} · {source.entries.length} phần
        </SelectItem>
       ))}
      </SelectGroup>
     </SelectContent>
    </Select>
   </Card>

   <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <StudioDictationPracticePanel
     activeIndex={effectiveActiveIndex}
     autoAdvance={autoAdvance}
     checkedCount={checkedEntryIds.size}
     entries={entries}
     isLoading={tts.isLoading}
     isPaused={tts.isPaused}
     isSpeaking={tts.isSpeaking}
     loopCurrent={loopCurrent}
     rate={tts.rate}
     scriptMode={scriptMode}
     selectedVoiceName={tts.selectedVoiceName}
     showSettings={true}
     voices={tts.voices}
     onAttempt={recordAttempt}
     onAutoAdvanceChange={changeAutoAdvance}
     onLoopCurrentChange={changeLoopCurrent}
     onNext={() => selectEntry(Math.min(entries.length - 1, effectiveActiveIndex + 1))}
     onPlayToggle={togglePlayback}
     onPrevious={() => selectEntry(Math.max(0, effectiveActiveIndex - 1))}
     onRateChange={tts.setRate}
     onRepeat={() => playEntry(effectiveActiveIndex)}
     onScriptModeChange={setScriptMode}
     onSelect={selectEntry}
     onStop={tts.stop}
     onVoiceChange={tts.setSelectedVoiceName}
    />
    <aside className="min-w-0 xl:sticky xl:top-3 xl:self-start">
     <StudioDictationReferencePanel
      activeIndex={effectiveActiveIndex}
      entries={entries}
      isPlaybackActive={tts.isLoading || tts.isPaused || tts.isSpeaking}
      sourceLabel={selectedSource.label}
      titleVi={titleVi || sourceLesson?.lesson.title.vi || selectedSource.label}
      titleZh={titleZh || sourceLesson?.lesson.title.zh || selectedSource.label}
     />
    </aside>
   </div>
  </div>
 );
}
