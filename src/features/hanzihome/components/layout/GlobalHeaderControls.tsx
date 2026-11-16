"use client";

import { useMemo } from "react";
import { useSelector } from "@tanstack/react-store";
import { BookOpen, Languages, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
 DropdownMenuCheckboxItem,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
} from "@/components/ui/overlays/dropdown-menu";
import {
 defaultLessonTextDisplaySettings,
 defaultTextbookDisplaySettings,
} from "@/features/hanzihome/utils/learning-state";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { OfflineAudioSettingsDialog } from "@/features/speech/OfflineAudioSettingsDialog";
import { speechSettingsDialogStore } from "@/stores/speech/speech-dialog-store";

const KNOWN_TEXTBOOK_KEYS: readonly string[] = [
 "static:nhip-cau",
 "static:doc-hieu",
 "static:khau-ngu",
 "static:tm2",
 "static:tm3",
];

/** Reading display and voice entries rendered at the top of the header quick settings menu. */
export function GlobalHeaderStudySettingsItems() {
 const t = useTranslations("Shell");
 const learning = useLearningState();
 const displayMode = useMemo(() => {
  const current = learning.state.settings.lessonTextDisplayMode;
  if (current) {
   return {
    ...current,
    showMeaning: current.showMeaning ?? true,
   };
  }
  return {
   ...defaultLessonTextDisplaySettings,
   autoDetectPinyin: true,
   showMeaning: true,
  };
 }, [learning.state.settings.lessonTextDisplayMode]);

 const showPinyin = displayMode.showPinyin;
 const showMeaning = displayMode.showMeaning;

 const togglePinyin = () => {
  const nextShowPinyin = !showPinyin;
  const currentBooks = learning.state.settings.bookDisplayModes ?? {};
  const allKeys = new Set<string>([...KNOWN_TEXTBOOK_KEYS, ...Object.keys(currentBooks)]);
  const updatedBookDisplayModes = Object.fromEntries(
   Array.from(allKeys).map((key) => [
    key,
    { ...(currentBooks[key] ?? defaultTextbookDisplaySettings), showPinyin: nextShowPinyin },
   ]),
  );

  learning.updateSettings({
   lessonTextDisplayMode: {
    ...displayMode,
    autoDetectPinyin: true,
    showPinyin: nextShowPinyin,
    showMeaning,
   },
   bookDisplayModes: updatedBookDisplayModes,
  });
 };

 const toggleMeaning = () => {
  const nextShowMeaning = !showMeaning;
  const currentBooks = learning.state.settings.bookDisplayModes ?? {};
  const allKeys = new Set<string>([...KNOWN_TEXTBOOK_KEYS, ...Object.keys(currentBooks)]);
  const updatedBookDisplayModes = Object.fromEntries(
   Array.from(allKeys).map((key) => [
    key,
    { ...(currentBooks[key] ?? defaultTextbookDisplaySettings), showMeaning: nextShowMeaning },
   ]),
  );

  learning.updateSettings({
   lessonTextDisplayMode: {
    ...displayMode,
    autoDetectPinyin: true,
    showPinyin,
    showMeaning: nextShowMeaning,
   },
   bookDisplayModes: updatedBookDisplayModes,
  });
 };

 return (
  <>
   <DropdownMenuLabel>{t("header.readingDisplay")}</DropdownMenuLabel>
   <DropdownMenuCheckboxItem
    checked={showPinyin}
    onSelect={(event) => event.preventDefault()}
    onCheckedChange={togglePinyin}
   >
    <Languages />
    {t("header.showPinyin")}
   </DropdownMenuCheckboxItem>
   <DropdownMenuCheckboxItem
    checked={showMeaning}
    onSelect={(event) => event.preventDefault()}
    onCheckedChange={toggleMeaning}
   >
    <BookOpen />
    {t("header.showMeaning")}
   </DropdownMenuCheckboxItem>
   <DropdownMenuItem onSelect={() => speechSettingsDialogStore.actions.openDialog()}>
    <Volume2 />
    {t("header.voiceSettings")}
   </DropdownMenuItem>
   <DropdownMenuSeparator />
  </>
 );
}

/** Hosts the voice settings dialog opened from the quick settings menu. */
export function GlobalHeaderStudyDialogs() {
 const isAudioSettingsOpen = useSelector(speechSettingsDialogStore, (state) => state.open);
 return (
  <OfflineAudioSettingsDialog
   trigger={null}
   open={isAudioSettingsOpen}
   onOpenChange={speechSettingsDialogStore.actions.setOpen}
  />
 );
}
