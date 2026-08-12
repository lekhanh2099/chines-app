"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
 BasePopoverTrigger,
} from "@/components/ui/base-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";

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
     <Typography as="p" variant="caption" tone="muted">
      Mặc định chỉ hiện field đang dùng trong UI học.
     </Typography>
    </div>
    <Button type="button" variant="ghost" size="toolbar" onClick={onReset}>
     Mặc định
    </Button>
   </div>

   <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
    <div className="flex min-w-0 items-center gap-1">
     <div className="min-w-0 flex-1">
      <BasePopoverTrigger active={open} width="full">
       <span className="flex min-w-0 flex-1 items-center gap-2">
        {firstSelectedGroup ? (
         <Badge casing="natural" className="min-w-0 max-w-full">
          {firstSelectedGroup.label}
         </Badge>
        ) : (
         <Typography as="span" variant="bodySmall" tone="muted" weight="semibold" clamp="one">
          Chọn field optional...
         </Typography>
        )}
        {remainingSelectedCount > 0 ? (
         <Badge casing="natural">+{remainingSelectedCount}</Badge>
        ) : null}
       </span>
      </BasePopoverTrigger>
     </div>
     {firstSelectedGroup ? (
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       onClick={() => onToggleGroup(firstSelectedGroup.keys, false)}
       aria-label={`Ẩn ${firstSelectedGroup.label}`}
      >
       <X />
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
      <BasePopoverPopup variant="selector" initialFocus={false} finalFocus={false}>
       <div className="grid gap-3 p-3">
        <div className="relative">
         <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
         <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm field optional..."
          adornment="start"
         />
        </div>
        <div className="flex items-center justify-between gap-2">
         <Button type="button" variant="ghost" size="toolbar" onClick={onReset}>
          Unselect all
         </Button>
         <Button type="button" variant="ghost" size="toolbar" onClick={onSelectAll}>
          Select all
         </Button>
        </div>
       </div>
       <Separator />
       <div className="max-h-72 overflow-y-auto py-1 scrollbar-soft">
        {filteredGroups.length > 0 ? (
         filteredGroups.map((fieldGroup) => {
          const checked = fieldGroup.keys.every((key) => selectedKeys.has(key));
          return (
           <Button
            key={fieldGroup.label}
            type="button"
            variant={checked ? "active" : "menu"}
            size="menu"
            align="start"
            className="w-full"
            aria-pressed={checked}
            onClick={() => onToggleGroup(fieldGroup.keys, !checked)}
           >
            <span className="flex w-4 shrink-0 justify-center">{checked ? <Check /> : null}</span>
            <Typography as="span" clamp="one" className="min-w-0 flex-1">
             {fieldGroup.label}
            </Typography>
            {fieldGroup.keys.length > 1 ? (
             <Badge casing="natural">{fieldGroup.keys.length}</Badge>
            ) : null}
           </Button>
          );
         })
        ) : (
         <Typography
          as="p"
          variant="bodySmall"
          tone="muted"
          weight="semibold"
          align="center"
          className="px-4 py-6"
         >
          Không có field phù hợp.
         </Typography>
        )}
       </div>
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </Popover.Portal>
   </Popover.Root>
  </section>
 );
}
