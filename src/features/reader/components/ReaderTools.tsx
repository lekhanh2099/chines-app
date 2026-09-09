"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
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

export function ReaderTools() {
 const t = useTranslations("Reader.study.chrome.tools");
 const commands = useReaderCommands();
 const { speech } = useReaderServices();
 const { value: display, onChange } = useReaderDisplay();
 const { actions } = useReaderStore();
 const loop = useReaderSelector((state) => state.playback.loopCurrent);
 const auto = useReaderSelector((state) => state.playback.autoAdvance);
 const focus = useReaderSelector((state) => state.ui.focusMode);
 const empty = useReaderSelector((state) => state.content.segmentIds.length === 0);
 const [open, setOpen] = useState(false);
 const trigger = useRef<HTMLButtonElement>(null);
 return (
  <div className="flex min-w-0 flex-wrap gap-2">
   <Button
    variant={focus ? "active" : "outline"}
    size="touch"
    aria-pressed={focus}
    onClick={actions.toggleFocus}
   >
    {t("focus")}
   </Button>
   {onChange ? (
    <>
     <Button
      ref={trigger}
      variant="outline"
      size="icon"
      aria-label={t("title")}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => setOpen(true)}
     >
      <Settings2 />
     </Button>
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
      <SheetBody className="grid content-start gap-4">
       <section className="grid gap-2">
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
       <section className="grid gap-2">
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
       <section className="grid gap-2">
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
      </SheetBody>
     </Sheet>
     <Button
      variant={display.showPinyin ? "active" : "outline"}
      size="touch"
      aria-pressed={display.showPinyin}
      disabled={display.revealMode === "tap"}
      onClick={() => onChange({ ...display, showPinyin: !display.showPinyin })}
     >
      {t("showPinyin")}
     </Button>
     <Button
      variant={display.showMeaning ? "active" : "outline"}
      size="touch"
      aria-pressed={display.showMeaning}
      disabled={display.revealMode === "tap"}
      onClick={() => onChange({ ...display, showMeaning: !display.showMeaning })}
     >
      {t("showTranslation")}
     </Button>
    </>
   ) : null}
   {speech ? (
    <>
     <Button variant="outline" size="touch" disabled={empty} onClick={commands.playAll}>
      {t("playAll")}
     </Button>
     <Button
      variant={loop ? "active" : "outline"}
      size="touch"
      disabled={empty}
      aria-pressed={loop}
      onClick={actions.toggleLoop}
     >
      {t("loop")}
     </Button>
     <Button
      variant={auto ? "active" : "outline"}
      size="touch"
      disabled={empty}
      aria-pressed={auto}
      onClick={actions.toggleAutoAdvance}
     >
      {t("autoAdvance")}
     </Button>
    </>
   ) : null}
  </div>
 );
}
