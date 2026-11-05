"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { dictationEntryText } from "./dictation-workspace-utils";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { scrollAppContentToElement } from "@/components/layout/scroll/app-scroll";
import { ListeningShortcutLegend } from "@/features/hanzihome/listening/ListeningShortcutLegend";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import type { TTSVoice } from "@/hooks/useTTS";
import { cn } from "@/lib/utils";

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
 checkedEntryIds,
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
 checkedEntryIds?: ReadonlySet<string>;
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
 const activeButtonRef = useRef<HTMLButtonElement>(null);
 const entry = entries[activeIndex];

 useEffect(() => {
  scrollAppContentToElement(activeButtonRef.current, { block: "nearest" });
 }, [activeIndex]);

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
     className={cn(
      "grid grid-cols-5 items-start gap-1.5 sm:grid-cols-8 md:grid-cols-10",
      entries.length > 15 &&
       "max-h-28 overflow-y-auto rounded-xl border border-border-default/50 bg-bg-subtle/30 p-2 scrollbar-thin",
     )}
     aria-label={t("segmentAria")}
    >
     {entries.map((candidate, index) => {
      const isEntryActive = index === activeIndex;
      const isEntryDone = checkedEntryIds?.has(candidate.id);

      return (
       <Button
        key={candidate.id}
        ref={isEntryActive ? activeButtonRef : undefined}
        type="button"
        size="compact"
        variant={isEntryActive ? "active" : isEntryDone ? "success" : "outline"}
        aria-current={isEntryActive ? "step" : undefined}
        title={candidate.title}
        onClick={() => onSelect(index)}
       >
        <span>{index + 1}</span>
       </Button>
      );
     })}
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
