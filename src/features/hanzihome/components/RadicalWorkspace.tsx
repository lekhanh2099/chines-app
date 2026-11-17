"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@/components/ui/display/typography";
import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";

import { ActionCard } from "@/components/ui/actions/action-card";
import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { Chip } from "@/components/ui/actions/chip";
import { Input } from "@/components/ui/forms/input";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import {
 HanziText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import {
 clearHanziHomeSearchNavigationIntent,
 useHanziHomeSearchNavigationIntent,
} from "@/features/hanzihome/search/searchNavigationStore";
import type { StaticRadicalData } from "@/features/hanzihome/types";
import { cn } from "@/lib/utils";
import { z } from "zod";

import { radicalHref } from "@/features/hanzihome/radical-characters/radical-character-forms";
import { useRouter } from "@/i18n/navigation";

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
 const router = useRouter();
 const searchIntent = useHanziHomeSearchNavigationIntent();
 const intentRadicalId = searchIntent?.module === "radicals" ? searchIntent.targetId : "";
 // A global-search hit lands on the list first; forward it to that radical's page.
 useEffect(() => {
  if (!intentRadicalId) return;
  // Consume the intent so returning to the list does not redirect again.
  clearHanziHomeSearchNavigationIntent();
  router.replace(radicalHref(intentRadicalId));
 }, [intentRadicalId, router]);
 const [searchValue, setSearchValue] = useState("");
 const [strokeFilter, setStrokeFilter] = useState<StrokeFilter>("all");
 const [view, setView] = useState<RadicalView>(RadicalViewSchema.enum.grid);
 const filterCounts = useMemo(() => countRadicalStrokeFilters(radicals), [radicals]);
 const visibleRadicals = useMemo(
  () => filterRadicals(radicals, searchValue, strokeFilter),
  [radicals, searchValue, strokeFilter],
 );

 return (
  <>
   <div className="h-full min-h-0 overflow-x-hidden overflow-y-auto scrollbar-soft">
    {radicals.length === 0 ? (
     <Card padding="lg">
      <StudyInstructionText tone="muted" weight="semibold">
       {t("empty")}
      </StudyInstructionText>
     </Card>
    ) : (
     <div className="grid w-full min-w-0 gap-3 p-2 sm:p-3">
      <section className="grid gap-2" aria-labelledby="radical-list-heading">
       <Typography as="h2" variant="pageTitle" id="radical-list-heading" className="sr-only">
        {t("allRadicals")}
       </Typography>
       <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="relative min-w-40 flex-1 sm:max-w-80">
         <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
         <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          adornment="start"
         />
        </div>
        <div
         className="flex min-w-0 max-w-full flex-1 gap-1.5 overflow-x-auto scrollbar-none"
         role="group"
         aria-label={t("filterTitle")}
        >
         {strokeFilters.map((filter) => {
          const active = strokeFilter === filter.value;
          return (
           <Chip
            key={filter.value}
            type="button"
            variant={active ? "accent" : "default"}
            size="md"
            pressed={active}
            onClick={() => setStrokeFilter(filter.value)}
           >
            {filter.label}
            <Typography as="span" variant="bodySmall" tone="muted">
             {filterCounts.get(filter.value)}
            </Typography>
           </Chip>
          );
         })}
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
       <StudyInstructionText variant="bodySmall" tone="muted" aria-live="polite">
        {t("results", { count: visibleRadicals.length })}
       </StudyInstructionText>

       {visibleRadicals.length > 0 ? (
        <ul
         className={cn(
          "grid min-w-0 gap-2",
          view === "grid" ? "grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]" : "grid-cols-1",
         )}
        >
         {visibleRadicals.map((radical) => (
          <li key={radical.id} className="min-w-0">
           <RadicalBrowseCard
            radical={radical}
            onOpen={() => router.push(radicalHref(radical.id))}
           />
          </li>
         ))}
        </ul>
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
    )}
   </div>
  </>
 );
}

/** One radical: the glyph at reading size, its name and strokes, and the core meaning. */
function RadicalBrowseCard({
 radical,
 onOpen,
}: {
 radical: StaticRadicalData;
 onOpen: () => void;
}) {
 const t = useTranslations("Radicals");
 const supportingCount = countRadicalSupportingItems(radical);
 const name = radical.nameVi || t("unnamed");

 return (
  <ActionCard
   padding="md"
   onClick={onOpen}
   aria-label={t("openRadical", { radical: radical.radical, name })}
   className="flex h-full min-w-0 items-center gap-3"
  >
   <HanziText as="span" size="review" tone="primary" weight="black" leading="none">
    {radical.radical}
   </HanziText>
   <div className="grid min-w-0 flex-1 gap-0.5">
    <div className="flex min-w-0 items-center justify-between gap-2">
     <Typography as="h3" variant="cardTitle" tone="default" clamp="one">
      {name}
     </Typography>
     <Badge variant="info" size="sm" casing="natural">
      {t("strokes", { count: radical.strokes ?? "?" })}
     </Badge>
    </div>
    <StudyInstructionText variant="bodySmall" tone="secondary" clamp="two">
     {radical.coreMeaning.modern || radical.recognition || t("noDescription")}
    </StudyInstructionText>
    <StudyInstructionText variant="bodySmall" tone="muted">
     #{radical.index} · {t("relatedCount", { count: supportingCount })}
    </StudyInstructionText>
   </div>
  </ActionCard>
 );
}
