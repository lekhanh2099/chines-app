"use client";

import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Typography } from "@/components/ui/display/typography";
import { MandarinTtsControls } from "@/features/hanzihome/listening/MandarinTtsControls";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";

import { splitTtsStudioText, type TtsSegmentMode } from "./tts-studio.schemas";

import { useTtsLibrary } from "./useTtsLibrary";
import { useTtsStudioSave } from "./useTtsStudioSave";
import { useTtsStudioPlayback } from "./useTtsStudioPlayback";
import { ttsActiveSegmentIndex, ttsStudioTextSummary } from "./tts-studio-utils";
import { TtsStudioContentCard } from "./TtsStudioContentCard";
import { TtsStudioLibraryPanel } from "./TtsStudioLibraryPanel";
import { TtsStudioListenSection } from "./TtsStudioListenSection";
import { TtsStudioSavePanel } from "./TtsStudioSavePanel";

const ttsSampleText =
 "学习语言不能只怕出错。越怕开口说，就越没有机会进步。\n每天听一点、说一点，慢慢地就会越来越自然。";

export function TtsStudioWorkspace({ sourceText = "" }: { sourceText?: string }) {
 const t = useTranslations("TtsStudio");
 const tts = useSharedMandarinTts();
 const searchParams = useSearchParams();
 const requestedText = searchParams.get("text") ?? "";
 const { speakSequence } = tts;
 const [text, setText] = useState(() => requestedText || sourceText || ttsSampleText);
 const [workspaceTab, setWorkspaceTab] = useState<"compose" | "library">("compose");
 const [title, setTitle] = useState("");
 const [mode, setMode] = useState<TtsSegmentMode>("sentence");
 const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
 const [autoAdvance, setAutoAdvance] = useState(false);
 const [loopCurrent, setLoopCurrent] = useState(false);
 const [folderName, setFolderName] = useState("");
 const [folderId, setFolderId] = useState<string | null>(null);
 const libraryQuery = useTtsLibrary(workspaceTab === "library" || folderId !== null);
 const folders = libraryQuery.data?.folders ?? [];
 const clips = libraryQuery.data?.clips ?? [];
 const {
  audioUrl,
  isGenerating,
  saveError,
  saveFolder,
  saveClip,
  generatePreview,
  resetPreview,
  hasText,
  isSavingClip,
  isCreatingFolder,
 } = useTtsStudioSave({
  text,
  title,
  folderName,
  folderId,
  selectedVoice: tts.selectedVoice,
  rate: tts.rate,
  generateAudio: tts.generateAudio,
  onFolderCreated: (folder) => {
   setFolderId(folder.id);
   setFolderName("");
  },
 });
 const segments = useMemo(() => splitTtsStudioText(text, mode), [mode, text]);
 const effectiveActiveSegmentIndex = ttsActiveSegmentIndex(activeSegmentIndex, segments.length);
 const { characterCount, sentenceCount, paragraphCount, estimatedDuration } = useMemo(
  () => ttsStudioTextSummary(text),
  [text],
 );
 const { playSegments, playSegmentAt, stopPlayback, openClip } = useTtsStudioPlayback({
  text,
  mode,
  segments,
  autoAdvance,
  loopCurrent,
  speakSequence,
  stop: tts.stop,
  pause: tts.pause,
  resume: tts.resume,
  isSpeaking: tts.isSpeaking,
  isPaused: tts.isPaused,
  onSelect: setActiveSegmentIndex,
  setSelectedVoiceName: tts.setSelectedVoiceName,
  setRate: tts.setRate,
  onOpenClip: (clip) => {
   setWorkspaceTab("compose");
   setText(clip.text);
   setTitle(clip.title);
   setFolderId(clip.folder_id);
  },
 });

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <Typography as="h1" variant="pageTitle" weight="black">
       {t("heading")}
      </Typography>
      <Typography as="p" variant="body" tone="muted">
       {sourceText ? t("sourceDescription") : t("description")}
      </Typography>
     </div>
    </div>
   </Card>

   <Tabs
    value={workspaceTab}
    items={[
     { key: "compose", label: t("compose") },
     { key: "library", label: t("library") },
    ]}
    onValueChange={setWorkspaceTab}
    aria-label={t("workspaceAria")}
   >
    <TabsContent value="compose" className="pt-4 sm:pt-5">
     {workspaceTab === "compose" ? (
      <>
       <TtsStudioContentCard
        text={text}
        setText={setText}
        characterCount={characterCount}
        paragraphCount={paragraphCount}
        sentenceCount={sentenceCount}
        estimatedDuration={estimatedDuration}
        tts={tts}
       />

       <Card asChild variant="default" padding="none">
        <details>
         <summary className="cursor-pointer list-none px-3 py-3 text-sm font-bold text-text-primary [&::-webkit-details-marker]:hidden">
          {t("voiceSettings")}
         </summary>
         <div className="border-t border-border-default p-3">
          <MandarinTtsControls text={text} tts={tts} onPlayAll={playSegments} />
         </div>
        </details>
       </Card>

       <TtsStudioListenSection
        mode={mode}
        setMode={setMode}
        segments={segments}
        effectiveActiveSegmentIndex={effectiveActiveSegmentIndex}
        setActiveSegmentIndex={setActiveSegmentIndex}
        loopCurrent={loopCurrent}
        setLoopCurrent={setLoopCurrent}
        autoAdvance={autoAdvance}
        setAutoAdvance={setAutoAdvance}
        playSegmentAt={playSegmentAt}
        tts={tts}
       />

       <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
         type="button"
         disabled={!hasText || isGenerating}
         onClick={() => void generatePreview()}
        >
         {isGenerating ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
         {t("generateMp3")}
        </Button>
        <Button
         type="button"
         variant="ghost"
         disabled={!text && !title}
         onClick={() => {
          stopPlayback();
          setText("");
          setTitle("");
          resetPreview();
         }}
        >
         {t("clear")}
        </Button>
       </div>

       {audioUrl || saveError ? (
        <TtsStudioSavePanel
         title={title}
         setTitle={setTitle}
         folderName={folderName}
         setFolderName={setFolderName}
         folderId={folderId}
         setFolderId={setFolderId}
         folders={folders}
         hasText={hasText}
         isGenerating={isGenerating}
         isSavingClip={isSavingClip}
         isCreatingFolder={isCreatingFolder}
         saveClip={saveClip}
         saveFolder={saveFolder}
         generatePreview={generatePreview}
         saveError={saveError}
         audioUrl={audioUrl}
         tts={tts}
        />
       ) : null}
      </>
     ) : null}
    </TabsContent>

    <TabsContent value="library" className="pt-4 sm:pt-5">
     {workspaceTab === "library" ? (
      <TtsStudioLibraryPanel
       libraryQuery={libraryQuery}
       clips={clips}
       speakSequence={speakSequence}
       openClip={openClip}
      />
     ) : null}
    </TabsContent>
   </Tabs>
  </div>
 );
}
