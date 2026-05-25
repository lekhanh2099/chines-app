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
 listClassName,
}: {
 value: T;
 items?: SegmentedControlItem<T>[];
 groups?: SegmentedControlGroup<T>[];
 onValueChange: (value: T) => void;
 children?: React.ReactNode;
 className?: string;
 listClassName?: string;
}) {
 return (
  <div className={className}>
   <div className={listClassName}>
    <SegmentedControl
     value={value}
     items={items}
     groups={groups}
     onChange={onValueChange}
    />
   </div>
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
