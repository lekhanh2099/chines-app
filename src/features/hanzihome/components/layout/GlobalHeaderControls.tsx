"use client";

import { useMemo } from "react";
import { useSelector } from "@tanstack/react-store";
import { BookOpen, Languages, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Switch } from "@/components/ui/forms/switch";
import { Typography } from "@/components/ui/display/typography";
import { BasePopover } from "@/components/ui/overlays/base-popover";
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
export function GlobalHeaderStudySettingsItems({
 listening = false,
}: { listening?: boolean } = {}) {
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

 if (listening)
  return (
   <BasePopover.Close
    render={<Button variant="menu" size="menu" align="start" className="w-full" />}
    onClick={() => speechSettingsDialogStore.actions.openDialog()}
   >
    <Volume2 />
    {t("header.voiceSettings")}
   </BasePopover.Close>
  );
 return (
  <div className="grid divide-y divide-border-default">
   <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
    <Typography as="span" variant="bodySmall" className="flex items-center gap-2">
     <Languages className="size-4" />
     {t("header.showPinyin")}
    </Typography>
    <Switch
     checked={showPinyin}
     onCheckedChange={togglePinyin}
     disabled={learning.isLoading}
     aria-label={t("header.showPinyin")}
    />
   </label>
   <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
    <Typography as="span" variant="bodySmall" className="flex items-center gap-2">
     <BookOpen className="size-4" />
     {t("header.showMeaning")}
    </Typography>
    <Switch
     checked={showMeaning}
     onCheckedChange={toggleMeaning}
     disabled={learning.isLoading}
     aria-label={t("header.showMeaning")}
    />
   </label>
  </div>
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
   onCloseAutoFocus={(event) => {
    const trigger = document.getElementById("header-quick-settings-trigger");
    if (trigger) {
     event.preventDefault();
     trigger.focus();
    }
   }}
  />
 );
}
