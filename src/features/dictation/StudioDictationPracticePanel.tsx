"use client";

import { useTranslations } from "next-intl";
import { dictationEntryText } from "./dictation-workspace-utils";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { ListeningShortcutLegend } from "@/features/hanzihome/listening/ListeningShortcutLegend";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import type { TTSVoice } from "@/hooks/useTTS";

import type { DictationAttempt } from "@/features/dictation/dictation-session";
import { StudioDictationEditor } from "@/features/dictation/StudioDictationEditor";
import {
 StudioDictationSettingsMenu,
 type StudioDictationScriptMode,
} from "@/features/dictation/StudioDictationSettingsMenu";

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
 const t = useTranslations("Dictation");
 const entry = entries[activeIndex];
 if (!entry) return null;
 const text = dictationEntryText(entry);

 return (
  <Card variant="section" padding="md" className="grid content-start self-start gap-4">
   <header className="flex flex-col items-start justify-between gap-3 border-b border-border-default pb-3 sm:flex-row sm:items-center">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="black">
      {t("practiceTitle")}
     </Typography>
     <Typography variant="caption" tone="muted">
      {t("practiceHelp")}
     </Typography>
    </div>
    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
     <Badge casing="natural">{t("checked", { count: checkedCount, total: entries.length })}</Badge>
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
     aria-label={t("segmentAria")}
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
    {entry.title ? (
     <div className="flex flex-wrap items-center justify-between gap-3">
      <Typography variant="bodySmall" weight="black">
       {entry.title}
      </Typography>
     </div>
    ) : null}

    {scriptMode === "pinyin" ? (
     <Card variant="subtle" padding="sm">
      <Typography variant="bodySmall" tone="accent" wrapping="preWrap">
       {entry.transcript.full.pinyin || t("noPinyin")}
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
     isLoading={isLoading}
     isPaused={isPaused}
     isSpeaking={isSpeaking}
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
