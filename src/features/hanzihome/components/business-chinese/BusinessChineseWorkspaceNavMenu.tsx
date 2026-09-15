"use client";

import { Bookmark, Check, CloudCheck, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type BusinessChineseNavTab<T extends string = string> = {
 key: T;
 label: string;
};

export type BusinessChineseWorkspaceNavMenuProps<T extends string = string> = {
 tabs: ReadonlyArray<BusinessChineseNavTab<T>>;
 activeView: T;
 onActiveViewChange: (view: T) => void;
 isLessonBookmarked: boolean;
 onToggleLessonBookmark: () => void;
 bookmarkLabel: string;
 bookmarkedLabel: string;
 offlineReadyLabel: string;
 offlineDescription?: string;
 menuLabel?: string;
 className?: string;
};

export function BusinessChineseWorkspaceNavMenu<T extends string = string>({
 tabs,
 activeView,
 onActiveViewChange,
 isLessonBookmarked,
 onToggleLessonBookmark,
 bookmarkLabel,
 bookmarkedLabel,
 offlineReadyLabel,
 offlineDescription,
 menuLabel = "Nội dung bài học",
 className,
}: BusinessChineseWorkspaceNavMenuProps<T>) {
 const activeTab = tabs.find((tab) => tab.key === activeView);
 const title = activeTab ? `${menuLabel}: ${activeTab.label}` : menuLabel;

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="outline"
     size="icon-toolbar"
     className={cn("relative shrink-0", className)}
     aria-label={title}
     title={title}
    >
     <Menu className="size-4.5" />
     {isLessonBookmarked ? (
      <span
       className="absolute top-1.5 right-1.5 size-2 rounded-full bg-warning"
       aria-label={bookmarkedLabel}
      />
     ) : null}
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" width="md">
    <DropdownMenuLabel className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
     <span>{menuLabel}</span>
     {activeTab ? (
      <span className="text-[0.7rem] font-semibold normal-case text-accent-text">
       {activeTab.label}
      </span>
     ) : null}
    </DropdownMenuLabel>
    <DropdownMenuGroup>
     {tabs.map((tab) => {
      const isSelected = tab.key === activeView;
      return (
       <DropdownMenuItem
        key={tab.key}
        onClick={() => onActiveViewChange(tab.key)}
        className="flex cursor-pointer items-center justify-between"
       >
        <span className={cn(isSelected && "font-semibold text-accent-text")}>{tab.label}</span>
        {isSelected ? <Check className="size-4 shrink-0 text-accent-text" /> : null}
       </DropdownMenuItem>
      );
     })}
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
     Tiện ích
    </DropdownMenuLabel>
    <DropdownMenuGroup>
     <DropdownMenuItem onClick={onToggleLessonBookmark} className="cursor-pointer gap-2">
      <Bookmark
       className={cn(
        "size-4 shrink-0",
        isLessonBookmarked ? "fill-current text-warning" : "text-muted-foreground",
       )}
      />
      <span>{isLessonBookmarked ? bookmarkedLabel : bookmarkLabel}</span>
     </DropdownMenuItem>
     <DropdownMenuItem
      disabled
      className="cursor-default select-none gap-2 opacity-90"
      title={offlineDescription}
     >
      <CloudCheck className="size-4 shrink-0 text-success" />
      <span>{offlineReadyLabel}</span>
     </DropdownMenuItem>
    </DropdownMenuGroup>
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
