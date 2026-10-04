"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { TtsClipRow, TtsFolderRow } from "./tts-studio.schemas";
import { createTtsClipDraft } from "./tts-studio-utils";
import { useTtsLibraryMutations } from "./useTtsLibrary";
import { useTtsAudioPreview } from "./useTtsAudioPreview";

export function useTtsStudioSave({
 text,
 title,
 folderName,
 folderId,
 selectedVoice,
 rate,
 generateAudio,
 onFolderCreated,
}: {
 text: TtsClipRow["text"];
 title: TtsClipRow["title"];
 folderName: TtsFolderRow["name"];
 folderId: TtsClipRow["folder_id"];
 selectedVoice: ReturnType<typeof useSharedMandarinTts>["selectedVoice"];
 rate: ReturnType<typeof useSharedMandarinTts>["rate"];
 generateAudio: ReturnType<typeof useSharedMandarinTts>["generateAudio"];
 onFolderCreated: (folder: TtsFolderRow) => void;
}) {
 const t = useTranslations("TtsStudio");
 const libraryMutations = useTtsLibraryMutations();
 const [saveError, setSaveError] = useState("");
 const { audioUrl, isGenerating, prepareAudio, clearPreview } = useTtsAudioPreview(
  generateAudio,
  () => setSaveError(t("generateError")),
 );
 const hasText = text.trim().length > 0;

 const saveFolder = async () => {
  const name = folderName.trim();
  if (!name) return;
  setSaveError("");
  try {
   onFolderCreated(await libraryMutations.createFolder.mutateAsync(name));
  } catch {
   setSaveError(t("folderError"));
  }
 };

 const generatePreview = async () => {
  if (!hasText || !selectedVoice) return;
  setSaveError("");
  await prepareAudio(text);
 };

 const saveClip = async () => {
  setSaveError("");
  if (!selectedVoice || !hasText) return;
  const result = createTtsClipDraft({
   folderId,
   title,
   text,
   voice: selectedVoice.shortName,
   rate,
  });
  if (!result.success) {
   setSaveError(t("settingsError"));
   return;
  }
  if (!(await prepareAudio(text))) return;
  try {
   await libraryMutations.saveClip.mutateAsync(result.data);
  } catch {
   setSaveError(t("clipError"));
  }
 };

 const resetPreview = () => {
  clearPreview();
  setSaveError("");
 };

 return {
  audioUrl,
  hasText,
  isGenerating,
  saveError,
  saveFolder,
  saveClip,
  generatePreview,
  resetPreview,
  isSavingClip: libraryMutations.saveClip.isPending,
  isCreatingFolder: libraryMutations.createFolder.isPending,
 };
}
