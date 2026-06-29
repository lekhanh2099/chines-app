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
  <div className="shrink-0 border-b border-white/60 bg-white/45 px-3 py-2 shadow-[inset_0_-1px_0_rgb(117_72_246_/_6%)] backdrop-blur-2xl">
   <div
    ref={scrollRef}
    role="tablist"
    aria-label="Ghi chú đang mở"
    className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-none"
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
    "group relative flex h-11 min-w-32 max-w-64 cursor-pointer select-none items-center gap-1 rounded-xl border px-2 text-[13px] transition-all duration-150",
    isActive
     ? "z-10 border-white/80 bg-white/85 font-semibold text-text-primary shadow-theme-sm"
     : "border-white/0 text-text-muted hover:border-white/70 hover:bg-white/55 hover:text-text-secondary",
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
    className={cn("w-3.5 h-3.5 shrink-0 transition-colors", isActive ? " " : "text-text-muted/60")}
   />

   <span className="truncate flex-1 min-w-0 px-1">{tab.title}</span>

   <button
   className={cn(
     "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
     isActive
      ? "text-text-muted hover:text-text-primary hover:bg-bg-subtle"
      : "opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary hover:bg-bg-subtle",
    )}
    aria-label={`Đóng tab ${tab.title}`}
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
