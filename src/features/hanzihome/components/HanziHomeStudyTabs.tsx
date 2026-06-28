"use client";

import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type HanziHomeStudyTab<T extends string> = {
 key: T;
 label: string;
 shortLabel?: string;
 icon?: LucideIcon;
 badge?: string | number;
 disabled?: boolean;
};

type HanziHomeStudyTabsProps<T extends string> = {
 value: T;
 items: readonly HanziHomeStudyTab<T>[];
 onChange: (value: T) => void;
 compact?: boolean;
 className?: string;
};

export function HanziHomeStudyTabs<T extends string>({
 value,
 items,
 onChange,
 compact = false,
 className,
}: HanziHomeStudyTabsProps<T>) {
 return (
  <div
   role="tablist"
   aria-label="Nội dung học"
   className={cn(
    "flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-xl bg-bg-subtle/80 p-1 scrollbar-soft",
    className,
   )}
  >
   {items.map((item) => {
    const Icon = item.icon;
    const selected = value === item.key;

    return (
     <button
      key={item.key}
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={item.disabled}
      onClick={() => onChange(item.key)}
      className={cn(
       "flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-3 font-bold text-text-muted transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50",
       selected && "bg-bg-card text-accent-text shadow-theme-sm",
       compact && "min-h-11 px-2 text-xs",
      )}
     >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
      <span className="hidden sm:inline">{item.label}</span>
      {item.badge !== undefined ? (
       <Badge size="sm" className="shrink-0">
        {item.badge}
       </Badge>
      ) : null}
     </button>
    );
   })}
  </div>
 );
}
