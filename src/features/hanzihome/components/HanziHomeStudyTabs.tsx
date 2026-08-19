"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SegmentedControl, type SegmentedControlSurface } from "@/components/ui/segmented-control";

export type HanziHomeStudyTab<T extends string> = {
 key: T;
 label: string;
 shortLabel?: string;
 icon?: LucideIcon;
 badge?: ReactNode;
 disabled?: boolean;
};

type HanziHomeStudyTabsProps<T extends string> = {
 value: T;
 items: readonly HanziHomeStudyTab<T>[];
 onChange: (value: T) => void;
 compact?: boolean;
 surface?: SegmentedControlSurface;
 className?: string;
};

export function HanziHomeStudyTabs<T extends string>({
 value,
 items,
 onChange,
 compact = false,
 surface = "subtle",
 className,
}: HanziHomeStudyTabsProps<T>) {
 return (
  <SegmentedControl
   value={value}
   items={items.map((item) => ({
    key: item.key,
    label: item.label,
    compactLabel: item.shortLabel,
    icon: item.icon,
    disabled: item.disabled,
    suffix: item.badge !== undefined ? <Badge size="sm">{item.badge}</Badge> : undefined,
   }))}
   onChange={onChange}
   density={compact ? "toolbar" : "touch"}
   surface={surface}
   aria-label="Nội dung học"
   className={className}
  />
 );
}
