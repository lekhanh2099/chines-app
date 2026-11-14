"use client";

import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/actions/button";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import { AggregateLibrarySkeleton } from "@/features/hanzihome/components/AggregateLibrarySkeleton";
import type { AggregateKind } from "@/features/hanzihome/repositories/hanzihome-content-resources";

export function AggregateListStatus({
 kind,
 isLoading,
 isError,
 errorMessage,
 isEmpty,
 hasActiveFilters,
 onReset,
 onRetry,
}: {
 kind: AggregateKind;
 isLoading: boolean;
 isError: boolean;
 errorMessage?: string;
 isEmpty: boolean;
 hasActiveFilters: boolean;
 onReset: () => void;
 onRetry: () => void;
}) {
 const t = useTranslations("Vocab");

 return (
  <>
   {isLoading ? <AggregateLibrarySkeleton /> : null}

   {isError ? (
    <QueryErrorCard
     title={kind === "vocab" ? t("loadError.vocabTitle") : t("loadError.grammarTitle")}
     description={errorMessage ?? t("loadError.description")}
     onRetry={onRetry}
    />
   ) : null}

   {!isLoading && !isError && isEmpty ? (
    <EmptyState
     surface="subtle"
     title={t("empty.title")}
     description={t("empty.description")}
     actions={
      hasActiveFilters ? (
       <Button type="button" variant="outline" size="toolbar" onClick={onReset}>
        {t("filters.clear")}
       </Button>
      ) : undefined
     }
    />
   ) : null}
  </>
 );
}
