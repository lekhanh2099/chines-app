"use client";

import * as React from "react";

import {
 SegmentedControl,
 type SegmentedControlGroup,
 type SegmentedControlItem,
} from "@/components/ui/segmented-control";

export function Tabs<T extends string>({
 value,
 items,
 groups,
 onValueChange,
 children,
 className,
}: {
 value: T;
 items?: SegmentedControlItem<T>[];
 groups?: SegmentedControlGroup<T>[];
 onValueChange: (value: T) => void;
 children?: React.ReactNode;
 className?: string;
}) {
 return (
  <div className={className}>
   <SegmentedControl
    value={value}
    items={items}
    groups={groups}
    onChange={onValueChange}
   />
   {children}
  </div>
 );
}

export function TabsContent({
 children,
 active,
 className,
}: {
 children: React.ReactNode;
 active: boolean;
 className?: string;
}) {
 if (!active) return null;

 return <div className={className}>{children}</div>;
}
