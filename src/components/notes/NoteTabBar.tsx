"use client";

import { useMemo, type ReactNode, type Ref } from "react";
import { useSelector } from "@tanstack/react-store";
import { ChevronLeft, ChevronRight, Ellipsis, FileText, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs } from "@/components/ui/tabs";
import { noteTabsStore } from "@/stores/note-tabs-store";

export function NoteTabBar({
 leading,
 trailing,
 actionsRef,
 onCreateNote,
 focusLocked = false,
}: {
 leading?: ReactNode;
 trailing?: ReactNode;
 actionsRef?: Ref<HTMLDivElement>;
 onCreateNote?: () => void;
 focusLocked?: boolean;
}) {
 const tabs = useSelector(noteTabsStore, (state) => state.tabs);
 const activeNoteId = useSelector(noteTabsStore, (state) => state.activeNoteId);
 const { setActive, closeTab, closeOthers, closeAll, reorderTabs } = noteTabsStore.actions;
 const hasTopRow = Boolean(leading || trailing);
 const currentTabId = activeNoteId ?? tabs[0]?.noteId ?? "";
 const activeIndex = tabs.findIndex((tab) => tab.noteId === currentTabId);
 const activeTab = activeIndex >= 0 ? tabs[activeIndex] : null;
 const tabItems = useMemo(
  () => tabs.map((tab) => ({ key: tab.noteId, label: tab.title, icon: FileText })),
  [tabs],
 );

 if (tabs.length === 0 || !currentTabId) return null;

 return (
  <div className="hidden shrink-0 flex-col border-b border-border-default bg-bg-card md:flex">
   {hasTopRow ? (
    <div className="flex min-h-14 min-w-0 items-center gap-2 border-b border-border-default/70 px-4 py-2">
     {leading ? <div className="flex min-w-0 flex-1 items-center gap-2">{leading}</div> : null}
     {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
   ) : null}
   <div className="flex min-h-12 min-w-0 flex-nowrap items-center gap-2 overflow-hidden px-3 py-2 sm:px-4">
    <Tabs
     value={currentTabId}
     items={tabItems}
     onValueChange={setActive}
     aria-label="Ghi chú đang mở"
     className="min-w-0 flex-1"
    />
    {activeTab ? (
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <Button
        type="button"
        variant="ghost"
        size="icon-toolbar"
        aria-label={`Tùy chọn tab ${activeTab.title}`}
        title={`Tùy chọn tab ${activeTab.title}`}
       >
        <Ellipsis />
       </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
       <DropdownMenuItem
        disabled={activeIndex <= 0}
        onSelect={() => reorderTabs(activeIndex, activeIndex - 1)}
       >
        <ChevronLeft />
        Di chuyển sang trái
       </DropdownMenuItem>
       <DropdownMenuItem
        disabled={activeIndex < 0 || activeIndex >= tabs.length - 1}
        onSelect={() => reorderTabs(activeIndex, activeIndex + 1)}
       >
        <ChevronRight />
        Di chuyển sang phải
       </DropdownMenuItem>
       <DropdownMenuSeparator />
       <DropdownMenuItem
        disabled={focusLocked}
        onSelect={() => {
         if (!focusLocked) closeTab(activeTab.noteId);
        }}
       >
        <X />
        Đóng tab hiện tại
       </DropdownMenuItem>
       <DropdownMenuItem
        disabled={focusLocked || tabs.length <= 1}
        onSelect={() => {
         if (!focusLocked) closeOthers(activeTab.noteId);
        }}
       >
        Đóng các tab khác
       </DropdownMenuItem>
       <DropdownMenuItem
        disabled={focusLocked}
        onSelect={() => {
         if (!focusLocked) closeAll();
        }}
       >
        Đóng tất cả tab
       </DropdownMenuItem>
      </DropdownMenuContent>
     </DropdownMenu>
    ) : null}
    <Button
     type="button"
     variant="outline"
     size="icon-toolbar"
     className="shrink-0"
     onClick={onCreateNote}
     disabled={focusLocked}
     title={focusLocked ? "Focus mode đang khóa mở ghi chú mới" : "Mở thêm ghi chú"}
     aria-label={focusLocked ? "Focus mode đang khóa mở ghi chú mới" : "Mở thêm ghi chú"}
    >
     <Plus />
    </Button>
    <div
     ref={actionsRef}
     className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto scrollbar-none empty:hidden sm:gap-2 md:max-w-[min(56vw,44rem)] md:flex-none"
    />
   </div>
  </div>
 );
}
