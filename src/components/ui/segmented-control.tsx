import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SegmentedControlItem<T extends string = string> = {
 key: T;
 label: string;
 icon?: LucideIcon;
 disabled?: boolean;
};

export type SegmentedControlGroup<T extends string = string> = {
 key: string;
 items: SegmentedControlItem<T>[];
};

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
}: {
 value: T;
 items?: SegmentedControlItem<T>[];
 groups?: SegmentedControlGroup<T>[];
 onChange: (key: T) => void;
 className?: string;
 itemClassName?: string;
}) {
 const resolvedGroups = getSegmentedControlGroups({ items, groups });

 return (
  <div
   className={cn(
    "no-scrollbar flex w-full max-w-full min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain rounded-xl bg-bg-subtle p-1 mb-2",
    className,
   )}
  >
   {resolvedGroups.map((group, groupIndex) => (
    <div key={group.key} className="flex shrink-0 items-center gap-1">
     {groupIndex > 0 && (
      <span
       aria-hidden="true"
       className="h-6 w-px shrink-0 rounded-full bg-border-default"
      />
     )}

     <div className="flex items-center gap-1">
      {group.items.map((item) => {
       const Icon = item.icon;
       const active = value === item.key;

       return (
        <button
         key={item.key}
         type="button"
         disabled={item.disabled}
         data-active={active ? "true" : "false"}
         onClick={() => onChange(item.key)}
         className={cn(
          "flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          active
           ? "bg-bg-primary text-text-primary shadow-theme-sm"
           : "text-text-muted hover:bg-bg-primary hover:text-text-primary",
          itemClassName,
         )}
        >
         {Icon ? <Icon className="h-4 w-4" /> : null}
         {item.label}
        </button>
       );
      })}
     </div>
    </div>
   ))}
  </div>
 );
}
