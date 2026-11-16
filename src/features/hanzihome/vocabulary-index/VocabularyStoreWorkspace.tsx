"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Input } from "@/components/ui/forms/input";
import { SegmentedControl } from "@/components/ui/forms/segmented-control";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Typography } from "@/components/ui/display/typography";
import type { RadicalCharacterView } from "@/features/hanzihome/radical-characters/radical-characters.schemas";
import { useDebounce } from "@/hooks/useDebounce";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { VocabularyEntryCard } from "./VocabularyEntryCard";
import type { VocabularyEntry, VocabularyStoreTab } from "./vocabulary-index";
import { wordPinyinKey } from "./word-key";

function storeHref(pathname: string, query: string, page: number) {
 const params = new URLSearchParams();
 if (query) params.set("q", query);
 if (page > 1) params.set("page", String(page));
 const search = params.toString();
 return search ? `${pathname}?${search}` : pathname;
}

/** "Tra Hán tự": the unified vocabulary store plus the contextual lookup tool. */
export function VocabularyStoreWorkspace({
 query,
 items,
 total,
 storeTotal,
 page,
 pageCount,
 lookup,
}: {
 query: string;
 items: VocabularyEntry[];
 total: number;
 storeTotal: number;
 page: number;
 pageCount: number;
 lookup: ReactNode;
}) {
 const t = useTranslations("Inspector.store");
 const router = useRouter();
 const pathname = usePathname();
 const [tab, setTab] = useState<VocabularyStoreTab>("store");
 const [view, setView] = useState<RadicalCharacterView>("grid");
 const [draft, setDraft] = useState(query);
 const [syncedQuery, setSyncedQuery] = useState(query);
 const debouncedDraft = useDebounce(draft.trim(), 300);

 // History navigation changes `query` without remounting: adopt it as the draft.
 if (query !== syncedQuery) {
  setSyncedQuery(query);
  setDraft(query);
 }

 useEffect(() => {
  // Only a settled local edit may rewrite the URL, never a stale debounced value.
  if (debouncedDraft === draft.trim() && debouncedDraft !== query) {
   router.replace(storeHref(pathname, debouncedDraft, 1), { scroll: false });
  }
 }, [debouncedDraft, draft, pathname, query, router]);

 const pagerButton = (targetPage: number, label: string, icon: ReactNode) =>
  targetPage >= 1 && targetPage <= pageCount ? (
   <Button asChild variant="outline" size="icon-toolbar">
    <Link href={storeHref(pathname, query, targetPage)} aria-label={label} title={label}>
     {icon}
    </Link>
   </Button>
  ) : (
   <Button type="button" variant="outline" size="icon-toolbar" disabled aria-label={label}>
    {icon}
   </Button>
  );

 return (
  <Tabs
   value={tab}
   items={[
    { key: "store", label: t("storeTab") },
    { key: "lookup", label: t("lookupTab") },
   ]}
   onValueChange={setTab}
   aria-label={t("tabsAria")}
   className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2"
  >
   <TabsContent value="store" className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
    <div className="grid gap-1.5">
     <Typography as="h1" variant="pageTitle" className="sr-only">
      {t("title")}
     </Typography>
     <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-40 flex-1">
       <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
       <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchAria")}
        adornment="start"
       />
      </div>
      <SegmentedControl<RadicalCharacterView>
       value={view}
       items={[
        { key: "grid", label: t("grid"), icon: LayoutGrid },
        { key: "list", label: t("list"), icon: List },
       ]}
       onChange={setView}
       density="toolbar"
       aria-label={t("viewAria")}
       className="w-auto"
      />
      <nav aria-label={t("pagerAria")} className="flex shrink-0 items-center gap-1">
       {pagerButton(page - 1, t("previous"), <ChevronLeft />)}
       <Typography as="span" variant="label" tone="muted" className="tabular-nums">
        {t("page", { page, pageCount })}
       </Typography>
       {pagerButton(page + 1, t("next"), <ChevronRight />)}
      </nav>
     </div>
     <Typography as="p" variant="caption" tone="muted" aria-live="polite">
      {query ? t("results", { count: total, query }) : t("description", { count: storeTotal })}
     </Typography>
    </div>

    <div
     key={`${query}:${page}`}
     className="min-h-0 overflow-x-hidden overflow-y-auto scrollbar-soft"
    >
     {items.length > 0 ? (
      <ul
       className={cn(
        "grid min-w-0 gap-2",
        view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1",
       )}
      >
       {items.map((entry) => (
        <li key={`${entry.hanzi}:${wordPinyinKey(entry.hanzi, entry.pinyin)}`} className="min-w-0">
         <VocabularyEntryCard entry={entry} />
        </li>
       ))}
      </ul>
     ) : (
      <Card variant="subtle" padding="lg" className="grid gap-1">
       <Typography as="p" variant="label" align="center">
        {t("empty")}
       </Typography>
       <Typography as="p" variant="bodySmall" tone="muted" align="center">
        {t("emptyHelp")}
       </Typography>
      </Card>
     )}
    </div>
   </TabsContent>

   <TabsContent value="lookup" className="min-h-0 overflow-y-auto scrollbar-soft">
    {tab === "lookup" ? lookup : null}
   </TabsContent>
  </Tabs>
 );
}
