"use client";

import { useEffect, useState } from "react";
import {
 ChevronDown,
 ChevronUp,
 GitCompareArrows,
 Grid2X2,
 Search,
 SlidersHorizontal,
 TableProperties,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import type {
 NotebookGroup,
 NotebookSectionId,
 NotebookSeedData,
 NotebookViewMode,
} from "@/features/notebook/types";
import { cn } from "@/lib/utils";

export function NotebookToolbar({
 data,
 sectionIds,
 sectionId,
 groups,
 groupId,
 query,
 viewMode,
 onSectionChange,
 onGroupChange,
 onQueryChange,
 onViewModeChange,
}: {
 data: NotebookSeedData;
 sectionIds: readonly NotebookSectionId[];
 sectionId: NotebookSectionId;
 groups: NotebookGroup[];
 groupId: string;
 query: string;
 viewMode: NotebookViewMode;
 onSectionChange: (sectionId: NotebookSectionId) => void;
 onGroupChange: (groupId: string) => void;
 onQueryChange: (query: string) => void;
 onViewModeChange: (mode: NotebookViewMode) => void;
}) {
 const [isCompact, setIsCompact] = useState(false);
 const [filtersOpen, setFiltersOpen] = useState(false);
 const views = [
  { id: "cards" as const, label: "Thẻ học", icon: Grid2X2 },
  { id: "compare" as const, label: "So sánh", icon: GitCompareArrows },
  { id: "matrix" as const, label: "Tổng hợp", icon: TableProperties },
 ];
 const activeSectionLabel = data[sectionId].label;
 const activeGroupLabel =
  groupId === "all" ? "Tất cả" : groups.find((group) => group.id === groupId)?.name;

 useEffect(() => {
  let frame = 0;
  const updateCompactState = () => {
   if (frame) return;

   frame = window.requestAnimationFrame(() => {
    frame = 0;
    setIsCompact(window.scrollY > 220);
   });
  };

  updateCompactState();
  window.addEventListener("scroll", updateCompactState, { passive: true });

  return () => {
   if (frame) window.cancelAnimationFrame(frame);
   window.removeEventListener("scroll", updateCompactState);
  };
 }, []);

 const sectionButtons = sectionIds.map((id) => (
  <button
   key={id}
   type="button"
   onClick={() => onSectionChange(id)}
   className={cn(
    "shrink-0 border font-black transition",
    isCompact ? "rounded-lg px-2.5 py-1.5 text-xs" : "rounded-xl px-3 py-2 text-sm",
    sectionId === id
     ? "border-[#20233a] bg-[#20233a] text-white shadow-theme-sm"
     : "border-border-default bg-bg-card/80 text-text-secondary hover:border-primary/25",
   )}
  >
   {data[id].label}
  </button>
 ));

 const viewButtons = views.map((view) => {
  const Icon = view.icon;
  return (
   <Button
    key={view.id}
    type="button"
    size="sm"
    variant={viewMode === view.id ? "default" : "ghost"}
    className={cn(isCompact && "h-8 px-2 text-xs")}
    onClick={() => onViewModeChange(view.id)}
   >
    <Icon className="h-4 w-4" />
    {view.label}
   </Button>
  );
 });

 const groupButtons = (
  <>
   <button
    type="button"
    onClick={() => onGroupChange("all")}
    className={cn(
     "shrink-0 border text-xs font-black transition",
     isCompact ? "rounded-lg px-2.5 py-1.5" : "rounded-xl px-3 py-2",
     groupId === "all"
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border-default bg-bg-card/75 text-text-muted hover:border-primary/25",
    )}
   >
    Tất cả
   </button>
   {groups.map((group) => (
    <button
     key={group.id}
     type="button"
     onClick={() => onGroupChange(group.id)}
     className={cn(
      "shrink-0 border text-xs font-black transition",
      isCompact ? "rounded-lg px-2.5 py-1.5" : "rounded-xl px-3 py-2",
      groupId === group.id
       ? "border-primary bg-primary text-primary-foreground"
       : "border-border-default bg-bg-card/75 text-text-muted hover:border-primary/25",
     )}
    >
     {group.name}
    </button>
   ))}
  </>
 );

 if (isCompact) {
  return (
   <GlassPanel className="sticky top-[calc(3.5rem+0.5rem)] z-30 grid gap-2 p-2 shadow-theme-lg backdrop-blur-xl transition-all duration-200 sm:p-2.5">
    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
     <label className="relative block min-w-0 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <span className="sr-only">Tìm trong sổ tay</span>
      <input
       value={query}
       onChange={(event) => onQueryChange(event.target.value)}
       placeholder="Tìm: 只要, zhiyao, chỉ cần..."
       className="h-9 w-full rounded-lg border border-border-default bg-bg-card/90 pl-9 pr-3 text-xs font-medium text-text-primary outline-none transition focus:border-primary/40 focus:ring-3 focus:ring-ring/15"
      />
     </label>
     <div className="hidden shrink-0 gap-1 rounded-xl bg-bg-subtle p-1 md:flex">{viewButtons}</div>
     <Button
      type="button"
      variant={filtersOpen ? "default" : "outline"}
      size="sm"
      className="h-9 shrink-0 px-2.5 text-xs"
      aria-expanded={filtersOpen}
      onClick={() => setFiltersOpen((open) => !open)}
     >
      <SlidersHorizontal className="h-4 w-4" />
      <span className="hidden sm:inline">
       {activeSectionLabel}
       {activeGroupLabel ? ` · ${activeGroupLabel}` : ""}
      </span>
      <span className="sm:hidden">Bộ lọc</span>
      {filtersOpen ? (
       <ChevronUp className="h-3.5 w-3.5" />
      ) : (
       <ChevronDown className="h-3.5 w-3.5" />
      )}
     </Button>
    </div>

    <div className="flex shrink-0 gap-1 rounded-xl bg-bg-subtle p-1 md:hidden">{viewButtons}</div>

    {filtersOpen && (
     <div className="grid gap-2 border-t border-border-default/70 pt-2">
      <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 scrollbar-soft">
       {sectionButtons}
      </div>
      <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5 scrollbar-soft">
       {groupButtons}
      </div>
     </div>
    )}
   </GlassPanel>
  );
 }

 return (
  <GlassPanel className="sticky top-[calc(3.5rem+0.75rem)] z-30 grid gap-3 p-3 shadow-theme-lg sm:p-4">
   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-soft">{sectionButtons}</div>

   <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    <label className="relative block min-w-0 flex-1">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
     <span className="sr-only">Tìm trong sổ tay</span>
     <input
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder="Tìm: 只要, zhiyao, chỉ cần, trái dự đoán..."
      className="h-11 w-full rounded-xl border border-border-default bg-bg-card/90 pl-10 pr-4 text-sm font-medium text-text-primary outline-none transition focus:border-primary/40 focus:ring-3 focus:ring-ring/15"
     />
    </label>
    <div className="flex flex-wrap gap-1 rounded-xl bg-bg-subtle p-1">{viewButtons}</div>
   </div>

   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-soft">{groupButtons}</div>
  </GlassPanel>
 );
}
