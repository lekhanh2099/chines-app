"use client";

import { useTranslations } from "next-intl";
import { useDeferredValue, useId, useMemo, useState } from "react";
import {
 BookOpenCheck,
 Compass,
 GraduationCap,
 Languages,
 LoaderCircle,
 NotebookPen,
 Search,
 Shapes,
 X,
} from "lucide-react";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Input } from "@/components/ui/forms/input";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { Typography } from "@/components/ui/display/typography";
import { containsChinese } from "@/lib/text/chinese-utils";

import {
 countSearchResultCategories,
 filterSearchResultCategory,
 selectSearchNavigationItems,
 searchHanziHomeIndex,
} from "./searchHanziHomeIndex";
import { SearchResultItem } from "./SearchResultItem";
import type { HanziHomeSearchCategory, HanziHomeSearchIndexItem } from "./types";
import { useHanziHomeSearchIndex } from "./useHanziHomeSearchIndex";

const CATEGORIES: HanziHomeSearchCategory[] = [
 "all",
 "vocab",
 "grammar",
 "exercise",
 "lesson",
 "radical",
];

type GlobalSearchDialogProps = {
 open: boolean;
 query: string;
 courseId?: string;
 lessonId?: string;
 onOpenChange: (open: boolean) => void;
 onQueryChange: (query: string) => void;
 onOpenResult: (item: HanziHomeSearchIndexItem) => void;
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
 const deferredQuery = useDeferredValue(query);
 const searchIndex = useHanziHomeSearchIndex(open);

 const allResults = useMemo(
  () =>
   searchHanziHomeIndex(searchIndex.data ?? [], deferredQuery, {
    courseId,
    lessonId,
    includeGlobal: true,
    limit: 60,
   }),
  [courseId, deferredQuery, lessonId, searchIndex.data],
 );

 const categoryCounts = useMemo(() => countSearchResultCategories(allResults), [allResults]);
 const visibleResults = useMemo(
  () => filterSearchResultCategory(allResults, selectedCategory),
  [allResults, selectedCategory],
 );
 const initialNavigationItems = useMemo(
  () => selectSearchNavigationItems(searchIndex.data ?? [], { courseId, lessonId }),
  [courseId, lessonId, searchIndex.data],
 );

 const trimmedQuery = query.trim();
 const isSearching = trimmedQuery.length > 0;
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
      {searchIndex.isFetching ? (
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
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border-default bg-bg-subtle/40 px-3 py-1.5 scrollbar-none">
     {CATEGORIES.map((cat) => {
      const isSelected = selectedCategory === cat;
      const count = categoryCounts[cat];

      return (
       <Button
        key={cat}
        type="button"
        variant={isSelected ? "active" : "ghost"}
        size="compact"
        onClick={() => {
         setSelectedCategory(cat);
         setSelectedIndex(0);
        }}
       >
        <span>{t(`categories.${cat}`)}</span>
        {isSearching && count > 0 ? (
         <Badge size="sm" variant={isSelected ? "default" : "default"}>
          {count}
         </Badge>
        ) : null}
       </Button>
      );
     })}
    </div>

    {/* Direct Dictionary Lookup Quick Action */}
    {canLookupDirectly ? (
     <div className="border-b border-border-default p-2">
      <Button
       type="button"
       onClick={() => onDirectLookup(trimmedQuery)}
       variant="ghost"
       align="start"
       layout="grid"
       className="w-full grid-cols-[2.25rem_minmax(0,1fr)_auto]"
      >
       <IconTile tone="accent" size="sm">
        <BookOpenCheck />
       </IconTile>
       <span className="grid min-w-0 gap-0.5">
        <span className="flex items-center gap-2">
         <Typography as="span" variant="label" tone="default" weight="bold">
          {t.rich("lookupTitle", {
           term: trimmedQuery,
           hanzi: (chunks) => <span className="font-hanzi text-primary">{chunks}</span>,
          })}
         </Typography>
         <Badge size="sm" variant="accent">
          {t("dictionary")}
         </Badge>
        </span>
        <Typography as="span" variant="bodySmall" tone="muted" weight="medium">
         {t("lookupDescription")}
        </Typography>
       </span>
       <kbd className="rounded border border-border-default bg-bg-subtle px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-text-secondary">
        ↵ Enter
       </kbd>
      </Button>
     </div>
    ) : null}

    {searchIndex.isError ? (
     <QueryErrorCard
      title={t("loadError")}
      description={t("loadErrorDescription")}
      retryLabel={t("retry")}
      onRetry={() => {
       void searchIndex.refetch();
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
         query={deferredQuery}
         matchedSnippet={result.matchedSnippet}
         selected={index === safeSelectedIndex}
         onSelect={() => setSelectedIndex(index)}
         onOpen={() => onOpenResult(result.item)}
        />
       ))}

       {!searchIndex.isLoading && !searchIndex.isError && visibleResults.length === 0 && (
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

       <div className="grid grid-cols-2 gap-2 border-t border-border-default px-2 pt-3 sm:grid-cols-4">
        <Button
         type="button"
         variant="ghost"
         size="compact"
         onClick={() => handleQueryChange("bộ thủ")}
         className="justify-start gap-2"
        >
         <Shapes className="size-3.5 text-accent-text" />
         <span>{t("shortcuts.radicals")}</span>
        </Button>
        <Button
         type="button"
         variant="ghost"
         size="compact"
         onClick={() => handleQueryChange("ngữ pháp")}
         className="justify-start gap-2"
        >
         <GraduationCap className="size-3.5 text-info-text" />
         <span>{t("categories.grammar")}</span>
        </Button>
        <Button
         type="button"
         variant="ghost"
         size="compact"
         onClick={() => handleQueryChange("từ vựng")}
         className="justify-start gap-2"
        >
         <Languages className="size-3.5 text-accent-text" />
         <span>{t("categories.vocab")}</span>
        </Button>
        <Button
         type="button"
         variant="ghost"
         size="compact"
         onClick={() => handleQueryChange("ghi chú")}
         className="justify-start gap-2"
        >
         <NotebookPen className="size-3.5 text-text-secondary" />
         <span>{t("kinds.note")}</span>
        </Button>
       </div>
      </>
     )}
    </div>

    {/* Command Palette Footer */}
    <div className="flex items-center justify-between border-t border-border-default bg-bg-subtle/30 px-4 py-2 text-xs text-text-muted">
     <div className="flex items-center gap-3">
      <span className="flex items-center gap-1">
       <kbd className="rounded border border-border-default bg-bg-card px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-text-secondary">
        ↑↓
       </kbd>
       <span>{t("move")}</span>
      </span>
      <span className="flex items-center gap-1">
       <kbd className="rounded border border-border-default bg-bg-card px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-text-secondary">
        ↵
       </kbd>
       <span>{t("select")}</span>
      </span>
      <span className="flex items-center gap-1">
       <kbd className="rounded border border-border-default bg-bg-card px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-text-secondary">
        Tab
       </kbd>
       <span>{t("changeCategory")}</span>
      </span>
     </div>
     <span className="flex items-center gap-1">
      <kbd className="rounded border border-border-default bg-bg-card px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-text-secondary">
       Esc
      </kbd>
      <span>{t("close")}</span>
     </span>
    </div>
   </DialogContent>
  </Dialog>
 );
}
