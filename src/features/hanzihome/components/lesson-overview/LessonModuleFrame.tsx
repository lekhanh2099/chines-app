"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Check, ListTree, PanelLeftOpen } from "lucide-react";
import { Popover } from "@base-ui/react";

import { PanelToggleButton } from "@/components/layout/panel-toggle-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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
 sidebarSelectionKey?: string | null;
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
   className="h-9 w-9 shrink-0 rounded-lg border"
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
      !compact && (mobileNavigation ? "hidden" : "xl:hidden"),
     )}
    >
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
       <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2.5 text-xs"
        onClick={() => setSidebarSheetOpen(true)}
       >
        <PanelLeftOpen className="h-4 w-4" />
        <span>{sidebarLabel}</span>
       </Button>

       <div className="min-w-0">
        <p className="hidden line-clamp-2 font-black text-text-primary sm:block">{title}</p>
        {subtitle && (
         <p className="hidden line-clamp-2 text-xs font-semibold text-text-muted sm:block">
          {subtitle}
         </p>
        )}
       </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
       {sidebarSummary && (
        <span className="study-chip rounded-lg border px-2 py-1 text-xs font-black uppercase tracking-wide">
         {sidebarSummary}
        </span>
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
          <span className="min-w-0 truncate text-xs font-black uppercase tracking-wide text-text-muted">
           {sidebarLabel}
          </span>
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

    <Sheet
     open={sidebarSheetOpen}
     onOpenChange={setSidebarSheetOpen}
     side="right"
     className="sm:max-w-md"
    >
     <SheetHeader title={sidebarLabel} onClose={() => setSidebarSheetOpen(false)} />
     <SheetBody>{sidebar}</SheetBody>
    </Sheet>
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
    <Popover.Trigger className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-bg-card px-0 text-sm font-semibold text-text-primary shadow-theme-sm outline-none hover:bg-accent-subtle focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20 sm:h-10 sm:w-auto sm:max-w-44 sm:px-3 xl:hidden">
     <ListTree className="size-4 shrink-0" />
     <span className="hidden truncate sm:inline">{navigation.label}</span>
     <span className="sr-only">Chọn {navigation.label.toLowerCase()}</span>
    </Popover.Trigger>
   </HanziHomeCommandBarPortal>
   <Popover.Portal>
    <Popover.Positioner
     side="bottom"
     align="end"
     sideOffset={8}
     collisionPadding={8}
     positionMethod="fixed"
     style={{ zIndex: 90 }}
    >
     <Popover.Popup
      initialFocus={false}
      finalFocus={false}
      className="max-h-[min(24rem,calc(100dvh-7rem))] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border border-border-default bg-bg-elevated p-1.5 text-sm shadow-theme-lg scrollbar-soft"
     >
      <p className="px-2.5 py-1.5 text-xs font-black uppercase text-text-muted">
       {navigation.label}
      </p>
      {navigation.items.map((item) => {
       const selected = item.value === navigation.value;
       return (
        <Button
         key={item.value}
         type="button"
         variant={selected ? "active" : "ghost"}
         className="w-full justify-start px-2.5 text-left text-sm"
         onClick={() => {
          navigation.onChange(item.value);
          setOpen(false);
         }}
        >
         <span className="min-w-0 flex-1 truncate">{item.label}</span>
         {selected ? <Check className="size-4" /> : null}
        </Button>
       );
      })}
     </Popover.Popup>
    </Popover.Positioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
