"use client";

import { useRef, useCallback, useState } from "react";
import { X, FileText } from "lucide-react";
import { useNoteTabsStore, type NoteTab } from "@/stores/note-tabs-store";
import { cn } from "@/lib/utils";

export function NoteTabBar() {
 const tabs = useNoteTabsStore((s) => s.tabs);
 const activeNoteId = useNoteTabsStore((s) => s.activeNoteId);
 const setActive = useNoteTabsStore((s) => s.setActive);
 const closeTab = useNoteTabsStore((s) => s.closeTab);
 const reorderTabs = useNoteTabsStore((s) => s.reorderTabs);
 const scrollRef = useRef<HTMLDivElement>(null);

 // Drag state
 const [dragIndex, setDragIndex] = useState<number | null>(null);
 const [dropIndex, setDropIndex] = useState<number | null>(null);

 const handleWheel = useCallback((e: React.WheelEvent) => {
  if (scrollRef.current) {
   e.preventDefault();
   scrollRef.current.scrollLeft += e.deltaY;
  }
 }, []);

 const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
  setDragIndex(index);
  e.dataTransfer.effectAllowed = "move";
  // Minimal drag image — use the tab element itself
  const el = e.currentTarget as HTMLElement;
  e.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
 }, []);

 const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  setDropIndex(index);
 }, []);

 const handleDrop = useCallback(
  (e: React.DragEvent, index: number) => {
   e.preventDefault();
   if (dragIndex !== null && dragIndex !== index) {
    reorderTabs(dragIndex, index);
   }
   setDragIndex(null);
   setDropIndex(null);
  },
  [dragIndex, reorderTabs],
 );

 const handleDragEnd = useCallback(() => {
  setDragIndex(null);
  setDropIndex(null);
 }, []);

 if (tabs.length === 0) return null;

 return (
  <div className="flex items-stretch border-b border-border-default bg-bg-subtle/50 shrink-0 h-[38px]">
   <div
    ref={scrollRef}
    className="flex items-stretch overflow-x-auto scrollbar-none flex-1 min-w-0"
    onWheel={handleWheel}
   >
    {tabs.map((tab, index) => (
     <TabItem
      key={tab.noteId}
      tab={tab}
      index={index}
      isActive={tab.noteId === activeNoteId}
      isDragging={dragIndex === index}
      isDropTarget={dropIndex === index && dragIndex !== index}
      onActivate={() => setActive(tab.noteId)}
      onClose={() => closeTab(tab.noteId)}
      onDragStart={(e) => handleDragStart(e, index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
     />
    ))}
   </div>
  </div>
 );
}

function TabItem({
 tab,
 index,
 isActive,
 isDragging,
 isDropTarget,
 onActivate,
 onClose,
 onDragStart,
 onDragOver,
 onDrop,
 onDragEnd,
}: {
 tab: NoteTab;
 index: number;
 isActive: boolean;
 isDragging: boolean;
 isDropTarget: boolean;
 onActivate: () => void;
 onClose: () => void;
 onDragStart: (e: React.DragEvent) => void;
 onDragOver: (e: React.DragEvent) => void;
 onDrop: (e: React.DragEvent) => void;
 onDragEnd: () => void;
}) {
 return (
  <div
   role="tab"
   aria-selected={isActive}
   draggable
   onDragStart={onDragStart}
   onDragOver={onDragOver}
   onDrop={onDrop}
   onDragEnd={onDragEnd}
   className={cn(
    "group relative flex items-center gap-1 pl-2.5 pr-1 cursor-pointer select-none transition-all duration-150 text-[13px] min-w-0 max-w-[200px]",
    // Active: elevated card look with accent bottom border
    isActive
     ? "bg-bg-card text-text-primary font-medium shadow-[0_-1px_0_0_var(--border-default),1px_0_0_0_var(--border-default),-1px_0_0_0_var(--border-default)] z-10"
     : "text-text-muted hover:text-text-secondary hover:bg-bg-card/50",
    // Bottom accent indicator for active tab
    isActive && "border-b-2 border-b-accent -mb-px",
    !isActive && "border-b-2 border-b-transparent",
    // Drag states
    isDragging && "opacity-40",
    isDropTarget && "border-l-2 border-l-accent",
   )}
   onClick={onActivate}
   onAuxClick={(e) => {
    if (e.button === 1) {
     e.preventDefault();
     onClose();
    }
   }}
   title={tab.title}
  >
   <FileText
    className={cn(
     "w-3.5 h-3.5 shrink-0 transition-colors",
     isActive ? " " : "text-text-muted/60",
    )}
   />

   <span className="truncate flex-1 min-w-0 px-1">{tab.title}</span>

   <button
    className={cn(
     "shrink-0 w-[18px] h-[18px] rounded-sm flex items-center justify-center transition-all",
     isActive
      ? "text-text-muted hover:text-text-primary hover:bg-bg-subtle"
      : "opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary hover:bg-bg-subtle",
    )}
    onClick={(e) => {
     e.stopPropagation();
     onClose();
    }}
    title="Đóng tab"
   >
    <X className="w-3 h-3" />
   </button>
  </div>
 );
}
