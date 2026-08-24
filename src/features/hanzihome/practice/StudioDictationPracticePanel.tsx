"use client";

import { Pause, Play, Repeat2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { ListeningShortcutLegend } from "@/features/hanzihome/listening/ListeningShortcutLegend";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import type { TTSVoice } from "@/hooks/useTTS";

import type { DictationAttempt } from "./dictation-session";
import { StudioDictationEditor } from "./StudioDictationEditor";
import {
 StudioDictationSettingsMenu,
 type StudioDictationScriptMode,
} from "./StudioDictationSettingsMenu";

function entryText(entry: ListeningTranscriptEntry) {
 const lines = entry.transcript.lines.map((line) => line.zh.trim()).filter(Boolean);
 return lines.length > 0 ? lines.join("\n") : entry.transcript.full.zh;
}

export function StudioDictationPracticePanel({
 activeIndex,
 autoAdvance,
 checkedCount,
 entries,
 isLoading,
 isPaused,
 isSpeaking,
 loopCurrent,
 rate,
 scriptMode,
 selectedVoiceName,
 showSettings = true,
 voices,
 onAttempt,
 onAutoAdvanceChange,
 onLoopCurrentChange,
 onNext,
 onPlayToggle,
 onPrevious,
 onRateChange,
 onRepeat,
 onScriptModeChange,
 onSelect,
 onStop,
 onVoiceChange,
}: {
 activeIndex: number;
 autoAdvance: boolean;
 checkedCount: number;
 entries: ListeningTranscriptEntry[];
 isLoading: boolean;
 isPaused: boolean;
 isSpeaking: boolean;
 loopCurrent: boolean;
 rate: number;
 scriptMode: StudioDictationScriptMode;
 selectedVoiceName: string;
 showSettings?: boolean;
 voices: TTSVoice[];
 onAttempt: (attempt: DictationAttempt) => void;
 onAutoAdvanceChange: (next: boolean) => void;
 onLoopCurrentChange: (next: boolean) => void;
 onNext: () => void;
 onPlayToggle: () => void;
 onPrevious: () => void;
 onRateChange: (next: number) => void;
 onRepeat: () => void;
 onScriptModeChange: (next: StudioDictationScriptMode) => void;
 onSelect: (index: number) => void;
 onStop: () => void;
 onVoiceChange: (next: string) => void;
}) {
 const entry = entries[activeIndex];
 if (!entry) return null;
 const text = entryText(entry);

 return (
  <Card variant="section" padding="md" className="grid content-start self-start gap-4">
   <header className="flex flex-col items-start justify-between gap-3 border-b border-border-default pb-3 sm:flex-row sm:items-center">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="black">
      Luyện nghe chép
     </Typography>
     <Typography variant="caption" tone="muted">
      Nghe → chép → kiểm tra. Đáp án chỉ hiện sau khi chấm hoặc khi bạn chủ động bật gợi ý.
     </Typography>
    </div>
    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
     <Badge casing="natural">
      {checkedCount}/{entries.length} đã chấm
     </Badge>
     {showSettings ? (
      <>
       <ListeningShortcutLegend />
       <StudioDictationSettingsMenu
        autoAdvance={autoAdvance}
        loopCurrent={loopCurrent}
        rate={rate}
        scriptMode={scriptMode}
        selectedVoiceName={selectedVoiceName}
        voices={voices}
        onAutoAdvanceChange={onAutoAdvanceChange}
        onLoopCurrentChange={onLoopCurrentChange}
        onRateChange={onRateChange}
        onScriptModeChange={onScriptModeChange}
        onVoiceChange={onVoiceChange}
       />
      </>
     ) : null}
    </div>
   </header>

   {entries.length > 1 ? (
    <div
     className="grid grid-cols-5 items-start gap-2 sm:grid-cols-8 md:grid-cols-10"
     aria-label="Chọn phần nghe"
    >
     {entries.map((candidate, index) => (
      <Button
       key={candidate.id}
       type="button"
       size="sm"
       variant={index === activeIndex ? "active" : "outline"}
       aria-current={index === activeIndex ? "step" : undefined}
       title={candidate.title}
       onClick={() => onSelect(index)}
      >
       {index + 1}
      </Button>
     ))}
    </div>
   ) : null}

   <div className="grid min-w-0 gap-3 border-t border-border-default pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div className="grid gap-1">
      <Typography variant="bodySmall" weight="black">
       {entry.title || `Phần ${activeIndex + 1}`}
      </Typography>
      <Typography variant="caption" tone="muted">
       {Array.from(text).length} ký tự
      </Typography>
     </div>
     <div className="flex flex-wrap items-center gap-2">
      <Button type="button" disabled={isLoading} onClick={onPlayToggle}>
       {isSpeaking && !isPaused ? (
        <Pause data-icon="inline-start" />
       ) : (
        <Play data-icon="inline-start" />
       )}
       {isLoading
        ? "Đang chuẩn bị"
        : isSpeaking && !isPaused
          ? "Tạm dừng"
          : isPaused
            ? "Tiếp tục"
            : "Nghe phần này"}
      </Button>
      <Button type="button" variant="ghost" onClick={onRepeat}>
       <Repeat2 data-icon="inline-start" />
       Nghe lại
      </Button>
     </div>
    </div>

    {scriptMode === "pinyin" ? (
     <Card variant="subtle" padding="sm">
      <Typography variant="bodySmall" tone="accent" wrapping="preWrap">
       {entry.transcript.full.pinyin || "Phần này chưa có pinyin."}
      </Typography>
     </Card>
    ) : null}
    {scriptMode === "hanzi" ? (
     <Card variant="subtle" padding="sm">
      <Typography variant="body" lang="zh-CN" wrapping="preWrap">
       {text}
      </Typography>
     </Card>
    ) : null}

    <StudioDictationEditor
     entry={entry}
     index={activeIndex}
     total={entries.length}
     onAttempt={onAttempt}
     onPrevious={onPrevious}
     onPlayToggle={onPlayToggle}
     onRepeat={onRepeat}
     onNext={onNext}
     onToggleLoop={onLoopCurrentChange.bind(null, !loopCurrent)}
     onStop={onStop}
    />
   </div>
  </Card>
 );
}
