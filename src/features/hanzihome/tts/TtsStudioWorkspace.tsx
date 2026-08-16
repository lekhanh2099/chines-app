"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { MandarinTtsControls } from "@/features/hanzihome/listening/MandarinTtsControls";
import { useSharedMandarinTts } from "@/features/hanzihome/listening/MandarinTtsProvider";
import { buildCacheKey } from "@/lib/tts-cache";

import {
 splitTtsStudioText,
 ttsClipResponseSchema,
 ttsClipDraftSchema,
 ttsFolderResponseSchema,
 ttsLibraryResponseSchema,
 type TtsClipRow,
 type TtsFolderRow,
 type TtsSegmentMode,
} from "./tts-studio.schemas";

const ttsRatePresets = [
 { label: "Tự nhiên", rate: 1 },
 { label: "Luyện nghe chậm", rate: 0.9 },
 { label: "Hội thoại trẻ", rate: 1.1 },
 { label: "Thuyết minh", rate: 0.75 },
];
const ttsSampleText =
 "学习语言不能只怕出错。越怕开口说，就越没有机会进步。\n每天听一点、说一点，慢慢地就会越来越自然。";

export function TtsStudioWorkspace() {
 const tts = useSharedMandarinTts();
 const searchParams = useSearchParams();
 const { generateAudio, pause, resume, speakSequence, stop } = tts;
 const [text, setText] = useState(() => searchParams.get("text") ?? ttsSampleText);
 const [workspaceTab, setWorkspaceTab] = useState<"compose" | "library">("compose");
 const [title, setTitle] = useState("");
 const [mode, setMode] = useState<TtsSegmentMode>("sentence");
 const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
 const [autoAdvance, setAutoAdvance] = useState(false);
 const [loopCurrent, setLoopCurrent] = useState(false);
 const [folderName, setFolderName] = useState("");
 const [folderId, setFolderId] = useState<string | null>(null);
 const [folders, setFolders] = useState<TtsFolderRow[]>([]);
 const [clips, setClips] = useState<TtsClipRow[]>([]);
 const [saveError, setSaveError] = useState("");
 const [audioUrl, setAudioUrl] = useState<string | null>(null);
 const [isGenerating, setIsGenerating] = useState(false);
 const playbackRunRef = useRef(0);
 const loopCurrentRef = useRef(false);
 const segments = useMemo(() => splitTtsStudioText(text, mode), [mode, text]);
 const effectiveActiveSegmentIndex = Math.min(activeSegmentIndex, Math.max(0, segments.length - 1));
 const sentenceCount = useMemo(() => splitTtsStudioText(text, "sentence").length, [text]);
 const paragraphCount = useMemo(() => splitTtsStudioText(text, "paragraph").length, [text]);
 const characterCount = Array.from(text).length;
 const estimatedDurationSeconds = Math.max(0, Math.round(characterCount / 4));
 const estimatedDuration = `${Math.floor(estimatedDurationSeconds / 60)}:${String(
  estimatedDurationSeconds % 60,
 ).padStart(2, "0")}`;

 useEffect(() => {
  loopCurrentRef.current = loopCurrent;
 }, [loopCurrent]);

 useEffect(() => {
  playbackRunRef.current += 1;
  stop();
 }, [mode, stop, text]);

 const playSegments = useCallback(() => {
  if (segments.length === 0) return;
  playbackRunRef.current += 1;
  const runId = playbackRunRef.current;
  const play = () => {
   if (playbackRunRef.current !== runId) return;
   speakSequence(segments, () => {
    if (playbackRunRef.current !== runId || !loopCurrentRef.current) return;
    play();
   });
  };
  play();
 }, [segments, speakSequence]);

 const playSegmentAt = useCallback(
  (index: number) => {
   const segment = segments[index];
   if (segment === undefined) return;
   playbackRunRef.current += 1;
   const runId = playbackRunRef.current;
   const play = (currentIndex: number) => {
    const currentSegment = segments[currentIndex];
    if (currentSegment === undefined || playbackRunRef.current !== runId) return;
    setActiveSegmentIndex(currentIndex);
    speakSequence([currentSegment], () => {
     if (playbackRunRef.current !== runId) return;
     if (loopCurrentRef.current) {
      play(currentIndex);
      return;
     }
     if (autoAdvance && currentIndex < segments.length - 1) {
      play(currentIndex + 1);
     }
    });
   };
   play(index);
  },
  [autoAdvance, segments, speakSequence],
 );

 const stopPlayback = useCallback(() => {
  playbackRunRef.current += 1;
  stop();
 }, [stop]);

 useEffect(() => {
  if (workspaceTab !== "library") return;
  let cancelled = false;
  void fetch("/api/hanzihome/tts/library", { cache: "no-store" })
   .then(async (response) => {
    if (!response.ok) throw new Error("Không tải được thư viện TTS.");
    const parsed = ttsLibraryResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Dữ liệu thư viện TTS không hợp lệ.");
    if (!cancelled) {
     setFolders(parsed.data.folders);
     setClips(parsed.data.clips);
    }
   })
   .catch((error: Error) => {
    if (!cancelled) setSaveError(error.message);
   });
  return () => {
   cancelled = true;
  };
 }, [workspaceTab]);

 useEffect(
  () => () => {
   if (audioUrl) URL.revokeObjectURL(audioUrl);
  },
  [audioUrl],
 );

 useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
   const target = event.target;
   const isTextEntry = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
   if (isTextEntry) {
    if (event.key === "Escape") {
     stopPlayback();
     return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
     event.preventDefault();
     playSegments();
    }
    return;
   }
   if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.isComposing ||
    (target instanceof HTMLElement &&
     target.closest(
      "a, button, input, textarea, select, [contenteditable='true'], [role='button'], [role='combobox'], [role='menuitem'], [role='option'], [role='tab']",
     ))
   )
    return;
   if (event.key === "Escape") {
    stopPlayback();
    return;
   }
   if (event.key === " ") {
    event.preventDefault();
    if (tts.isSpeaking) pause();
    else if (tts.isPaused) resume();
    else playSegments();
    return;
   }
   if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    playSegments();
   }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
 }, [pause, playSegments, resume, stopPlayback, tts.isPaused, tts.isSpeaking]);

 const saveFolder = async () => {
  const name = folderName.trim();
  if (!name) return;
  setSaveError("");
  try {
   const response = await fetch("/api/hanzihome/tts/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "folder", name }),
   });
   const parsed = ttsFolderResponseSchema.safeParse(await response.json());
   if (!response.ok || !parsed.success) throw new Error("Không lưu được folder TTS.");
   setFolders((current) => [parsed.data.folder, ...current]);
   setFolderId(parsed.data.folder.id);
   setFolderName("");
  } catch (error) {
   setSaveError(error instanceof Error ? error.message : "Không lưu được folder TTS.");
  }
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
  try {
   const response = await fetch("/api/hanzihome/tts/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "clip", draft: result.data }),
   });
   const saved = ttsClipResponseSchema.safeParse(await response.json());
   if (!response.ok || !saved.success) throw new Error("Không lưu được clip TTS.");
   setClips((current) => [
    saved.data.clip,
    ...current.filter((clip) => clip.id !== saved.data.clip.id),
   ]);
  } catch (error) {
   setSaveError(error instanceof Error ? error.message : "Không lưu được clip TTS.");
  }
 };

 const openClip = (clip: TtsClipRow) => {
  stopPlayback();
  setWorkspaceTab("compose");
  setText(clip.text);
  setTitle(clip.title);
  setFolderId(clip.folder_id);
  tts.setSelectedVoiceName(clip.voice);
  tts.setRate(clip.rate);
 };

 return (
  <div className="grid min-w-0 gap-3">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="grid gap-1">
      <Typography as="h1" variant="pageTitle" weight="black">
       Soạn nội dung, nghe thử, rồi xuất MP3
      </Typography>
      <Typography as="p" variant="body" tone="muted">
       Một luồng chính. Thư viện audio được tách riêng để màn hình soạn không biến thành bảng điều
       khiển.
      </Typography>
     </div>
    </div>
   </Card>

   <Tabs
    value={workspaceTab}
    items={[
     { key: "compose", label: "Soạn & nghe" },
     { key: "library", label: "Thư viện" },
    ]}
    onValueChange={setWorkspaceTab}
    aria-label="Không gian TTS Studio"
   >
    <TabsContent value="compose" className="pt-3">
     {workspaceTab === "compose" ? (
      <>
       <Card variant="subtle" padding="md" className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
         <div className="grid gap-1">
          <Typography as="p" variant="overline" tone="accent" weight="black">
           BƯỚC 1
          </Typography>
          <Typography as="h2" variant="sectionTitle" weight="black">
           Nội dung cần đọc
          </Typography>
          <Typography as="p" variant="bodySmall" tone="muted">
           Xuống dòng để chia đoạn; dùng dấu câu để chia câu.
          </Typography>
         </div>
         <div className="flex flex-wrap gap-2" aria-label="Tóm tắt nội dung TTS">
          <Badge casing="natural" size="lg">
           {characterCount} ký tự
          </Badge>
          <Badge casing="natural" size="lg">
           {paragraphCount} đoạn
          </Badge>
          <Badge casing="natural" size="lg">
           {sentenceCount} câu
          </Badge>
          <Badge casing="natural" size="lg">
           ≈ {estimatedDuration}
          </Badge>
         </div>
        </div>

        <Textarea
         value={text}
         onChange={(event) => setText(event.target.value)}
         placeholder="Dán đoạn tiếng Trung vào đây…"
         aria-label="Nội dung cần tạo giọng đọc"
         maxLength={10000}
         className="min-h-64"
        />

        <Card variant="subtle" padding="sm" className="flex flex-wrap items-center gap-2">
         <div className="grid gap-0.5">
          <Typography as="span" variant="caption" tone="accent" weight="black">
           BƯỚC 2
          </Typography>
          <Typography as="span" variant="caption" tone="muted" weight="black">
           Chọn preset tốc độ
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
          Tùy chỉnh giọng đọc
         </summary>
         <div className="border-t border-border-default p-3">
          <MandarinTtsControls text={text} tts={tts} onPlayAll={playSegments} />
         </div>
        </details>
       </Card>

       <section className="grid gap-3">
        <div className="grid gap-1">
         <Typography as="p" variant="overline" tone="accent" weight="black">
          BƯỚC 3
         </Typography>
         <Typography as="h2" variant="sectionTitle" weight="black">
          Nghe theo câu hoặc đoạn
         </Typography>
        </div>
        <Card variant="subtle" padding="sm" className="grid gap-3">
         <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography as="span" variant="overline" tone="accent" weight="black">
           NGHE THỬ
          </Typography>
          <Typography as="span" variant="caption" tone="muted" weight="black">
           {segments.length === 0
            ? "Chưa có nội dung"
            : `Câu ${effectiveActiveSegmentIndex + 1} / ${segments.length}`}
          </Typography>
         </div>
         <div className="grid gap-2">
          <SegmentedControl
           value={mode}
           items={[
            { key: "sentence", label: "Theo câu" },
            { key: "paragraph", label: "Theo đoạn" },
           ]}
           onChange={setMode}
           aria-label="Chế độ chia đoạn"
          />
          <div className="flex flex-wrap items-center gap-2">
           <Button
            type="button"
            size="sm"
            variant={loopCurrent ? "active" : "outline"}
            aria-pressed={loopCurrent}
            onClick={() => setLoopCurrent((current) => !current)}
           >
            Lặp
           </Button>
           <Button
            type="button"
            size="sm"
            variant={autoAdvance ? "active" : "outline"}
            aria-pressed={autoAdvance}
            onClick={() => setAutoAdvance((current) => !current)}
           >
            Tự chuyển
           </Button>
          </div>
         </div>
         <div className="flex flex-wrap gap-2" aria-label="Chọn câu nghe thử">
          {segments.map((segment, index) => (
           <Button
            key={`${index}:${segment}`}
            type="button"
            size="sm"
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
            {tts.isSpeaking ? "Đang đọc" : "Nghe"}
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
           Trước
          </Button>
          <Button
           type="button"
           size="sm"
           variant="outline"
           disabled={segments.length === 0}
           onClick={() => playSegmentAt(effectiveActiveSegmentIndex)}
          >
           Phát lại
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
           Sau
          </Button>
         </div>
         <Typography as="span" variant="caption" tone="muted">
          Space: tạm dừng/tiếp tục · R: phát lại · Esc: dừng
         </Typography>
        </Card>
       </section>

       <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button
         type="button"
         disabled={!text.trim() || isGenerating}
         onClick={() => void generatePreview()}
        >
         {isGenerating ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
         Tạo MP3 toàn bài
        </Button>
        <Button
         type="button"
         variant="ghost"
         disabled={!text && !title}
         onClick={() => {
          stopPlayback();
          setText("");
          setTitle("");
          setAudioUrl(null);
          setSaveError("");
         }}
        >
         Xóa nội dung
        </Button>
       </div>

       {audioUrl !== null || saveError ? (
        <Card variant="subtle" padding="md" className="grid gap-3">
         <div className="grid gap-1">
          <Typography as="h3" variant="cardTitle" weight="black">
           Lưu clip vào thư viện HanziHome
          </Typography>
          <Typography as="p" variant="bodySmall" tone="muted">
           Audio được tạo qua edge-tts-ts; thư mục, clip và thiết lập thuộc tài khoản HanziHome.
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
           {isGenerating ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
           ) : null}
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
          <Button
           type="button"
           variant="outline"
           disabled={!folderName.trim()}
           onClick={() => void saveFolder()}
          >
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
       ) : null}
      </>
     ) : null}
    </TabsContent>

    <TabsContent value="library" className="pt-3">
     {workspaceTab === "library" ? (
      <Card variant="section" padding="md" className="grid gap-2">
       <Typography as="h3" variant="cardTitle" weight="black">
        Thư viện clip
       </Typography>
       {clips.length === 0 ? (
        <Typography as="p" variant="bodySmall" tone="muted">
         Chưa có clip nào. Hãy chuyển sang tab Soạn để tạo clip đầu tiên.
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
           {clip.title || "Clip chưa đặt tên"}
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
           Phát
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => openClip(clip)}>
           Mở clip
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
           <Link href={`/dictation?clipId=${encodeURIComponent(clip.id)}`} prefetch={false}>
            Luyện dictation
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
