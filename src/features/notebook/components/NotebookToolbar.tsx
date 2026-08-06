"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
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
import { Card } from "@/components/ui/card";
import type {
 NotebookGroup,
 NotebookSectionId,
 NotebookSeedData,
 NotebookViewMode,
} from "@/features/notebook/types";
const compactEnterScrollTop = 240;
const compactExitScrollTop = 32;

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
 const toolbarRef = useRef<HTMLDivElement>(null);
 const [isCompact, setIsCompact] = useState(false);
 const [filtersOpen, setFiltersOpen] = useState(false);
 const views: { id: NotebookViewMode; label: string; icon: typeof Grid2X2 }[] = [
  { id: "cards", label: "Thẻ học", icon: Grid2X2 },
  { id: "compare", label: "So sánh", icon: GitCompareArrows },
  { id: "matrix", label: "Tổng hợp", icon: TableProperties },
 ];
 const activeSectionLabel = data[sectionId].label;
 const activeGroupLabel =
  groupId === "all" ? "Tất cả" : groups.find((group) => group.id === groupId)?.name;

 useEffect(() => {
  const toolbar = toolbarRef.current;
  if (!toolbar) return;

  const scrollOwner = toolbar.closest("main");
  const eventTarget = scrollOwner ?? window;
  let frame = 0;
  const updateCompactState = () => {
   if (frame) return;

   frame = window.requestAnimationFrame(() => {
    frame = 0;
    const scrollTop = scrollOwner?.scrollTop ?? window.scrollY;
    setIsCompact((compact) =>
     compact ? scrollTop > compactExitScrollTop : scrollTop > compactEnterScrollTop,
    );
   });
  };

  updateCompactState();
  eventTarget.addEventListener("scroll", updateCompactState, { passive: true });

  return () => {
   if (frame) window.cancelAnimationFrame(frame);
   eventTarget.removeEventListener("scroll", updateCompactState);
  };
 }, []);

 const sectionButtons = sectionIds.map((id) => (
  <Button
   key={id}
   type="button"
   size={isCompact ? "toolbar" : "sm"}
   variant={sectionId === id ? "active" : "surfaceCard"}
   aria-pressed={sectionId === id}
   onClick={() => onSectionChange(id)}
   className="shrink-0"
  >
   {data[id].label}
  </Button>
 ));

 const viewButtons = views.map((view) => {
  const Icon = view.icon;
  return (
   <Button
    key={view.id}
    type="button"
    size={isCompact ? "toolbar" : "sm"}
    variant={viewMode === view.id ? "active" : "ghost"}
    aria-pressed={viewMode === view.id}
    onClick={() => onViewModeChange(view.id)}
   >
    <Icon className="h-4 w-4" />
    {view.label}
   </Button>
  );
 });

 const groupButtons = (
  <>
   <Button
    type="button"
    size={isCompact ? "toolbar" : "sm"}
    variant={groupId === "all" ? "active" : "surfaceCard"}
    aria-pressed={groupId === "all"}
    onClick={() => onGroupChange("all")}
    className="shrink-0"
   >
    Tất cả
   </Button>
   {groups.map((group) => (
    <Button
     key={group.id}
     type="button"
     size={isCompact ? "toolbar" : "sm"}
     variant={groupId === group.id ? "active" : "surfaceCard"}
     aria-pressed={groupId === group.id}
     onClick={() => onGroupChange(group.id)}
     className="shrink-0"
    >
     {group.name}
    </Button>
   ))}
  </>
 );

 if (isCompact) {
  return (
   <Card
    ref={toolbarRef}
    variant="section"
    padding="sm"
    className="sticky top-2 z-30 grid gap-2 sm:top-3"
   >
    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
     <Label variant="label" className="relative block min-w-0 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <span className="sr-only">Tìm trong sổ tay</span>
      <Input
       value={query}
       onChange={(event) => onQueryChange(event.target.value)}
       placeholder="Tìm: 只要, zhiyao, chỉ cần..."
       density="compact"
       adornment="start"
       className="w-full"
      />
     </Label>
     <div className="hidden shrink-0 gap-1 rounded-xl bg-bg-subtle p-1 md:flex">{viewButtons}</div>
     <Button
      type="button"
      variant={filtersOpen ? "default" : "outline"}
      size="sm"
      className="shrink-0"
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
   </Card>
  );
 }

 return (
  <Card
   ref={toolbarRef}
   variant="section"
   padding="md"
   className="sticky top-2 z-30 grid gap-3 sm:top-3"
  >
   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-soft">{sectionButtons}</div>

   <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    <Label variant="label" className="relative block min-w-0 flex-1">
     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
     <span className="sr-only">Tìm trong sổ tay</span>
     <Input
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder="Tìm: 只要, zhiyao, chỉ cần, trái dự đoán..."
      adornment="start"
      className="w-full"
     />
    </Label>
    <div className="flex flex-wrap gap-1 rounded-xl bg-bg-subtle p-1">{viewButtons}</div>
   </div>

   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-soft">{groupButtons}</div>
  </Card>
 );
}
