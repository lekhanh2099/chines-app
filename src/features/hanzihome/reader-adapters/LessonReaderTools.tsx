"use client";

import {
 Focus,
 Headphones,
 ListEnd,
 Play,
 Repeat2,
 RotateCcw,
 Settings2,
 Square,
} from "lucide-react";
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
import { Switch } from "@/components/ui/forms/switch";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Separator } from "@/components/ui/layout/separator";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Typography } from "@/components/ui/display/typography";
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
 compactAtWide: _compactAtWide,
}: {
 onOpenShadowing?: () => void;
 displayMode: LessonDisplayMode;
 onDisplayModeChange: (updates: Partial<LessonDisplayMode>) => void;
 menuContent?: ReactNode;
 sheetContent?: ReactNode;
 compactAtWide?: boolean;
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
   {!isCoarsePointer && !compact ? (
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button type="button" variant="outline" size="icon-toolbar" aria-label={t("title")}>
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
      {
       <HanziHomeReadingQuickSettingsMenu
        displayMode={displayMode}
        onChange={onDisplayModeChange}
       />
      }
      {menuContent}
     </DropdownMenuContent>
    </DropdownMenu>
   ) : (
    <>
     <Button
      type="button"
      variant="outline"
      size="icon-toolbar"
      aria-haspopup="dialog"
      ref={toolsTriggerRef}
      aria-label={t("title")}
      aria-expanded={dialogOpen}
      onClick={() => setDialogOpen(true)}
     >
      <Settings2 />
     </Button>

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
         <section className="grid gap-3">
          <div className="flex items-center gap-2">
           <Headphones aria-hidden="true" className="size-4 text-text-muted" />
           <Typography
            as="h3"
            variant="cardTitle"
            tone="muted"
            weight="black"
            transform="uppercase"
           >
            {t("listening")}
           </Typography>
          </div>

          <div className="grid grid-cols-2 gap-2">
           <Button type="button" variant="surfaceCard" size="touch" onClick={commands.playAll}>
            <Play data-icon="inline-start" />
            {t("playAll")}
           </Button>
           <Button
            type="button"
            variant="surfaceCard"
            size="touch"
            wrap="normal"
            onClick={commands.restartCurrent}
           >
            <RotateCcw data-icon="inline-start" />
            {commandLabels("restart")}
           </Button>
           <Button
            type="button"
            variant="surfaceCard"
            size="touch"
            wrap="normal"
            disabled={playbackStatus === "idle"}
            onClick={commands.stop}
           >
            <Square data-icon="inline-start" />
            {commandLabels("stopReading")}
           </Button>
          </div>

          {onOpenShadowing ? (
           <Button type="button" variant="surfaceCard" size="touch" onClick={onOpenShadowing}>
            {t("shadowing")}
           </Button>
          ) : null}

          <div className="divide-y divide-border-default">
           <div className="flex min-h-11 items-center justify-between gap-3 py-1.5">
            <Typography variant="label">{t("loop")}</Typography>
            <Switch
             checked={loopCurrent}
             onCheckedChange={() => actions.toggleLoop()}
             aria-label={t("loop")}
            />
           </div>
           <div className="flex min-h-11 items-center justify-between gap-3 py-1.5">
            <Typography variant="label">{t("autoAdvance")}</Typography>
            <Switch
             checked={autoAdvance}
             onCheckedChange={() => actions.toggleAutoAdvance()}
             aria-label={t("autoAdvance")}
            />
           </div>
           <div className="flex min-h-11 items-center justify-between gap-3 py-1.5">
            <Typography variant="label">{t("focus")}</Typography>
            <Switch
             checked={focusMode}
             onCheckedChange={() => actions.toggleFocus()}
             aria-label={t("focus")}
            />
           </div>
          </div>

          <div className="grid gap-2">
           <Typography variant="label">{commandLabels("rate")}</Typography>
           <SegmentedControl<string>
            value={String(rate)}
            items={readerRateOptions.map((option) => ({
             key: String(option),
             label: `${option}x`,
            }))}
            onChange={(value) => commands.setRate(Number(value))}
            density="touch"
            layout="wrap"
            aria-label={commandLabels("rate")}
           />
          </div>
         </section>

         <Separator />
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
   )}
  </>
 );
}
