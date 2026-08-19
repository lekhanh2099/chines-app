"use client";

import { ChevronLeft, ChevronRight, List, Pause, Play, RotateCcw, Square } from "lucide-react";

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
import { cn } from "@/lib/utils";

import {
 useReaderRuntimeCommands,
 useReaderRuntimeSelector,
} from "../runtime/ReaderRuntimeProvider";
import { ReaderTools } from "./ReaderTools";

const readerRateOptions: readonly number[] = [0.75, 0.9, 1, 1.1, 1.25];

export type ReaderToolbarStickyOffset = "none" | "page" | "tabs";

function stickyClassName(offset: ReaderToolbarStickyOffset) {
 if (offset === "page") return "sticky top-0 z-20";
 if (offset === "tabs") return "sticky top-12 z-20";
 return "";
}

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
   ? "Tạm dừng"
   : playbackStatus === "paused"
     ? "Tiếp tục"
     : playbackStatus === "loading"
       ? "Dừng"
       : "Nghe bài";
 const PlaybackIcon =
  playbackStatus === "playing" ? Pause : playbackStatus === "loading" ? Square : Play;

 return (
  <Card
   variant="section"
   padding="sm"
   className={cn(stickyClassName(stickyOffset), "bg-bg-subtle/95 backdrop-blur")}
  >
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <Typography variant="caption" tone="muted" weight="black" className="mr-auto">
     Đoạn {activeIndex + 1} / {segmentCount}
    </Typography>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isFirst}
     aria-label="Đoạn trước"
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
     aria-label="Nghe lại đoạn"
     title="Nghe lại đoạn"
     onClick={commands.restartCurrent}
    >
     <RotateCcw />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isIdle}
     aria-label="Dừng đọc"
     title="Dừng đọc"
     onClick={commands.stop}
    >
     <Square />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     disabled={isLast}
     aria-label="Đoạn sau"
     onClick={commands.next}
    >
     <ChevronRight />
    </Button>
    <Select value={String(rate)} onValueChange={(value) => commands.setRate(Number(value))}>
     <SelectTrigger size="sm" aria-label="Tốc độ đọc">
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
      aria-label="Mở mục lục đoạn"
      title="Mục lục đoạn"
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
