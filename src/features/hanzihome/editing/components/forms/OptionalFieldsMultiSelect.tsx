"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { BasePopover as Popover, BasePopoverPositioner } from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OptionalFieldGroup = {
 label: string;
 keys: string[];
};

export function OptionalFieldsMultiSelect({
 groups,
 selectedGroups,
 selectedKeys,
 onReset,
 onSelectAll,
 onToggleGroup,
}: {
 groups: OptionalFieldGroup[];
 selectedGroups: OptionalFieldGroup[];
 selectedKeys: Set<string>;
 onReset: () => void;
 onSelectAll: () => void;
 onToggleGroup: (keys: string[], checked: boolean) => void;
}) {
 const [open, setOpen] = useState(false);
 const [query, setQuery] = useState("");
 const filteredGroups = useMemo(() => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return groups;
  return groups.filter((fieldGroup) => fieldGroup.label.toLowerCase().includes(normalizedQuery));
 }, [groups, query]);
 const firstSelectedGroup = selectedGroups[0];
 const remainingSelectedCount = Math.max(0, selectedGroups.length - 1);

 return (
  <section className="grid gap-2">
   <div className="flex items-center justify-between gap-2">
    <div>
     <h3 className="text-sm font-bold text-text-primary">Field optional</h3>
     <p className="text-xs text-text-muted">Mặc định chỉ hiện field đang dùng trong UI học.</p>
    </div>
    <Button type="button" variant="ghost" size="sm" onClick={onReset}>
     Mặc định
    </Button>
   </div>
   <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
    <div className="flex min-w-0 items-center gap-1">
     <Popover.Trigger
      className={cn(
       "flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-2 py-1.5 text-left shadow-xs transition-colors outline-none hover:bg-bg-subtle focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/20",
       open && "border-primary/50 bg-accent-subtle",
      )}
     >
      <div className="flex min-w-0 flex-1 items-center gap-2">
       {firstSelectedGroup ? (
        <span className="min-w-0 max-w-full truncate rounded-full border border-border-default bg-bg-subtle px-2 py-1 text-sm font-bold text-text-primary">
         {firstSelectedGroup.label}
        </span>
       ) : (
        <span className="px-1 text-sm font-semibold text-text-muted">Chọn field optional...</span>
       )}
       {remainingSelectedCount > 0 ? (
        <span className="rounded-full border border-border-default bg-bg-subtle px-2 py-1 text-sm font-bold text-text-secondary">
         +{remainingSelectedCount}
        </span>
       ) : null}
      </div>
      <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
     </Popover.Trigger>
     {firstSelectedGroup ? (
      <Button
       type="button"
       variant="ghost"
       size="icon-sm"
       onClick={() => onToggleGroup(firstSelectedGroup.keys, false)}
       aria-label={`Ẩn ${firstSelectedGroup.label}`}
      >
       <X className="h-3.5 w-3.5" />
      </Button>
     ) : null}
    </div>
    <Popover.Portal>
     <BasePopoverPositioner
      side="bottom"
      align="start"
      sideOffset={8}
      collisionPadding={12}
      positionMethod="fixed"
     >
      <Popover.Popup
       initialFocus={false}
       finalFocus={false}
       className="w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-theme-lg"
      >
       <div className="grid gap-3 p-3">
        <div className="relative">
         <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
         <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm field optional..."
          className="pl-9"
         />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
         <button
          type="button"
          className="font-bold text-primary underline-offset-4 hover:underline"
          onClick={onReset}
         >
          Unselect all
         </button>
         <button
          type="button"
          className="font-bold text-primary underline-offset-4 hover:underline"
          onClick={onSelectAll}
         >
          Select all
         </button>
        </div>
       </div>
       <div className="max-h-72 overflow-y-auto border-t border-border-default py-1 scrollbar-soft">
        {filteredGroups.length > 0 ? (
         filteredGroups.map((fieldGroup) => {
          const checked = fieldGroup.keys.every((key) => selectedKeys.has(key));
          return (
           <button
            key={fieldGroup.label}
            type="button"
            className={cn(
             "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition-colors",
             checked
              ? "bg-bg-primary text-text-primary"
              : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary",
            )}
            onClick={() => onToggleGroup(fieldGroup.keys, !checked)}
           >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-default">
             {checked ? <Check className="h-4 w-4 text-primary" /> : null}
            </span>
            <span className="min-w-0 flex-1 truncate">{fieldGroup.label}</span>
            {fieldGroup.keys.length > 1 ? (
             <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs text-text-muted">
              {fieldGroup.keys.length}
             </span>
            ) : null}
           </button>
          );
         })
        ) : (
         <p className="px-4 py-6 text-center text-sm font-semibold text-text-muted">
          Không có field phù hợp.
         </p>
        )}
       </div>
      </Popover.Popup>
     </BasePopoverPositioner>
    </Popover.Portal>
   </Popover.Root>
  </section>
 );
}
