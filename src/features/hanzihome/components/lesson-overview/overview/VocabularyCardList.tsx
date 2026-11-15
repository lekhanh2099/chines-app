"use client";

import type { ReactNode } from "react";
import { PictureInPicture2, Search, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Typography } from "@/components/ui/display/typography";
import { Input } from "@/components/ui/forms/input";
import { Card } from "@/components/ui/layout/card";
import type { UniversalPipMode } from "@/features/hanzihome/components/review/UniversalAmbientPip";

/** Count, search and caller actions above a vocabulary card list. */
export function VocabularyListToolbar({
 totalCount,
 query,
 onQueryChange,
 resultCount,
 actions,
}: {
 totalCount: number;
 query: string;
 onQueryChange: (query: string) => void;
 resultCount: number;
 actions: ReactNode;
}) {
 const t = useTranslations("Vocab.cards");

 return (
  <Card
   variant="subtle"
   padding="sm"
   className="flex min-w-0 flex-wrap items-center justify-between gap-2"
  >
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <Badge casing="natural">{t("count", { count: totalCount })}</Badge>
    <label className="relative min-w-40 flex-1 sm:w-64 sm:flex-none">
     <span className="sr-only">{t("searchLabel")}</span>
     <Input
      type="search"
      density="compact"
      adornment="start"
      value={query}
      onChange={(event) => onQueryChange(event.target.value)}
      placeholder={t("searchPlaceholder")}
      autoComplete="off"
     />
     <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </label>
    {query ? (
     <Typography variant="caption" tone="secondary">
      {t("resultCount", { count: resultCount })}
     </Typography>
    ) : null}
   </div>
   <div className="flex flex-wrap items-center gap-1.5">{actions}</div>
  </Card>
 );
}

/** Vocabulary dictation and review PiP launchers shared by lesson and article vocabulary lists. */
export function VocabularyPipActions({
 dictationActive,
 reviewActive,
 onToggle,
}: {
 dictationActive: boolean;
 reviewActive: boolean;
 onToggle: (mode: UniversalPipMode) => void;
}) {
 const t = useTranslations("Vocab.cards");

 return (
  <>
   <Button
    type="button"
    size="toolbar"
    variant={dictationActive ? "active" : "outline"}
    onClick={() => onToggle("dictation")}
    title={t("dictationPipTitle")}
   >
    <Volume2 />
    {t("dictationPip")}
   </Button>
   <Button
    type="button"
    size="toolbar"
    variant={reviewActive ? "active" : "outline"}
    onClick={() => onToggle("vocab")}
    title={t("reviewPipTitle")}
   >
    <PictureInPicture2 />
    {t("reviewPip")}
   </Button>
  </>
 );
}

export function VocabularyCardGrid({ children }: { children: ReactNode }) {
 return <div className="grid min-w-0 gap-2 sm:grid-cols-2">{children}</div>;
}

export function VocabularyNoResults({ query }: { query: string }) {
 const t = useTranslations("Vocab.cards");

 return (
  <Card variant="subtle" padding="md" className="text-center">
   <Typography variant="bodySmall" tone="muted">
    {t("noResults", { query })}
   </Typography>
  </Card>
 );
}

/** Toolbar plus empty/no-result states plus the card grid for one vocabulary list. */
export function VocabularyCardList({
 totalCount,
 query,
 onQueryChange,
 resultCount,
 actions,
 children,
}: {
 totalCount: number;
 query: string;
 onQueryChange: (query: string) => void;
 resultCount: number;
 actions: ReactNode;
 children: ReactNode;
}) {
 const t = useTranslations("Vocab.cards");

 if (totalCount === 0) {
  return (
   <Card variant="subtle" padding="md">
    <Typography variant="bodySmall" tone="muted">
     {t("empty")}
    </Typography>
   </Card>
  );
 }

 return (
  <div className="grid min-w-0 gap-2">
   <VocabularyListToolbar
    totalCount={totalCount}
    query={query}
    onQueryChange={onQueryChange}
    resultCount={resultCount}
    actions={actions}
   />
   {resultCount === 0 ? (
    <VocabularyNoResults query={query} />
   ) : (
    <VocabularyCardGrid>{children}</VocabularyCardGrid>
   )}
  </div>
 );
}
