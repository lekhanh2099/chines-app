import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SegmentedControlItem<T extends string = string> = {
 key: T;
 label: string;
 compactLabel?: string;
 icon?: LucideIcon;
 suffix?: ReactNode;
 disabled?: boolean;
};

export type SegmentedControlGroup<T extends string = string> = {
 key: string;
 items: SegmentedControlItem<T>[];
};

type SegmentedControlSurface = "subtle" | "transparent";
type SegmentedControlDensity = "toolbar" | "touch";

function getSegmentedControlGroups<T extends string>({
 items = [],
 groups,
}: {
 items?: SegmentedControlItem<T>[];
 groups?: SegmentedControlGroup<T>[];
}) {
 if (groups && groups.length > 0) return groups;

 return [
  {
   key: "default",
   items,
  },
 ];
}

export function SegmentedControl<T extends string>({
 value,
 items,
 groups,
 onChange,
 className,
 itemClassName,
 surface = "subtle",
 density = "toolbar",
 "aria-label": ariaLabel,
}: {
 value: T;
 items?: SegmentedControlItem<T>[];
 groups?: SegmentedControlGroup<T>[];
 onChange: (key: T) => void;
 className?: string;
 itemClassName?: string;
 surface?: SegmentedControlSurface;
 density?: SegmentedControlDensity;
 "aria-label"?: string;
}) {
 const resolvedGroups = getSegmentedControlGroups({ items, groups });

 return (
  <div
   role="group"
   aria-label={ariaLabel}
   className={cn(
    "no-scrollbar flex w-full max-w-full min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain",
    surface === "subtle" ? "rounded-lg bg-bg-subtle/70 p-0.5" : "bg-transparent p-0",
    className,
   )}
  >
   {resolvedGroups.map((group, groupIndex) => (
    <div key={group.key} className="flex shrink-0 items-center gap-1">
     {groupIndex > 0 ? (
      <span aria-hidden="true" className="h-6 w-px shrink-0 rounded-full bg-border-default" />
     ) : null}

     <div className="flex items-center gap-1">
      {group.items.map((item) => {
       const Icon = item.icon;
       const active = value === item.key;

       return (
        <Button
         key={item.key}
         type="button"
         size={density === "touch" ? "touch" : "toolbar"}
         variant={active ? "active" : "navigation"}
         disabled={item.disabled}
         aria-pressed={active}
         onClick={() => onChange(item.key)}
         className={cn("shrink-0", itemClassName)}
        >
         {Icon ? <Icon data-icon="inline-start" /> : null}
         {item.compactLabel ? (
          <>
           <span className="sm:hidden">{item.compactLabel}</span>
           <span className="hidden sm:inline">{item.label}</span>
          </>
         ) : (
          item.label
         )}
         {item.suffix}
        </Button>
       );
      })}
     </div>
    </div>
   ))}
  </div>
 );
}
