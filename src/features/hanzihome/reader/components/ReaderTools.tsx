"use client";

import { Focus, ListEnd, Play, Repeat2, Settings2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { HanziHomeReadingQuickSettingsMenu } from "@/features/hanzihome/HanziHomeReadingSettingsSection";
import { ReadingSettingsTouchControls } from "@/features/hanzihome/components/reading/ReadingSettingsTouchControls";
import { DEFAULT_LESSON_DISPLAY_MODE } from "@/features/hanzihome/components/lesson-overview/types";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 useReaderRuntimeActions,
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";

export function ReaderTools({ onOpenShadowing }: { onOpenShadowing?: () => void }) {
 const t = useTranslations("Reader.study.chrome.tools");
 const [sheetOpen, setSheetOpen] = useState(false);
 const commands = useReaderRuntimeCommands();
 const actions = useReaderRuntimeActions();
 const loopCurrent = useReaderRuntimeSelector((state) => state.loopCurrent);
 const autoAdvance = useReaderRuntimeSelector((state) => state.autoAdvance);
 const focusMode = useReaderRuntimeSelector((state) => state.focusMode);
 const learning = useLearningState();
 const displayMode = learning.state.settings.lessonTextDisplayMode ?? DEFAULT_LESSON_DISPLAY_MODE;
 const updateDisplayMode = (updates: Partial<typeof displayMode>) => {
  learning.updateSettings({ lessonTextDisplayMode: { ...displayMode, ...updates } });
 };

 return (
  <>
   <div className="hidden xl:block">
    <DropdownMenu>
     <DropdownMenuTrigger asChild>
      <Button type="button" variant="outline" size="toolbar">
       <Settings2 data-icon="inline-start" />
       {t("title")}
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" width="lg">
      <DropdownMenuLabel>{t("listening")}</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => commands.playAll()}>
       <Play />
       {t("playAll")}
      </DropdownMenuItem>
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
      <HanziHomeReadingQuickSettingsMenu />
     </DropdownMenuContent>
    </DropdownMenu>
   </div>

   <div className="xl:hidden">
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     aria-haspopup="dialog"
     aria-expanded={sheetOpen}
     onClick={() => setSheetOpen(true)}
    >
     <Settings2 data-icon="inline-start" />
     <span className="hidden sm:inline">{t("title")}</span>
     <span className="sm:hidden">{t("shortTitle")}</span>
    </Button>
   </div>

   <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side="bottom" height="tall">
    <SheetHeader title={t("title")} onClose={() => setSheetOpen(false)} />
    <SheetBody className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
     <div className="grid gap-5">
      <section className="grid gap-3">
       <Typography as="h3" variant="cardTitle" tone="muted" weight="black" transform="uppercase">
        {t("listening")}
       </Typography>
       <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
      </section>

      <Separator />
      <ReadingSettingsTouchControls displayMode={displayMode} onChange={updateDisplayMode} />
     </div>
    </SheetBody>
   </Sheet>
  </>
 );
}
