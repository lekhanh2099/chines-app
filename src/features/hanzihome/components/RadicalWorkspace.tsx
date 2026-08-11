"use client";

import { Typography } from "@/components/ui/typography";
import { useMemo, useState } from "react";
import { ArrowRight, LayoutGrid, List, Pencil, Search, X } from "lucide-react";

import { ActionCard } from "@/components/ui/action-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { IconTile } from "@/components/ui/icon-tile";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import {
 HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { RadicalDetailPanel } from "@/features/hanzihome/components/RadicalDetailPanel";
import {
 HanziFontPreview,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
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
 { value: StrokeFilterSchema.enum.all, label: "Tất cả" },
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
 const [view, setView] = useState<RadicalView>(RadicalViewSchema.enum.grid);
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
   <Card padding="lg">
    <StudyInstructionText tone="muted" weight="semibold">
     Chưa có dữ liệu bộ thủ.
    </StudyInstructionText>
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
      size="icon-toolbar"
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
        <Typography
         as="h2"
         variant="sectionTitle"
         id="radical-filter-heading"
         tone="default"
         weight="black"
        >
         Lọc theo số nét
        </Typography>
        <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
         Duyệt {radicals.length} bộ thủ theo độ phức tạp hoặc tìm theo tên và ý nghĩa.
        </StudyInstructionText>
       </div>
       <div className="relative min-w-0 lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
         value={searchValue}
         onChange={(event) => setSearchValue(event.target.value)}
         placeholder="Tìm bộ thủ, tên, nghĩa..."
         aria-label="Tìm bộ thủ"
         adornment="start"
        />
       </div>
      </div>

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none lg:flex-wrap">
       {strokeFilters.map((filter) => {
        const active = strokeFilter === filter.value;
        return (
         <Chip
          key={filter.value}
          type="button"
          variant={active ? "accent" : "default"}
          size="touch"
          pressed={active}
          onClick={() => setStrokeFilter(filter.value)}
         >
          {filter.label}
          <Typography as="span" variant="caption" tone="muted" weight="bold">
           {filterCounts.get(filter.value)}
          </Typography>
         </Chip>
        );
       })}
      </div>
     </section>

     <section className="grid gap-3" aria-labelledby="radical-list-heading">
      <div className="flex items-center justify-between gap-3 border-t border-border-default pt-5 lg:pt-7">
       <div className="min-w-0">
        <Typography
         as="h2"
         variant="sectionTitle"
         id="radical-list-heading"
         tone="default"
         weight="black"
        >
         {strokeFilter === "all"
          ? "Tất cả bộ thủ"
          : strokeFilters.find((filter) => filter.value === strokeFilter)?.label}
        </Typography>
        <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
         {visibleRadicals.length} kết quả
        </StudyInstructionText>
       </div>
       <SegmentedControl<RadicalView>
        value={view}
        items={[
         { key: RadicalViewSchema.enum.grid, label: "Lưới", icon: LayoutGrid },
         { key: RadicalViewSchema.enum.list, label: "Danh sách", icon: List },
        ]}
        onChange={setView}
        density="toolbar"
        aria-label="Kiểu hiển thị bộ thủ"
        className="w-auto"
       />
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
       <Card variant="subtle" padding="lg">
        <StudyInstructionText tone="default" weight="semibold" align="center">
         Không có bộ thủ phù hợp.
        </StudyInstructionText>
        <StudyInstructionText variant="bodySmall" tone="muted" align="center" className="mt-1">
         Thử đổi số nét hoặc từ khóa tìm kiếm.
        </StudyInstructionText>
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
  <ActionCard
   padding="md"
   onClick={onOpen}
   className={cn(
    "group grid min-w-0 gap-4",
    compact ? "sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center" : "content-between",
   )}
  >
   <div
    className={cn("flex min-w-0 gap-3", compact ? "items-center" : "items-start justify-between")}
   >
    <IconTile tone="inverse" size="lg">
     <HanziFontPreview font="songti" size="card" tone="inverse" weight="black" leading="none">
      {radical.radical}
     </HanziFontPreview>
    </IconTile>
    {compact ? null : (
     <Badge variant="info" size="sm">
      {radical.strokes ?? "?"} nét
     </Badge>
    )}
   </div>

   <div className="min-w-0">
    <div className="flex flex-wrap items-center gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" weight="black" clamp="one">
      {radical.nameVi || "Chưa có tên"}
     </Typography>
     {compact ? (
      <Badge variant="info" size="sm">
       {radical.strokes ?? "?"} nét
      </Badge>
     ) : null}
    </div>
    <StudyInstructionText
     variant="bodySmall"
     tone="muted"
     clamp="two"
     leading="relaxed"
     className="mt-1"
    >
     {radical.coreMeaning.modern || radical.recognition || "Chưa có mô tả."}
    </StudyInstructionText>
    <StudyInstructionText variant="caption" tone="muted" weight="semibold" className="mt-3">
     #{radical.index} · {supportingCount} mục liên quan
    </StudyInstructionText>
   </div>

   <Typography
    as="span"
    variant="label"
    tone="accent"
    weight="bold"
    className="flex items-center gap-1.5"
   >
    Xem chi tiết
    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
   </Typography>
  </ActionCard>
 );
}
