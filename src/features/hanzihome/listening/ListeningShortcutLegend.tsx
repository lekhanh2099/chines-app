"use client";

import { useTranslations } from "next-intl";

import { Keyboard } from "lucide-react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
 BasePopoverTrigger,
} from "@/components/ui/overlays/base-popover";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";

type ShortcutLegendItem = readonly [key: string, label: string];

function ShortcutKey({ children }: { children: string }) {
 return (
  <kbd>
   <Badge size="sm" casing="natural">
    {children}
   </Badge>
  </kbd>
 );
}

export function ListeningShortcutLegend() {
 const t = useTranslations("Dictation");
 const editingShortcuts: ShortcutLegendItem[] = [
  ["Control", t("playPause")],
  ["Ctrl/⌘ R", t("replay")],
  ["Ctrl/⌘ ↵", t("checkAnswer")],
  ["Ctrl/⌘ →", t("goNext")],
  ["Ctrl/⌘ ←", t("goPrevious")],
  ["Esc", t("stopSpeech")],
 ];

 const generalShortcuts: ShortcutLegendItem[] = [
  ["1 / ←", t("previousPart")],
  ["2 / Control / Space", t("playPause")],
  ["3 / Ctrl/⌘ R / R", t("replay")],
  ["4 / →", t("nextPart")],
  ["5 / L", t("toggleLoop")],
  ["6 / Ctrl/⌘ ↵", t("checkEdit")],
  ["Esc", t("stopPlayback")],
 ];

 return (
  <Popover.Root modal={false}>
   <BasePopoverTrigger aria-label={t("shortcutAria")}>
    <Keyboard data-icon="inline-start" />
    {t("shortcuts")}
   </BasePopoverTrigger>
   <Popover.Portal>
    <BasePopoverPositioner
     side="bottom"
     align="end"
     sideOffset={8}
     collisionPadding={12}
     positionMethod="fixed"
    >
     <BasePopoverPopup variant="menu" initialFocus={false} finalFocus={false}>
      <div className="grid w-80 gap-3">
       <div className="grid gap-1.5">
        <Typography as="h3" variant="bodySmall" weight="black">
         {t("editingShortcuts")}
        </Typography>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
         {editingShortcuts.map(([key, label]) => (
          <div key={key} className="contents">
           <ShortcutKey>{key}</ShortcutKey>
           <Typography as="span" variant="caption" tone="muted">
            {label}
           </Typography>
          </div>
         ))}
        </div>
        <Typography as="p" variant="caption" tone="muted" scale="fine" emphasis="italic">
         {t("numberHelp")}
        </Typography>
       </div>

       <div className="grid gap-1.5 border-t border-border-default pt-2">
        <Typography as="h3" variant="bodySmall" weight="black">
         {t("generalShortcuts")}
        </Typography>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
         {generalShortcuts.map(([key, label]) => (
          <div key={key} className="contents">
           <ShortcutKey>{key}</ShortcutKey>
           <Typography as="span" variant="caption" tone="muted">
            {label}
           </Typography>
          </div>
         ))}
        </div>
       </div>
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
