"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { useMemo, useState } from "react";
import { ArrowRight, LayoutGrid, List, Pencil, Search, X } from "lucide-react";

import { ActionCard } from "@/components/ui/actions/action-card";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Chip } from "@/components/ui/actions/chip";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Input } from "@/components/ui/forms/input";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/overlays/sheet";
import {
 HANZIHOME_COMMAND_BAR_MODULE_TARGET_ID,
 HanziHomeCommandBarPortal,
} from "@/features/hanzihome/components/layout/HanziHomeCommandBarPortal";
import { RadicalDetailPanel } from "@/features/hanzihome/components/RadicalDetailPanel";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { useHanziHomeCanEdit } from "@/features/hanzihome/hooks/useHanziHomeCanEdit";
import { useHanziHomeSearchNavigationIntent } from "@/features/hanzihome/search/searchNavigationStore";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";
import { z } from "zod";

import { RadicalEditDialog } from "./RadicalEditDialog";
import {
 StrokeFilterSchema,
 type StrokeFilter,
 countRadicalStrokeFilters,
 countRadicalSupportingItems,
 filterRadicals,
} from "./radical-workspace-utils";

type RadicalWorkspaceProps = {
 radicals: StaticRadicalData[];
};

const RadicalViewSchema = z.enum(["grid", "list"]);
type RadicalView = z.infer<typeof RadicalViewSchema>;
type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export function RadicalWorkspace({ radicals }: RadicalWorkspaceProps) {
 const t = useTranslations("Radicals");
 const strokeFilters = useMemo(
  () => [
   { value: StrokeFilterSchema.enum.all, label: t("all") },
   { value: StrokeFilterSchema.enum["1"], label: t("strokes", { count: 1 }) },
   { value: StrokeFilterSchema.enum["2"], label: t("strokes", { count: 2 }) },
   { value: StrokeFilterSchema.enum["3"], label: t("strokes", { count: 3 }) },
   { value: StrokeFilterSchema.enum["4"], label: t("strokes", { count: 4 }) },
   { value: StrokeFilterSchema.enum["5-6"], label: t("strokes", { count: "5–6" }) },
   { value: StrokeFilterSchema.enum["7+"], label: t("strokes", { count: "7+" }) },
  ],
  [t],
 );
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

 const filterCounts = useMemo(() => countRadicalStrokeFilters(radicals), [radicals]);
 const visibleRadicals = useMemo(
  () => filterRadicals(radicals, searchValue, strokeFilter),
  [radicals, searchValue, strokeFilter],
 );

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
     {t("empty")}
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
      title={editMode ? t("editOff") : t("editOn")}
      aria-label={editMode ? t("editOff") : t("editOn")}
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
         {t("filterTitle")}
        </Typography>
        <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
         {t("filterHelp", { count: radicals.length })}
        </StudyInstructionText>
       </div>
       <div className="relative min-w-0 lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
         value={searchValue}
         onChange={(event) => setSearchValue(event.target.value)}
         placeholder={t("searchPlaceholder")}
         aria-label={t("searchAria")}
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
          ? t("allRadicals")
          : strokeFilters.find((filter) => filter.value === strokeFilter)?.label}
        </Typography>
        <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
         {t("results", { count: visibleRadicals.length })}
        </StudyInstructionText>
       </div>
       <SegmentedControl<RadicalView>
        value={view}
        items={[
         { key: RadicalViewSchema.enum.grid, label: t("grid"), icon: LayoutGrid },
         { key: RadicalViewSchema.enum.list, label: t("list"), icon: List },
        ]}
        onChange={setView}
        density="toolbar"
        aria-label={t("viewAria")}
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
       <Card variant="subtle" padding="lg" className="grid gap-1">
        <StudyInstructionText tone="default" weight="semibold" align="center">
         {t("noMatches")}
        </StudyInstructionText>
        <StudyInstructionText variant="bodySmall" tone="muted" align="center">
         {t("noMatchesHelp")}
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
       title={`${selectedRadical.radical} · ${selectedRadical.nameVi || t("unnamed")}`}
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
 const t = useTranslations("Radicals");
 const supportingCount = countRadicalSupportingItems(radical);

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
     <HanziText size="card" tone="inverse" weight="black" leading="none">
      {radical.radical}
     </HanziText>
    </IconTile>
    {compact ? null : (
     <Badge variant="info" size="sm">
      {t("strokes", { count: radical.strokes ?? "?" })}
     </Badge>
    )}
   </div>

   <div className="grid min-w-0 gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" weight="black" clamp="one">
      {radical.nameVi || t("unnamed")}
     </Typography>
     {compact ? (
      <Badge variant="info" size="sm">
       {t("strokes", { count: radical.strokes ?? "?" })}
      </Badge>
     ) : null}
    </div>
    <StudyInstructionText variant="bodySmall" tone="muted" clamp="two" leading="relaxed">
     {radical.coreMeaning.modern || radical.recognition || t("noDescription")}
    </StudyInstructionText>
    <StudyInstructionText variant="caption" tone="muted" weight="semibold">
     #{radical.index} · {t("relatedCount", { count: supportingCount })}
    </StudyInstructionText>
   </div>

   <Typography
    as="span"
    variant="label"
    tone="accent"
    weight="bold"
    className="flex items-center gap-1.5"
   >
    {t("details")}
    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
   </Typography>
  </ActionCard>
 );
}
