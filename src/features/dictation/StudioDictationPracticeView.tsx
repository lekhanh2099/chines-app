"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { StudioDictationPracticePanel } from "@/features/dictation/StudioDictationPracticePanel";
import { StudioDictationReferencePanel } from "@/features/dictation/StudioDictationReferencePanel";
import type { useDictationPlayback } from "./useDictationPlayback";
import type { StudioDictationPracticeFlow } from "./useStudioDictationPracticeFlow";
import type { StudioDictationSourceState } from "./useStudioDictationSource";

/** Step 3: practice header, dictation transport panel and reference sidebar. */
export function StudioDictationPracticeView({
 source,
 flow,
 playback,
 tts,
 titleZh,
 titleVi,
 playbackModeLabel,
 onChangeMode,
 onChangeSource,
}: {
 source: StudioDictationSourceState;
 flow: StudioDictationPracticeFlow;
 playback: ReturnType<typeof useDictationPlayback>;
 tts: ReturnType<typeof useSharedMandarinTts>;
 titleZh: string;
 titleVi: string;
 playbackModeLabel: string;
 onChangeMode: () => void;
 onChangeSource: () => void;
}) {
 const t = useTranslations("Dictation");
 const { sourceEntries, selectedBook, selectedSection, selectedClip } = source;
 const { checkedEntryIds, scriptMode, setScriptMode, persistAttempt, attemptSaveError } = flow;
 const {
  effectiveActiveEntryIndex,
  loopCurrent,
  autoAdvance,
  selectTransportEntry,
  playTransport,
  toggleTransportPlayback,
  changeTransportLoop,
  changeTransportAutoAdvance,
 } = playback;
 return (
  <div className="grid gap-4">
   <section className="flex flex-col gap-3 border-b border-border-default pb-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="grid min-w-0 gap-1">
     <Typography variant="overline" tone="accent" weight="black">
      {t("stepPractice")}
     </Typography>
     <Typography as="h2" variant="sectionTitle" weight="black" clamp="one">
      {titleZh}
     </Typography>
     <Typography variant="bodySmall" tone="muted" clamp="one">
      {playbackModeLabel} · {titleVi}
     </Typography>
    </div>
    <div className="flex shrink-0 flex-wrap gap-2">
     <Button type="button" variant="outline" onClick={onChangeMode}>
      {t("changeMode")}
     </Button>
     <Button type="button" variant="outline" onClick={onChangeSource}>
      {t("changeSource")}
     </Button>
    </div>
   </section>

   <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
    <div className="min-w-0">
     <StudioDictationPracticePanel
      activeIndex={effectiveActiveEntryIndex}
      autoAdvance={autoAdvance}
      checkedCount={checkedEntryIds.size}
      checkedEntryIds={checkedEntryIds}
      entries={sourceEntries}
      isLoading={tts.isLoading}
      isPaused={tts.isPaused}
      isSpeaking={tts.isSpeaking}
      loopCurrent={loopCurrent}
      rate={tts.rate}
      scriptMode={scriptMode}
      selectedVoiceName={tts.selectedVoiceName}
      voices={tts.voices}
      onAttempt={persistAttempt}
      onAutoAdvanceChange={changeTransportAutoAdvance}
      onLoopCurrentChange={changeTransportLoop}
      onNext={() =>
       selectTransportEntry(Math.min(sourceEntries.length - 1, effectiveActiveEntryIndex + 1))
      }
      onPlayToggle={toggleTransportPlayback}
      onPrevious={() => selectTransportEntry(Math.max(0, effectiveActiveEntryIndex - 1))}
      onRateChange={(next) => {
       tts.stop();
       tts.setRate(next);
      }}
      onRepeat={playTransport}
      onScriptModeChange={setScriptMode}
      onSelect={selectTransportEntry}
      onStop={tts.stop}
      onVoiceChange={(next) => {
       tts.stop();
       tts.setSelectedVoiceName(next);
      }}
     />
    </div>
    <aside className="min-w-0 xl:sticky xl:top-3 xl:self-start">
     <StudioDictationReferencePanel
      activeIndex={effectiveActiveEntryIndex}
      entries={sourceEntries}
      isPlaybackActive={tts.isLoading || tts.isPaused || tts.isSpeaking}
      sourceLabel={
       selectedBook?.title || selectedSection?.titleVi || selectedClip?.title || t("currentLesson")
      }
      titleVi={titleVi}
      titleZh={titleZh}
     />
    </aside>
   </div>
   {attemptSaveError ? (
    <Typography variant="caption" tone="danger">
     {t("saveError")}
    </Typography>
   ) : null}
  </div>
 );
}
