"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { NotebookContent } from "@/features/notebook/components/NotebookContent";
import { NotebookSectionGuide } from "@/features/notebook/components/NotebookSectionGuide";
import { NotebookToolbar } from "@/features/notebook/components/NotebookToolbar";
import {
 getNotebookSectionComparisons,
 getNotebookSectionItems,
 notebookSectionIds,
 notebookSeedData,
} from "@/features/notebook/data/notebookSeedData";
import type { NotebookSectionId, NotebookViewMode } from "@/features/notebook/types";
import { filterNotebookItems } from "@/features/notebook/utils/filterNotebookItems";

export function NotebookPage() {
 const t = useTranslations("Notebook");
 const [sectionId, setSectionId] = useState<NotebookSectionId>("conjunctions");
 const [groupId, setGroupId] = useState("all");
 const [query, setQuery] = useState("");
 const [viewMode, setViewMode] = useState<NotebookViewMode>("cards");
 const section = notebookSeedData[sectionId];
 const sectionItems = useMemo(() => getNotebookSectionItems(sectionId), [sectionId]);
 const visibleItems = useMemo(
  () => filterNotebookItems(sectionItems, groupId, query),
  [groupId, query, sectionItems],
 );
 const visibleComparisons = useMemo(() => {
  const comparisons = getNotebookSectionComparisons(sectionId);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");

  if (!normalizedQuery) return comparisons;

  return comparisons.filter((comparison) =>
   [
    comparison.title,
    comparison.note,
    comparison.rule,
    comparison.danger,
    ...comparison.terms,
   ].some((value) => value.toLocaleLowerCase("vi").includes(normalizedQuery)),
  );
 }, [query, sectionId]);

 const handleSectionChange = (nextSectionId: NotebookSectionId) => {
  setSectionId(nextSectionId);
  setGroupId("all");
 };

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5">
    <NotebookToolbar
     data={notebookSeedData}
     sectionIds={notebookSectionIds}
     sectionId={sectionId}
     groups={section.groups}
     groupId={groupId}
     query={query}
     viewMode={viewMode}
     onSectionChange={handleSectionChange}
     onGroupChange={setGroupId}
     onQueryChange={setQuery}
     onViewModeChange={setViewMode}
    />
    <section className="grid gap-3" aria-labelledby="notebook-section-heading">
     <div className="flex flex-wrap items-end justify-between gap-3 px-1">
      <div className="grid gap-1">
       <Typography as="h1" id="notebook-section-heading" variant="sectionTitle" weight="black">
        {section.label} · <span lang="zh-CN">{section.zh}</span>
       </Typography>
       <Typography as="p" variant="bodySmall" tone="muted" leading="standard" className="max-w-4xl">
        {section.desc}
       </Typography>
      </div>
      <Badge variant="purple" size="md">
       {t("summary", {
        terms: section.terms.length,
        groups: section.groups.length,
        comparisons: section.compares.length,
       })}
      </Badge>
     </div>
     <NotebookSectionGuide section={section} />
     <NotebookContent items={visibleItems} comparisons={visibleComparisons} viewMode={viewMode} />
    </section>
   </div>
  </PageContainer>
 );
}
