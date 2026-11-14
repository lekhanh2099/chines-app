"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Compass, LoaderCircle, Search, X } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Input } from "@/components/ui/forms/input";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import { containsChinese } from "@/lib/text/chinese-utils";

import {
 CATEGORIES,
 SearchCategoryTabs,
 SearchCommandFooter,
 SearchDirectLookupAction,
 SearchQuickAccessShortcuts,
 useSearchQuickAccessItems,
} from "./GlobalSearchDialogParts";
import { emptySearchCategoryCounts } from "./search-results";
import { SearchResultItem } from "./SearchResultItem";
import type { HanziHomeSearchCategory, HanziHomeSearchResultItem } from "./types";
import { useHanziHomeSearch } from "./useHanziHomeSearch";

type GlobalSearchDialogProps = {
 open: boolean;
 query: string;
 courseId?: string;
 lessonId?: string;
 onOpenChange: (open: boolean) => void;
 onQueryChange: (query: string) => void;
 onOpenResult: (item: HanziHomeSearchResultItem) => void;
 onDirectLookup: (query: string) => void;
};

export function GlobalSearchDialog({
 open,
 query,
 courseId,
 lessonId,
 onOpenChange,
 onQueryChange,
 onOpenResult,
 onDirectLookup,
}: GlobalSearchDialogProps) {
 const t = useTranslations("Shell.search");
 const [selectedIndex, setSelectedIndex] = useState(0);
 const [selectedCategory, setSelectedCategory] = useState<HanziHomeSearchCategory>("all");
 const listboxId = useId();
 const trimmedQuery = query.trim();
 const isSearching = trimmedQuery.length > 0;
 const search = useHanziHomeSearch({
  enabled: open,
  query,
  category: selectedCategory,
  courseId,
  lessonId,
 });
 const visibleResults = isSearching ? (search.data?.results ?? []) : [];
 const categoryCounts = search.data?.counts ?? emptySearchCategoryCounts();
 const highlightQuery = search.data?.query ?? trimmedQuery;
 const initialNavigationItems = useSearchQuickAccessItems();

 const displayItemsCount = isSearching ? visibleResults.length : initialNavigationItems.length;
 const safeSelectedIndex = Math.min(selectedIndex, Math.max(displayItemsCount - 1, 0));
 const activeOptionId =
  displayItemsCount > 0 ? `${listboxId}-option-${safeSelectedIndex}` : undefined;
 const canLookupDirectly = containsChinese(trimmedQuery);

 const handleQueryChange = (nextQuery: string) => {
  setSelectedIndex(0);
  onQueryChange(nextQuery);
 };

 const cycleCategory = (direction: 1 | -1) => {
  const currentIndex = CATEGORIES.findIndex((category) => category === selectedCategory);
  const nextIndex = (currentIndex + direction + CATEGORIES.length) % CATEGORIES.length;
  const nextCategory = CATEGORIES[nextIndex];
  if (nextCategory) {
   setSelectedCategory(nextCategory);
   setSelectedIndex(0);
  }
 };

 const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (event.key === "ArrowDown") {
   event.preventDefault();
   setSelectedIndex((current) => (displayItemsCount === 0 ? 0 : (current + 1) % displayItemsCount));
  }

  if (event.key === "ArrowUp") {
   event.preventDefault();
   setSelectedIndex((current) =>
    displayItemsCount === 0 ? 0 : (current - 1 + displayItemsCount) % displayItemsCount,
   );
  }

  if (event.key === "Tab") {
   event.preventDefault();
   cycleCategory(event.shiftKey ? -1 : 1);
  }

  if (event.key === "Enter") {
   event.preventDefault();
   if (isSearching) {
    const selected = visibleResults[safeSelectedIndex];
    if (selected) onOpenResult(selected.item);
    else if (canLookupDirectly) onDirectLookup(trimmedQuery);
   } else {
    const selected = initialNavigationItems[safeSelectedIndex];
    if (selected) onOpenResult(selected);
   }
  }
 };

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent
    showCloseButton={false}
    size="command"
    placement="top"
    className="h-[min(44rem,calc(100dvh-4rem))]"
    aria-describedby="hanzihome-search-description"
   >
    <DialogHeader className="sr-only">
     <DialogTitle>{t("title")}</DialogTitle>
     <DialogDescription id="hanzihome-search-description">{t("description")}</DialogDescription>
    </DialogHeader>

    {/* Search Input Bar */}
    <div className="relative border-b border-border-default">
     <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted" />
     <Input
      autoFocus
      value={query}
      onChange={(event) => handleQueryChange(event.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={t("placeholder")}
      role="combobox"
      aria-label={t("inputAria")}
      aria-autocomplete="list"
      aria-controls={listboxId}
      aria-expanded={open}
      aria-activedescendant={activeOptionId}
      density="comfortable"
      surface="transparent"
      adornment="both"
      className="w-full"
     />
     <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
      {isSearching && search.isUpdating ? (
       <LoaderCircle className="size-4 animate-spin text-text-muted" />
      ) : null}
      {isSearching ? (
       <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => handleQueryChange("")}
        aria-label={t("clear")}
       >
        <X />
       </Button>
      ) : (
       <kbd className="pointer-events-none hidden rounded border border-border-default bg-bg-subtle px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-text-secondary sm:inline-block">
        ESC
       </kbd>
      )}
     </div>
    </div>

    {/* Category Filter Tabs */}
    <SearchCategoryTabs
     selectedCategory={selectedCategory}
     categoryCounts={categoryCounts}
     isSearching={isSearching}
     onSelectCategory={(cat) => {
      setSelectedCategory(cat);
      setSelectedIndex(0);
     }}
    />

    {/* Direct Dictionary Lookup Quick Action */}
    {canLookupDirectly ? (
     <SearchDirectLookupAction term={trimmedQuery} onLookup={onDirectLookup} />
    ) : null}

    {isSearching && search.isError ? (
     <QueryErrorCard
      title={t("loadError")}
      description={t("loadErrorDescription")}
      retryLabel={t("retry")}
      onRetry={() => {
       void search.refetch();
      }}
     />
    ) : null}

    {/* Results List */}
    <div
     id={listboxId}
     className="flex min-h-0 flex-1 flex-col gap-1 overscroll-contain overflow-y-auto px-2 py-2 scrollbar-soft"
     role="listbox"
     aria-label={t("resultsAria")}
    >
     {isSearching ? (
      <>
       {visibleResults.map((result, index) => (
        <SearchResultItem
         key={result.item.id}
         id={`${listboxId}-option-${index}`}
         item={result.item}
         query={highlightQuery}
         matchedSnippet={result.matchedSnippet}
         matchedText={result.matchedText}
         selected={index === safeSelectedIndex}
         onSelect={() => setSelectedIndex(index)}
         onOpen={() => onOpenResult(result.item)}
        />
       ))}

       {search.isCurrent && !search.isError && visibleResults.length === 0 && (
        <div className="grid gap-2 px-4 py-12 text-center">
         <Typography variant="label" tone="default" weight="bold">
          {t("empty", { category: t(`categories.${selectedCategory}`) })}
         </Typography>
         <Typography variant="bodySmall" tone="muted" weight="medium">
          {t("emptyDescription")}
         </Typography>
        </div>
       )}
      </>
     ) : (
      <>
       <div className="px-2 py-1.5">
        <Typography variant="overline" tone="muted" className="flex items-center gap-1.5">
         <Compass className="size-3.5" />
         {t("quickAccess")}
        </Typography>
       </div>

       {initialNavigationItems.map((item, index) => (
        <SearchResultItem
         key={item.id}
         id={`${listboxId}-option-${index}`}
         item={item}
         selected={index === safeSelectedIndex}
         onSelect={() => setSelectedIndex(index)}
         onOpen={() => onOpenResult(item)}
        />
       ))}

       <SearchQuickAccessShortcuts onQueryChange={handleQueryChange} />
      </>
     )}
    </div>

    {/* Command Palette Footer */}
    <SearchCommandFooter />
   </DialogContent>
  </Dialog>
 );
}
