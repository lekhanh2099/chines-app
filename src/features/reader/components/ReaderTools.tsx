"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { BookOpen, Focus, Languages, ListEnd, Repeat2, Settings2, Square } from "lucide-react";

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
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
 readerFontSchema,
 readerSizeSchema,
 readerRevealModeSchema,
} from "../model/reader-display";
import {
 useReaderCommands,
 useReaderDisplay,
 useReaderSelector,
 useReaderServices,
 useReaderStore,
} from "../runtime/reader-context";

const readerRateOptions: readonly number[] = [0.75, 0.9, 1, 1.1, 1.25];

export function ReaderTools() {
 const t = useTranslations("Reader.study.chrome.tools");
 const commandLabels = useTranslations("Reader.study.chrome.commands");
 const commands = useReaderCommands();
 const { speech } = useReaderServices();
 const { value: display, onChange } = useReaderDisplay();
 const { actions } = useReaderStore();
 const loop = useReaderSelector((state) => state.playback.loopCurrent);
 const auto = useReaderSelector((state) => state.playback.autoAdvance);
 const focus = useReaderSelector((state) => state.ui.focusMode);
 const empty = useReaderSelector((state) => state.content.segmentIds.length === 0);
 const rate = useReaderSelector((state) => state.playback.rate);
 const playbackStatus = useReaderSelector((state) => state.playback.status);
 const [open, setOpen] = useState(false);
 const trigger = useRef<HTMLButtonElement>(null);

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      ref={trigger}
      type="button"
      variant="outline"
      size="icon-toolbar"
      aria-label={t("title")}
     >
      <Settings2 />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     {speech ? (
      <DropdownMenuItem disabled={empty} onSelect={() => commands.playAll()}>
       <BookOpen />
       <span>{t("playAll")}</span>
      </DropdownMenuItem>
     ) : null}
     {speech ? (
      <DropdownMenuItem disabled={playbackStatus === "idle"} onSelect={commands.stop}>
       <Square />
       <span>{commandLabels("stopReading")}</span>
      </DropdownMenuItem>
     ) : null}
     {speech ? (
      <>
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
      </>
     ) : null}
     {speech ? (
      <DropdownMenuCheckboxItem
       checked={loop}
       disabled={empty}
       onSelect={(event) => event.preventDefault()}
       onCheckedChange={() => actions.toggleLoop()}
      >
       <Repeat2 />
       <span>{t("loop")}</span>
      </DropdownMenuCheckboxItem>
     ) : null}
     {speech ? (
      <DropdownMenuCheckboxItem
       checked={auto}
       disabled={empty}
       onSelect={(event) => event.preventDefault()}
       onCheckedChange={() => actions.toggleAutoAdvance()}
      >
       <ListEnd />
       <span>{t("autoAdvance")}</span>
      </DropdownMenuCheckboxItem>
     ) : null}
     <DropdownMenuCheckboxItem
      checked={focus}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={() => actions.toggleFocus()}
     >
      <Focus />
      <span>{t("focus")}</span>
     </DropdownMenuCheckboxItem>
     {onChange ? (
      <>
       <DropdownMenuSeparator />
       <DropdownMenuLabel>{t("display")}</DropdownMenuLabel>
       <DropdownMenuCheckboxItem
        checked={display.showPinyin}
        disabled={display.revealMode === "tap"}
        onSelect={(event) => event.preventDefault()}
        onCheckedChange={() => onChange({ ...display, showPinyin: !display.showPinyin })}
       >
        <Languages />
        <span>{t("pinyin")}</span>
       </DropdownMenuCheckboxItem>
       <DropdownMenuCheckboxItem
        checked={display.showMeaning}
        disabled={display.revealMode === "tap"}
        onSelect={(event) => event.preventDefault()}
        onCheckedChange={() => onChange({ ...display, showMeaning: !display.showMeaning })}
       >
        <BookOpen />
        <span>{t("translation")}</span>
       </DropdownMenuCheckboxItem>
       <DropdownMenuSeparator />
       <DropdownMenuItem onSelect={() => setOpen(true)}>
        <Settings2 />
        <span>
         {t("font")} / {t("size")}
        </span>
       </DropdownMenuItem>
      </>
     ) : null}
    </DropdownMenuContent>
   </DropdownMenu>

   {onChange ? (
    <Sheet
     open={open}
     onOpenChange={setOpen}
     side="bottom"
     height="tall"
     onCloseAutoFocus={(event) => {
      event.preventDefault();
      trigger.current?.focus();
     }}
    >
     <SheetHeader title={t("title")} onClose={() => setOpen(false)} />
     <SheetBody className="grid content-start gap-5">
      <section className="grid gap-3">
       <Typography as="h3" variant="sectionTitle">
        {t("font")}
       </Typography>
       <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {readerFontSchema.options.map((font) => (
         <Button
          key={font}
          size="touch"
          variant={display.hanziFont === font ? "active" : "outline"}
          aria-pressed={display.hanziFont === font}
          onClick={() => onChange({ ...display, hanziFont: font })}
         >
          {t(`fonts.${font}`)}
         </Button>
        ))}
       </div>
      </section>

      <Separator />

      <section className="grid gap-3">
       <Typography as="h3" variant="sectionTitle">
        {t("size")}
       </Typography>
       <SegmentedControl
        value={display.hanziSize}
        density="touch"
        aria-label={t("size")}
        items={readerSizeSchema.options.map((key) => ({ key, label: t(`sizes.${key}`) }))}
        onChange={(hanziSize) => onChange({ ...display, hanziSize })}
       />
      </section>

      <Separator />

      <section className="grid gap-3">
       <Typography as="h3" variant="sectionTitle">
        {t("reveal")}
       </Typography>
       <SegmentedControl
        value={display.revealMode}
        density="touch"
        aria-label={t("reveal")}
        items={readerRevealModeSchema.options.map((key) => ({
         key,
         label: t(`revealModes.${key}`),
        }))}
        onChange={(revealMode) => onChange({ ...display, revealMode })}
       />
      </section>

      <Separator />

      <section className="grid gap-2">
       <Typography as="h3" variant="sectionTitle">
        {t("display")}
       </Typography>
       <div className="divide-y divide-border-default">
        <div className="flex min-h-14 items-center justify-between gap-4 py-2.5">
         <div className="grid min-w-0 gap-0.5">
          <Typography as="p" variant="label" tone="default" weight="bold">
           {t("pinyin")}
          </Typography>
          <Typography as="p" variant="caption" tone="muted">
           {display.revealMode === "tap" ? t("revealModes.tap") : t("showPinyin")}
          </Typography>
         </div>
         <Switch
          checked={display.showPinyin}
          disabled={display.revealMode === "tap"}
          onCheckedChange={(checked) => onChange({ ...display, showPinyin: checked })}
          aria-label={t("showPinyin")}
         />
        </div>
        <div className="flex min-h-14 items-center justify-between gap-4 py-2.5">
         <div className="grid min-w-0 gap-0.5">
          <Typography as="p" variant="label" tone="default" weight="bold">
           {t("translation")}
          </Typography>
          <Typography as="p" variant="caption" tone="muted">
           {display.revealMode === "tap" ? t("revealModes.tap") : t("showTranslation")}
          </Typography>
         </div>
         <Switch
          checked={display.showMeaning}
          disabled={display.revealMode === "tap"}
          onCheckedChange={(checked) => onChange({ ...display, showMeaning: checked })}
          aria-label={t("showTranslation")}
         />
        </div>
       </div>
      </section>
     </SheetBody>
    </Sheet>
   ) : null}
  </>
 );
}
