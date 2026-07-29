"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
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
     <Typography as="h3" variant="cardTitle" tone="default" weight="bold">
      Field optional
     </Typography>
     <StudyInstructionText variant="caption" tone="muted">
      Mặc định chỉ hiện field đang dùng trong UI học.
     </StudyInstructionText>
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
        <StudyInstructionText
         variant="label"
         tone="default"
         weight="bold"
         clamp="one"
         className="min-w-0 max-w-full rounded-full border border-border-default bg-bg-subtle px-2 py-1"
        >
         {firstSelectedGroup.label}
        </StudyInstructionText>
       ) : (
        <StudyInstructionText variant="bodySmall" tone="muted" weight="semibold" className="px-1">
         Chọn field optional...
        </StudyInstructionText>
       )}
       {remainingSelectedCount > 0 ? (
        <StudyInstructionText
         variant="label"
         tone="secondary"
         weight="bold"
         className="rounded-full border border-border-default bg-bg-subtle px-2 py-1"
        >
         +{remainingSelectedCount}
        </StudyInstructionText>
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
          adornment="start"
         />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
         <Button type="button" variant="ghost" onClick={onReset}>
          Unselect all
         </Button>
         <Button type="button" variant="ghost" onClick={onSelectAll}>
          Select all
         </Button>
        </div>
       </div>
       <div className="max-h-72 overflow-y-auto border-t border-border-default py-1 scrollbar-soft">
        {filteredGroups.length > 0 ? (
         filteredGroups.map((fieldGroup) => {
          const checked = fieldGroup.keys.every((key) => selectedKeys.has(key));
          return (
           <Button
            key={fieldGroup.label}
            type="button"
            variant={checked ? "surfaceCard" : "menu"}
            size="list"
            align="start"
            className="w-full"
            onClick={() => onToggleGroup(fieldGroup.keys, !checked)}
           >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-default">
             {checked ? <Check className="h-4 w-4 text-primary" /> : null}
            </span>
            <StudyInstructionText as="span" clamp="one" className="min-w-0 flex-1">
             {fieldGroup.label}
            </StudyInstructionText>
            {fieldGroup.keys.length > 1 ? (
             <StudyInstructionText
              variant="caption"
              tone="muted"
              className="rounded-full bg-bg-subtle px-2 py-0.5"
             >
              {fieldGroup.keys.length}
             </StudyInstructionText>
            ) : null}
           </Button>
          );
         })
        ) : (
         <StudyInstructionText
          variant="bodySmall"
          tone="muted"
          weight="semibold"
          align="center"
          className="px-4 py-6"
         >
          Không có field phù hợp.
         </StudyInstructionText>
        )}
       </div>
      </Popover.Popup>
     </BasePopoverPositioner>
    </Popover.Portal>
   </Popover.Root>
  </section>
 );
}
