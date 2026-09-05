"use client";

import { ChevronLeft, ChevronRight, List, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

import {
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";
import { ReaderTools, readerRateOptions } from "./ReaderTools";

export type ReaderToolbarStickyOffset = "none" | "page" | "tabs";

const stickyClassName: Record<ReaderToolbarStickyOffset, string> = {
 none: "",
 page: "sticky top-0 z-20",
 tabs: "sticky top-12 z-20",
};

export function ReaderCommandBar({
 segmentCount,
 onOpenOutline,
 onOpenShadowing,
 stickyOffset = "page",
 compact = false,
 outlineMenu,
 displayMode,
 onDisplayModeChange,
}: {
 segmentCount: number;
 onOpenOutline: () => void;
 onOpenShadowing?: () => void;
 stickyOffset?: ReaderToolbarStickyOffset;
 compact?: boolean;
 outlineMenu?: (onNavigate: () => void) => ReactNode;
 displayMode?: LessonDisplayMode;
 onDisplayModeChange?: (updates: Partial<LessonDisplayMode>) => void;
}) {
 const t = useTranslations("Reader.study.chrome.commands");
 const commands = useReaderRuntimeCommands();
 const isCoarsePointer = useCoarsePointer();
 const [outlineMenuOpen, setOutlineMenuOpen] = useState(false);
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const playbackStatus = useReaderRuntimeSelector((state) => state.playbackStatus);
 const rate = useReaderRuntimeSelector((state) => state.rate);
 const isFirst = activeIndex <= 0;
 const isLast = activeIndex >= segmentCount - 1;
 const isIdle = playbackStatus === "idle";
 const commandSize = isCoarsePointer ? "touch" : "toolbar";
 const iconCommandSize = isCoarsePointer ? "icon" : "icon-toolbar";

 const togglePlayback = () => {
  if (playbackStatus === "playing") commands.pause();
  else if (playbackStatus === "paused") commands.resume();
  else if (playbackStatus === "loading") commands.stop();
  else commands.playCurrent();
 };
 const playbackLabel =
  playbackStatus === "playing"
   ? t("pause")
   : playbackStatus === "paused"
     ? t("resume")
     : playbackStatus === "loading"
       ? t("stop")
       : t("listen");
 const PlaybackIcon =
  playbackStatus === "playing" ? Pause : playbackStatus === "loading" ? Square : Play;
 const useOutlineDropdown = !isCoarsePointer && outlineMenu !== undefined;

 return (
  <Card variant="section" padding="sm" className={stickyClassName[stickyOffset]}>
   <div className="flex min-w-0 items-center gap-1 sm:flex-wrap sm:gap-2">
    <Typography variant="caption" tone="muted" weight="black" className="mr-auto">
     <span className="sr-only sm:not-sr-only">
      {t("segment", { current: activeIndex + 1, total: segmentCount })}
     </span>
     <span className="whitespace-nowrap sm:hidden" aria-hidden="true">
      {activeIndex + 1} / {segmentCount}
     </span>
    </Typography>
    <Button
     type="button"
     variant="ghost"
     size={iconCommandSize}
     disabled={isFirst}
     aria-label={t("previous")}
     onClick={commands.previous}
    >
     <ChevronLeft />
    </Button>
    <Button
     type="button"
     variant={isIdle ? "default" : "active"}
     size={commandSize}
     aria-label={playbackLabel}
     onClick={togglePlayback}
    >
     <PlaybackIcon data-icon="inline-start" />
     <span className="hidden sm:inline">{playbackLabel}</span>
    </Button>
    <Button
     type="button"
     variant="ghost"
     size={iconCommandSize}
     aria-label={t("restart")}
     title={t("restart")}
     onClick={commands.restartCurrent}
     className="hidden sm:inline-flex"
    >
     <RotateCcw />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size={iconCommandSize}
     disabled={isIdle}
     aria-label={t("stopReading")}
     title={t("stopReading")}
     onClick={commands.stop}
     className="hidden sm:inline-flex"
    >
     <Square />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size={iconCommandSize}
     disabled={isLast}
     aria-label={t("next")}
     onClick={commands.next}
    >
     <ChevronRight />
    </Button>
    <div className="hidden sm:block">
     <Select value={String(rate)} onValueChange={(value) => commands.setRate(Number(value))}>
      <SelectTrigger size="sm" aria-label={t("rate")}>
       <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
       {readerRateOptions.map((option) => (
        <SelectItem key={option} value={String(option)}>
         {option.toFixed(2)}x
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>
    {useOutlineDropdown ? (
     <Popover.Root open={outlineMenuOpen} onOpenChange={setOutlineMenuOpen} modal={false}>
      <Popover.Trigger
       render={
        <Button
         type="button"
         variant="outline"
         size={iconCommandSize}
         aria-label={t("openOutline")}
         title={t("outline")}
         className={compact ? undefined : "2xl:hidden"}
        />
       }
      >
       <List />
      </Popover.Trigger>
      <Popover.Portal>
       <BasePopoverPositioner
        side="bottom"
        align="end"
        sideOffset={8}
        collisionPadding={8}
        positionMethod="fixed"
       >
        <BasePopoverPopup initialFocus={false} finalFocus={false} variant="moduleMenu">
         {outlineMenu(() => setOutlineMenuOpen(false))}
        </BasePopoverPopup>
       </BasePopoverPositioner>
      </Popover.Portal>
     </Popover.Root>
    ) : (
     <div className={compact ? undefined : "2xl:hidden"}>
      <Button
       type="button"
       variant="outline"
       size={iconCommandSize}
       aria-label={t("openOutline")}
       title={t("outline")}
       onClick={onOpenOutline}
      >
       <List />
      </Button>
     </div>
    )}
    <ReaderTools
     onOpenShadowing={onOpenShadowing}
     displayMode={displayMode}
     onDisplayModeChange={onDisplayModeChange}
    />
   </div>
  </Card>
 );
}
