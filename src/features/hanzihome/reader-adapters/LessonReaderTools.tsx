"use client";

import { Focus, ListEnd, Play, Repeat2, RotateCcw, Settings2, Square, Type } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
