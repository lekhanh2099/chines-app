"use client";

import {
 BookOpen,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 Languages,
 Pause,
 Play,
 RotateCcw,
 Square,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Typography } from "@/components/ui/display/typography";
import {
 useReaderCommands,
 useReaderDisplay,
 useReaderSelector,
 useReaderServices,
} from "../runtime/reader-context";
import { ReaderOutline } from "./ReaderOutline";
import { ReaderTools } from "./ReaderTools";

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
 const showPinyinButton = hasPinyin && !toolbar?.hidePinyinToggle;
 const showTranslationButton = hasTranslation && !toolbar?.hideTranslationToggle;
 const showContentDisplay =
  !toolbar?.hideContentDisplay &&
  Boolean(onDisplayChange) &&
  (showPinyinButton || showTranslationButton);
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
   variant={toolbar?.stickyOffset ? "elevated" : "default"}
   className={
    toolbar?.stickyOffset === "tabs"
     ? "sticky top-12 z-20"
     : toolbar?.stickyOffset === "page"
       ? "sticky top-0 z-20"
       : undefined
   }
  >
   <div
    className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none"
    data-reader-toolbar
   >
    {/* Nhóm 0: Điều hướng đầu toolbar (ví dụ: mục lục phần học) */}
    {toolbar?.leadingActions ? (
     <div className="flex shrink-0 items-center gap-1" data-reader-group="leading">
      {toolbar.leadingActions}
     </div>
    ) : null}

    {/* Nhóm 1: Phát âm thanh và điều hướng câu */}
    <div className="flex shrink-0 items-center gap-1" data-reader-group="playback">
     {speech ? (
      <Button
       size="toolbar"
       className="w-9 justify-center sm:w-auto"
       aria-label={label}
       disabled={
        segmentCount === 0 ||
        (status === "playing" && !speech.pause) ||
        (status === "paused" && !speech.resume)
       }
       onClick={playback}
      >
       <PlaybackIcon data-icon="inline-start" />
       <span className="hidden sm:inline">{label}</span>
      </Button>
     ) : null}
     {speech && status !== "idle" ? (
      <Button
       variant="ghost"
       size="icon-toolbar"
       aria-label={t("stopReading")}
       onClick={commands.stop}
      >
       <Square className="size-3.5 fill-current" />
      </Button>
     ) : null}
     <Button
      variant="ghost"
      size="icon-toolbar"
      aria-label={t("previous")}
      disabled={index === 0 || segmentCount === 0}
      onClick={commands.previous}
     >
      <ChevronLeft />
     </Button>
     <Typography
      variant="caption"
      weight="medium"
      tone="muted"
      className="hidden md:inline whitespace-nowrap px-1 select-none"
      aria-label={t("segment", {
       current: segmentCount === 0 ? 0 : index + 1,
       total: segmentCount,
      })}
     >
      {t("segment", { current: segmentCount === 0 ? 0 : index + 1, total: segmentCount })}
     </Typography>
     <Button
      variant="ghost"
      size="icon-toolbar"
      aria-label={t("next")}
      disabled={segmentCount === 0 || index >= segmentCount - 1}
      onClick={commands.next}
     >
      <ChevronRight />
     </Button>
     <Button
      variant="ghost"
      size="icon-toolbar"
      aria-label={t("restart")}
      disabled={segmentCount === 0 || !speech}
      onClick={commands.restartCurrent}
     >
      <RotateCcw />
     </Button>
     {!toolbar?.leadingActions ? <ReaderOutline /> : null}
     {speech ? (
      <div className="hidden md:flex items-center">
       <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
         <Button
          variant="outline"
          size="toolbar"
          className="gap-1"
          aria-label={t("rate")}
          title={t("rate")}
         >
          <span className="font-mono">{rate === 1 ? "1.0x" : `${rate}x`}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
         </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" width="content" density="compact">
         <DropdownMenuRadioGroup
          value={String(rate)}
          onValueChange={(value) => commands.setRate(Number(value))}
         >
          {[0.75, 0.9, 1, 1.1, 1.25].map((option) => (
           <DropdownMenuRadioItem key={option} value={String(option)}>
            {option === 1 ? "1.0x" : `${option}x`}
           </DropdownMenuRadioItem>
          ))}
         </DropdownMenuRadioGroup>
        </DropdownMenuContent>
       </DropdownMenu>
      </div>
     ) : null}
    </div>

    {/* Nhóm 3: Quick Toggles (Pinyin, Bản dịch) - Hiển thị trực tiếp từ màn hình md trở lên */}
    {showContentDisplay ? (
     <div className="hidden md:flex shrink-0 items-center gap-1" data-reader-group="display">
      {showPinyinButton ? (
       <Button
        variant={display?.showPinyin ? "active" : "outline"}
        size="toolbar"
        aria-label={toolsLabels("showPinyin")}
        aria-pressed={display?.showPinyin}
        disabled={display?.revealMode === "tap"}
        onClick={() => onDisplayChange?.({ ...display, showPinyin: !display?.showPinyin })}
       >
        <Languages data-icon="inline-start" />
        <span>{toolsLabels("pinyin")}</span>
       </Button>
      ) : null}
      {showTranslationButton ? (
       <Button
        variant={display?.showMeaning ? "active" : "outline"}
        size="toolbar"
        aria-label={toolsLabels("showTranslation")}
        aria-pressed={display?.showMeaning}
        disabled={display?.revealMode === "tap"}
        onClick={() => onDisplayChange?.({ ...display, showMeaning: !display?.showMeaning })}
       >
        <BookOpen data-icon="inline-start" />
        <span>{toolsLabels("translation")}</span>
       </Button>
      ) : null}
     </div>
    ) : null}

    {/* Nhóm 4: Tính năng nâng cao */}
    {showAdvancedTools ? (
     <div className="flex shrink-0 items-center" data-reader-group="tools">
      {renderTools ? renderTools({ content: <ReaderTools /> }) : <ReaderTools />}
     </div>
    ) : null}

    {/* Nhóm 5: Công cụ của workspace */}
    {toolbar?.actions ? (
     <div className="ml-auto flex shrink-0 items-center gap-1.5">{toolbar.actions}</div>
    ) : null}
   </div>
   {error ? (
    <Typography role="alert" tone="danger" wrapping="breakWords">
     {error}
    </Typography>
   ) : null}
  </Card>
 );
}
