"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Textarea } from "@/components/ui/forms/textarea";
import { Typography } from "@/components/ui/display/typography";
import { MandarinTtsControls } from "@/features/hanzihome/listening/MandarinTtsControls";
import { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";

import { splitTtsStudioText, type TtsSegmentMode } from "./tts-studio.schemas";

import { useTtsLibrary } from "./useTtsLibrary";
import { useTtsStudioSave } from "./useTtsStudioSave";
import { useTtsStudioPlayback } from "./useTtsStudioPlayback";
import {
 ttsActiveSegmentIndex,
 ttsClipDownloadFilename,
 ttsStudioTextSummary,
} from "./tts-studio-utils";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";

const ttsSampleText =
 "学习语言不能只怕出错。越怕开口说，就越没有机会进步。\n每天听一点、说一点，慢慢地就会越来越自然。";

export function TtsStudioWorkspace({ sourceText = "" }: { sourceText?: string }) {
 const t = useTranslations("TtsStudio");
 const ttsRatePresets = [
  { label: t("natural"), rate: 1 },
  { label: t("slow"), rate: 0.9 },
  { label: t("conversation"), rate: 1.1 },
  { label: t("narration"), rate: 0.75 },
 ];
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
       <Card variant="subtle" padding="md" className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
         <div className="grid gap-1">
          <Typography as="p" variant="overline" tone="accent" weight="black">
           {t("step", { number: 1 })}
          </Typography>
          <Typography as="h2" variant="sectionTitle" weight="black">
           {t("contentTitle")}
          </Typography>
          <Typography as="p" variant="bodySmall" tone="muted">
           {t("contentHelp")}
          </Typography>
         </div>
         <div className="flex flex-wrap gap-2" aria-label={t("summaryAria")}>
          <Badge casing="natural" size="lg">
           {t("characters", { count: characterCount })}
          </Badge>
          <Badge casing="natural" size="lg">
           {t("paragraphs", { count: paragraphCount })}
          </Badge>
          <Badge casing="natural" size="lg">
           {t("sentences", { count: sentenceCount })}
          </Badge>
          <Badge casing="natural" size="lg">
           ≈ {estimatedDuration}
          </Badge>
         </div>
        </div>

        <Textarea
         value={text}
         onChange={(event) => setText(event.target.value)}
         placeholder={t("textPlaceholder")}
         aria-label={t("textAria")}
         maxLength={10000}
         className="min-h-64"
        />

        <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
         <div className="grid gap-0.5">
          <Typography as="span" variant="caption" tone="accent" weight="black">
           {t("step", { number: 2 })}
          </Typography>
          <Typography as="span" variant="caption" tone="muted" weight="black">
           {t("rateTitle")}
          </Typography>
         </div>
         {ttsRatePresets.map((preset) => (
          <Button
           key={preset.label}
           type="button"
           size="sm"
           variant={tts.rate === preset.rate ? "active" : "ghost"}
           onClick={() => tts.setRate(preset.rate)}
          >
           {preset.label}
          </Button>
         ))}
        </Card>
       </Card>

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

       <section className="grid gap-3">
        <div className="grid gap-1">
         <Typography as="p" variant="overline" tone="accent" weight="black">
          {t("step", { number: 3 })}
         </Typography>
         <Typography as="h2" variant="sectionTitle" weight="black">
          {t("listenTitle")}
         </Typography>
        </div>
        <Card variant="subtle" padding="sm" className="grid gap-3">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography as="span" variant="overline" tone="accent" weight="black">
           {t("preview")}
          </Typography>
          <Typography as="span" variant="caption" tone="muted" weight="black">
           {segments.length === 0
            ? t("noContent")
            : t("progress", { current: effectiveActiveSegmentIndex + 1, total: segments.length })}
          </Typography>
         </div>
         <div className="grid gap-2">
          <SegmentedControl
           value={mode}
           items={[
            { key: "sentence", label: t("sentenceMode") },
            { key: "paragraph", label: t("paragraphMode") },
           ]}
           onChange={setMode}
           aria-label={t("modeAria")}
          />
          <div className="flex flex-wrap items-center gap-2">
           <Button
            type="button"
            size="sm"
            variant={loopCurrent ? "active" : "outline"}
            aria-pressed={loopCurrent}
            onClick={() => setLoopCurrent((current) => !current)}
           >
            {t("loop")}
           </Button>
           <Button
            type="button"
            size="sm"
            variant={autoAdvance ? "active" : "outline"}
            aria-pressed={autoAdvance}
            onClick={() => setAutoAdvance((current) => !current)}
           >
            {t("autoAdvance")}
           </Button>
          </div>
         </div>
         <div className="flex flex-wrap gap-2" aria-label={t("segmentGroupAria")}>
          {segments.map((segment, index) => (
           <Button
            key={`${index}:${segment}`}
            type="button"
            size="icon"
            aria-label={t("segmentAria", { number: index + 1 })}
            variant={index === effectiveActiveSegmentIndex ? "active" : "outline"}
            onClick={() => setActiveSegmentIndex(index)}
           >
            {index + 1}
           </Button>
          ))}
         </div>
         {segments[effectiveActiveSegmentIndex] ? (
          <Card
           variant="default"
           padding="sm"
           className="flex min-w-0 flex-wrap items-center gap-2"
          >
           <Typography as="p" variant="body" lang="zh-CN" className="min-w-0 flex-1">
            {segments[effectiveActiveSegmentIndex]}
           </Typography>
           <Button
            type="button"
            size="sm"
            disabled={tts.isLoading}
            onClick={() => playSegmentAt(effectiveActiveSegmentIndex)}
           >
            {tts.isSpeaking ? t("speaking") : t("listen")}
           </Button>
          </Card>
         ) : null}
         <div className="flex flex-wrap gap-2">
          <Button
           type="button"
           size="sm"
           variant="outline"
           disabled={effectiveActiveSegmentIndex === 0}
           onClick={() => {
            setActiveSegmentIndex((current) => Math.max(0, current - 1));
            playSegmentAt(Math.max(0, effectiveActiveSegmentIndex - 1));
           }}
          >
           {t("previous")}
          </Button>
          <Button
           type="button"
           size="sm"
           variant="outline"
           disabled={segments.length === 0}
           onClick={() => playSegmentAt(effectiveActiveSegmentIndex)}
          >
           {t("replay")}
          </Button>
          <Button
           type="button"
           size="sm"
           variant="outline"
           disabled={effectiveActiveSegmentIndex >= segments.length - 1}
           onClick={() => {
            setActiveSegmentIndex((current) => Math.min(segments.length - 1, current + 1));
            playSegmentAt(Math.min(segments.length - 1, effectiveActiveSegmentIndex + 1));
           }}
          >
           {t("next")}
          </Button>
         </div>
         <Typography as="span" variant="caption" tone="muted">
          {t("shortcuts")}
         </Typography>
        </Card>
       </section>

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
        <Card variant="subtle" padding="md" className="grid gap-3">
         <div className="grid gap-1">
          <Typography as="h3" variant="cardTitle" weight="black">
           {t("saveTitle")}
          </Typography>
          <Typography as="p" variant="bodySmall" tone="muted">
           {t("saveHelp")}
          </Typography>
         </div>
         <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("clipPlaceholder")}
          aria-label={t("clipAria")}
         />
         <div className="flex flex-wrap gap-2">
          <Button
           type="button"
           disabled={!hasText || !tts.selectedVoice || isGenerating || isSavingClip}
           onClick={() => void saveClip()}
          >
           {isGenerating ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
           ) : null}
           {t("saveClip")}
          </Button>
          <Button
           type="button"
           variant="outline"
           disabled={!hasText || !tts.selectedVoice || isGenerating}
           onClick={() => void generatePreview()}
          >
           {t("generateAudio")}
          </Button>
          <Input
           value={folderName}
           onChange={(event) => setFolderName(event.target.value)}
           placeholder={t("folderPlaceholder")}
           aria-label={t("folderAria")}
           className="max-w-xs"
          />
          <Button
           type="button"
           variant="outline"
           disabled={!folderName.trim() || isCreatingFolder}
           onClick={() => void saveFolder()}
          >
           {t("createFolder")}
          </Button>
         </div>
         {folders.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label={t("foldersAria")}>
           <Button
            type="button"
            size="sm"
            variant={folderId === null ? "active" : "outline"}
            onClick={() => setFolderId(null)}
           >
            {t("uncategorized")}
           </Button>
           {folders.map((folder) => (
            <Button
             key={folder.id}
             type="button"
             size="sm"
             variant={folder.id === folderId ? "active" : "outline"}
             onClick={() => setFolderId(folder.id)}
            >
             {folder.name}
            </Button>
           ))}
          </div>
         ) : null}
         {saveError ? (
          <Typography as="p" variant="bodySmall" tone="danger">
           {saveError}
          </Typography>
         ) : null}
         {audioUrl ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
           <audio controls preload="none" src={audioUrl} className="min-w-0 max-w-full" />
           <Button type="button" variant="outline" size="sm" asChild>
            <a href={audioUrl} download={ttsClipDownloadFilename(title)}>
             <Download data-icon="inline-start" />
             {t("download")}
            </a>
           </Button>
          </div>
         ) : null}
        </Card>
       ) : null}
      </>
     ) : null}
    </TabsContent>

    <TabsContent value="library" className="pt-4 sm:pt-5">
     {workspaceTab === "library" ? (
      <Card variant="section" padding="md" className="grid gap-2">
       <Typography as="h3" variant="cardTitle" weight="black">
        {t("libraryTitle")}
       </Typography>
       {libraryQuery.isPending ? (
        <Typography variant="bodySmall" tone="muted">
         {t("loading")}
        </Typography>
       ) : null}
       {libraryQuery.isError ? (
        <QueryErrorCard
         title={t("loadError")}
         description={t("loadErrorHelp")}
         retryLabel={t("retry")}
         onRetry={() => {
          void libraryQuery.refetch();
         }}
        />
       ) : null}
       {!libraryQuery.isPending && !libraryQuery.isError && clips.length === 0 ? (
        <Typography as="p" variant="bodySmall" tone="muted">
         {t("emptyLibrary")}
        </Typography>
       ) : null}
       {clips.map((clip) => (
        <Card
         key={clip.id}
         variant="default"
         padding="sm"
         className="flex min-w-0 flex-wrap items-center justify-between gap-2"
        >
         <div className="grid min-w-0 gap-0.5">
          <Typography as="p" variant="bodySmall" weight="black" clamp="one">
           {clip.title || t("untitled")}
          </Typography>
          <Typography as="p" variant="caption" tone="muted" clamp="two">
           {clip.text}
          </Typography>
         </div>
         <div className="flex flex-wrap gap-2">
          <Button
           type="button"
           size="sm"
           variant="outline"
           onClick={() => speakSequence([clip.text])}
          >
           {t("play")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => openClip(clip)}>
           {t("open")}
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
           <Link href={`/dictation?clipId=${encodeURIComponent(clip.id)}`} prefetch={false}>
            {t("dictation")}
           </Link>
          </Button>
         </div>
        </Card>
       ))}
      </Card>
     ) : null}
    </TabsContent>
   </Tabs>
  </div>
 );
}
