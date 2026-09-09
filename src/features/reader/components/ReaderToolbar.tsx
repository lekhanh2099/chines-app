"use client";

"use client";

import {
 BookOpen,
 ChevronLeft,
 ChevronRight,
 Languages,
 Pause,
 Play,
 RotateCcw,
 Square,
} from "lucide-react";
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
 useReaderDisplay,
 useReaderSelector,
 useReaderServices,
} from "../runtime/reader-context";
import { ReaderTools } from "./ReaderTools";
import { ReaderOutline } from "./ReaderOutline";

export function ReaderToolbar() {
 const t = useTranslations("Reader.study.chrome.commands");
 const toolsLabels = useTranslations("Reader.study.chrome.tools");
 const commands = useReaderCommands();
 const { speech, toolbar, renderTools } = useReaderServices();
 const { value: display, onChange: onDisplayChange } = useReaderDisplay();

 const index = useReaderSelector((state) => state.navigation.activeIndex);
 const segmentCount = useReaderSelector((state) => state.content.segmentIds.length);
 const status = useReaderSelector((state) => state.playback.status);
 const rate = useReaderSelector((state) => state.playback.rate);
 const error = useReaderSelector((state) => state.playback.error);
 const capabilities = useReaderSelector((state) => state.content.capabilities);

 const hasPinyin = capabilities.includes("pinyin");
 const hasTranslation = capabilities.includes("translation");
 const showContentDisplay =
  !toolbar?.hideContentDisplay && Boolean(onDisplayChange) && (hasPinyin || hasTranslation);
 const showAdvancedTools = !toolbar?.hideAdvancedTools;

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
   <div className="flex min-w-0 flex-wrap items-center gap-3" data-reader-toolbar>
    {/* Nhóm 1: Điều hướng nội dung (luôn có) */}
    <div className="flex items-center gap-1" data-reader-group="navigation">
     <Typography variant="caption" weight="medium" className="whitespace-nowrap px-1 select-none">
      {t("segment", { current: segmentCount === 0 ? 0 : index + 1, total: segmentCount })}
     </Typography>
     <Button
      variant="ghost"
      size="icon"
      aria-label={t("previous")}
      disabled={index === 0 || segmentCount === 0}
      onClick={commands.previous}
     >
      <ChevronLeft />
     </Button>
     <Button
      variant="ghost"
      size="icon"
      aria-label={t("restart")}
      disabled={segmentCount === 0 || !speech}
      onClick={commands.restartCurrent}
     >
      <RotateCcw />
     </Button>
     <Button
      variant="ghost"
      size="icon"
      aria-label={t("next")}
      disabled={segmentCount === 0 || index >= segmentCount - 1}
      onClick={commands.next}
     >
      <ChevronRight />
     </Button>
    </div>

    {/* Nhóm 2: Phát âm thanh (luôn có) */}
    <div className="flex items-center gap-1" data-reader-group="playback">
     {speech ? (
      <>
       <Button
        size="touch"
        aria-label={label}
        disabled={
         segmentCount === 0 ||
         (status === "playing" && !speech.pause) ||
         (status === "paused" && !speech.resume)
        }
        onClick={playback}
       >
        <PlaybackIcon />
        <span>{label}</span>
       </Button>
       <Button
        variant="ghost"
        size="icon"
        aria-label={t("stopReading")}
        disabled={status === "idle"}
        onClick={commands.stop}
       >
        <Square className="size-3.5 fill-current" />
       </Button>
       <Select value={String(rate)} onValueChange={(value) => commands.setRate(Number(value))}>
        <SelectTrigger aria-label={t("rate")} size="sm" className="w-[5.5rem]">
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
     <ReaderOutline />
    </div>

    {/* Nhóm 3: Hiển thị nội dung (chỉ hiển thị nếu có) */}
    {showContentDisplay ? (
     <div className="flex items-center gap-1" data-reader-group="display">
      {hasPinyin ? (
       <Button
        variant={display.showPinyin ? "active" : "outline"}
        size="toolbar"
        aria-label={toolsLabels("showPinyin")}
        aria-pressed={display.showPinyin}
        disabled={display.revealMode === "tap"}
        onClick={() => onDisplayChange?.({ ...display, showPinyin: !display.showPinyin })}
       >
        <Languages data-icon="inline-start" />
        <span>{toolsLabels("pinyin")}</span>
       </Button>
      ) : null}
      {hasTranslation ? (
       <Button
        variant={display.showMeaning ? "active" : "outline"}
        size="toolbar"
        aria-label={toolsLabels("showTranslation")}
        aria-pressed={display.showMeaning}
        disabled={display.revealMode === "tap"}
        onClick={() => onDisplayChange?.({ ...display, showMeaning: !display.showMeaning })}
       >
        <BookOpen data-icon="inline-start" />
        <span>{toolsLabels("translation")}</span>
       </Button>
      ) : null}
     </div>
    ) : null}

    {/* Nhóm 4: Tính năng nâng cao (chỉ hiển thị nếu có) */}
    {showAdvancedTools ? (
     <div className="flex items-center gap-1" data-reader-group="tools">
      {renderTools ? renderTools({ content: <ReaderTools /> }) : <ReaderTools />}
     </div>
    ) : null}

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
