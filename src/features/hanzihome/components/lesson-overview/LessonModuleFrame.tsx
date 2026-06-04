"use client";

import type { ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
}: LessonModuleFrameProps) {
 return (
  <div className="grid gap-3">
   <Card
    padding="sm"
    className={cn(
     "sticky z-20 rounded-xl border-border-default bg-bg-primary/95 shadow-theme-sm backdrop-blur",
     compact ? "top-0" : "top-11",
    )}
   >
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div className="flex min-w-0 items-center gap-2">
      <Button
       type="button"
       variant="outline"
       size="sm"
       className="h-8 px-2.5 text-xs"
       onClick={() => onSidebarOpenChange(!sidebarOpen)}
      >
       {sidebarOpen ? (
        <PanelLeftClose className="h-4 w-4" />
       ) : (
        <PanelLeftOpen className="h-4 w-4" />
       )}
       <span className="hidden sm:inline">
        {sidebarOpen ? "Ẩn mục" : sidebarLabel}
       </span>
      </Button>

      <div className="min-w-0">
       <p className="truncate text-sm font-black text-text-primary">{title}</p>
       {subtitle && (
        <p className="hidden truncate text-xs font-semibold text-text-muted sm:block">
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
     sidebarOpen && "lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]",
    )}
   >
    {sidebarOpen && (
     <aside
      className={cn(
       "min-w-0 lg:sticky lg:self-start",
       compact ? "lg:top-14" : "lg:top-24",
     )}
    >
      <Card
       padding="sm"
       className="max-w-full overflow-hidden rounded-xl border-border-default"
      >
       {sidebar}
      </Card>
     </aside>
    )}

    <div className="min-w-0">{children}</div>
   </div>
  </div>
 );
}

type LessonModuleSidebarItemProps = {
 selected: boolean;
 title: string;
 subtitle?: string;
 marker?: ReactNode;
 icon?: ReactNode;
 onClick: () => void;
};

export function LessonModuleSidebarItem({
 selected,
 title,
 subtitle,
 marker,
 icon,
 onClick,
}: LessonModuleSidebarItemProps) {
 return (
  <button
   type="button"
   onClick={onClick}
   className={cn(
    "flex min-h-14 w-full min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    selected
     ? "border-primary bg-primary text-primary-foreground shadow-theme-sm"
     : "border-border-default bg-bg-subtle text-text-primary hover:bg-bg-primary",
   )}
  >
   {icon && <span className="shrink-0 opacity-90">{icon}</span>}
   <span className="min-w-0 flex-1">
    <span className="block truncate text-sm font-black">{title}</span>
    {subtitle && (
     <span className="mt-0.5 block truncate text-xs font-semibold opacity-80">
      {subtitle}
     </span>
    )}
   </span>
   {marker && <span className="shrink-0 text-xs font-bold">{marker}</span>}
  </button>
 );
}
