"use client";

import { ChevronLeft, ChevronRight, List, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 useReaderCommands,
 useReaderRegistry,
 useReaderSelector,
 useReaderServices,
 useReaderStore,
} from "../runtime/reader-context";
import { ReaderTools } from "./ReaderTools";

export function ReaderToolbar() {
 const t = useTranslations("Reader.study.chrome.commands");
 const commands = useReaderCommands();
 const registry = useReaderRegistry();
 const { speech, toolbar, renderTools } = useReaderServices();
 const { actions } = useReaderStore();
 const index = useReaderSelector((state) => state.navigation.activeIndex);
 const count = useReaderSelector((state) => state.content.segmentIds.length);
 const status = useReaderSelector((state) => state.playback.status);
 const rate = useReaderSelector((state) => state.playback.rate);
 const error = useReaderSelector((state) => state.playback.error);
 const outlineOpen = useReaderSelector((state) => state.ui.outlineOpen);
 const label =
  status === "playing"
   ? t("pause")
   : status === "paused"
     ? t("resume")
     : status === "loading"
       ? t("stop")
       : t("listen");
 const PlaybackIcon = status === "playing" ? Pause : status === "loading" ? Square : Play;
 const playback = () => {
  if (status === "playing") commands.pause();
  else if (status === "paused") commands.resume();
  else if (status === "loading") commands.stop();
  else commands.playCurrent();
 };
 return (
  <Card
   padding="sm"
   className={
    toolbar?.stickyOffset === "tabs"
     ? "sticky top-12 z-20"
     : toolbar?.stickyOffset === "page"
       ? "sticky top-0 z-20"
       : undefined
   }
  >
   <div className="flex min-w-0 flex-wrap items-center gap-2" data-reader-toolbar>
    <Typography variant="caption" className="mr-auto">
     {t("segment", { current: count === 0 ? 0 : index + 1, total: count })}
    </Typography>
    <Button
     variant="ghost"
     size="icon"
     aria-label={t("previous")}
     disabled={index === 0 || count === 0}
     onClick={commands.previous}
    >
     <ChevronLeft />
    </Button>
    {speech ? (
     <>
      <Button
       variant="ghost"
       size="icon"
       aria-label={t("restart")}
       disabled={count === 0}
       onClick={commands.restartCurrent}
      >
       <RotateCcw />
      </Button>
      <Button
       size="touch"
       aria-label={label}
       disabled={
        count === 0 ||
        (status === "playing" && !speech.pause) ||
        (status === "paused" && !speech.resume)
       }
       onClick={playback}
      >
       <PlaybackIcon />
       {label}
      </Button>
     </>
    ) : null}
    <Button
     variant="ghost"
     size="icon"
     aria-label={t("next")}
     disabled={count === 0 || index >= count - 1}
     onClick={commands.next}
    >
     <ChevronRight />
    </Button>
    {speech ? (
     <>
      <Button
       variant="ghost"
       size="icon"
       aria-label={t("stopReading")}
       disabled={status === "idle"}
       onClick={commands.stop}
      >
       <Square />
      </Button>
      <Select value={String(rate)} onValueChange={(value) => commands.setRate(Number(value))}>
       <SelectTrigger aria-label={t("rate")}>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        {[0.75, 0.9, 1, 1.1, 1.25].map((option) => (
         <SelectItem key={option} value={String(option)}>
          {option.toFixed(2)}x
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </>
    ) : null}
    <Button
     variant="outline"
     size="icon"
     aria-label={t("openOutline")}
     aria-expanded={outlineOpen}
     disabled={count === 0}
     onClick={(event) => {
      registry.setOutlineTrigger(event.currentTarget);
      actions.openOutline();
     }}
    >
     <List />
    </Button>
    {renderTools ? renderTools({ content: <ReaderTools /> }) : <ReaderTools />}
    {toolbar?.actions}
   </div>
   {error ? (
    <Typography role="alert" tone="danger" wrapping="breakWords">
     {error}
    </Typography>
   ) : null}
  </Card>
 );
}
