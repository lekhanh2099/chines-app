"use client";

import { useTranslations } from "next-intl";
import { BookOpenCheck, GraduationCap, Languages, NotebookPen, Shapes } from "lucide-react";

import {
 navigationItems,
 type NavigationItemId,
} from "@/components/layout/navigation/navigation-config";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";

import { HANZIHOME_SEARCH_CATEGORIES } from "./search-results";
import type {
 HanziHomeSearchCategory,
 HanziHomeSearchCategoryCounts,
 HanziHomeSearchResultItem,
} from "./types";

export const CATEGORIES = HANZIHOME_SEARCH_CATEGORIES;

const QUICK_ACCESS_ITEM_IDS = [
 "lessons",
 "businessChinese",
 "chineseBridge",
 "readingComprehension",
 "spokenChinese",
 "reader",
 "inspector",
 "radicals",
 "notes",
] satisfies readonly NavigationItemId[];

/** Quick-access destinations for an empty query, labelled from the shared navigation config. */
export function useSearchQuickAccessItems(): HanziHomeSearchResultItem[] {
 const t = useTranslations("Shell");
 return QUICK_ACCESS_ITEM_IDS.map((itemId) => {
  const item = navigationItems[itemId];
  return {
   id: `navigation:${itemId}`,
   kind: "navigation",
   title: t(item.messageKey),
   subtitle: t("search.kinds.navigation"),
   href: item.href,
  };
 });
}

export function SearchCategoryTabs({
 selectedCategory,
 categoryCounts,
 isSearching,
 onSelectCategory,
}: {
 selectedCategory: HanziHomeSearchCategory;
 categoryCounts: HanziHomeSearchCategoryCounts;
 isSearching: boolean;
 onSelectCategory: (category: HanziHomeSearchCategory) => void;
}) {
 const t = useTranslations("Shell.search");

 return (
  <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border-default bg-bg-subtle/40 px-3 py-1.5 scrollbar-none">
   {CATEGORIES.map((cat) => {
    const isSelected = selectedCategory === cat;
    const count = categoryCounts[cat];

    return (
     <Button
      key={cat}
      type="button"
      variant={isSelected ? "active" : "ghost"}
      size="compact"
      onClick={() => onSelectCategory(cat)}
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
 );
}

export function SearchDirectLookupAction({
 term,
 onLookup,
}: {
 term: string;
 onLookup: (query: string) => void;
}) {
 const t = useTranslations("Shell.search");

 return (
  <div className="border-b border-border-default p-2">
   <Button
    type="button"
    onClick={() => onLookup(term)}
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
        term,
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
 );
}

export function SearchQuickAccessShortcuts({
 onQueryChange,
}: {
 onQueryChange: (query: string) => void;
}) {
 const t = useTranslations("Shell.search");

 return (
  <div className="grid grid-cols-2 gap-2 border-t border-border-default px-2 pt-3 sm:grid-cols-4">
   <Button
    type="button"
    variant="ghost"
    size="compact"
    onClick={() => onQueryChange("bộ thủ")}
    className="justify-start gap-2"
   >
    <Shapes className="size-3.5 text-accent-text" />
    <span>{t("shortcuts.radicals")}</span>
   </Button>
   <Button
    type="button"
    variant="ghost"
    size="compact"
    onClick={() => onQueryChange("ngữ pháp")}
    className="justify-start gap-2"
   >
    <GraduationCap className="size-3.5 text-info-text" />
    <span>{t("categories.grammar")}</span>
   </Button>
   <Button
    type="button"
    variant="ghost"
    size="compact"
    onClick={() => onQueryChange("từ vựng")}
    className="justify-start gap-2"
   >
    <Languages className="size-3.5 text-accent-text" />
    <span>{t("categories.vocab")}</span>
   </Button>
   <Button
    type="button"
    variant="ghost"
    size="compact"
    onClick={() => onQueryChange("ghi chú")}
    className="justify-start gap-2"
   >
    <NotebookPen className="size-3.5 text-text-secondary" />
    <span>{t("kinds.note")}</span>
   </Button>
  </div>
 );
}

export function SearchCommandFooter() {
 const t = useTranslations("Shell.search");

 return (
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
 );
}
