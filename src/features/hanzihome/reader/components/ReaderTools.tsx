"use client";

import { Focus, ListEnd, Play, Repeat2, RotateCcw, Settings2, Square } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { HanziHomeReadingQuickSettingsMenu } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { ReadingSettingsTouchControls } from "@/features/hanzihome/components/reading/ReadingSettingsTouchControls";
import {
 DEFAULT_LESSON_DISPLAY_MODE,
 type LessonDisplayMode,
} from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import {
 useReaderRuntimeActions,
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";

type ReaderToolsProps = {
 onOpenShadowing?: () => void;
 displayMode?: LessonDisplayMode;
 onDisplayModeChange?: (updates: Partial<LessonDisplayMode>) => void;
};

export const readerRateOptions: readonly number[] = [0.75, 0.9, 1, 1.1, 1.25];

export function ReaderTools({
 onOpenShadowing,
 displayMode,
 onDisplayModeChange,
}: ReaderToolsProps) {
 if (displayMode && onDisplayModeChange) {
  return (
   <ReaderToolsContent
    onOpenShadowing={onOpenShadowing}
    displayMode={displayMode}
    onDisplayModeChange={onDisplayModeChange}
    persistentSettings={false}
   />
  );
 }

 return <ConnectedReaderTools onOpenShadowing={onOpenShadowing} />;
}

function ConnectedReaderTools({ onOpenShadowing }: { onOpenShadowing?: () => void }) {
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const updateDisplayMode = (updates: Partial<LessonDisplayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 return (
  <ReaderToolsContent
   onOpenShadowing={onOpenShadowing}
   displayMode={displayMode}
   onDisplayModeChange={updateDisplayMode}
   persistentSettings
  />
 );
}

function ReaderToolsContent({
 onOpenShadowing,
 displayMode,
 onDisplayModeChange,
 persistentSettings,
}: {
 onOpenShadowing?: () => void;
 displayMode: LessonDisplayMode;
 onDisplayModeChange: (updates: Partial<LessonDisplayMode>) => void;
 persistentSettings: boolean;
}) {
 const t = useTranslations("Reader.study.chrome.tools");
 const commandLabels = useTranslations("Reader.study.chrome.commands");
 const [sheetOpen, setSheetOpen] = useState(false);
 const isCoarsePointer = useCoarsePointer();
 const commands = useReaderRuntimeCommands();
 const actions = useReaderRuntimeActions();
 const loopCurrent = useReaderRuntimeSelector((state) => state.loopCurrent);
 const autoAdvance = useReaderRuntimeSelector((state) => state.autoAdvance);
 const focusMode = useReaderRuntimeSelector((state) => state.focusMode);
 const rate = useReaderRuntimeSelector((state) => state.rate);
 const playbackStatus = useReaderRuntimeSelector((state) => state.playbackStatus);

 return (
  <>
   {!isCoarsePointer ? (
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button type="button" variant="outline" size="toolbar" aria-label={t("title")}>
       <Settings2 data-icon="inline-start" />
       <span className="hidden sm:inline">{t("title")}</span>
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" width="lg">
      <DropdownMenuLabel>{t("listening")}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => commands.playAll()}>
       <Play />
       {t("playAll")}
      </DropdownMenuItem>
      <div className="sm:hidden">
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
      </div>
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
      {persistentSettings ? (
       <HanziHomeReadingQuickSettingsMenu />
      ) : (
       <HanziHomeReadingQuickSettingsMenu
        displayMode={displayMode}
        onChange={onDisplayModeChange}
       />
      )}
     </DropdownMenuContent>
    </DropdownMenu>
   ) : (
    <>
     <Button
      type="button"
      variant="outline"
      size="toolbar"
      aria-haspopup="dialog"
      aria-label={t("title")}
      aria-expanded={sheetOpen}
      onClick={() => setSheetOpen(true)}
     >
      <Settings2 data-icon="inline-start" />
      <span className="hidden sm:inline">{t("title")}</span>
     </Button>

     <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="bottom" height="tall">
      <SheetHeader title={t("title")} onClose={() => setSheetOpen(false)} />
      <SheetBody className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
       <div className="grid gap-5">
        <section className="grid gap-3">
         <Typography as="h3" variant="cardTitle" tone="muted" weight="black" transform="uppercase">
          {t("listening")}
         </Typography>
         <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button
           type="button"
           variant="surfaceCard"
           size="touch"
           className="sm:hidden"
           onClick={commands.restartCurrent}
          >
           <RotateCcw data-icon="inline-start" />
           {commandLabels("restart")}
          </Button>
          <Button
           type="button"
           variant="surfaceCard"
           size="touch"
           className="sm:hidden"
           disabled={playbackStatus === "idle"}
           onClick={commands.stop}
          >
           <Square data-icon="inline-start" />
           {commandLabels("stopReading")}
          </Button>
          <Button type="button" variant="surfaceCard" size="touch" onClick={commands.playAll}>
           <Play data-icon="inline-start" />
           {t("playAll")}
          </Button>
          <Button
           type="button"
           variant={loopCurrent ? "active" : "surfaceCard"}
           size="touch"
           aria-pressed={loopCurrent}
           onClick={() => actions.toggleLoop()}
          >
           <Repeat2 data-icon="inline-start" />
           {t("loop")}
          </Button>
          <Button
           type="button"
           variant={autoAdvance ? "active" : "surfaceCard"}
           size="touch"
           aria-pressed={autoAdvance}
           onClick={() => actions.toggleAutoAdvance()}
          >
           <ListEnd data-icon="inline-start" />
           {t("autoAdvance")}
          </Button>
          {onOpenShadowing ? (
           <Button type="button" variant="surfaceCard" size="touch" onClick={onOpenShadowing}>
            {t("shadowing")}
           </Button>
          ) : null}
          <Button
           type="button"
           variant={focusMode ? "active" : "surfaceCard"}
           size="touch"
           aria-pressed={focusMode}
           onClick={() => actions.toggleFocus()}
          >
           <Focus data-icon="inline-start" />
           {t("focus")}
          </Button>
         </div>
         <div className="grid gap-2 sm:hidden">
          <Typography variant="label">{commandLabels("rate")}</Typography>
          <Select value={String(rate)} onValueChange={(value) => commands.setRate(Number(value))}>
           <SelectTrigger width="full" aria-label={commandLabels("rate")}>
            <SelectValue />
           </SelectTrigger>
           <SelectContent>
            {readerRateOptions.map((option) => (
             <SelectItem key={option} value={String(option)}>
              {option.toFixed(2)}x
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </div>
        </section>

        <Separator />
        <ReadingSettingsTouchControls displayMode={displayMode} onChange={onDisplayModeChange} />
       </div>
      </SheetBody>
     </Sheet>
    </>
   )}
  </>
 );
}
