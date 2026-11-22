"use client";

import {
 Focus,
 ListEnd,
 Play,
 Repeat2,
 RotateCcw,
 Settings2,
 Square,
 Type,
 Volume2,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { HanziFontPreview } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { BasePopover } from "@/components/ui/overlays/base-popover";
import { OfflineAudioSettingsDialog } from "@/features/speech/OfflineAudioSettingsDialog";
import type { TextbookLesson } from "@/features/hanzihome/static-json/textbook-catalog";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import { Switch } from "@/components/ui/forms/switch";
import {
 Select,
 SelectTrigger,
 SelectValue,
 SelectContent,
 SelectItem,
} from "@/components/ui/forms/select";
import { Typography } from "@/components/ui/display/typography";
import {
 fontOptions,
 sizeOptions,
 revealOptions,
 visibilityOptions,
} from "@/features/hanzihome/components/lesson-overview/LessonReadingSettings";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { Separator } from "@/components/ui/layout/separator";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { HanziHomeReadingQuickSettingsMenu } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { ReadingSettingsTouchControls } from "@/features/hanzihome/components/reading/ReadingSettingsTouchControls";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import {
 useReaderStore,
 useReaderCommands,
 useReaderSelector,
} from "@/features/reader/runtime/reader-context";

const readerRateOptions: readonly number[] = [0.75, 0.9, 1, 1.1, 1.25];

export function LessonReaderTools({
 onOpenShadowing,
 displayMode,
 onDisplayModeChange,
 menuContent,
 sheetContent,
}: {
 onOpenShadowing?: () => void;
 displayMode: LessonDisplayMode;
 onDisplayModeChange: (updates: Partial<LessonDisplayMode>) => void;
 menuContent?: ReactNode;
 sheetContent?: ReactNode;
}) {
 const t = useTranslations("Reader.study.chrome.tools");
 const common = useTranslations("Common.actions");
 const commandLabels = useTranslations("Reader.study.chrome.commands");
 const [dialogOpen, setDialogOpen] = useState(false);
 const toolsTriggerRef = useRef<HTMLButtonElement>(null);
 const isCoarsePointer = useCoarsePointer();
 const [compact, setCompact] = useState(false);
 useEffect(() => {
  const query = window.matchMedia("(max-width: 63.999rem)");
  const update = () => setCompact(query.matches);
  update();
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
 }, []);
 const commands = useReaderCommands();
 const { actions } = useReaderStore();
 const loopCurrent = useReaderSelector((state) => state.playback.loopCurrent);
 const autoAdvance = useReaderSelector((state) => state.playback.autoAdvance);
 const focusMode = useReaderSelector((state) => state.ui.focusMode);
 const rate = useReaderSelector((state) => state.playback.rate);
 const playbackStatus = useReaderSelector((state) => state.playback.status);

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      ref={toolsTriggerRef}
      type="button"
      variant="outline"
      size="icon-toolbar"
      aria-label={t("title")}
     >
      <Settings2 />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="lg">
     <DropdownMenuLabel>{t("listening")}</DropdownMenuLabel>
     <DropdownMenuItem onSelect={() => commands.playAll()}>
      <Play />
      {t("playAll")}
     </DropdownMenuItem>
     <DropdownMenuItem onSelect={commands.restartCurrent}>
      <RotateCcw />
      {commandLabels("restart")}
     </DropdownMenuItem>
     <DropdownMenuItem disabled={playbackStatus === "idle"} onSelect={commands.stop}>
      <Square />
      {commandLabels("stopReading")}
     </DropdownMenuItem>
     <DropdownMenuLabel>{commandLabels("rate")}</DropdownMenuLabel>
     <DropdownMenuRadioGroup
      value={String(rate)}
      onValueChange={(value) => commands.setRate(Number(value))}
     >
      {readerRateOptions.map((option) => (
       <DropdownMenuRadioItem key={option} value={String(option)}>
        {option.toFixed(2)}x
       </DropdownMenuRadioItem>
      ))}
     </DropdownMenuRadioGroup>
     <DropdownMenuSeparator />
     <DropdownMenuCheckboxItem
      checked={loopCurrent}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={() => actions.toggleLoop()}
     >
      <Repeat2 />
      {t("loop")}
     </DropdownMenuCheckboxItem>
     <DropdownMenuCheckboxItem
      checked={autoAdvance}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={() => actions.toggleAutoAdvance()}
     >
      <ListEnd />
      {t("autoAdvance")}
     </DropdownMenuCheckboxItem>
     {onOpenShadowing ? (
      <DropdownMenuItem onSelect={onOpenShadowing}>{t("shadowing")}</DropdownMenuItem>
     ) : null}
     <DropdownMenuSeparator />
     <DropdownMenuLabel>{t("display")}</DropdownMenuLabel>
     <DropdownMenuCheckboxItem
      checked={focusMode}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={() => actions.toggleFocus()}
     >
      <Focus />
      {t("focus")}
     </DropdownMenuCheckboxItem>
     <DropdownMenuSeparator />
     {isCoarsePointer || compact ? (
      <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
       <Type />
       {t("font")} / {t("size")}
      </DropdownMenuItem>
     ) : (
      <HanziHomeReadingQuickSettingsMenu displayMode={displayMode} onChange={onDisplayModeChange} />
     )}
     {isCoarsePointer || compact ? null : menuContent}
    </DropdownMenuContent>
   </DropdownMenu>

   <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent
     size="md"
     closeLabel={common("close")}
     aria-describedby={undefined}
     onCloseAutoFocus={(event) => {
      event.preventDefault();
      toolsTriggerRef.current?.focus();
     }}
    >
     <DialogHeader>
      <DialogTitle>{t("title")}</DialogTitle>
     </DialogHeader>
     <DialogBody>
      <div className="grid gap-4">
       <ReadingSettingsTouchControls displayMode={displayMode} onChange={onDisplayModeChange} />
       {sheetContent ? (
        <>
         <Separator />
         {sheetContent}
        </>
       ) : null}
      </div>
     </DialogBody>
    </DialogContent>
   </Dialog>
  </>
 );
}

/** Publishes the active workspace Reader's controls, without moving its state into the shell. */
export function LessonReaderHeaderSettings({
 lesson,
 displayMode,
 onDisplayModeChange,
}: {
 lesson: TextbookLesson;
 displayMode: LessonDisplayMode;
 onDisplayModeChange: (updates: Partial<LessonDisplayMode>) => void;
}) {
 const ownerId = useId();
 const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
 const lessonLabels = useTranslations("BusinessChinese");
 const t = useTranslations("Reader.study.chrome.tools");
 const commandLabels = useTranslations("Reader.study.chrome.commands");
 const { isLoading } = useLearningState();
 const commands = useReaderCommands();
 const { actions } = useReaderStore();
 const loopCurrent = useReaderSelector((state) => state.playback.loopCurrent);
 const autoAdvance = useReaderSelector((state) => state.playback.autoAdvance);
 const focusMode = useReaderSelector((state) => state.ui.focusMode);
 const rate = useReaderSelector((state) => state.playback.rate);
 const playbackStatus = useReaderSelector((state) => state.playback.status);
 const segmentCount = useReaderSelector((state) => state.content.segmentIds.length);
 const panels = useMemo(
  () => ({
   reading: (
    <div className="grid divide-y divide-border-default">
     {visibilityOptions.map((option) => (
      <label
       key={option.key}
       className="flex min-h-12 items-center justify-between gap-3 px-3 py-2"
      >
       <Typography as="span" variant="bodySmall">
        {option.label}
       </Typography>
       <Switch
        checked={displayMode[option.key]}
        aria-label={option.label}
        disabled={
         isLoading ||
         (displayMode.revealMode === "tap" &&
          (option.key === "showPinyin" || option.key === "showMeaning"))
        }
        onCheckedChange={(checked) => onDisplayModeChange({ [option.key]: checked })}
       />
      </label>
     ))}
     <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       {t("autoPinyin")}
      </Typography>
      <Switch
       checked={displayMode.autoDetectPinyin}
       disabled={isLoading}
       aria-label={t("autoPinyin")}
       onCheckedChange={(checked) => onDisplayModeChange({ autoDetectPinyin: checked })}
      />
     </label>
     <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       {t("font")}
      </Typography>
      <Select
       value={displayMode.hanziFont}
       disabled={isLoading}
       onValueChange={(value) => {
        const option = fontOptions.find((item) => item.value === value);
        if (option) onDisplayModeChange({ hanziFont: option.value });
       }}
      >
       <SelectTrigger aria-label={t("font")}>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        {fontOptions.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          <HanziFontPreview as="span" font={option.value} leading="none">
           文
          </HanziFontPreview>
          {option.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       {t("size")}
      </Typography>
      <Select
       value={displayMode.hanziSize}
       disabled={isLoading}
       onValueChange={(value) => {
        const option = sizeOptions.find((item) => item.value === value);
        if (option) onDisplayModeChange({ hanziSize: option.value });
       }}
      >
       <SelectTrigger aria-label={t("size")}>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        {sizeOptions.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          {option.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       Cách mở nội dung
      </Typography>
      <Select
       value={displayMode.revealMode}
       disabled={isLoading}
       onValueChange={(value) => {
        const option = revealOptions.find((item) => item.value === value);
        if (option) onDisplayModeChange({ revealMode: option.value });
       }}
      >
       <SelectTrigger aria-label="Cách mở nội dung">
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        {revealOptions.map((option) => (
         <SelectItem key={option.value} value={option.value}>
          {option.label}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       {t("focus")}
      </Typography>
      <Switch
       checked={focusMode}
       aria-label={t("focus")}
       onCheckedChange={() => actions.toggleFocus()}
      />
     </label>
    </div>
   ),
   listening: (
    <div className="grid gap-1">
     <Button
      variant="menu"
      size="menu"
      align="start"
      disabled={segmentCount === 0}
      onClick={() => commands.playAll()}
     >
      <Play />
      {t("playAll")}
     </Button>
     <Button
      variant="menu"
      size="menu"
      align="start"
      disabled={segmentCount === 0}
      onClick={commands.restartCurrent}
     >
      <RotateCcw />
      {commandLabels("restart")}
     </Button>
     <Button
      variant="menu"
      size="menu"
      align="start"
      disabled={playbackStatus === "idle"}
      onClick={commands.stop}
     >
      <Square />
      {commandLabels("stopReading")}
     </Button>
     <Separator />
     <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       {commandLabels("rate")}
      </Typography>
      <Select
       value={String(rate)}
       onValueChange={(value) => {
        const option = readerRateOptions.find((item) => String(item) === value);
        if (option !== undefined) commands.setRate(option);
       }}
      >
       <SelectTrigger aria-label={commandLabels("rate")}>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        {readerRateOptions.map((option) => (
         <SelectItem key={option} value={String(option)}>
          {option === 1 ? "1.0x" : `${option}x`}
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       {t("loop")}
      </Typography>
      <Switch
       checked={loopCurrent}
       aria-label={t("loop")}
       onCheckedChange={() => actions.toggleLoop()}
      />
     </label>
     <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
      <Typography as="span" variant="bodySmall">
       {t("autoAdvance")}
      </Typography>
      <Switch
       checked={autoAdvance}
       aria-label={t("autoAdvance")}
       onCheckedChange={() => actions.toggleAutoAdvance()}
      />
     </label>
     <Separator />
     <BasePopover.Close
      render={<Button variant="menu" size="menu" align="start" />}
      onClick={() => setAudioSettingsOpen(true)}
     >
      <Volume2 />
      {lessonLabels("voiceAndOffline")}
     </BasePopover.Close>
    </div>
   ),
  }),
  [
   displayMode,
   onDisplayModeChange,
   isLoading,
   t,
   commandLabels,
   actions,
   commands,
   focusMode,
   loopCurrent,
   autoAdvance,
   rate,
   playbackStatus,
   segmentCount,
   lessonLabels,
  ],
 );
 useEffect(() => {
  headerToolbarStore.actions.setOwnedSettings(ownerId, panels.reading, panels.listening);
 }, [ownerId, panels]);
 useEffect(() => () => headerToolbarStore.actions.clearOwnedSettings(ownerId), [ownerId]);
 return (
  <OfflineAudioSettingsDialog
   lesson={lesson}
   trigger={null}
   open={audioSettingsOpen}
   onOpenChange={setAudioSettingsOpen}
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
