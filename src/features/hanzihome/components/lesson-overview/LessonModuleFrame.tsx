"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Check, ListTree, PanelLeftOpen } from "lucide-react";

import { PanelToggleButton } from "@/components/layout/panel-toggle-button";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { z } from "zod";
import {
 HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";

type LessonModuleFrameProps = {
 title: string;
 subtitle?: string;
 sidebarLabel: string;
 sidebarSummary?: string;
 sidebarOpen: boolean;
 onSidebarOpenChange: (open: boolean) => void;
 sidebar: ReactNode;
 sidebarRail?: ReactNode;
 actions?: ReactNode;
 children: ReactNode;
 compact?: boolean;
 sidebarSelectionKey?: z.infer<z.ZodNullable<z.ZodString>>;
 mobileNavigation?: {
  label: string;
  value: string;
  items: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
 };
};

type LessonModuleSidebarRailItemProps = {
 icon: ReactNode;
 label: string;
 selected?: boolean;
 onClick: () => void;
};

export function LessonModuleSidebarRailItem({
 icon,
 label,
 selected = false,
 onClick,
}: LessonModuleSidebarRailItemProps) {
 return (
  <Button
   type="button"
   variant={selected ? "active" : "ghost"}
   size="icon-sm"
   className="size-10 shrink-0"
   aria-label={label}
   title={label}
   onClick={onClick}
  >
   {icon}
  </Button>
 );
}

export function LessonModuleFrame({
 title,
 subtitle,
 sidebarLabel,
 sidebarSummary,
 sidebarOpen,
 onSidebarOpenChange,
 sidebar,
 sidebarRail,
 actions,
 children,
 compact = false,
 sidebarSelectionKey,
 mobileNavigation,
}: LessonModuleFrameProps) {
 const [sidebarSheetOpen, setSidebarSheetOpen] = useState(false);
 const previousSelectionKey = useRef(sidebarSelectionKey);

 useEffect(() => {
  if (previousSelectionKey.current !== sidebarSelectionKey && sidebarSelectionKey !== undefined) {
   setSidebarSheetOpen(false);
  }

  previousSelectionKey.current = sidebarSelectionKey;
 }, [sidebarSelectionKey]);

 return (
  <>
   {!compact && mobileNavigation ? <MobileModuleNavigation navigation={mobileNavigation} /> : null}
   <div
    className={cn(
     compact
      ? "grid gap-3"
      : "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1 overflow-hidden sm:gap-2 xl:gap-0",
    )}
   >
    <Card
     variant="default"
     padding="none"
     className={cn(
      "border-border-default bg-bg-card p-1.5 shadow-none sm:p-2.5",
      compact && "sticky top-0 z-20",
      !compact && (mobileNavigation ? "hidden" : "xl:hidden"),
     )}
    >
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className={cn("flex min-w-0 items-center gap-2", compact && "flex-1")}>
       {compact && mobileNavigation ? (
        <SegmentedControl
         value={mobileNavigation.value}
         items={mobileNavigation.items.map((item) => ({
          key: item.value,
          label: item.label,
         }))}
         onChange={mobileNavigation.onChange}
        />
       ) : (
        <Button
         type="button"
         variant="outline"
         size="sm"

         onClick={() => setSidebarSheetOpen(true)}
        >
         <PanelLeftOpen className="h-4 w-4" />
         <span>{sidebarLabel}</span>
        </Button>
       )}

       <div className={cn("min-w-0", compact && "hidden")}>
        <StudyInstructionText tone="default" weight="black" clamp="two" className="hidden sm:block">
         {title}
        </StudyInstructionText>
        {subtitle && (
         <StudyInstructionText
          variant="caption"
          tone="muted"
          weight="semibold"
          clamp="two"
          className="hidden sm:block"
         >
          {subtitle}
         </StudyInstructionText>
        )}
       </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
       {sidebarSummary && !compact && (
        <StudyInstructionText
         variant="overline"
         weight="black"
         tracking="wide"
         transform="uppercase"
         className="study-chip rounded-lg border px-2 py-1"
        >
         {sidebarSummary}
        </StudyInstructionText>
       )}
       {actions}
      </div>
     </div>
    </Card>

    <div
     className={cn(
      "grid min-w-0 gap-3",
      !compact && "min-h-0 overflow-x-clip",
      !compact &&
       sidebarOpen &&
       "xl:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)]",
      !compact && !sidebarOpen && "xl:grid-cols-[3.25rem_minmax(0,1fr)]",
     )}
    >
     {!compact && sidebarOpen && (
      <aside
       className={cn("hidden min-w-0 xl:block xl:min-h-0 xl:self-stretch xl:overflow-hidden")}
      >
       <Card
        variant="default"
        padding="sm"
        className="h-full max-w-full overflow-hidden border-border-default bg-bg-card shadow-none"
       >
        <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
         <div className="flex items-center justify-between gap-2 border-b border-border-default pb-2">
          <StudyInstructionText
           variant="overline"
           tone="muted"
           weight="black"
           tracking="wide"
           clamp="one"
           transform="uppercase"
           className="min-w-0"
          >
           {sidebarLabel}
          </StudyInstructionText>
          <div className="flex shrink-0 items-center gap-1.5">
           {actions}
           <PanelToggleButton
            open={sidebarOpen}
            onOpenChange={onSidebarOpenChange}
            label={sidebarLabel}
            className="h-8 w-8 rounded-lg"
           />
          </div>
         </div>
         <div className="min-h-0 overflow-x-hidden overflow-y-auto pr-1 scrollbar-soft">
          {sidebar}
         </div>
        </div>
       </Card>
      </aside>
     )}

     {!compact && !sidebarOpen && (
      <aside className="hidden min-w-0 xl:block xl:min-h-0 xl:self-stretch xl:overflow-hidden">
       <Card
        variant="default"
        padding="none"
        className="h-full max-w-full overflow-hidden border-border-default bg-bg-card shadow-none"
       >
        <div className="flex h-full min-h-0 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2 scrollbar-soft">
         <PanelToggleButton
          open={sidebarOpen}
          onOpenChange={onSidebarOpenChange}
          label={sidebarLabel}
          size="md"
          className="h-9 w-9 rounded-lg"
         />
         <div className="h-px w-6 shrink-0 bg-border-default" />
         {sidebarRail ? (
          <div className="flex min-h-0 w-full flex-col items-center gap-2">{sidebarRail}</div>
         ) : null}
        </div>
       </Card>
      </aside>
     )}

     <div className="relative min-h-0 min-w-0 overflow-y-auto pr-1 scrollbar-soft">{children}</div>
    </div>

    {!compact ? (
     <Sheet
      open={sidebarSheetOpen}
      onOpenChange={setSidebarSheetOpen}
      side="right"
      className="sm:max-w-md"
     >
      <SheetHeader title={sidebarLabel} onClose={() => setSidebarSheetOpen(false)} />
      <SheetBody>{sidebar}</SheetBody>
     </Sheet>
    ) : null}
   </div>
  </>
 );
}

function MobileModuleNavigation({
 navigation,
}: {
 navigation: NonNullable<LessonModuleFrameProps["mobileNavigation"]>;
}) {
 const [open, setOpen] = useState(false);

 return (
  <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
   <HanziHomeCommandBarPortal targetId={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}>
    <Popover.Trigger
     render={
      <Button
       variant="outline"
       size="responsive-compact"
       className="shrink-0 xl:hidden"
       aria-label={`Chọn ${navigation.label.toLowerCase()}`}
      />
     }
    >
     <ListTree className="size-4 shrink-0" />
     <StudyInstructionText clamp="one" className="hidden sm:inline">
      {navigation.label}
     </StudyInstructionText>
     <span className="sr-only">Chọn {navigation.label.toLowerCase()}</span>
    </Popover.Trigger>
   </HanziHomeCommandBarPortal>
   <Popover.Portal>
    <BasePopoverPositioner
     side="bottom"
     align="end"
     sideOffset={8}
     collisionPadding={8}
     positionMethod="fixed"
    >
     <BasePopoverPopup initialFocus={false} finalFocus={false} variant="moduleMenu">
      <StudyInstructionText
       variant="overline"
       tone="muted"
       weight="black"
       transform="uppercase"
       className="px-2.5 py-1.5"
      >
       {navigation.label}
      </StudyInstructionText>
      {navigation.items.map((item) => {
       const selected = item.value === navigation.value;
       return (
        <Button
         key={item.value}
         type="button"
         variant={selected ? "active" : "ghost"}
         align="start"
         className="w-full"
         onClick={() => {
          navigation.onChange(item.value);
          setOpen(false);
         }}
        >
         <StudyInstructionText as="span" clamp="one" className="min-w-0 flex-1">
          {item.label}
         </StudyInstructionText>
         {selected ? <Check className="size-4" /> : null}
        </Button>
       );
      })}
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
