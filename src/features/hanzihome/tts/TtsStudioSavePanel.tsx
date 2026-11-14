"use client";

import type { Dispatch, SetStateAction } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { Typography } from "@/components/ui/display/typography";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import { ttsClipDownloadFilename } from "./tts-studio-utils";
import type { useTtsLibrary } from "./useTtsLibrary";
import type { useTtsStudioSave } from "./useTtsStudioSave";

type MandarinTts = ReturnType<typeof useSharedMandarinTts>;
type TtsStudioSave = ReturnType<typeof useTtsStudioSave>;
type TtsStudioFolderId = Parameters<typeof useTtsStudioSave>[0]["folderId"];
type TtsLibraryFolders = NonNullable<ReturnType<typeof useTtsLibrary>["data"]>["folders"];

/** Save step: clip title, folder selection/creation, save errors and the generated MP3 preview. */
export function TtsStudioSavePanel({
 title,
 setTitle,
 folderName,
 setFolderName,
 folderId,
 setFolderId,
 folders,
 hasText,
 isGenerating,
 isSavingClip,
 isCreatingFolder,
 saveClip,
 saveFolder,
 generatePreview,
 saveError,
 audioUrl,
 tts,
}: {
 title: string;
 setTitle: Dispatch<SetStateAction<string>>;
 folderName: string;
 setFolderName: Dispatch<SetStateAction<string>>;
 folderId: TtsStudioFolderId;
 setFolderId: Dispatch<SetStateAction<TtsStudioFolderId>>;
 folders: TtsLibraryFolders;
 hasText: TtsStudioSave["hasText"];
 isGenerating: TtsStudioSave["isGenerating"];
 isSavingClip: TtsStudioSave["isSavingClip"];
 isCreatingFolder: TtsStudioSave["isCreatingFolder"];
 saveClip: TtsStudioSave["saveClip"];
 saveFolder: TtsStudioSave["saveFolder"];
 generatePreview: TtsStudioSave["generatePreview"];
 saveError: TtsStudioSave["saveError"];
 audioUrl: TtsStudioSave["audioUrl"];
 tts: MandarinTts;
}) {
 const t = useTranslations("TtsStudio");

 return (
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
     {isGenerating ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
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
 );
}
