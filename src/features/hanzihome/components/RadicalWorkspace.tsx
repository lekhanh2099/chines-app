"use client";

import { useMemo, useState } from "react";
import { ArrowRight, LayoutGrid, List, Pencil, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import {
 HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { RadicalDetailPanel } from "@/features/hanzihome/components/RadicalDetailPanel";
import { getHanziFontFamily } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useHanziHomeSearchNavigationIntent } from "@/features/hanzihome/search/searchNavigationStore";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";
import { z } from "zod";

import { RadicalEditDialog } from "./RadicalEditDialog";

type RadicalWorkspaceProps = {
 radicals: StaticRadicalData[];
};

const RadicalViewSchema = z.enum(["grid", "list"]);
type RadicalView = z.infer<typeof RadicalViewSchema>;
const StrokeFilterSchema = z.enum(["all", "1", "2", "3", "4", "5-6", "7+"]);
type StrokeFilter = z.infer<typeof StrokeFilterSchema>;
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

const strokeFilters: Array<{ value: StrokeFilter; label: string }> = [
 { value: "all", label: "Tất cả" },
 { value: "1", label: "1 nét" },
 { value: "2", label: "2 nét" },
 { value: "3", label: "3 nét" },
 { value: "4", label: "4 nét" },
 { value: "5-6", label: "5–6 nét" },
 { value: "7+", label: "7+ nét" },
];

function matchesStrokeFilter(strokes: StaticRadicalData["strokes"], filter: StrokeFilter) {
 if (filter === "all") return true;
 if (strokes == null) return false;
 if (filter === "5-6") return strokes >= 5 && strokes <= 6;
 if (filter === "7+") return strokes >= 7;
 return strokes === Number(filter);
}

function radicalSearchText(radical: StaticRadicalData) {
 return [
  radical.radical,
  radical.nameVi ?? "",
  radical.coreMeaning.history ?? "",
  radical.coreMeaning.modern ?? "",
  radical.recognition ?? "",
  radical.variants.map((variant) => `${variant.form} ${variant.note}`).join(" "),
  radical.relatedComponents?.map((component) => `${component.form} ${component.note}`).join(" ") ??
   "",
  radical.groups?.map((group) => `${group.name} ${group.chars.join(" ")}`).join(" ") ?? "",
 ]
  .join(" ")
  .toLowerCase();
}

export function RadicalWorkspace({ radicals }: RadicalWorkspaceProps) {
 const searchIntent = useHanziHomeSearchNavigationIntent();
 const canEdit = useHanziHomeCanEdit();
 const intentRadicalId =
  (searchIntent?.module === "radicals" ? searchIntent.targetId : null) ?? null;
 const [selectedId, setSelectedId] = useState<Nullable<string>>(intentRadicalId);
 const [detailOpen, setDetailOpen] = useState(Boolean(intentRadicalId));
 const [searchValue, setSearchValue] = useState("");
 const [strokeFilter, setStrokeFilter] = useState<StrokeFilter>("all");
 const [view, setView] = useState<RadicalView>("grid");
 const [editMode, setEditMode] = useState(false);
 const [editingRadical, setEditingRadical] = useState<Nullable<StaticRadicalData>>(null);

 const filterCounts = useMemo(
  () =>
   new Map(
    strokeFilters.map((filter) => [
     filter.value,
     radicals.filter((radical) => matchesStrokeFilter(radical.strokes, filter.value)).length,
    ]),
   ),
  [radicals],
 );

 const visibleRadicals = useMemo(() => {
  const keyword = searchValue.trim().toLowerCase();
  return radicals.filter(
   (radical) =>
    matchesStrokeFilter(radical.strokes, strokeFilter) &&
    (!keyword || radicalSearchText(radical).includes(keyword)),
  );
 }, [radicals, searchValue, strokeFilter]);

 const selectedRadical = useMemo(
  () => radicals.find((radical) => radical.id === selectedId) ?? null,
  [radicals, selectedId],
 );

 const openRadical = (radical: StaticRadicalData) => {
  setSelectedId(radical.id);
  setDetailOpen(true);
 };

 if (radicals.length === 0) {
  return (
   <Card padding="lg" className="rounded-xl">
    <p className="font-semibold text-text-muted">Chưa có dữ liệu bộ thủ.</p>
   </Card>
  );
 }

 return (
  <>
   {canEdit ? (
    <HanziHomeCommandBarPortal targetId={HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID}>
     <Button
      type="button"
      variant={editMode ? "active" : "outline"}
      size="icon-sm"
      onClick={() => setEditMode((current) => !current)}
      title={editMode ? "Tắt chế độ sửa bộ thủ" : "Bật chế độ sửa bộ thủ"}
      aria-label={editMode ? "Tắt chế độ sửa bộ thủ" : "Bật chế độ sửa bộ thủ"}
     >
      {editMode ? <X /> : <Pencil />}
     </Button>
    </HanziHomeCommandBarPortal>
   ) : null}

   <div className="h-full min-h-0 overflow-y-auto scrollbar-soft">
    <div className="mx-auto grid w-full max-w-7xl gap-5 p-2 sm:p-3 lg:gap-7 lg:p-5">
     <section className="grid gap-3" aria-labelledby="radical-filter-heading">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
       <div>
        <h2 id="radical-filter-heading" className="text-xl font-black text-text-primary">
         Lọc theo số nét
        </h2>
        <p className="text-sm font-medium text-text-muted">
         Duyệt {radicals.length} bộ thủ theo độ phức tạp hoặc tìm theo tên và ý nghĩa.
        </p>
       </div>
       <div className="relative min-w-0 lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
         value={searchValue}
         onChange={(event) => setSearchValue(event.target.value)}
         placeholder="Tìm bộ thủ, tên, nghĩa..."
         aria-label="Tìm bộ thủ"
         className="pl-9"
        />
       </div>
      </div>

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-wrap">
       {strokeFilters.map((filter) => {
        const active = strokeFilter === filter.value;
        return (
         <Button
          key={filter.value}
          type="button"
          variant={active ? "active" : "surfaceCard"}
          size="sm"
          className="min-w-max justify-between gap-3 px-3"
          aria-pressed={active}
          onClick={() => setStrokeFilter(filter.value)}
         >
          {filter.label}
          <span className="text-xs tabular-nums text-text-muted">
           {filterCounts.get(filter.value)}
          </span>
         </Button>
        );
       })}
      </div>
     </section>

     <section className="grid gap-3" aria-labelledby="radical-list-heading">
      <div className="flex items-center justify-between gap-3 border-t border-border-default pt-5 lg:pt-7">
       <div className="min-w-0">
        <h2 id="radical-list-heading" className="text-2xl font-black text-text-primary">
         {strokeFilter === "all"
          ? "Tất cả bộ thủ"
          : strokeFilters.find((filter) => filter.value === strokeFilter)?.label}
        </h2>
        <p className="text-sm font-medium text-text-muted">{visibleRadicals.length} kết quả</p>
       </div>
       <div className="flex shrink-0 rounded-xl border border-border-default bg-bg-card p-1 shadow-theme-sm">
        <Button
         type="button"
         variant={view === "grid" ? "active" : "ghost"}
         size="icon-xs"
         aria-label="Hiển thị dạng lưới"
         aria-pressed={view === "grid"}
         onClick={() => setView("grid")}
        >
         <LayoutGrid />
        </Button>
        <Button
         type="button"
         variant={view === "list" ? "active" : "ghost"}
         size="icon-xs"
         aria-label="Hiển thị dạng danh sách"
         aria-pressed={view === "list"}
         onClick={() => setView("list")}
        >
         <List />
        </Button>
       </div>
      </div>

      {visibleRadicals.length > 0 ? (
       <div
        className={cn(
         "grid gap-3",
         view === "grid" ? "sm:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1",
        )}
       >
        {visibleRadicals.map((radical) => (
         <RadicalBrowseCard
          key={radical.id}
          radical={radical}
          compact={view === "list"}
          onOpen={() => openRadical(radical)}
         />
        ))}
       </div>
      ) : (
       <Card variant="subtle" padding="lg" className="text-center">
        <p className="font-semibold text-text-primary">Không có bộ thủ phù hợp.</p>
        <p className="mt-1 text-sm text-text-muted">Thử đổi số nét hoặc từ khóa tìm kiếm.</p>
       </Card>
      )}
     </section>
    </div>
   </div>

   <Sheet open={detailOpen && Boolean(selectedRadical)} onOpenChange={setDetailOpen} side="right">
    {selectedRadical ? (
     <>
      <SheetHeader
       title={`${selectedRadical.radical} · ${selectedRadical.nameVi || "Chưa có tên"}`}
       onClose={() => setDetailOpen(false)}
      />
      <SheetBody>
       <RadicalDetailPanel
        radical={selectedRadical}
        editMode={editMode}
        onEdit={() => setEditingRadical(selectedRadical)}
       />
      </SheetBody>
     </>
    ) : null}
   </Sheet>

   <RadicalEditDialog
    radical={editingRadical}
    open={Boolean(editingRadical)}
    onOpenChange={(open) => {
     if (!open) setEditingRadical(null);
    }}
   />
  </>
 );
}

function RadicalBrowseCard({
 radical,
 compact,
 onOpen,
}: {
 radical: StaticRadicalData;
 compact: boolean;
 onOpen: () => void;
}) {
 const supportingCount =
  radical.variants.length +
  (radical.relatedComponents?.length ?? 0) +
  (radical.groups?.reduce((total, group) => total + group.chars.length, 0) ?? 0);

 return (
  <button
   type="button"
   onClick={onOpen}
   className={cn(
    "group grid min-w-0 gap-4 rounded-xl border border-border-default bg-bg-card p-4 text-left shadow-theme-sm transition-colors hover:border-primary/25 hover:bg-bg-elevated focus-visible:border-ring/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
    compact ? "sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center" : "content-between",
   )}
  >
   <div
    className={cn("flex min-w-0 gap-3", compact ? "items-center" : "items-start justify-between")}
   >
    <div className="app-brand-gradient flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-3xl font-black leading-none text-primary-foreground shadow-theme-sm">
     <span lang="zh-CN" style={{ fontFamily: getHanziFontFamily("songti") }}>
      {radical.radical}
     </span>
    </div>
    {compact ? null : (
     <Badge variant="info" size="sm">
      {radical.strokes ?? "?"} nét
     </Badge>
    )}
   </div>

   <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
     <h3 className="truncate text-lg font-black text-text-primary">
      {radical.nameVi || "Chưa có tên"}
     </h3>
     {compact ? (
      <Badge variant="info" size="sm">
       {radical.strokes ?? "?"} nét
      </Badge>
     ) : null}
    </div>
    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">
     {radical.coreMeaning.modern || radical.recognition || "Chưa có mô tả."}
    </p>
    <p className="mt-3 text-xs font-semibold text-text-muted">
     #{radical.index} · {supportingCount} mục liên quan
    </p>
   </div>

   <span className="flex items-center gap-1.5 text-sm font-bold text-accent-text">
    Xem chi tiết
    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
   </span>
  </button>
 );
}
