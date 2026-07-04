"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
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
 sidebarSelectionKey?: string | null;
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
   variant={selected ? "default" : "ghost"}
   size="icon-sm"
   className="h-9 w-9 shrink-0 rounded-lg"
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
  <div className={cn(compact ? "grid gap-3" : "grid h-full min-h-0 overflow-hidden")}>
   {compact ? (
    <Card variant="default" padding="sm" className="border-border-default bg-bg-card shadow-none">
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
        <p className="line-clamp-2 font-black text-text-primary">{title}</p>
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
   ) : null}

   <div
    className={cn(
     "grid min-w-0 gap-3",
     !compact && "min-h-0 overflow-x-clip",
     !compact && sidebarOpen && "xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]",
     !compact && !sidebarOpen && "xl:grid-cols-[3.25rem_minmax(0,1fr)]",
    )}
   >
    {!compact && sidebarOpen && (
     <aside className={cn("hidden min-w-0 xl:block xl:min-h-0 xl:self-stretch xl:overflow-hidden")}>
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
         <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-8 w-8 shrink-0 rounded-lg"
          aria-label={`Thu gọn ${sidebarLabel.toLowerCase()}`}
          title={`Thu gọn ${sidebarLabel.toLowerCase()}`}
          onClick={() => onSidebarOpenChange(false)}
         >
          <PanelLeftClose className="h-4 w-4" />
         </Button>
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
        <Button
         type="button"
         variant="ghost"
         size="icon-sm"
         className="h-9 w-9 shrink-0 rounded-lg"
         aria-label={`Mở ${sidebarLabel.toLowerCase()}`}
         title={`Mở ${sidebarLabel.toLowerCase()}`}
         onClick={() => onSidebarOpenChange(true)}
        >
         <PanelLeftOpen className="h-4 w-4" />
        </Button>
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
    className="p-4 sm:max-w-md"
   >
    <SheetHeader title={sidebarLabel} onClose={() => setSidebarSheetOpen(false)} />
    {sidebar}
   </Sheet>
  </div>
 );
}
