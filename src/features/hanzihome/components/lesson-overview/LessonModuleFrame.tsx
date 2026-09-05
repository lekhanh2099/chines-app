"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Check, ListTree, PanelLeftOpen } from "lucide-react";
import { z } from "zod";

import { PanelToggleButton } from "@/components/layout/panel-toggle-button";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import {
 HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { cn } from "@/lib/utils";

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
 showMobileHeader?: boolean;
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
   size="icon-toolbar"
   className="shrink-0"
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
 showMobileHeader = true,
 sidebarSelectionKey,
 mobileNavigation,
}: LessonModuleFrameProps) {
 const [sidebarSheetOpen, setSidebarSheetOpen] = useState(false);
 const previousSelectionKey = useRef(sidebarSelectionKey);
 const contentViewportRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (previousSelectionKey.current !== sidebarSelectionKey && sidebarSelectionKey !== undefined) {
   setSidebarSheetOpen(false);
   contentViewportRef.current?.scrollTo({ top: 0 });
  }

  previousSelectionKey.current = sidebarSelectionKey;
 }, [sidebarSelectionKey]);

 const mobileHeader = (
  <Card variant="section" padding="sm">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div className={cn("flex min-w-0 items-center gap-2", compact && "flex-1")}>
     {compact && mobileNavigation ? (
      <Select value={mobileNavigation.value} onValueChange={mobileNavigation.onChange}>
       <SelectTrigger
        aria-label={`Chọn ${mobileNavigation.label.toLowerCase()}`}
        size="sm"
        width="full"
       >
        <SelectValue />
       </SelectTrigger>
       <SelectContent
        align="start"
        collisionPadding={8}
        className="max-h-80 min-w-[var(--radix-select-trigger-width)]"
       >
        <SelectGroup>
         {mobileNavigation.items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
           {item.label}
          </SelectItem>
         ))}
        </SelectGroup>
       </SelectContent>
      </Select>
     ) : (
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       onClick={() => setSidebarSheetOpen(true)}
      >
       <PanelLeftOpen data-icon="inline-start" />
       {sidebarLabel}
      </Button>
     )}

     <div className={cn("min-w-0", compact && "hidden")}>
      <StudyInstructionText tone="default" weight="black" clamp="two" className="hidden sm:block">
       {title}
      </StudyInstructionText>
      {subtitle ? (
       <StudyInstructionText
        variant="caption"
        tone="muted"
        weight="semibold"
        clamp="two"
        className="hidden sm:block"
       >
        {subtitle}
       </StudyInstructionText>
      ) : null}
     </div>
    </div>

    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
     {sidebarSummary && !compact ? <Badge casing="natural">{sidebarSummary}</Badge> : null}
     {actions}
    </div>
   </div>
  </Card>
 );

 return (
  <>
   {!compact && mobileNavigation ? <MobileModuleNavigation navigation={mobileNavigation} /> : null}
   <div
    className={cn(
     compact
      ? "grid gap-3"
      : "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1 overflow-hidden sm:gap-2 xl:gap-0",
     !showMobileHeader && "grid-rows-[minmax(0,1fr)]",
    )}
   >
    {!showMobileHeader ? null : compact ? (
     <div className="sticky top-0 z-20">{mobileHeader}</div>
    ) : mobileNavigation ? null : (
     <div className="xl:hidden">{mobileHeader}</div>
    )}

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
     {!compact && sidebarOpen ? (
      <aside className="hidden min-w-0 xl:block xl:min-h-0 xl:self-stretch xl:overflow-hidden">
       <Card variant="section" padding="sm" className="h-full max-w-full overflow-hidden">
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
            size="sm"
           />
          </div>
         </div>
         <div className="min-h-0 overflow-x-hidden overflow-y-auto pr-1 scrollbar-soft">
          {sidebar}
         </div>
        </div>
       </Card>
      </aside>
     ) : null}

     {!compact && !sidebarOpen ? (
      <aside className="hidden min-w-0 xl:block xl:min-h-0 xl:self-stretch xl:overflow-hidden">
       <Card variant="section" padding="none" className="h-full max-w-full overflow-hidden">
        <div className="flex h-full min-h-0 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2 scrollbar-soft">
         <PanelToggleButton
          open={sidebarOpen}
          onOpenChange={onSidebarOpenChange}
          label={sidebarLabel}
          size="md"
         />
         <Separator className="w-6" />
         {sidebarRail ? (
          <div className="flex min-h-0 w-full flex-col items-center gap-2">{sidebarRail}</div>
         ) : null}
        </div>
       </Card>
      </aside>
     ) : null}

     <div
      ref={contentViewportRef}
      className="relative min-h-0 min-w-0 overflow-y-auto pr-1 scrollbar-soft"
     >
      {children}
     </div>
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
       size="toolbar"
       className="shrink-0 xl:hidden"
       aria-label={`Chọn ${navigation.label.toLowerCase()}`}
      />
     }
    >
     <ListTree data-icon="inline-start" />
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
      <div className="px-2.5 py-1.5">
       <StudyInstructionText variant="overline" tone="muted" weight="black" transform="uppercase">
        {navigation.label}
       </StudyInstructionText>
      </div>
      {navigation.items.map((item) => {
       const selected = item.value === navigation.value;
       return (
        <Button
         key={item.value}
         type="button"
         variant={selected ? "active" : "menu"}
         size="menu"
         align="start"
         className="w-full"
         aria-pressed={selected}
         onClick={() => {
          navigation.onChange(item.value);
          setOpen(false);
         }}
        >
         <StudyInstructionText as="span" clamp="one" className="min-w-0 flex-1">
          {item.label}
         </StudyInstructionText>
         {selected ? <Check /> : null}
        </Button>
       );
      })}
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
