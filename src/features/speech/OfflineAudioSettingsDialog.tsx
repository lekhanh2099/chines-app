"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
 AlertCircle,
 CheckCircle2,
 Cpu,
 DownloadCloud,
 HardDrive,
 Loader2,
 Play,
 Settings2,
 Square,
 Trash2,
 Volume2,
 Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/overlays/dialog";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Typography } from "@/components/ui/display/typography";
import {
 clearAllCachedAudio,
 countCachedEntries,
 estimateCacheSizeBytes,
} from "@/lib/audio/tts-cache";
import {
 deleteAiModel,
 downloadAiModel,
 getAiModelStorageEstimate,
 type AiModelStatus,
} from "@/features/speech/offline-ai-model";
import { useLessonAudioPack } from "@/features/speech/useLessonAudioPack";
import { useFastMandarinSpeech } from "@/features/hanzihome/hooks/useFastMandarinSpeech";
import { useOptionalSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { DEFAULT_MANDARIN_VOICE, MANDARIN_VOICE_STORAGE_KEY } from "@/hooks/useTTS";
import { STANDARD_MANDARIN_VOICES } from "@/features/speech/mandarin-voices";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

export type OfflineAudioSettingsDialogProps = {
 readonly lesson?: TextbookLesson | null;
 readonly trigger?: ReactNode;
};

export function OfflineAudioSettingsDialog({ lesson, trigger }: OfflineAudioSettingsDialogProps) {
 const [open, setOpen] = useState(false);
 const [cacheEntries, setCacheEntries] = useState(0);
 const [cacheBytes, setCacheBytes] = useState(0);
 const [aiModelStatus, setAiModelStatus] = useState<AiModelStatus>("not_downloaded");
 const [aiModelBytes, setAiModelBytes] = useState(0);
 const [aiDownloadPercent, setAiDownloadPercent] = useState(0);
 const [isTestingVoice, setIsTestingVoice] = useState(false);

 const tts = useOptionalSharedMandarinTts();
 const [localVoice, setLocalVoice] = useState(DEFAULT_MANDARIN_VOICE);
 const selectedVoiceName = tts?.selectedVoiceName || localVoice || DEFAULT_MANDARIN_VOICE;

 const lessonPack = useLessonAudioPack(lesson, selectedVoiceName);
 const fastSpeech = useFastMandarinSpeech();

 const selectedVoiceMeta =
  STANDARD_MANDARIN_VOICES.find((v) => v.shortName === selectedVoiceName) ??
  STANDARD_MANDARIN_VOICES[0];

 const refreshStats = async () => {
  const [entries, bytes, modelEst] = await Promise.all([
   countCachedEntries(),
   estimateCacheSizeBytes(),
   getAiModelStorageEstimate(),
  ]);

  setCacheEntries(entries);
  setCacheBytes(bytes);
  setAiModelBytes(modelEst.sizeBytes);
  setAiModelStatus(modelEst.isReady ? "ready" : "not_downloaded");
 };

 useEffect(() => {
  let isMounted = true;
  if (!open) return;

  void (async () => {
   const [entries, bytes, modelEst] = await Promise.all([
    countCachedEntries(),
    estimateCacheSizeBytes(),
    getAiModelStorageEstimate(),
   ]);
   if (!isMounted) return;
   setCacheEntries(entries);
   setCacheBytes(bytes);
   setAiModelBytes(modelEst.sizeBytes);
   setAiModelStatus(modelEst.isReady ? "ready" : "not_downloaded");
  })();

  return () => {
   isMounted = false;
  };
 }, [open]);

 const handleVoiceChange = (nextVoice: string) => {
  if (isTestingVoice) {
   fastSpeech.stop();
   setIsTestingVoice(false);
  }
  setLocalVoice(nextVoice);
  tts?.setSelectedVoiceName(nextVoice);
  if (typeof window !== "undefined") {
   try {
    window.localStorage.setItem(MANDARIN_VOICE_STORAGE_KEY, nextVoice);
   } catch {
    // Ignore storage errors in private browsing
   }
  }
 };

 const handleTogglePreview = () => {
  if (isTestingVoice) {
   fastSpeech.stop();
   setIsTestingVoice(false);
   return;
  }

  setIsTestingVoice(true);
  fastSpeech.speak("你好，很高兴认识你。欢迎学习中文！", {
   voice: selectedVoiceName,
   rate: 1.0,
   onFinish: () => setIsTestingVoice(false),
  });
 };

 const handleOpenChange = (nextOpen: boolean) => {
  setOpen(nextOpen);
  if (!nextOpen) {
   fastSpeech.stop();
   setIsTestingVoice(false);
  }
 };

 const handleClearCache = async () => {
  await clearAllCachedAudio();
  await refreshStats();
  await lessonPack.refreshStatus();
 };

 const handleDownloadAiModel = async () => {
  setAiModelStatus("downloading");
  setAiDownloadPercent(0);

  const success = await downloadAiModel((_received, _total, percent) => {
   setAiDownloadPercent(percent);
  });

  if (success) {
   setAiModelStatus("ready");
   await refreshStats();
  } else {
   setAiModelStatus("error");
  }
 };

 const handleDeleteAiModel = async () => {
  await deleteAiModel();
  setAiModelStatus("not_downloaded");
  await refreshStats();
 };

 const cacheMb = (cacheBytes / (1024 * 1024)).toFixed(1);
 const aiModelMb = (aiModelBytes / (1024 * 1024)).toFixed(1);

 return (
  <Dialog open={open} onOpenChange={handleOpenChange}>
   <DialogTrigger asChild>
    {trigger ?? (
     <Button
      type="button"
      variant="outline"
      size="compact"
      aria-label="Cài đặt giọng đọc và bộ nhớ offline"
     >
      <DownloadCloud className="size-3.5" />
      <span>Offline & Giọng đọc</span>
     </Button>
    )}
   </DialogTrigger>

   <DialogContent size="md">
    <DialogHeader>
     <DialogTitle icon={<Settings2 />}>Cài đặt Giọng đọc & Bộ nhớ Offline</DialogTitle>
     <DialogDescription>
      Chọn giọng phát âm tiếng Trung yêu thích và chủ động tải dữ liệu để học mượt mà 0ms khi không
      có mạng.
     </DialogDescription>
    </DialogHeader>

    <DialogBody className="grid gap-4 py-3">
     {/* Section 1: Voice Selection & Live Test */}
     <Card variant="subtle" padding="md" className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
       <div className="flex items-center gap-1.5">
        <Volume2 className="size-4 text-primary" />
        <Typography variant="body" weight="bold">
         Giọng đọc tiếng Trung (Mandarin Voice)
        </Typography>
       </div>
       <Badge variant="purple" casing="natural">
        Đồng bộ toàn app
       </Badge>
      </div>

      <div className="grid gap-2">
       <Select value={selectedVoiceName} onValueChange={handleVoiceChange}>
        <SelectTrigger width="full" aria-label="Chọn giọng đọc tiếng Trung">
         <SelectValue placeholder="Chọn giọng đọc..." />
        </SelectTrigger>
        <SelectContent>
         <SelectGroup>
          {STANDARD_MANDARIN_VOICES.map((voice) => (
           <SelectItem key={voice.shortName} value={voice.shortName}>
            <span className="font-medium">{voice.label}</span>
           </SelectItem>
          ))}
         </SelectGroup>
        </SelectContent>
       </Select>

       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
        <Typography variant="caption" tone="muted" className="flex-1">
         {selectedVoiceMeta?.description}
        </Typography>

        <div className="shrink-0">
         <Button
          type="button"
          variant={isTestingVoice ? "active" : "secondary"}
          size="compact"
          onClick={handleTogglePreview}
          aria-label="Nghe thử giọng đọc"
         >
          {isTestingVoice ? (
           <>
            <Square className="size-3.5 fill-current" />
            <span>Dừng nghe thử</span>
           </>
          ) : (
           <>
            <Play className="size-3.5" />
            <span>Nghe thử câu mẫu</span>
           </>
          )}
         </Button>
        </div>
       </div>
      </div>
     </Card>

     {/* Section 2: Auto-Apply Explanation Callout */}
     <Card variant="subtle" padding="md" className="grid gap-1.5">
      <div className="flex items-center gap-2">
       <Zap className="size-4 shrink-0 text-warning" />
       <Typography variant="bodySmall" weight="bold">
        Tự động áp dụng 100% khi học
       </Typography>
      </div>
      <Typography variant="caption" tone="muted" className="leading-relaxed">
       Sau khi bạn tải gói bài học bên dưới, hệ thống sẽ{" "}
       <strong>tự động phát từ bộ nhớ Offline trong máy (0ms latency, không tốn data mạng)</strong>{" "}
       trong Bài khóa, Luyện nghe chép và Từ vựng mà không cần bạn bấm &quot;Apply&quot; thủ công.
      </Typography>
     </Card>

     {/* Section 3: Lesson Audio Pack */}
     {lesson && lessonPack.totalCount > 0 ? (
      <Card variant="subtle" padding="md" className="grid gap-3">
       <div className="flex items-start justify-between gap-2">
        <div className="grid gap-1">
         <div className="flex items-center gap-1.5">
          <Typography variant="body" weight="bold">
           Gói âm thanh bài học này
          </Typography>
          <Badge variant={lessonPack.isFullyCached ? "success" : "default"} casing="natural">
           {lessonPack.isFullyCached ? "Đã sẵn sàng Offline" : "Chưa tải đủ"}
          </Badge>
         </div>
         <Typography variant="caption" tone="muted">
          {`Đã lưu ${lessonPack.cachedCount}/${lessonPack.totalCount} câu & từ vựng (${lessonPack.progressPercent}%) theo giọng ${selectedVoiceMeta?.label.split(" ")[0] ?? "chuẩn"}`}
         </Typography>
        </div>

        <Button
         type="button"
         variant={lessonPack.isFullyCached ? "secondary" : "default"}
         size="compact"
         disabled={lessonPack.isDownloading || lessonPack.isFullyCached}
         onClick={lessonPack.downloadLessonAudio}
        >
         {lessonPack.isDownloading ? (
          <>
           <Loader2 className="size-3.5 animate-spin" />
           <span>{`Đang tải ${lessonPack.progressPercent}%...`}</span>
          </>
         ) : lessonPack.isFullyCached ? (
          <>
           <CheckCircle2 className="size-3.5 text-success-text" />
           <span>Đã tải đủ</span>
          </>
         ) : (
          <>
           <DownloadCloud className="size-3.5" />
           <span>Tải bài này (~3MB)</span>
          </>
         )}
        </Button>
       </div>

       {lessonPack.isDownloading ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-default/40">
         <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${lessonPack.progressPercent}%` }}
         />
        </div>
       ) : null}
      </Card>
     ) : null}

     {/* Section 4: Hugging Face Local AI Model */}
     <Card variant="subtle" padding="md" className="grid gap-3">
      <div className="flex items-start justify-between gap-2">
       <div className="grid gap-1">
        <div className="flex items-center gap-1.5">
         <Cpu className="size-4 text-purple-text" />
         <Typography variant="body" weight="bold">
          Mô hình AI Offline (Hugging Face VITS)
         </Typography>
         <Badge variant={aiModelStatus === "ready" ? "success" : "purple"} casing="natural">
          {aiModelStatus === "ready"
           ? "Đã sẵn sàng"
           : aiModelStatus === "downloading"
             ? "Đang tải"
             : "Tùy chọn"}
         </Badge>
        </div>
        <Typography variant="caption" tone="muted">
         Tự sinh âm thanh trực tiếp trong máy cho chữ Hán bất kỳ mà không cần Internet (~43MB).
        </Typography>
       </div>

       {aiModelStatus === "ready" ? (
        <Button
         type="button"
         variant="outline"
         size="compact"
         onClick={handleDeleteAiModel}
         title="Xóa model khỏi máy để giải phóng bộ nhớ"
        >
         <Trash2 className="size-3 text-danger-text" />
         <span>Xóa model</span>
        </Button>
       ) : (
        <Button
         type="button"
         variant="default"
         size="compact"
         disabled={aiModelStatus === "downloading"}
         onClick={handleDownloadAiModel}
        >
         {aiModelStatus === "downloading" ? (
          <>
           <Loader2 className="size-3.5 animate-spin" />
           <span>{`Đang tải ${aiDownloadPercent}%...`}</span>
          </>
         ) : (
          <>
           <DownloadCloud className="size-3.5" />
           <span>Tải Model AI (~43MB)</span>
          </>
         )}
        </Button>
       )}
      </div>

      {aiModelStatus === "downloading" ? (
       <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-default/40">
        <div
         className="h-full bg-purple-text transition-all duration-300"
         style={{ width: `${aiDownloadPercent}%` }}
        />
       </div>
      ) : null}

      {aiModelStatus === "ready" ? (
       <div className="flex items-center gap-2 text-xs text-text-muted">
        <CheckCircle2 className="size-3.5 text-success-text" />
        <span>{`Mô hình đã lưu an toàn trong Cache trình duyệt (${aiModelMb} MB)`}</span>
       </div>
      ) : null}

      {aiModelStatus === "error" ? (
       <div className="flex items-center gap-2 text-xs text-danger-text">
        <AlertCircle className="size-3.5" />
        <span>Tải mô hình không thành công. Vui lòng thử lại.</span>
       </div>
      ) : null}
     </Card>

     {/* Section 5: Storage Overview & Clear Cache */}
     <Card variant="section" padding="md" className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
       <div className="flex items-center gap-2">
        <HardDrive className="size-4 text-text-muted" />
        <Typography variant="bodySmall" weight="bold">
         Bộ nhớ đệm âm thanh (IndexedDB)
        </Typography>
       </div>
       <Typography variant="bodySmall" tone="muted">
        {`${cacheEntries} file (${cacheMb} MB)`}
       </Typography>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border-default/40">
       <Typography variant="caption" tone="muted">
        Xóa bộ nhớ đệm sẽ giải phóng dung lượng trên máy mà không làm mất bài học.
       </Typography>
       <Button
        type="button"
        variant="outline"
        size="compact"
        disabled={cacheEntries === 0}
        onClick={handleClearCache}
       >
        <Trash2 className="size-3 text-danger-text" />
        <span>Dọn sạch cache</span>
       </Button>
      </div>
     </Card>
    </DialogBody>
   </DialogContent>
  </Dialog>
 );
}
