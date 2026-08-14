"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { MandarinTtsControls } from "@/features/hanzihome/listening/MandarinTtsControls";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { buildCacheKey } from "@/lib/tts-cache";

import {
 splitTtsStudioText,
 ttsClipDraftSchema,
 type TtsClipDraft,
 type TtsSegmentMode,
} from "./tts-studio.schemas";

type TtsStudioFolder = {
 id: string;
 name: string;
};

type TtsStudioClip = {
 id: string;
 draft: TtsClipDraft;
};

export function TtsStudioWorkspace() {
 const tts = useSharedMandarinTts();
 const { generateAudio, speakSequence, stop } = tts;
 const [text, setText] = useState("");
 const [title, setTitle] = useState("");
 const [mode, setMode] = useState<TtsSegmentMode>("sentence");
 const [folderName, setFolderName] = useState("");
 const [folderId, setFolderId] = useState<string | null>(null);
 const [folders, setFolders] = useState<TtsStudioFolder[]>([]);
 const [clips, setClips] = useState<TtsStudioClip[]>([]);
 const [saveError, setSaveError] = useState("");
 const [audioUrl, setAudioUrl] = useState<string | null>(null);
 const [isGenerating, setIsGenerating] = useState(false);
 const segments = useMemo(() => splitTtsStudioText(text, mode), [mode, text]);

 useEffect(
  () => () => {
   if (audioUrl) URL.revokeObjectURL(audioUrl);
  },
  [audioUrl],
 );

 useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape") {
    stop();
    return;
   }
   if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (segments.length > 0) speakSequence(segments);
   }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
 }, [segments, speakSequence, stop]);

 const saveFolder = () => {
  const name = folderName.trim();
  if (!name) return;
  const id = window.crypto.randomUUID();
  setFolders((current) => [...current, { id, name }]);
  setFolderId(id);
  setFolderName("");
 };

 const generatePreview = async () => {
  if (!text.trim() || !tts.selectedVoice) return;
  setSaveError("");
  setIsGenerating(true);
  const blob = await generateAudio(text);
  setIsGenerating(false);
  if (!blob) {
   setSaveError(tts.error ?? "Không tạo được audio cho clip.");
   return;
  }
  setAudioUrl(URL.createObjectURL(blob));
 };

 const saveClip = async () => {
  setSaveError("");
  if (!tts.selectedVoice || !text.trim()) return;

  const result = ttsClipDraftSchema.safeParse({
   folderId,
   title: title.trim(),
   text: text.trim(),
   voice: tts.selectedVoice.shortName,
   rate: tts.rate,
   cacheKey: buildCacheKey(text.trim(), tts.selectedVoice.shortName, tts.rate),
  });
  if (!result.success) {
   setSaveError("Không thể tạo clip với thiết lập hiện tại.");
   return;
  }

  setIsGenerating(true);
  const blob = await generateAudio(text);
  setIsGenerating(false);
  if (!blob) {
   setSaveError(tts.error ?? "Không tạo được audio cho clip.");
   return;
  }
  setAudioUrl(URL.createObjectURL(blob));
  setClips((current) => [{ id: window.crypto.randomUUID(), draft: result.data }, ...current]);
 };

 const openClip = (clip: TtsStudioClip) => {
  setText(clip.draft.text);
  setTitle(clip.draft.title);
  setFolderId(clip.draft.folderId);
  tts.setSelectedVoiceName(clip.draft.voice);
  tts.setRate(clip.draft.rate);
 };

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <Badge variant="purple" className="w-fit">
       TTS Studio
      </Badge>
      <Typography as="h2" variant="sectionTitle" weight="black">
       Soạn và luyện nghe
      </Typography>
      <Typography as="p" variant="bodySmall" tone="muted">
       Dùng edge-tts-ts của HanziHome; cache audio được khóa theo text, voice và rate.
      </Typography>
     </div>
     <Badge>{segments.length} đoạn</Badge>
    </div>

    <Textarea
     value={text}
     onChange={(event) => setText(event.target.value)}
     placeholder="Nhập câu hoặc đoạn tiếng Trung…"
     aria-label="Nội dung TTS Studio"
     maxLength={10000}
     className="min-h-48"
    />

    <div className="flex flex-wrap gap-2" aria-label="Chế độ chia đoạn">
     <Button
      type="button"
      size="sm"
      variant={mode === "sentence" ? "active" : "outline"}
      onClick={() => setMode("sentence")}
     >
      Theo câu
     </Button>
     <Button
      type="button"
      size="sm"
      variant={mode === "paragraph" ? "active" : "outline"}
      onClick={() => setMode("paragraph")}
     >
      Theo đoạn
     </Button>
    </div>
   </Card>

   <MandarinTtsControls text={text} tts={tts} />

   <Card variant="subtle" padding="md" className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="black">
      Lưu clip vào thư viện HanziHome
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      Audio được tạo qua edge-tts-ts và giữ trong cache HanziHome; metadata library sẽ nối Supabase
      sau migration.
     </Typography>
    </div>
    <Input
     value={title}
     onChange={(event) => setTitle(event.target.value)}
     placeholder="Tên clip"
     aria-label="Tên clip TTS"
    />
    <div className="flex flex-wrap gap-2">
     <Button
      type="button"
      disabled={!text.trim() || !tts.selectedVoice || isGenerating}
      onClick={() => void saveClip()}
     >
      {isGenerating ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
      Lưu clip
     </Button>
     <Button
      type="button"
      variant="outline"
      disabled={!text.trim() || !tts.selectedVoice || isGenerating}
      onClick={() => void generatePreview()}
     >
      Tạo audio
     </Button>
     <Input
      value={folderName}
      onChange={(event) => setFolderName(event.target.value)}
      placeholder="Tên folder mới"
      aria-label="Tên folder TTS mới"
      className="max-w-xs"
     />
     <Button type="button" variant="outline" disabled={!folderName.trim()} onClick={saveFolder}>
      Tạo folder
     </Button>
    </div>
    {folders.length > 0 ? (
     <div className="flex flex-wrap gap-2" aria-label="Folder TTS">
      <Button
       type="button"
       size="sm"
       variant={folderId === null ? "active" : "outline"}
       onClick={() => setFolderId(null)}
      >
       Chưa phân loại
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
       <a href={audioUrl} download={`${title.trim() || "hanzihome-tts"}.mp3`}>
        <Download data-icon="inline-start" />
        Tải audio
       </a>
      </Button>
     </div>
    ) : null}
   </Card>

   {clips.length > 0 ? (
    <Card variant="section" padding="md" className="grid gap-2">
     <Typography as="h3" variant="cardTitle" weight="black">
      Thư viện clip
     </Typography>
     {clips.map((clip) => (
      <div
       key={clip.id}
       className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-surface p-3"
      >
       <div className="grid min-w-0 gap-0.5">
        <Typography as="p" variant="bodySmall" weight="black" clamp="one">
         {clip.draft.title || "Clip chưa đặt tên"}
        </Typography>
        <Typography as="p" variant="caption" tone="muted" clamp="two">
         {clip.draft.text}
        </Typography>
       </div>
       <Button type="button" size="sm" variant="outline" onClick={() => openClip(clip)}>
        Mở clip
       </Button>
      </div>
     ))}
    </Card>
   ) : null}
  </div>
 );
}
