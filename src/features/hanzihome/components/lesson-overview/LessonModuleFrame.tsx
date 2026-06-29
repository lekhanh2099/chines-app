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
 actions?: ReactNode;
 children: ReactNode;
 compact?: boolean;
 sidebarSelectionKey?: string | null;
};

export function LessonModuleFrame({
 title,
 subtitle,
 sidebarLabel,
 sidebarSummary,
 sidebarOpen,
 onSidebarOpenChange,
 sidebar,
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
  <div
   className={cn(
    "grid gap-3",
    !compact && "h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden",
   )}
  >
   <Card
    variant="default"
    padding="sm"
    className="border-border-default/80 bg-bg-card/70 shadow-none backdrop-blur"
   >
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div className="flex min-w-0 items-center gap-2">
      <Button
       type="button"
       variant="outline"
       size="sm"
       className={cn("h-8 px-2.5 text-xs", compact ? "flex" : "xl:hidden")}
       onClick={() => setSidebarSheetOpen(true)}
      >
       <PanelLeftOpen className="h-4 w-4" />
       <span>{sidebarLabel}</span>
      </Button>
      <Button
       type="button"
       variant="outline"
       size="sm"
       className={cn("h-8 px-2.5 text-xs", compact ? "hidden" : "hidden xl:flex")}
       onClick={() => onSidebarOpenChange(!sidebarOpen)}
      >
       {sidebarOpen ? (
        <PanelLeftClose className="h-4 w-4" />
       ) : (
        <PanelLeftOpen className="h-4 w-4" />
       )}
       <span>{sidebarOpen ? "Ẩn mục" : sidebarLabel}</span>
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
       <span className="rounded-lg bg-bg-subtle px-2 py-1 text-xs font-black uppercase tracking-wide text-text-muted">
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
     !compact && sidebarOpen && "xl:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]",
    )}
   >
    {!compact && sidebarOpen && (
     <aside className={cn("hidden min-w-0 xl:block xl:min-h-0 xl:self-stretch xl:overflow-hidden")}>
      <Card
       variant="default"
       padding="sm"
       className="h-full max-w-full overflow-hidden border-border-default/80 bg-bg-card/60 shadow-none backdrop-blur"
      >
       <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto pr-1 scrollbar-soft">
        {sidebar}
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
