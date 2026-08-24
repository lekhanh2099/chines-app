"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import type {
 SegmentedControlGroup,
 SegmentedControlItem,
} from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

type TabsContextValue = {
 baseId: string;
 value: string;
 itemKeys: string[];
};

const TabsContext = React.createContext<TabsContextValue>({
 baseId: "tabs",
 value: "",
 itemKeys: [],
});

function resolveTabGroups<T extends string>({
 items = [],
 groups,
}: {
 items?: SegmentedControlItem<T>[];
 groups?: SegmentedControlGroup<T>[];
}) {
 if (groups && groups.length > 0) return groups;
 return [{ key: "default", items }];
}

export function Tabs<T extends string>({
 value,
 items,
 groups,
 onValueChange,
 children,
 className,
 listClassName,
 "aria-label": ariaLabel,
}: {
 value: T;
 items?: SegmentedControlItem<T>[];
 groups?: SegmentedControlGroup<T>[];
 onValueChange: (value: T) => void;
 children?: React.ReactNode;
 className?: string;
 listClassName?: string;
 "aria-label"?: string;
}) {
 const generatedId = React.useId();
 const baseId = `tabs-${generatedId.replaceAll(":", "")}`;
 const resolvedGroups = resolveTabGroups({ items, groups });
 const flatItems = resolvedGroups.flatMap((group) => group.items);
 const itemKeys = flatItems.map((item) => item.key);

 const moveFocus = (currentIndex: number, direction: number) => {
  if (flatItems.length === 0) return;

  for (let offset = 1; offset <= flatItems.length; offset += 1) {
   const nextIndex = (currentIndex + direction * offset + flatItems.length) % flatItems.length;
   const nextItem = flatItems[nextIndex];
   if (!nextItem || nextItem.disabled) continue;

   onValueChange(nextItem.key);
   document.getElementById(`${baseId}-tab-${nextIndex}`)?.focus();
   return;
  }
 };

 return (
  <TabsContext.Provider value={{ baseId, value, itemKeys }}>
   <div className={cn("min-w-0", className)}>
    {flatItems.length > 0 ? (
     <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={cn(
       "no-scrollbar flex w-full max-w-full min-w-0 items-center gap-1 overflow-x-auto overscroll-x-contain rounded-lg bg-bg-subtle/70 p-0.5",
       listClassName,
      )}
     >
      {resolvedGroups.map((group, groupIndex) => (
       <React.Fragment key={group.key}>
        {groupIndex > 0 ? (
         <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border-default" />
        ) : null}
        {group.items.map((item) => {
         const flatIndex = flatItems.findIndex((candidate) => candidate.key === item.key);
         const Icon = item.icon;
         const selected = value === item.key;

         return (
          <Button
           key={item.key}
           id={`${baseId}-tab-${flatIndex}`}
           type="button"
           role="tab"
           aria-selected={selected}
           aria-controls={`${baseId}-panel-${flatIndex}`}
           tabIndex={selected ? 0 : -1}
           size="toolbar"
           variant={selected ? "active" : "navigation"}
           disabled={item.disabled}
           className="shrink-0"
           onClick={() => onValueChange(item.key)}
           onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
             event.preventDefault();
             moveFocus(flatIndex, 1);
            } else if (event.key === "ArrowLeft") {
             event.preventDefault();
             moveFocus(flatIndex, -1);
            } else if (event.key === "Home") {
             event.preventDefault();
             const firstIndex = flatItems.findIndex((candidate) => !candidate.disabled);
             const firstItem = flatItems[firstIndex];
             if (firstItem) {
              onValueChange(firstItem.key);
              document.getElementById(`${baseId}-tab-${firstIndex}`)?.focus();
             }
            } else if (event.key === "End") {
             event.preventDefault();
             const reversedIndex = flatItems
              .toReversed()
              .findIndex((candidate) => !candidate.disabled);
             const lastIndex = reversedIndex < 0 ? -1 : flatItems.length - 1 - reversedIndex;
             const lastItem = flatItems[lastIndex];
             if (lastItem) {
              onValueChange(lastItem.key);
              document.getElementById(`${baseId}-tab-${lastIndex}`)?.focus();
             }
            }
           }}
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
       </React.Fragment>
      ))}
     </div>
    ) : null}
    {children}
   </div>
  </TabsContext.Provider>
 );
}

export function TabsContent({
 children,
 value,
 active,
 className,
}: {
 children: React.ReactNode;
 value?: string;
 active?: boolean;
 className?: string;
}) {
 const context = React.useContext(TabsContext);
 if (context.itemKeys.length === 0) {
  return <div className={className}>{children}</div>;
 }

 const panelValue = value ?? context.value;
 const isActive = value === undefined ? active === true : context.value === value;
 if (!isActive) return null;

 const index = context.itemKeys.indexOf(panelValue);
 if (index < 0) return null;

 return (
  <div
   id={`${context.baseId}-panel-${index}`}
   role="tabpanel"
   aria-labelledby={`${context.baseId}-tab-${index}`}
   tabIndex={0}
   className={className}
  >
   {children}
  </div>
 );
}
