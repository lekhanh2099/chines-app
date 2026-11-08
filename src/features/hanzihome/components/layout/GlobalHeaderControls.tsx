"use client";

import { useMemo } from "react";
import { useSelector } from "@tanstack/react-store";
import { BookOpen, ChevronDown, Languages, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuLabel,
 DropdownMenuTrigger,
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

export function GlobalHeaderStudyActions() {
 const t = useTranslations("Shell");
 const learning = useLearningState();
 const isAudioSettingsOpen = useSelector(speechSettingsDialogStore, (state) => state.open);

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

 const displayLabel = useMemo(() => {
  if (showPinyin && showMeaning) return t("header.displayModeBoth");
  if (showPinyin) return t("header.displayModePinyinOnly");
  if (showMeaning) return t("header.displayModeMeaningOnly");
  return t("header.displayModeHanziOnly");
 }, [showPinyin, showMeaning, t]);

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
  <div className="flex items-center gap-1 shrink-0">
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      variant="outline"
      size="compact"
      aria-label={t("header.displaySettings")}
      title={t("header.displaySettings")}
      className="hidden sm:inline-flex items-center gap-1.5 shrink-0"
     >
      <Languages className="size-3.5" />
      <span>{displayLabel}</span>
      <ChevronDown className="size-3 text-muted-foreground" />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     <DropdownMenuLabel>{t("header.readingDisplay")}</DropdownMenuLabel>
     <DropdownMenuCheckboxItem
      checked={showPinyin}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={togglePinyin}
     >
      <Languages className="size-4" />
      <span>{t("header.showPinyin")}</span>
     </DropdownMenuCheckboxItem>
     <DropdownMenuCheckboxItem
      checked={showMeaning}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={toggleMeaning}
     >
      <BookOpen className="size-4" />
      <span>{t("header.showMeaning")}</span>
     </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
   </DropdownMenu>

   <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={() => speechSettingsDialogStore.actions.openDialog()}
    title={t("header.voiceSettings")}
    aria-label={t("header.voiceSettings")}
    className="hidden sm:inline-flex shrink-0"
   >
    <Volume2 className="size-4" />
   </Button>

   <OfflineAudioSettingsDialog
    trigger={null}
    open={isAudioSettingsOpen}
    onOpenChange={speechSettingsDialogStore.actions.setOpen}
   />
  </div>
 );
}
