"use client";

import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HanziHomeStudyTab<T extends string> = {
 key: T;
 label: string;
 shortLabel?: string;
 icon?: LucideIcon;
 badge?: React.ComponentProps<typeof Badge>["children"];
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
  <div className={cn("min-w-0 max-w-full rounded-xl bg-bg-subtle/80 p-1", className)}>
   <div
    role="tablist"
    aria-label="Nội dung học"
    className="flex min-w-0 max-w-full gap-1 overflow-x-auto rounded-lg p-0.5 scrollbar-soft sm:p-1.5"
   >
    {items.map((item) => {
     const Icon = item.icon;
     const selected = value === item.key;

     return (
      <Button
       key={item.key}
       type="button"
       variant={selected ? "active" : "ghost"}
       size={compact ? "toolbar" : "tab"}
       role="tab"
       aria-selected={selected}
       disabled={item.disabled}
       onClick={() => onChange(item.key)}
       className="shrink-0"
      >
       {Icon ? <Icon data-icon="inline-start" /> : null}
       <span className="sm:hidden">{item.shortLabel ?? item.label}</span>
       <span className="hidden sm:inline">{item.label}</span>
       {item.badge !== undefined ? (
        <Badge size="sm" className="shrink-0">
         {item.badge}
        </Badge>
       ) : null}
      </Button>
     );
    })}
   </div>
  </div>
 );
}
