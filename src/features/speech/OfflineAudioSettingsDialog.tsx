"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
 AlertCircle,
 CheckCircle2,
 Cpu,
 DownloadCloud,
 HardDrive,
 Loader2,
 Settings2,
 Trash2,
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

 const lessonPack = useLessonAudioPack(lesson);

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
  <Dialog open={open} onOpenChange={setOpen}>
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
      Chủ động quản lý dữ liệu âm thanh để học và nghe chép khi không có mạng Internet.
     </DialogDescription>
    </DialogHeader>

    <DialogBody className="grid gap-4 py-3">
     {/* Section 1: Lesson Audio Pack */}
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
          {`Đã lưu ${lessonPack.cachedCount}/${lessonPack.totalCount} câu & từ vựng (${lessonPack.progressPercent}%)`}
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

     {/* Section 2: Hugging Face Local AI Model */}
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

     {/* Section 3: Storage Overview & Clear Cache */}
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
