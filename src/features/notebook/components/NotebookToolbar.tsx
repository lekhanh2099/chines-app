import { GitCompareArrows, Grid2X2, Search, TableProperties } from "lucide-react";

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
 const views = [
  { id: "cards" as const, label: "Thẻ học", icon: Grid2X2 },
  { id: "compare" as const, label: "So sánh", icon: GitCompareArrows },
  { id: "matrix" as const, label: "Tổng hợp", icon: TableProperties },
 ];

 return (
  <GlassPanel className="grid gap-3 p-3 sm:p-4">
   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-soft">
    {sectionIds.map((id) => (
     <button
      key={id}
      type="button"
      onClick={() => onSectionChange(id)}
      className={cn(
       "shrink-0 rounded-xl border px-3 py-2 text-sm font-black transition",
       sectionId === id
        ? "border-[#20233a] bg-[#20233a] text-white shadow-theme-sm"
        : "border-border-default bg-bg-card/80 text-text-secondary hover:border-primary/25",
      )}
     >
      {data[id].label}
     </button>
    ))}
   </div>

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
    <div className="flex flex-wrap gap-1 rounded-xl bg-bg-subtle p-1">
     {views.map((view) => {
      const Icon = view.icon;
      return (
       <Button
        key={view.id}
        type="button"
        size="sm"
        variant={viewMode === view.id ? "default" : "ghost"}
        onClick={() => onViewModeChange(view.id)}
       >
        <Icon className="h-4 w-4" />
        {view.label}
       </Button>
      );
     })}
    </div>
   </div>

   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-soft">
    <button
     type="button"
     onClick={() => onGroupChange("all")}
     className={cn(
      "shrink-0 rounded-xl border px-3 py-2 text-xs font-black transition",
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
       "shrink-0 rounded-xl border px-3 py-2 text-xs font-black transition",
       groupId === group.id
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border-default bg-bg-card/75 text-text-muted hover:border-primary/25",
      )}
     >
      {group.name}
     </button>
    ))}
   </div>
  </GlassPanel>
 );
}
