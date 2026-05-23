import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SegmentedControlItem<T extends string = string> = {
 key: T;
 label: string;
 icon?: LucideIcon;
 disabled?: boolean;
};

export function SegmentedControl<T extends string>({
 value,
 items,
 onChange,
 className,
 itemClassName,
}: {
 value: T;
 items: SegmentedControlItem<T>[];
 onChange: (key: T) => void;
 className?: string;
 itemClassName?: string;
}) {
 return (
  <div
   className={cn(
    "no-scrollbar flex w-full max-w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-2xl  bg-stone-100 p-1",
    className,
   )}
  >
   {items.map((item) => {
    const Icon = item.icon;
    const active = value === item.key;
    return (
     <button
      key={item.key}
      type="button"
      disabled={item.disabled}
      onClick={() => onChange(item.key)}
      className={cn(
       "flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50",
       active
        ? "bg-red-500 text-white shadow-theme-sm"
        : "text-stone-600 hover:bg-white",
       itemClassName,
      )}
     >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {item.label}
     </button>
    );
   })}
  </div>
 );
}
