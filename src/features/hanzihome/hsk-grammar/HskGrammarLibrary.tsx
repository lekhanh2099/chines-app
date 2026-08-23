"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/patterns/empty-state";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { QueryErrorCard } from "@/components/ui/query-error-card";
import { Typography } from "@/components/ui/typography";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { usePathname, useRouter } from "@/i18n/navigation";

import { HskGrammarDetail } from "./HskGrammarDetail";
import { HskGrammarNavigation } from "./HskGrammarNavigation";
import { loadHskGrammarDataset } from "./hsk-grammar-api";
import {
 isHskGrammarLevel,
 normalizeHskGrammarSearch,
} from "./hsk-grammar.constants";
import type { HskGrammarItem, HskGrammarLevel } from "./hsk-grammar.schemas";

function matchesQuery(item: HskGrammarItem, normalizedQuery: string) {
 if (!normalizedQuery) return true;

 const searchable = [
  item.title,
  item.title_vi,
  item.core,
  ...item.focus,
  ...item.categories,
  ...item.structures,
  ...item.usage_notes,
  ...item.constraints,
  ...item.contrasts.map((contrast) => contrast.summary_vi),
 ].join("\n");

 return normalizeHskGrammarSearch(searchable).includes(normalizedQuery);
}

export function HskGrammarLibrary() {
 const t = useTranslations("HskGrammar");
 const pathname = usePathname();
 const router = useRouter();
 const searchParams = useSearchParams();
 const levelParam = searchParams.get("level");
 const level: HskGrammarLevel = isHskGrammarLevel(levelParam) ? levelParam : "HSK4";
 const pointParam = searchParams.get("point");
 const [filterQuery, setFilterQuery] = useState("");

 const query = useQuery({
  queryKey: hanzihomeQueryKeys.hskGrammar(level),
  queryFn: () => loadHskGrammarDataset(level),
  staleTime: Infinity,
 });

 const normalizedFilter = normalizeHskGrammarSearch(filterQuery);
 const filteredItems = useMemo(
  () => (query.data?.items ?? []).filter((item) => matchesQuery(item, normalizedFilter)),
  [normalizedFilter, query.data?.items],
 );
 const selectedItem =
  filteredItems.find((item) => item.id === pointParam) ?? filteredItems[0] ?? null;
 const selectedIndex = selectedItem
  ? filteredItems.findIndex((item) => item.id === selectedItem.id)
  : -1;
 const previousItem = selectedIndex > 0 ? filteredItems[selectedIndex - 1] ?? null : null;
 const nextItem =
  selectedIndex >= 0 && selectedIndex < filteredItems.length - 1
   ? filteredItems[selectedIndex + 1] ?? null
   : null;

 const replaceSelection = ({
  nextLevel,
  nextPoint,
 }: {
  nextLevel?: HskGrammarLevel;
  nextPoint?: string | null;
 }) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  if (nextLevel) nextParams.set("level", nextLevel);
  if (nextPoint === null) nextParams.delete("point");
  else if (nextPoint) nextParams.set("point", nextPoint);

  const queryString = nextParams.toString();
  router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
 };

 const changeLevel = (nextLevel: HskGrammarLevel) => {
  if (nextLevel === level) return;
  setFilterQuery("");
  replaceSelection({ nextLevel, nextPoint: null });
 };

 return (
  <div className="grid min-w-0 gap-5">
   <PageHeader
    eyebrow={t("page.eyebrow")}
    title={t("page.title")}
    description={t("page.description")}
    meta={
     <Typography variant="caption" tone="muted" weight="bold">
      {t("page.demoMeta", { count: query.data?.item_count ?? 0 })}
     </Typography>
    }
   />

   {query.isPending ? (
    <Card variant="section" padding="lg">
     <Typography variant="bodySmall" tone="muted">
      {t("states.loading")}
     </Typography>
    </Card>
   ) : null}

   {query.isError ? (
    <QueryErrorCard
     title={t("states.loadErrorTitle")}
     description={t("states.loadErrorDescription")}
     onRetry={() => void query.refetch()}
    />
   ) : null}

   {query.data && query.data.items.length === 0 ? (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)] xl:items-start">
     <HskGrammarNavigation
      level={level}
      items={[]}
      selectedItemId={null}
      query={filterQuery}
      onQueryChange={setFilterQuery}
      onLevelChange={changeLevel}
      onItemChange={() => undefined}
     />
     <EmptyState title={t("states.empty")} description={t("states.emptyDescription")} />
    </div>
   ) : null}

   {query.data && query.data.items.length > 0 ? (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)] xl:items-start">
     <HskGrammarNavigation
      level={level}
      items={filteredItems}
      selectedItemId={selectedItem?.id ?? null}
      query={filterQuery}
      onQueryChange={setFilterQuery}
      onLevelChange={changeLevel}
      onItemChange={(itemId) => replaceSelection({ nextPoint: itemId })}
     />

     {selectedItem ? (
      <HskGrammarDetail
       dataset={query.data}
       item={selectedItem}
       previousItem={previousItem}
       nextItem={nextItem}
       onNavigate={(itemId) => replaceSelection({ nextPoint: itemId })}
      />
     ) : (
      <EmptyState title={t("navigation.noResults")} />
     )}
    </div>
   ) : null}
  </div>
 );
}
