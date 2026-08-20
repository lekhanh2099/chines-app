"use client";

import { ChevronLeft, ChevronRight, List, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useTranslations } from "next-intl";

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

import {
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";
import { ReaderTools } from "./ReaderTools";

const readerRateOptions: readonly number[] = [0.75, 0.9, 1, 1.1, 1.25];

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
}: {
 segmentCount: number;
 onOpenOutline: () => void;
 onOpenShadowing?: () => void;
 stickyOffset?: ReaderToolbarStickyOffset;
}) {
 const t = useTranslations("Reader.study.chrome.commands");
 const commands = useReaderRuntimeCommands();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const playbackStatus = useReaderRuntimeSelector((state) => state.playbackStatus);
 const rate = useReaderRuntimeSelector((state) => state.rate);
 const isFirst = activeIndex <= 0;
 const isLast = activeIndex >= segmentCount - 1;
 const isIdle = playbackStatus === "idle";

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

 return (
  <Card variant="section" padding="sm" className={stickyClassName[stickyOffset]}>
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <Typography variant="caption" tone="muted" weight="black" className="mr-auto">
     {t("segment", { current: activeIndex + 1, total: segmentCount })}
    </Typography>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isFirst}
     aria-label={t("previous")}
     onClick={commands.previous}
    >
     <ChevronLeft />
    </Button>
    <Button
     type="button"
     variant={isIdle ? "default" : "active"}
     size="toolbar"
     aria-label={playbackLabel}
     onClick={togglePlayback}
    >
     <PlaybackIcon data-icon="inline-start" />
     {playbackLabel}
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={t("restart")}
     title={t("restart")}
     onClick={commands.restartCurrent}
    >
     <RotateCcw />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isIdle}
     aria-label={t("stopReading")}
     title={t("stopReading")}
     onClick={commands.stop}
    >
     <Square />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isLast}
     aria-label={t("next")}
     onClick={commands.next}
    >
     <ChevronRight />
    </Button>
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
    <div className="2xl:hidden">
     <Button
      type="button"
      variant="outline"
      size="icon-toolbar"
      aria-label={t("openOutline")}
      title={t("outline")}
      onClick={onOpenOutline}
     >
      <List />
     </Button>
    </div>
    <ReaderTools onOpenShadowing={onOpenShadowing} />
   </div>
  </Card>
 );
}
